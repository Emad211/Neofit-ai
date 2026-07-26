from __future__ import annotations
import argparse, csv, hashlib, io, json, random, re, time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from PIL import Image, ImageDraw, ImageFont, ImageOps

API = "https://api.openverse.org/v1/images/"
ALLOWED_LICENSES = {"cc0","pdm","by","by-sa"}
LICENSE_BUCKET = {"cc0":"cc0_pd","pdm":"cc0_pd","by":"cc_by","by-sa":"cc_by_sa"}
UA = "IFKB-Openverse-Acquisition/0.12 (+https://github.com/Emad211/Neofit-ai)"

def request_json(url: str, attempts: int = 6) -> dict:
    delay = 3.0
    for attempt in range(attempts):
        req = Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        try:
            with urlopen(req, timeout=60) as response:
                return json.load(response)
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == attempts - 1:
                raise
            retry = exc.headers.get("Retry-After")
            wait = float(retry) if retry and retry.isdigit() else delay
        except (URLError, TimeoutError):
            if attempt == attempts - 1:
                raise
            wait = delay
        time.sleep(wait + random.uniform(0, 0.8))
        delay = min(delay * 2, 45)
    raise RuntimeError("unreachable")

def request_bytes(url: str, attempts: int = 5) -> bytes:
    delay = 3.0
    for attempt in range(attempts):
        req = Request(url, headers={"User-Agent": UA, "Accept": "image/*"})
        try:
            with urlopen(req, timeout=90) as response:
                data = response.read(12 * 1024 * 1024)
                if not data:
                    raise ValueError("empty image")
                return data
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == attempts - 1:
                raise
        except (URLError, TimeoutError):
            if attempt == attempts - 1:
                raise
        time.sleep(delay + random.uniform(0, 0.8))
        delay = min(delay * 2, 45)
    raise RuntimeError("unreachable")

def norm(text: str | None) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())

