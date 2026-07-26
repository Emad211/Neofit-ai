#!/usr/bin/env python3
"""Build a compact atomic/basic food layer from official USDA SR Legacy CSV data."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sqlite3
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Iterable

SR_URL = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip"
USER_AGENT = "IFKB-SR-Importer/1.0 (+https://github.com/Emad211/Neofit-ai)"
OUTPUT_FIELDS = (
    "calories_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g",
    "sugars_g", "sodium_mg", "cholesterol_mg",
)
ID_MAP = {
    "203": "protein_g", "204": "fat_g", "205": "carbs_g",
    "291": "fiber_g", "269": "sugars_g", "307": "sodium_mg", "601": "cholesterol_mg",
    "1003": "protein_g", "1004": "fat_g", "1005": "carbs_g",
    "1079": "fiber_g", "2000": "sugars_g", "1093": "sodium_mg", "1253": "cholesterol_mg",
}
ENERGY_IDS = {"208": 1, "1008": 2, "2047": 3, "2048": 4}


def download(url: str, output: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=180) as response, output.open("wb") as handle:
        while chunk := response.read(1024 * 1024):
            handle.write(chunk)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def find_member(names: Iterable[str], basename: str, required: bool = True) -> str | None:
    matches = [name for name in names if Path(name).name.lower() == basename.lower()]
    if not matches and not required:
        return None
    if len(matches) != 1:
        raise RuntimeError(f"Expected exactly one {basename}, found {matches}")
    return matches[0]


def rows_from_zip(archive: zipfile.ZipFile, member: str):
    with archive.open(member) as raw:
        text = (line.decode("utf-8-sig") for line in raw)
        yield from csv.DictReader(text)


def number(value: str | None) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except ValueError:
        return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output
    output.mkdir(parents=True, exist_ok=True)
    archive_path = output / "FoodData_Central_sr_legacy_food_csv_2018-04.zip"
    if not archive_path.exists():
        download(SR_URL, archive_path)

    with zipfile.ZipFile(archive_path) as archive:
        names = archive.namelist()
        food_member = find_member(names, "food.csv")
        food_nutrient_member = find_member(names, "food_nutrient.csv")
        portion_member = find_member(names, "food_portion.csv")
        measure_member = find_member(names, "measure_unit.csv")
        sr_member = find_member(names, "sr_legacy_food.csv", required=False)

        measure_by_id = {row["id"]: row["name"] for row in rows_from_zip(archive, measure_member)}
        ndb_by_fdc = {}
        if sr_member:
            ndb_by_fdc = {row["fdc_id"]: row.get("ndb_number") for row in rows_from_zip(archive, sr_member)}

        nutrients: dict[str, dict[str, float]] = defaultdict(dict)
        energy: dict[str, tuple[int, float]] = {}
        for row in rows_from_zip(archive, food_nutrient_member):
            nutrient_id = (row.get("nutrient_id") or "").strip()
            amount = number(row.get("amount"))
            if amount is None:
                continue
            if nutrient_id in ENERGY_IDS:
                priority = ENERGY_IDS[nutrient_id]
                current = energy.get(row["fdc_id"])
                if current is None or priority < current[0]:
                    energy[row["fdc_id"]] = (priority, amount)
            elif nutrient_id in ID_MAP:
                nutrients[row["fdc_id"]][ID_MAP[nutrient_id]] = amount
        for fdc_id, (_, value) in energy.items():
            nutrients[fdc_id]["calories_kcal"] = value

        portions: dict[str, list[dict]] = defaultdict(list)
        for row in rows_from_zip(archive, portion_member):
            grams = number(row.get("gram_weight"))
            if grams is None or grams <= 0:
                continue
            amount = number(row.get("amount")) or 1.0
            measure = measure_by_id.get(row.get("measure_unit_id", ""), "")
            label = row.get("portion_description") or row.get("modifier") or measure or "portion"
            portions[row["fdc_id"]].append({
                "amount": amount, "label": label.strip(), "measureUnit": measure, "gramWeight": grams,
            })

        foods = []
        for row in rows_from_zip(archive, food_member):
            if row.get("data_type") != "sr_legacy_food":
                continue
            fdc_id = row["fdc_id"]
            food_nutrients = nutrients.get(fdc_id, {})
            foods.append({
                "id": f"sr-{fdc_id}", "fdcId": int(fdc_id), "ndbNumber": ndb_by_fdc.get(fdc_id),
                "nameEn": row.get("description", "").strip(), "dataType": row.get("data_type"),
                "nutrientsPer100g": {field: food_nutrients.get(field) for field in OUTPUT_FIELDS},
                "portions": sorted(portions.get(fdc_id, []), key=lambda item: item["gramWeight"]),
                "source": {"name": "USDA FoodData Central SR Legacy", "url": SR_URL},
            })

    foods.sort(key=lambda item: (item["nameEn"].lower(), item["fdcId"]))
    complete = sum(all(food["nutrientsPer100g"].get(k) is not None for k in ("calories_kcal","protein_g","fat_g","carbs_g")) for food in foods)
    if complete < int(len(foods) * 0.95):
        raise RuntimeError(f"Macro coverage too low: {complete}/{len(foods)}")

    json_path = output / "sr_legacy_app_layer.json"
    json_path.write_text(json.dumps({
        "format":"ifkb-atomic-food-layer","version":"sr-legacy-2018",
        "foodCount":len(foods),"foods":foods,
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    db_path = output / "sr_legacy_app_layer.sqlite"
    if db_path.exists(): db_path.unlink()
    db = sqlite3.connect(db_path)
    db.executescript("""
      CREATE TABLE foods(id TEXT PRIMARY KEY,fdc_id INTEGER UNIQUE,ndb_number TEXT,name_en TEXT,
        calories_kcal REAL,protein_g REAL,fat_g REAL,carbs_g REAL,fiber_g REAL,sugars_g REAL,
        sodium_mg REAL,cholesterol_mg REAL);
      CREATE TABLE portions(id INTEGER PRIMARY KEY AUTOINCREMENT,food_id TEXT,amount REAL,label TEXT,
        measure_unit TEXT,gram_weight REAL,FOREIGN KEY(food_id) REFERENCES foods(id));
      CREATE INDEX foods_name_idx ON foods(name_en);
      CREATE INDEX portions_food_idx ON portions(food_id);
    """)
    for food in foods:
        n=food["nutrientsPer100g"]
        db.execute("INSERT INTO foods VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",(
            food["id"],food["fdcId"],food["ndbNumber"],food["nameEn"],*(n[k] for k in OUTPUT_FIELDS)))
        db.executemany("INSERT INTO portions(food_id,amount,label,measure_unit,gram_weight) VALUES (?,?,?,?,?)",
            [(food["id"],p["amount"],p["label"],p["measureUnit"],p["gramWeight"]) for p in food["portions"]])
    db.commit();db.close()

    manifest={
        "releaseId":"IFKB-SR-Legacy-app-layer","archiveSha256":sha256(archive_path),
        "foodCount":len(foods),"completeMacroCount":complete,
        "portionCount":sum(len(food["portions"]) for food in foods),
        "jsonSha256":sha256(json_path),"sqliteSha256":sha256(db_path),
    }
    (output/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(manifest,indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
