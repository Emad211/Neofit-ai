#!/usr/bin/env python3
from pathlib import Path


def replace_once(path_str: str, old: str, new: str, label: str) -> None:
    path = Path(path_str)
    text = path.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one match in {path}, found {count}')
    path.write_text(text.replace(old, new), encoding='utf-8')


expanded_fields = '''OUTPUT_FIELDS = (
    "calories_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g",
    "sugars_g", "sodium_mg", "cholesterol_mg", "calcium_mg",
    "iron_mg", "potassium_mg", "vitamin_c_mg",
)'''
for path in ('ifkb/universal/import_fndds_app_layer.py', 'ifkb/universal/import_sr_legacy_app_layer.py'):
    replace_once(
        path,
        '''OUTPUT_FIELDS = (
    "calories_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g",
    "sugars_g", "sodium_mg", "cholesterol_mg",
)''',
        expanded_fields,
        'OUTPUT_FIELDS',
    )

replace_once(
    'ifkb/universal/import_fndds_app_layer.py',
    '''    "291": "fiber_g", "269": "sugars_g", "307": "sodium_mg",
    "601": "cholesterol_mg",
    "1003": "protein_g", "1004": "fat_g", "1005": "carbs_g",
    "1079": "fiber_g", "2000": "sugars_g", "1093": "sodium_mg",
    "1253": "cholesterol_mg",''',
    '''    "291": "fiber_g", "269": "sugars_g", "307": "sodium_mg",
    "601": "cholesterol_mg", "301": "calcium_mg", "303": "iron_mg",
    "306": "potassium_mg", "401": "vitamin_c_mg",
    "1003": "protein_g", "1004": "fat_g", "1005": "carbs_g",
    "1079": "fiber_g", "2000": "sugars_g", "1093": "sodium_mg",
    "1253": "cholesterol_mg", "1087": "calcium_mg", "1089": "iron_mg",
    "1092": "potassium_mg", "1162": "vitamin_c_mg",''',
    'FNDDS nutrient IDs',
)
replace_once(
    'ifkb/universal/import_fndds_app_layer.py',
    '''    "sodium, na": "sodium_mg",
    "cholesterol": "cholesterol_mg",''',
    '''    "sodium, na": "sodium_mg",
    "cholesterol": "cholesterol_mg",
    "calcium, ca": "calcium_mg",
    "iron, fe": "iron_mg",
    "potassium, k": "potassium_mg",
    "vitamin c, total ascorbic acid": "vitamin_c_mg",''',
    'FNDDS nutrient names',
)
replace_once(
    'ifkb/universal/import_fndds_app_layer.py',
    '''        sugars_g REAL, sodium_mg REAL, cholesterol_mg REAL
      );''',
    '''        sugars_g REAL, sodium_mg REAL, cholesterol_mg REAL, calcium_mg REAL,
        iron_mg REAL, potassium_mg REAL, vitamin_c_mg REAL
      );''',
    'FNDDS SQLite columns',
)
replace_once(
    'ifkb/universal/import_fndds_app_layer.py',
    '            "INSERT INTO foods VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",',
    '            f"INSERT INTO foods VALUES ({\',\'.join(\'?\' for _ in range(4 + len(OUTPUT_FIELDS)))})",',
    'FNDDS dynamic placeholders',
)

replace_once(
    'ifkb/universal/import_sr_legacy_app_layer.py',
    '''    "291": "fiber_g", "269": "sugars_g", "307": "sodium_mg", "601": "cholesterol_mg",
    "1003": "protein_g", "1004": "fat_g", "1005": "carbs_g",
    "1079": "fiber_g", "2000": "sugars_g", "1093": "sodium_mg", "1253": "cholesterol_mg",''',
    '''    "291": "fiber_g", "269": "sugars_g", "307": "sodium_mg", "601": "cholesterol_mg",
    "301": "calcium_mg", "303": "iron_mg", "306": "potassium_mg", "401": "vitamin_c_mg",
    "1003": "protein_g", "1004": "fat_g", "1005": "carbs_g",
    "1079": "fiber_g", "2000": "sugars_g", "1093": "sodium_mg", "1253": "cholesterol_mg",
    "1087": "calcium_mg", "1089": "iron_mg", "1092": "potassium_mg", "1162": "vitamin_c_mg",''',
    'SR nutrient IDs',
)
replace_once(
    'ifkb/universal/import_sr_legacy_app_layer.py',
    '        sodium_mg REAL,cholesterol_mg REAL);',
    '''        sodium_mg REAL,cholesterol_mg REAL,calcium_mg REAL,iron_mg REAL,
        potassium_mg REAL,vitamin_c_mg REAL);''',
    'SR SQLite columns',
)
replace_once(
    'ifkb/universal/import_sr_legacy_app_layer.py',
    '        db.execute("INSERT INTO foods VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",(',
    '        db.execute(f"INSERT INTO foods VALUES ({\',\'.join(\'?\' for _ in range(4 + len(OUTPUT_FIELDS)))})",(',
    'SR dynamic placeholders',
)