def make_contact_sheet(rows, output: Path, title: str) -> None:
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    font = ImageFont.truetype(font_path, 20) if Path(font_path).exists() else ImageFont.load_default()
    title_font = ImageFont.truetype(font_path, 28) if Path(font_path).exists() else font
    canvas = Image.new("RGB", (1600, 1150), "#f3f3f3")
    draw = ImageDraw.Draw(canvas)
    draw.text((25, 18), title, fill="black", font=title_font)
    for idx, row in enumerate(rows[:6]):
        col, rr = idx % 3, idx // 3
        x, y = 25 + col * 525, 80 + rr * 520
        with Image.open(output.parent / row["local_relative_path"]) as img:
            img = ImageOps.exif_transpose(img).convert("RGB")
            thumb = ImageOps.contain(img, (490, 385))
        canvas.paste(thumb, (x + (490-thumb.width)//2, y))
        draw.text((x, y+395), f"{row['candidate_id']} | {row['title'][:42]}", fill="black", font=font)
        draw.text((x, y+425), f"{row['source']} | {row['license']} | rank {row['query_rank']}", fill="black", font=font)
        draw.text((x, y+455), f"{row['creator'][:55]}", fill="black", font=font)
    canvas.save(output, quality=88, optimize=True)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--queries", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--max-per-class", type=int, default=6)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output/"thumbnails").mkdir(exist_ok=True)
    (args.output/"class_contact_sheets").mkdir(exist_ok=True)

    with args.queries.open("r",encoding="utf-8-sig",newline="") as handle:
        classes=list(csv.DictReader(handle))

    rows=[]
    failures=[]
    summaries=[]
    seen_openverse_ids=set()
    for cls in classes:
        selected=[]
        query_list=[q.strip() for q in cls["queries_pipe"].split("|") if q.strip()]
        for q_index, query in enumerate(query_list, start=1):
            params={"q":query,"license":"cc0,pdm,by,by-sa","page_size":"20","page":"1"}
            url=API+"?"+urlencode(params)
            try:
                data=request_json(url)
            except Exception as exc:
                failures.append({"canon_id":cls["canon_id"],"food_name_en":cls["food_name_en"],"query":query,"stage":"api_search","error":repr(exc)})
                continue
            for result in data.get("results",[]):
                oid=str(result.get("id") or "")
                if not oid or oid in seen_openverse_ids:
                    continue
                license_code=str(result.get("license") or "").lower()
                if license_code not in ALLOWED_LICENSES or result.get("mature") is True:
                    continue
                try:
                    width_i=int(result.get("width") or 0)
                    height_i=int(result.get("height") or 0)
                except Exception:
                    width_i=height_i=0
                if width_i and height_i and min(width_i,height_i)<500:
                    continue
                thumb=result.get("thumbnail")
                landing=result.get("foreign_landing_url")
                original=result.get("url")
                if not thumb or not landing:
                    continue
                try:
                    raw=request_bytes(thumb)
                    with Image.open(io.BytesIO(raw)) as img:
                        img=ImageOps.exif_transpose(img).convert("RGB")
                        if min(img.size)<400:
                            continue
                        img.thumbnail((1024,1024))
                        candidate_id=f"{cls['canon_id']}-OV-{len(selected)+1:02d}"
                        relative=Path("thumbnails")/cls["canon_id"]/f"{candidate_id}.jpg"
                        destination=args.output/relative
                        destination.parent.mkdir(parents=True,exist_ok=True)
                        img.save(destination,quality=90,optimize=True)
                except Exception as exc:
                    failures.append({"canon_id":cls["canon_id"],"food_name_en":cls["food_name_en"],"query":query,"stage":"thumbnail_download","error":repr(exc)})
                    continue
                row={
                    "candidate_id":candidate_id,"canon_id":cls["canon_id"],"food_name_fa":cls["food_name_fa"],"food_name_en":cls["food_name_en"],
                    "query":query,"query_index":q_index,"query_rank":len(selected)+1,"openverse_id":oid,
                    "title":norm(result.get("title")),"creator":norm(result.get("creator")),"creator_url":result.get("creator_url") or "",
                    "license":license_code,"license_version":result.get("license_version") or "","license_url":result.get("license_url") or "",
                    "license_bucket":LICENSE_BUCKET[license_code],"source":result.get("source") or "","provider":result.get("provider") or "",
                    "foreign_landing_url":landing,"original_url":original or "","thumbnail_url":thumb,
                    "width":width_i,"height":height_i,"local_relative_path":str(relative).replace("\\","/"),
                    "local_sha256":hashlib.sha256(destination.read_bytes()).hexdigest(),"attribution":norm(result.get("attribution")),
                    "category":result.get("category") or "","filetype":result.get("filetype") or "",
                    "visual_review_status":"pending","selected_for_dataset":"no","nutrition_gold_allowed":"no"
                }
                selected.append(row)
                rows.append(row)
                seen_openverse_ids.add(oid)
                if len(selected)>=args.max_per_class:
                    break
            if len(selected)>=args.max_per_class:
                break
            time.sleep(2.5)
        summaries.append({"canon_id":cls["canon_id"],"food_name_fa":cls["food_name_fa"],"food_name_en":cls["food_name_en"],"candidate_count":len(selected),"query_count":len(query_list),"status":"candidates_found" if selected else "no_candidate_or_failure"})
        make_contact_sheet(selected,args.output/"class_contact_sheets"/f"{cls['canon_id']}.jpg",f"{cls['food_name_en']} | {cls['food_name_fa']}")
        time.sleep(3.0)

    fields=list(rows[0].keys()) if rows else ["candidate_id","canon_id","food_name_fa","food_name_en","query","openverse_id"]
    with (args.output/"candidate_manifest.csv").open("w",encoding="utf-8",newline="") as handle:
        writer=csv.DictWriter(handle,fieldnames=fields);writer.writeheader();writer.writerows(rows)
    with (args.output/"class_summary.csv").open("w",encoding="utf-8",newline="") as handle:
        writer=csv.DictWriter(handle,fieldnames=list(summaries[0].keys()));writer.writeheader();writer.writerows(summaries)
    failure_fields=["canon_id","food_name_en","query","stage","error"]
    with (args.output/"query_failures.csv").open("w",encoding="utf-8",newline="") as handle:
        writer=csv.DictWriter(handle,fieldnames=failure_fields);writer.writeheader();writer.writerows(failures)
    manifest={
        "format":"ifkb-openverse-candidate-discovery","classes":len(classes),"candidateImages":len(rows),
        "classesWithCandidates":sum(summary["candidate_count"]>0 for summary in summaries),"failures":len(failures),
        "policy":{"api":"Openverse API only; no catalog scraping","licenses":["cc0","pdm","by","by-sa"],
                  "licenseVerification":"Openverse metadata is provisional; landing-page verification required before acceptance",
                  "nutritionGold":False}
    }
    (args.output/"dataset_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

if __name__=="__main__":
    main()
