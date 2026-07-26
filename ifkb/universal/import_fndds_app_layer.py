#!/usr/bin/env python3
"""Build a compact app-search layer from official USDA FNDDS 2021-2023 CSV data."""
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

FNDDS_URL = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip"
USER_AGENT = "IFKB-FNDDS-Importer/1.1 (+https://github.com/Emad211/Neofit-ai)"

# Stable USDA nutrient IDs are safer than matching display names, which can change.
NUTRIENT_ID_TO_FIELD = {
    "1003": "protein_g",
    "1004": "fat_g",
    "1005": "carbs_g",
    "1079": "fiber_g",
    "2000": "sugars_g",
    "1093": "sodium_mg",
    "1253": "cholesterol_mg",
}
ENERGY_ID_PRIORITY = ("1008", "2047", "2048")
OUTPUT_FIELDS = (
    "calories_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g",
    "sugars_g", "sodium_mg", "cholesterol_mg",
)


def download(url: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
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


def find_member(names: Iterable[str], basename: str) -> str:
    matches = [name for name in names if Path(name).name.lower() == basename.lower()]
    if len(matches) != 1:
        raise RuntimeError(f"Expected exactly one {basename}, found {matches}")
    return matches[0]


def rows_from_zip(archive: zipfile.ZipFile, member: str):
    with archive.open(member) as raw:
        text = (line.decode("utf-8-sig") for line in raw)
        yield from csv.DictReader(text)


def as_float(value: str | None) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except ValueError:
        return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--archive", type=Path)
    args = parser.parse_args()

    output = args.output
    output.mkdir(parents=True, exist_ok=True)
    archive_path = args.archive or output / "FoodData_Central_survey_food_csv_2024-10-31.zip"
    if not archive_path.exists():
        download(FNDDS_URL, archive_path)

    with zipfile.ZipFile(archive_path) as archive:
        names = archive.namelist()
        food_member = find_member(names, "food.csv")
        food_nutrient_member = find_member(names, "food_nutrient.csv")
        portion_member = find_member(names, "food_portion.csv")
        measure_member = find_member(names, "measure_unit.csv")
        survey_member = find_member(names, "survey_fndds_food.csv")

        measure_name_by_id = {
            row["id"]: row["name"] for row in rows_from_zip(archive, measure_member)
        }
        survey_by_fdc = {
            row["fdc_id"]: row for row in rows_from_zip(archive, survey_member)
        }

        nutrient_values: dict[str, dict[str, float]] = defaultdict(dict)
        energy_candidates: dict[str, dict[str, float]] = defaultdict(dict)
        for row in rows_from_zip(archive, food_nutrient_member):
            nutrient_id = row.get("nutrient_id", "")
            amount = as_float(row.get("amount"))
            if amount is None:
                continue
            if nutrient_id in ENERGY_ID_PRIORITY:
                energy_candidates[row["fdc_id"]][nutrient_id] = amount
                continue
            field = NUTRIENT_ID_TO_FIELD.get(nutrient_id)
            if field:
                nutrient_values[row["fdc_id"]][field] = amount

        for fdc_id, candidates in energy_candidates.items():
            for nutrient_id in ENERGY_ID_PRIORITY:
                if nutrient_id in candidates:
                    nutrient_values[fdc_id]["calories_kcal"] = candidates[nutrient_id]
                    break

        portions: dict[str, list[dict]] = defaultdict(list)
        for row in rows_from_zip(archive, portion_member):
            grams = as_float(row.get("gram_weight"))
            if grams is None or grams <= 0:
                continue
            amount = as_float(row.get("amount")) or 1.0
            measure = measure_name_by_id.get(row.get("measure_unit_id", ""), "")
            label = row.get("portion_description") or row.get("modifier") or measure or "portion"
            portions[row["fdc_id"]].append({
                "amount": amount,
                "label": label.strip(),
                "measureUnit": measure,
                "gramWeight": grams,
            })

        foods = []
        for row in rows_from_zip(archive, food_member):
            if row.get("data_type") != "survey_fndds_food":
                continue
            fdc_id = row["fdc_id"]
            nutrients = nutrient_values.get(fdc_id, {})
            survey = survey_by_fdc.get(fdc_id, {})
            foods.append({
                "id": f"fndds-{fdc_id}",
                "fdcId": int(fdc_id),
                "foodCode": survey.get("food_code"),
                "nameEn": row.get("description", "").strip(),
                "dataType": row.get("data_type"),
                "publicationDate": row.get("publication_date"),
                "nutrientsPer100g": {field: nutrients.get(field) for field in OUTPUT_FIELDS},
                "portions": sorted(portions.get(fdc_id, []), key=lambda item: item["gramWeight"]),
                "source": {
                    "name": "USDA FoodData Central FNDDS 2021-2023",
                    "url": FNDDS_URL,
                },
            })

    foods.sort(key=lambda item: (item["nameEn"].lower(), item["fdcId"]))
    complete_macro_count = sum(
        all(food["nutrientsPer100g"].get(key) is not None for key in ("calories_kcal", "protein_g", "fat_g", "carbs_g"))
        for food in foods
    )
    if complete_macro_count < int(len(foods) * 0.95):
        raise RuntimeError(f"Macro mapping incomplete: {complete_macro_count}/{len(foods)} foods")

    json_path = output / "fndds_2021_2023_app_layer.json"
    json_path.write_text(json.dumps({
        "format": "ifkb-universal-food-layer",
        "version": "fndds-2021-2023",
        "foodCount": len(foods),
        "foods": foods,
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    csv_path = output / "fndds_2021_2023_foods.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        fieldnames = ["id", "fdc_id", "food_code", "name_en", *OUTPUT_FIELDS, "portion_count"]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for food in foods:
            nutrients = food["nutrientsPer100g"]
            writer.writerow({
                "id": food["id"], "fdc_id": food["fdcId"], "food_code": food["foodCode"],
                "name_en": food["nameEn"], **nutrients, "portion_count": len(food["portions"]),
            })

    db_path = output / "fndds_2021_2023_app_layer.sqlite"
    if db_path.exists():
        db_path.unlink()
    db = sqlite3.connect(db_path)
    db.executescript("""
        CREATE TABLE foods(
          id TEXT PRIMARY KEY, fdc_id INTEGER UNIQUE NOT NULL, food_code TEXT,
          name_en TEXT NOT NULL, calories_kcal REAL, protein_g REAL, fat_g REAL,
          carbs_g REAL, fiber_g REAL, sugars_g REAL, sodium_mg REAL, cholesterol_mg REAL
        );
        CREATE TABLE portions(
          id INTEGER PRIMARY KEY AUTOINCREMENT, food_id TEXT NOT NULL, amount REAL NOT NULL,
          label TEXT NOT NULL, measure_unit TEXT, gram_weight REAL NOT NULL,
          FOREIGN KEY(food_id) REFERENCES foods(id)
        );
        CREATE INDEX foods_name_idx ON foods(name_en);
        CREATE INDEX portions_food_idx ON portions(food_id);
    """)
    for food in foods:
        nutrients = food["nutrientsPer100g"]
        db.execute(
            "INSERT INTO foods VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (food["id"], food["fdcId"], food["foodCode"], food["nameEn"],
             *(nutrients[field] for field in OUTPUT_FIELDS)),
        )
        db.executemany(
            "INSERT INTO portions(food_id,amount,label,measure_unit,gram_weight) VALUES (?,?,?,?,?)",
            [(food["id"], p["amount"], p["label"], p["measureUnit"], p["gramWeight"])
             for p in food["portions"]],
        )
    db.commit()
    db.close()

    manifest = {
        "releaseId": "IFKB-FNDDS-2021-2023-app-layer",
        "officialArchiveUrl": FNDDS_URL,
        "archiveSha256": sha256(archive_path),
        "foodCount": len(foods),
        "completeMacroCount": complete_macro_count,
        "portionCount": sum(len(food["portions"]) for food in foods),
        "jsonSha256": sha256(json_path),
        "sqliteSha256": sha256(db_path),
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