builder = 'ifkb/universal/build_mobile_catalog.py'
replace_once(
    builder,
    '''  sodium_mg REAL,
  cholesterol_mg REAL,
  macro_completeness INTEGER''',
    '''  sodium_mg REAL,
  cholesterol_mg REAL,
  calcium_mg REAL,
  iron_mg REAL,
  potassium_mg REAL,
  vitamin_c_mg REAL,
  macro_completeness INTEGER''',
    'mobile catalog columns',
)
replace_once(
    builder,
    '''                          fiber_g,sugars_g,sodium_mg,cholesterol_mg
                   FROM foods ORDER BY id''',
    '''                          fiber_g,sugars_g,sodium_mg,cholesterol_mg,calcium_mg,iron_mg,
                          potassium_mg,vitamin_c_mg
                   FROM foods ORDER BY id''',
    'mobile catalog source query',
)
replace_once(
    builder,
    '''                     fat_g,carbs_g,fiber_g,sugars_g,sodium_mg,cholesterol_mg,macro_completeness)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
    '''                     fat_g,carbs_g,fiber_g,sugars_g,sodium_mg,cholesterol_mg,calcium_mg,
                     iron_mg,potassium_mg,vitamin_c_mg,macro_completeness)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
    'mobile catalog insert',
)
replace_once(
    builder,
    '''            'macroCompleteCount': db.execute('SELECT COUNT(*) FROM generic_foods WHERE macro_completeness=1').fetchone()[0],
            'iranianCanonCount':''',
    '''            'macroCompleteCount': db.execute('SELECT COUNT(*) FROM generic_foods WHERE macro_completeness=1').fetchone()[0],
            'calciumCoverageCount': db.execute('SELECT COUNT(*) FROM generic_foods WHERE calcium_mg IS NOT NULL').fetchone()[0],
            'ironCoverageCount': db.execute('SELECT COUNT(*) FROM generic_foods WHERE iron_mg IS NOT NULL').fetchone()[0],
            'potassiumCoverageCount': db.execute('SELECT COUNT(*) FROM generic_foods WHERE potassium_mg IS NOT NULL').fetchone()[0],
            'vitaminCCoverageCount': db.execute('SELECT COUNT(*) FROM generic_foods WHERE vitamin_c_mg IS NOT NULL').fetchone()[0],
            'iranianCanonCount':''',
    'mobile catalog micronutrient counts',
)
replace_once(builder, "parser.add_argument('--version', default='1.0.0')", "parser.add_argument('--version', default='1.1.0')", 'catalog default version')

ranking = 'mobile/src/nutrition-core/universal-catalog-ranking.ts'
replace_once(
    ranking,
    '''  readonly cholesterolMg: number | null;
  readonly macroComplete: boolean;''',
    '''  readonly cholesterolMg: number | null;
  readonly calciumMg: number | null;
  readonly ironMg: number | null;
  readonly potassiumMg: number | null;
  readonly vitaminCMg: number | null;
  readonly macroComplete: boolean;''',
    'ranking micronutrients',
)

