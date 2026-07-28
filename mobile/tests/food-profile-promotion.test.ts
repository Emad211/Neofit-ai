import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  parseFoodProfilePromotionJson,
  type FoodProfilePromotionBundle,
} from '../src/domain/food-profile-promotion';

function validBundle(): FoodProfilePromotionBundle {
  return {
    format: 'neofit-food-profile-promotion',
    schemaVersion: 1,
    source: {
      label: 'Peer-reviewed Iranian recipe dataset',
      version: '2026.1',
      evidenceTier: 'verified_source',
    },
    records: [{
      sourceRecordId: 'article-17:table-3:row-8',
      food: {
        id: 'IFKB-CANON-00008',
        nameFa: 'قورمه سبزی',
        nameEn: 'Ghormeh sabzi',
        aliasesFa: ['قرمه سبزی'],
        aliasesEn: ['Persian herb stew'],
        category: 'stew',
        portionLabelFa: 'یک پرس ۳۲۰ گرمی',
        portionLabelEn: 'one 320 g serving',
        portionGrams: 320,
        calories: 410,
        proteinG: 24,
        carbsG: 28,
        fatG: 20,
        variabilityPct: 15,
        confidence: 'high',
        notesFa: 'پروفایل مبتنی بر منبع مشخص.',
        notesEn: 'Profile tied to a specific source record.',
      },
    }],
  };
}

test('strong profile promotion bundle parses a versioned source and record id', () => {
  const parsed = parseFoodProfilePromotionJson(JSON.stringify(validBundle()));
  assert.equal(parsed.source.evidenceTier, 'verified_source');
  assert.equal(parsed.source.version, '2026.1');
  assert.equal(parsed.records[0]?.sourceRecordId, 'article-17:table-3:row-8');
  assert.equal(parsed.records[0]?.food.portionGrams, 320);
  assert.equal(parsed.records[0]?.food.id, 'IFKB-CANON-00008');
});

test('promotion bundle rejects weak profiles, duplicates and fallback-labelled sources', () => {
  const missingWeight = validBundle();
  missingWeight.records[0]!.food.portionGrams = null;
  assert.throws(
    () => parseFoodProfilePromotionJson(JSON.stringify(missingWeight)),
    /defensible serving weight/,
  );

  const lowConfidence = validBundle();
  lowConfidence.records[0]!.food.confidence = 'low';
  assert.throws(
    () => parseFoodProfilePromotionJson(JSON.stringify(lowConfidence)),
    /cannot remain low confidence/,
  );

  const duplicate = validBundle();
  duplicate.records.push({
    ...duplicate.records[0]!,
    sourceRecordId: 'article-17:table-3:row-9',
  });
  assert.throws(
    () => parseFoodProfilePromotionJson(JSON.stringify(duplicate)),
    /Duplicate promoted food id/,
  );

  const fallbackSource = validBundle();
  fallbackSource.source.label = 'IFKB DS0 broad-fallback';
  assert.throws(
    () => parseFoodProfilePromotionJson(JSON.stringify(fallbackSource)),
    /cannot be used as promoted evidence/,
  );
});

test('promotion application is merge-only and refreshes record-level canonical provenance', () => {
  const service = readFileSync(new URL('../src/services/food-profile-promotion.ts', import.meta.url), 'utf8');
  assert.match(service, /replacePreviousImports:\s*false/);
  assert.match(service, /record\.sourceRecordId/);
  assert.match(service, /source_record_id = \?, source_version = \?/);
  assert.match(service, /evidence_tier = \?/);
  assert.match(service, /seedNutritionCoreFromFoodCatalog\(database\)/);
  assert.doesNotMatch(service, /DELETE FROM food_catalog/);
});
