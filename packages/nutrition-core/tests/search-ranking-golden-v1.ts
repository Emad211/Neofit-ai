import type {
  PersianAliasRecord,
  UniversalCatalogCandidate,
} from '../src';

export const SEARCH_RANKING_GOLDEN_PROVENANCE = {
  referenceBranch: 'agent/iranian-food-kb-foundation',
  referenceHead: '648b98cdc921beb26ccd0ff05a1f17944bb6f71d',
  searchBlob: 'bb99c934beeed5094da7e0a29a8f53635ace48b3',
  rankingBlob: '9b23b1ef7d6817ff2b946e1fdedcad76608279e1',
  mobileTestBlob: '2291e1958efe5e17010230c5864c9fadc9bc47ba',
  aliasRegistryBlob: '94429b1937edc6234b23fc8398531b531a891cc2',
  benchmarkManifestBlob: '24a1d20effe679b23e4ee4966d0bdb01f2b06ec0',
  benchmarkReleaseVersion: '1.1.0',
  benchmarkCatalogVersion: '1.2.0',
  benchmarkDatabaseSha256: '0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247',
  benchmarkWorkflowRun: 30285619578,
  benchmarkArtifact: 8660666147,
  benchmarkArtifactDigest: 'sha256:d43931525ade2f1b685b18647d1554cc317f14bd8874ed66fe5c85370454fbde',
  naturalQueryReleaseStatus: 'contract_only_not_released',
} as const;

export const controlledAliasRows: readonly PersianAliasRecord[] = [
  { aliasFa: 'تخم مرغ', target: 'egg, whole', targetType: 'generic' },
  { aliasFa: 'تخم مرغ آب پز', target: 'egg, whole, boiled', targetType: 'generic' },
  { aliasFa: 'سفیده تخم مرغ', target: 'egg, white', targetType: 'generic' },
  { aliasFa: 'گوجه فرنگی', target: 'tomato', targetType: 'generic' },
  { aliasFa: 'ماست', target: 'yogurt', targetType: 'generic' },
  { aliasFa: 'ماست', target: 'IFKB-CANON-00080', targetType: 'iranian_canon' },
  { aliasFa: 'قورمه‌سبزی', target: 'IFKB-CANON-00008', targetType: 'iranian_canon' },
  { aliasFa: 'قورمه سبزی', target: 'IFKB-CANON-00008', targetType: 'iranian_canon' },
  { aliasFa: 'دیزی', target: 'IFKB-CANON-00108', targetType: 'iranian_canon' },
  { aliasFa: 'اکبر جوجه', target: 'IFKB-CANON-00112', targetType: 'iranian_canon' },
  { aliasFa: 'اکبرجوجه', target: 'IFKB-CANON-00112', targetType: 'iranian_canon' },
  { aliasFa: 'کوکو سیب‌زمینی', target: 'IFKB-CANON-00184', targetType: 'iranian_canon' },
  { aliasFa: 'کوکو سیب زمینی', target: 'IFKB-CANON-00184', targetType: 'iranian_canon' },
];

export const representativeAliasCases = [
  { variant: 'exact_alias', query: 'گوجه فرنگی', target: 'tomato', targetType: 'generic' },
  { variant: 'quantity_context', query: '50 گرم گوجه فرنگی', target: 'tomato', targetType: 'generic' },
  { variant: 'arabic_characters', query: 'سفيده تخم مرغ', target: 'egg, white', targetType: 'generic' },
  { variant: 'context_sentence', query: 'برای ناهار دیزی', target: 'IFKB-CANON-00108', targetType: 'iranian_canon' },
  { variant: 'extra_spacing', query: '  گوجه   فرنگی  ', target: 'tomato', targetType: 'generic' },
  { variant: 'half_space', query: 'کوکو‌سیب زمینی', target: 'IFKB-CANON-00184', targetType: 'iranian_canon' },
  { variant: 'punctuation', query: '«اکبر جوجه»', target: 'IFKB-CANON-00112', targetType: 'iranian_canon' },
  { variant: 'joined_spacing', query: 'گوجهفرنگی', target: 'tomato', targetType: 'generic' },
  { variant: 'trailing_serving', query: 'دیزی، یک سهم', target: 'IFKB-CANON-00108', targetType: 'iranian_canon' },
] as const;

export function universalCandidate(
  id: string,
  sourceType: UniversalCatalogCandidate['sourceType'],
  nameEn: string,
  overrides: Partial<UniversalCatalogCandidate> = {},
): UniversalCatalogCandidate {
  return {
    id,
    sourceType,
    nameEn,
    caloriesKcal: 100,
    proteinG: 10,
    fatG: 3,
    carbsG: 12,
    fiberG: 1,
    sugarsG: 1,
    sodiumMg: 20,
    cholesterolMg: 0,
    calciumMg: 10,
    ironMg: 1,
    potassiumMg: 100,
    vitaminCMg: 1,
    macroComplete: true,
    portionCount: 1,
    bm25: -1,
    ...overrides,
  };
}