repo = 'mobile/src/db/universal-catalog-repository.ts'
replace_once(
    repo,
    '''  cholesterol_mg: number | null;
  macro_completeness: number;''',
    '''  cholesterol_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;
  vitamin_c_mg: number | null;
  macro_completeness: number;''',
    'repository row micronutrients',
)
replace_once(
    repo,
    '''    cholesterolMg: row.cholesterol_mg,
    macroComplete:''',
    '''    cholesterolMg: row.cholesterol_mg,
    calciumMg: row.calcium_mg,
    ironMg: row.iron_mg,
    potassiumMg: row.potassium_mg,
    vitaminCMg: row.vitamin_c_mg,
    macroComplete:''',
    'repository mapping micronutrients',
)
replace_once(
    repo,
    '''            f.fiber_g,f.sugars_g,f.sodium_mg,f.cholesterol_mg,f.macro_completeness,''',
    '''            f.fiber_g,f.sugars_g,f.sodium_mg,f.cholesterol_mg,f.calcium_mg,f.iron_mg,
            f.potassium_mg,f.vitamin_c_mg,f.macro_completeness,''',
    'repository search SELECT',
)
replace_once(
    repo,
    '''    `SELECT id,source_type,name_en,calories_kcal,protein_g,fat_g,carbs_g,fiber_g,sugars_g,
            sodium_mg,cholesterol_mg,macro_completeness,portion_count''',
    '''    `SELECT id,source_type,name_en,calories_kcal,protein_g,fat_g,carbs_g,fiber_g,sugars_g,
            sodium_mg,cholesterol_mg,calcium_mg,iron_mg,potassium_mg,vitamin_c_mg,
            macro_completeness,portion_count''',
    'repository details SELECT',
)

for path in ('mobile/app/food-search.tsx', 'mobile/src/services/nutrition-recipe-resolver.ts'):
    replace_once(
        path,
        '''    ...(details.cholesterolMg === null ? {} : { cholesterolMg: details.cholesterolMg }),
  };''',
        '''    ...(details.cholesterolMg === null ? {} : { cholesterolMg: details.cholesterolMg }),
    ...(details.calciumMg === null ? {} : { calciumMg: details.calciumMg }),
    ...(details.ironMg === null ? {} : { ironMg: details.ironMg }),
    ...(details.potassiumMg === null ? {} : { potassiumMg: details.potassiumMg }),
    ...(details.vitaminCMg === null ? {} : { vitaminCMg: details.vitaminCMg }),
  };''',
        f'{path} vector micronutrients',
    )

replace_once(
    'mobile/src/db/universal-catalog-database.ts',
    "const EXPECTED_CATALOG_VERSION = '1.0.0';",
    "const EXPECTED_CATALOG_VERSION = '1.1.0';",
    'runtime catalog version',
)

workflow = '.github/workflows/ifkb-mobile-catalog-v1.yml'
replace_once(workflow, '--version 1.0.0', '--version 1.1.0', 'catalog workflow version')
replace_once(
    workflow,
    '''          complete=db.execute('SELECT COUNT(*) FROM generic_foods WHERE macro_completeness=1').fetchone()[0]
          white=''',
    '''          complete=db.execute('SELECT COUNT(*) FROM generic_foods WHERE macro_completeness=1').fetchone()[0]
          calcium=db.execute('SELECT COUNT(*) FROM generic_foods WHERE calcium_mg IS NOT NULL').fetchone()[0]
          iron=db.execute('SELECT COUNT(*) FROM generic_foods WHERE iron_mg IS NOT NULL').fetchone()[0]
          potassium=db.execute('SELECT COUNT(*) FROM generic_foods WHERE potassium_mg IS NOT NULL').fetchone()[0]
          vitamin_c=db.execute('SELECT COUNT(*) FROM generic_foods WHERE vitamin_c_mg IS NOT NULL').fetchone()[0]
          white=''',
    'catalog workflow micro counts',
)
replace_once(
    workflow,
    '''          assert complete>=13224,complete
          assert all(value>0''',
    '''          assert complete>=13224,complete
          assert calcium>10000,calcium
          assert iron>10000,iron
          assert potassium>10000,potassium
          assert vitamin_c>9000,vitamin_c
          assert all(value>0''',
    'catalog workflow micro assertions',
)
replace_once(
    workflow,
    "'completeMacros':complete,'bytes':manifest['databaseBytes']",
    "'completeMacros':complete,'calcium':calcium,'iron':iron,'potassium':potassium,'vitaminC':vitamin_c,'bytes':manifest['databaseBytes']",
    'catalog workflow micro report',
)

print('micronutrient patch anchors applied successfully')
