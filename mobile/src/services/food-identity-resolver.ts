import { findBestLocalFoodMatch } from '@/services/local-food-matcher';
import {
  buildCatalogQueries,
  interpretFoodIdentityWithLlm,
  type FoodIdentityInterpretation,
} from '@/services/food-language-interpretation';
import type { VisionFoodCandidate } from '@/services/vision-food-contract';

export type LocalFoodMatch = NonNullable<Awaited<ReturnType<typeof findBestLocalFoodMatch>>>;

export interface LlmFoodResolutionChoice {
  readonly key: string;
  readonly query: string;
  readonly local: LocalFoodMatch;
}

export interface FoodIdentityResolution {
  readonly source: 'local' | 'llm' | 'none';
  readonly directMatch: LocalFoodMatch | null;
  readonly choices: readonly LlmFoodResolutionChoice[];
  readonly interpretation: FoodIdentityInterpretation | null;
  readonly requiresConfirmation: boolean;
}

const RELIABLE_LOCAL_SCORE = 500;
const CLOSE_MATCH_MARGIN = 90;
const MINIMUM_LLM_AUTO_CONFIDENCE = 0.78;
const MAX_CHOICES = 4;

function uniqueChoices(
  rows: readonly { query: string; local: LocalFoodMatch }[],
): LlmFoodResolutionChoice[] {
  const seen = new Set<string>();
  const output: LlmFoodResolutionChoice[] = [];
  for (const row of [...rows].sort((left, right) => right.local.score - left.local.score)) {
    if (seen.has(row.local.item.id)) continue;
    seen.add(row.local.item.id);
    output.push({
      key: `${row.local.item.id}:${output.length}`,
      query: row.query,
      local: row.local,
    });
    if (output.length >= MAX_CHOICES) break;
  }
  return output;
}

export async function resolveFoodIdentityLocalFirst(input: {
  description: string;
  locale: 'fa' | 'en';
  allowLlm: boolean;
  visionCandidates?: readonly VisionFoodCandidate[];
  visionWarnings?: readonly string[];
}): Promise<FoodIdentityResolution> {
  const description = input.description.trim();
  const directMatch = description.length >= 2
    ? await findBestLocalFoodMatch(description)
    : null;

  if (directMatch && directMatch.score >= RELIABLE_LOCAL_SCORE) {
    return {
      source: 'local',
      directMatch,
      choices: [{ key: `${directMatch.item.id}:direct`, query: description, local: directMatch }],
      interpretation: null,
      requiresConfirmation: false,
    };
  }

  if (!input.allowLlm) {
    return {
      source: 'none',
      directMatch,
      choices: [],
      interpretation: null,
      requiresConfirmation: false,
    };
  }

  const interpretation = await interpretFoodIdentityWithLlm({
    description,
    locale: input.locale,
    ...(input.visionCandidates !== undefined
      ? { visionCandidates: input.visionCandidates }
      : {}),
    ...(input.visionWarnings !== undefined
      ? { visionWarnings: input.visionWarnings }
      : {}),
  });
  const queries = buildCatalogQueries(interpretation);
  const matched = (await Promise.all(queries.map(async (query) => ({
    query,
    local: await findBestLocalFoodMatch(query),
  }))))
    .filter((row): row is { query: string; local: LocalFoodMatch } => row.local !== null)
    .filter((row) => row.local.score >= RELIABLE_LOCAL_SCORE);
  const choices = uniqueChoices(matched);
  const best = choices[0];
  const second = choices[1];
  const closeAlternative = Boolean(
    best && second && best.local.score - second.local.score < CLOSE_MATCH_MARGIN,
  );
  const requiresConfirmation = Boolean(
    best && (
      interpretation.needsUserConfirmation
      || interpretation.confidence < MINIMUM_LLM_AUTO_CONFIDENCE
      || closeAlternative
    ),
  );

  return {
    source: choices.length > 0 ? 'llm' : 'none',
    directMatch,
    choices,
    interpretation,
    requiresConfirmation,
  };
}
