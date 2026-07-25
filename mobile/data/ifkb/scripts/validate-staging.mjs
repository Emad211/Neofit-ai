import fs from 'node:fs';
import path from 'node:path';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map((value) => value.replace(/^\uFEFF/, ''));
  return rows
    .slice(1)
    .filter((candidate) => candidate.some((value) => value !== ''))
    .map((candidate) => Object.fromEntries(
      headers.map((header, index) => [header, candidate[index] ?? '']),
    ));
}

function numberOrNull(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

const root = process.argv[2] ?? path.resolve('mobile/data/ifkb');
const strictRelease = process.argv.includes('--release');
const ingredientsPath = path.join(root, 'reference/ingredient-catalog-core.csv');
const stagingPath = path.join(root, 'staging/0.2.1/source-observations.csv');

const ingredients = parseCsv(fs.readFileSync(ingredientsPath, 'utf8'));
const staging = parseCsv(fs.readFileSync(stagingPath, 'utf8'));
const ingredientIds = new Set(ingredients.map((row) => row.ingredient_id));
const allowedStatuses = new Set([
  'pending_official_verification',
  'candidate_secondary',
  'quarantined',
  'verified',
  'rejected',
]);
const quarantineStatuses = new Set(['quarantined', 'rejected']);
const issues = [];

function issue(recordId, ruleId, severity, message) {
  issues.push({ recordId, ruleId, severity, message });
}

for (const row of staging) {
  const id = row.staging_id || '<missing>';
  if (!row.staging_id || !row.ingredient_id || !row.source_id || !row.source_release) {
    issue(id, 'QA-SRC-001', 'critical', 'Required identity/provenance field is missing.');
  }
  if (!ingredientIds.has(row.ingredient_id)) {
    issue(id, 'QA-ID-001', 'critical', `Unknown ingredient_id: ${row.ingredient_id}`);
  }
  if (row.basis !== 'per_100g') {
    issue(id, 'QA-BAS-001', 'critical', `Unsupported basis: ${row.basis}`);
  }
  if (!allowedStatuses.has(row.qa_status)) {
    issue(id, 'QA-REV-001', 'critical', `Unknown qa_status: ${row.qa_status}`);
  }

  const energy = numberOrNull(row.energy_kcal_100g);
  const protein = numberOrNull(row.protein_g);
  const carbs = numberOrNull(row.available_carbs_g);
  const fat = numberOrNull(row.fat_g);
  const fibre = numberOrNull(row.fiber_g) ?? 0;

  for (const [name, value] of Object.entries({ protein, carbs, fat, fibre })) {
    if (Number.isNaN(value) || (value !== null && (value < 0 || value > 100))) {
      issue(id, 'QA-RNG-001', 'critical', `${name} is outside 0–100 g/100 g or non-numeric.`);
    }
  }

  if (
    row.source_energy_raw
    && row.source_energy_unit_raw !== 'kcal'
    && energy === null
    && !quarantineStatuses.has(row.qa_status)
  ) {
    issue(id, 'QA-UNIT-001', 'critical', 'Ambiguous/non-kcal energy without quarantine.');
  }

  if ([protein, carbs, fat].every((value) => value !== null && !Number.isNaN(value))) {
    const calculated = protein * 4 + carbs * 4 + fat * 9 + fibre * 2;
    if (energy !== null && !Number.isNaN(energy) && energy > 0) {
      const delta = Math.abs(energy - calculated) / energy;
      if (delta > 0.10 && !quarantineStatuses.has(row.qa_status)) {
        issue(
          id,
          'QA-EN-004',
          'critical',
          `Energy delta ${(delta * 100).toFixed(1)}% exceeds 10% but row is not quarantined.`,
        );
      } else if (delta > 0.05 && row.qa_status === 'verified') {
        issue(id, 'QA-EN-003', 'high', `Verified row has energy delta ${(delta * 100).toFixed(1)}%.`);
      }
    }
  }

  if (strictRelease && row.qa_status !== 'verified') {
    issue(
      id,
      'QA-REL-001',
      'critical',
      `Release mode forbids non-verified staging status: ${row.qa_status}`,
    );
  }
}

const critical = issues.filter((entry) => entry.severity === 'critical');
const report = {
  mode: strictRelease ? 'release' : 'staging-audit',
  ingredientCount: ingredients.length,
  stagingCount: staging.length,
  quarantinedCount: staging.filter((row) => row.qa_status === 'quarantined').length,
  issueCount: issues.length,
  criticalCount: critical.length,
  issues,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = critical.length > 0 ? 1 : 0;
