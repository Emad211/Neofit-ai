import type { EvidenceTier } from './types';

export interface CatalogProvenanceInput {
  readonly sourceType: 'seeded' | 'custom' | 'imported';
  readonly sourceLabel: string;
  readonly evidenceTier?: EvidenceTier;
}

export function resolveCatalogEvidenceTier(input: CatalogProvenanceInput): EvidenceTier {
  if (input.sourceType === 'custom') return 'user_entered';
  if (/\bDS0\b|broad[ -]?fallback/i.test(input.sourceLabel)) return 'broad_fallback';
  return input.evidenceTier ?? 'legacy_estimate';
}

export function isAllowedImportedEvidenceTier(value: EvidenceTier): boolean {
  return value === 'verified_source'
    || value === 'digital_consensus'
    || value === 'legacy_estimate';
}
