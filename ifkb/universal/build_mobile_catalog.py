#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE generic_foods(
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK(source_type IN ('sr_legacy','fndds')),
  source_numeric_id INTEGER,
  source_food_code TEXT,
  name_en TEXT NOT NULL,
  calories_kcal REAL,
  protein_g REAL,
  fat_g REAL,
  carbs_g REAL,
  fiber_g REAL,
  sugars_g REAL,
  sodium_mg REAL,
  cholesterol_mg REAL,
  macro_completeness INTEGER NOT NULL CHECK(macro_completeness IN (0,1)),
  portion_count INTEGER NOT NULL DEFAULT 0 CHECK(portion_count >= 0)
);
CREATE INDEX generic_foods_name_idx ON generic_foods(name_en COLLATE NOCASE);
CREATE INDEX generic_foods_source_idx ON generic_foods(source_type, name_en);
CREATE TABLE generic_portions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  food_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  label TEXT NOT NULL,
  measure_unit TEXT,
  gram_weight REAL NOT NULL CHECK(gram_weight > 0),
  FOREIGN KEY(food_id) REFERENCES generic_foods(id) ON DELETE CASCADE
);
CREATE INDEX generic_portions_food_idx ON generic_portions(food_id, gram_weight);
CREATE TABLE iranian_canon(
  canon_id TEXT PRIMARY KEY,
  name_fa TEXT NOT NULL,
  name_en TEXT NOT NULL,
  aliases_fa TEXT,
  category TEXT,
  region TEXT,
  canon_status TEXT,
  priority TEXT
);
CREATE INDEX iranian_canon_name_fa_idx ON iranian_canon(name_fa COLLATE NOCASE);
CREATE INDEX iranian_canon_name_en_idx ON iranian_canon(name_en COLLATE NOCASE);
CREATE TABLE persian_search_aliases(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias_fa TEXT NOT NULL,
  target TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('generic','iranian_canon')),
  UNIQUE(alias_fa,target,target_type)
);
CREATE INDEX persian_alias_idx ON persian_search_aliases(alias_fa COLLATE NOCASE);
CREATE VIRTUAL TABLE generic_food_search USING fts5(
  id UNINDEXED,
  name_en,
  source_type UNINDEXED,
  tokenize='unicode61 remove_diacritics 2'
);
CREATE VIRTUAL TABLE iranian_food_search USING fts5(
  canon_id UNINDEXED,
  name_fa,
  name_en,
  aliases_fa,
  category UNINDEXED,
  tokenize='unicode61 remove_diacritics 2'
);
"""


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle))


def source_food_rows(db_path: Path, source_type: str) -> Iterable[tuple]:
    db = sqlite3.connect(db_path)
    try:
        columns = {row[1] for row in db.execute('PRAGMA table_info(foods)')}
        food_code = 'food_code' if 'food_code' in columns else 'ndb_number' if 'ndb_number' in columns else 'NULL'
        query = f'''SELECT id,fdc_id,{food_code},name_en,calories_kcal,protein_g,fat_g,carbs_g,
                          fiber_g,sugars_g,sodium_mg,cholesterol_mg
                   FROM foods ORDER BY id'''
        for row in db.execute(query):
            complete = int(all(value is not None for value in row[4:8]))
            yield (row[0], source_type, *row[1:], complete)
    finally:
        db.close()


def source_portion_rows(db_path: Path) -> Iterable[tuple]:
    db = sqlite3.connect(db_path)
    try:
        yield from db.execute(
            'SELECT food_id,amount,label,measure_unit,gram_weight FROM portions ORDER BY food_id,id'
        )
    finally:
        db.close()


def build(args: argparse.Namespace) -> dict:
    output: Path = args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        output.unlink()
    db = sqlite3.connect(output)
    try:
        db.execute('PRAGMA journal_mode=OFF')
        db.execute('PRAGMA synchronous=OFF')
        db.execute('PRAGMA temp_store=MEMORY')
        db.executescript(SCHEMA)
        for source_type, path in [('sr_legacy', args.sr_db), ('fndds', args.fndds_db)]:
            db.executemany(
                '''INSERT INTO generic_foods(
                     id,source_type,source_numeric_id,source_food_code,name_en,calories_kcal,protein_g,
                     fat_g,carbs_g,fiber_g,sugars_g,sodium_mg,cholesterol_mg,macro_completeness)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                source_food_rows(path, source_type),
            )
            db.executemany(
                '''INSERT INTO generic_portions(food_id,amount,label,measure_unit,gram_weight)
                   VALUES (?,?,?,?,?)''',
                source_portion_rows(path),
            )
        db.execute(
            '''UPDATE generic_foods SET portion_count=(
                 SELECT COUNT(*) FROM generic_portions p WHERE p.food_id=generic_foods.id)'''
        )
        db.execute(
            '''INSERT INTO generic_food_search(id,name_en,source_type)
               SELECT id,name_en,source_type FROM generic_foods'''
        )

        canon = read_csv(args.iranian_canon)
        db.executemany(
            '''INSERT INTO iranian_canon(
                 canon_id,name_fa,name_en,aliases_fa,category,region,canon_status,priority)
               VALUES (?,?,?,?,?,?,?,?)''',
            [
                tuple(row.get(key) or None for key in (
                    'canon_id','name_fa','name_en','aliases_fa','category','region','canon_status','priority'
                ))
                for row in canon
            ],
        )
        db.execute(
            '''INSERT INTO iranian_food_search(canon_id,name_fa,name_en,aliases_fa,category)
               SELECT canon_id,name_fa,name_en,COALESCE(aliases_fa,''),COALESCE(category,'')
               FROM iranian_canon'''
        )

        aliases = read_csv(args.persian_aliases)
        db.executemany(
            '''INSERT OR IGNORE INTO persian_search_aliases(alias_fa,target,target_type)
               VALUES (?,?,?)''',
            [(row['alias_fa'], row['target'], row['target_type']) for row in aliases],
        )

        now = datetime.now(timezone.utc).isoformat()
        counts = {
            'genericFoodCount': db.execute('SELECT COUNT(*) FROM generic_foods').fetchone()[0],
            'genericPortionCount': db.execute('SELECT COUNT(*) FROM generic_portions').fetchone()[0],
            'macroCompleteCount': db.execute('SELECT COUNT(*) FROM generic_foods WHERE macro_completeness=1').fetchone()[0],
            'iranianCanonCount': db.execute('SELECT COUNT(*) FROM iranian_canon').fetchone()[0],
            'persianAliasCount': db.execute('SELECT COUNT(*) FROM persian_search_aliases').fetchone()[0],
        }
        metadata = {
            'format': 'ifkb-mobile-catalog',
            'version': args.version,
            'createdAt': now,
            **{key: str(value) for key, value in counts.items()},
        }
        db.executemany('INSERT INTO meta(key,value) VALUES (?,?)', metadata.items())
        db.commit()
        db.execute('PRAGMA optimize')
        db.execute('VACUUM')
        db.commit()
    finally:
        db.close()

    manifest = {
        'format': 'ifkb-mobile-catalog-release',
        'version': args.version,
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'databaseFile': output.name,
        'databaseBytes': output.stat().st_size,
        'databaseSha256': sha256(output),
        **counts,
        'sources': {
            'srLegacyDatabase': str(args.sr_db),
            'fnddsDatabase': str(args.fndds_db),
        },
    }
    args.manifest.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--sr-db', type=Path, required=True)
    parser.add_argument('--fndds-db', type=Path, required=True)
    parser.add_argument('--iranian-canon', type=Path, required=True)
    parser.add_argument('--persian-aliases', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--version', default='1.0.0')
    args = parser.parse_args()
    print(json.dumps(build(args), ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
