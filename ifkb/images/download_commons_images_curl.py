#!/usr/bin/env python3
"""Parallel curl-based Commons downloader with licence validation and attribution output."""
from __future__ import annotations
import argparse, csv, hashlib, html, json, mimetypes, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlencode, urlparse
from PIL import Image, ImageOps

API="https://commons.wikimedia.org/w/api.php"
UA="IFKB-Research/0.10.2 (+https://github.com/Emad211/Neofit-ai)"
MIN_DIM=500
ALLOWED={"image/jpeg","image/png","image/webp"}

def curl_bytes(url:str, max_time:int=60)->bytes:
    proc=subprocess.run(["curl","-L","--fail","--silent","--show-error","--retry","2","--retry-all-errors","--connect-timeout","10","--max-time",str(max_time),"-A",UA,url],capture_output=True)
    if proc.returncode:
        raise RuntimeError(proc.stderr.decode("utf-8",errors="replace").strip() or f"curl exit {proc.returncode}")
    return proc.stdout

def clean(value:str|None)->str:
    text=html.unescape(value or "")
    text=re.sub(r"<br\s*/?>"," | ",text,flags=re.I)
    text=re.sub(r"<[^>]+>","",text)
    return " ".join(text.split())

def norm_license(value:str)->str:
    text=clean(value).upper().replace("CREATIVE COMMONS","CC")
    return " ".join(re.sub(r"[^A-Z0-9]+"," ",text).split())

def license_ok(expected:str,actual:str)->bool:
    e,a=norm_license(expected),norm_license(actual)
    return (e.startswith("CC0") and a.startswith("CC0")) or e==a

def bucket(actual:str)->str:
    n=norm_license(actual)
    if n.startswith("CC0") or "PUBLIC DOMAIN" in n:return "cc0_pd"
    if "CC BY SA" in n:return "cc_by_sa"
    if n.startswith("CC BY"):return "cc_by"
    raise RuntimeError(f"unapproved licence {actual!r}")

def resolve(title:str)->dict[str,Any]:
    params={"action":"query","format":"json","formatversion":"2","titles":f"File:{title}","prop":"imageinfo","iiprop":"url|size|sha1|mime|extmetadata","iiurlwidth":"1600"}
    data=json.loads(curl_bytes(API+"?"+urlencode(params),30))
    pages=data.get("query",{}).get("pages",[])
    if len(pages)!=1 or pages[0].get("missing"):raise RuntimeError("Commons file not found")
    infos=pages[0].get("imageinfo") or []
    if len(infos)!=1:raise RuntimeError("imageinfo missing")
    info=infos[0]; meta={k:v.get("value","") for k,v in (info.get("extmetadata") or {}).items()}
    return {"canonical_title":pages[0].get("title",f"File:{title}"),"original_url":info["url"],"thumb_url":info.get("thumburl",""),"description_url":info.get("descriptionurl",f"https://commons.wikimedia.org/wiki/File:{quote(title.replace(' ','_'),safe='_().-~')}"),"mime":info.get("mime",""),"width":int(info.get("width") or 0),"height":int(info.get("height") or 0),"size_bytes":int(info.get("size") or 0),"commons_sha1":info.get("sha1",""),"license_short_name":clean(meta.get("LicenseShortName")),"license_url":clean(meta.get("LicenseUrl")),"artist":clean(meta.get("Artist")),"credit":clean(meta.get("Credit")),"description":clean(meta.get("ImageDescription"))}

def extension(url:str,mime:str)->str:
    ext=Path(urlparse(url).path).suffix.lower()
    if ext in {".jpg",".jpeg",".png",".webp"}:return ".jpg" if ext==".jpeg" else ext
    ext=mimetypes.guess_extension(mime) or ".bin"
    return ".jpg" if ext==".jpe" else ext

def process(entry:dict[str,str],out:Path)->dict[str,Any]:
    sid=entry["seed_image_id"].strip()
    if entry.get("identity_review")!="approved":raise RuntimeError("identity not approved")
    info=resolve(entry["commons_file_title"].strip())
    if info["mime"] not in ALLOWED:raise RuntimeError(f"unsupported MIME {info['mime']}")
    if min(info["width"],info["height"])<MIN_DIM:raise RuntimeError("source below minimum dimension")
    if not license_ok(entry["expected_license"],info["license_short_name"]):raise RuntimeError(f"licence mismatch expected={entry['expected_license']} actual={info['license_short_name']}")
    lic_bucket=bucket(info["license_short_name"])
    used_url=info["original_url"]; variant="original"
    try: raw=curl_bytes(used_url,60)
    except Exception:
        if not info["thumb_url"]:raise
        used_url=info["thumb_url"];variant="commons_1600px_thumbnail_fallback";raw=curl_bytes(used_url,60)
    ext=extension(used_url,info["mime"])
    rel=Path("images")/lic_bucket/entry["canon_id"]/f"{sid}{ext}"; path=out/rel;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
    with Image.open(path) as image:
        image=ImageOps.exif_transpose(image);w,h=image.size
        if min(w,h)<MIN_DIM:raise RuntimeError("decoded file below minimum dimension")
        preview=image.convert("RGB");preview.thumbnail((1024,1024),Image.Resampling.LANCZOS)
        prel=Path("previews")/entry["canon_id"]/f"{sid}.jpg";pp=out/prel;pp.parent.mkdir(parents=True,exist_ok=True);preview.save(pp,"JPEG",quality=88,optimize=True)
    artist=info["artist"] or info["credit"] or "Wikimedia Commons contributor"
    attribution=f"{entry['food_name_en']} — {artist}; {info['license_short_name']}; {info['description_url']}"
    return {**entry,**info,"license_bucket":lic_bucket,"download_url_used":used_url,"download_variant":variant,"image_relative_path":str(rel),"preview_relative_path":str(prel),"downloaded_size_bytes":len(raw),"local_sha256":hashlib.sha256(raw).hexdigest(),"decoded_width":w,"decoded_height":h,"attribution_text":attribution,"dataset_use_status":"identity_reference_only_not_nutrition_gold","download_status":"downloaded_verified"}

def write_csv(path:Path,rows:list[dict[str,Any]],fields:list[str]):
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open("w",encoding="utf-8",newline="") as f:
        writer=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore");writer.writeheader();writer.writerows(rows)

def main()->int:
    ap=argparse.ArgumentParser();ap.add_argument("--manifest",type=Path,required=True);ap.add_argument("--output",type=Path,required=True);args=ap.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    with args.manifest.open("r",encoding="utf-8-sig",newline="") as f:entries=list(csv.DictReader(f))
    resolved=[];failures=[]
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(process,e,args.output):e for e in entries}
        for fut in as_completed(futures):
            e=futures[fut]
            try:r=fut.result();resolved.append(r);print(f"OK {r['seed_image_id']} {r['download_variant']}",flush=True)
            except Exception as exc:failures.append({"seed_image_id":e.get("seed_image_id",""),"canon_id":e.get("canon_id",""),"commons_file_title":e.get("commons_file_title",""),"error":str(exc)});print(f"FAILED {e.get('seed_image_id')}: {exc}",file=sys.stderr,flush=True)
    resolved.sort(key=lambda r:r["seed_image_id"]);failures.sort(key=lambda r:r["seed_image_id"])
    if resolved:write_csv(args.output/"resolved_manifest.csv",resolved,list(resolved[0].keys()))
    write_csv(args.output/"failures.csv",failures,["seed_image_id","canon_id","commons_file_title","error"])
    lines=["# IFKB Pilot Image Attributions",""]
    for r in resolved:lines.extend([f"## {r['seed_image_id']} — {r['food_name_fa']}","",r["attribution_text"],""])
    (args.output/"ATTRIBUTION.md").write_text("\n".join(lines),encoding="utf-8")
    manifest={"format":"ifkb-internet-image-seed","version":"0.10.2","source":"Wikimedia Commons API","requested":len(entries),"downloaded":len(resolved),"failed":len(failures),"licenceBuckets":sorted({r['license_bucket'] for r in resolved}),"downloadVariants":sorted({r['download_variant'] for r in resolved}),"nutritionGoldRecords":0}
    (args.output/"dataset_manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    if failures or len(resolved)!=len(entries):raise SystemExit(f"incomplete acquisition: {len(resolved)}/{len(entries)}")
    return 0
if __name__=="__main__":raise SystemExit(main())
