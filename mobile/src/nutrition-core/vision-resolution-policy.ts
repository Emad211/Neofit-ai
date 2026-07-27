export interface VisionResolutionCandidateInput {
  readonly localId: string;
  readonly label: string;
  readonly localScore: number;
  readonly confidence: number | null;
  readonly visibleComponents: readonly string[];
}

export type VisionResolutionReason =
  | 'multiple_visible_components'
  | 'close_alternative'
  | 'low_provider_confidence'
  | 'weak_local_match'
  | 'provider_warning';

export interface VisionResolutionDecision {
  readonly mode: 'no_match' | 'auto_select' | 'confirm';
  readonly bestIndex: number | null;
  readonly choiceIndexes: readonly number[];
  readonly reasons: readonly VisionResolutionReason[];
  readonly visibleComponents: readonly string[];
}

const MINIMUM_LOCAL_SCORE = 220;
const STRONG_LOCAL_SCORE = 500;
const MINIMUM_AUTO_CONFIDENCE = 0.65;
const CLOSE_SCORE_MARGIN = 90;
const MAX_CONFIRMATION_CHOICES = 4;

function normalizedText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/\s+/g, ' ')
    .trim();
}

function confidenceValue(value: number | null): number {
  return value === null || !Number.isFinite(value)
    ? 0.35
    : Math.max(0, Math.min(1, value));
}

function combinedScore(candidate: VisionResolutionCandidateInput): number {
  return candidate.localScore + confidenceValue(candidate.confidence) * 120;
}

export function decideVisionResolution(input: {
  readonly candidates: readonly VisionResolutionCandidateInput[];
  readonly providerWarnings?: readonly string[];
}): VisionResolutionDecision {
  const ranked = input.candidates
    .map((candidate, index) => ({ candidate, index, score: combinedScore(candidate) }))
    .filter(({ candidate }) => Number.isFinite(candidate.localScore) && candidate.localScore >= MINIMUM_LOCAL_SCORE)
    .sort((left, right) => right.score - left.score || right.candidate.localScore - left.candidate.localScore || left.index - right.index);

  if (ranked.length === 0) {
    return {
      mode: 'no_match',
      bestIndex: null,
      choiceIndexes: [],
      reasons: [],
      visibleComponents: [],
    };
  }

  const distinctChoices: typeof ranked = [];
  const seenLocalIds = new Set<string>();
  for (const item of ranked) {
    if (seenLocalIds.has(item.candidate.localId)) continue;
    seenLocalIds.add(item.candidate.localId);
    distinctChoices.push(item);
    if (distinctChoices.length >= MAX_CONFIRMATION_CHOICES) break;
  }

  const componentMap = new Map<string, string>();
  for (const item of ranked) {
    for (const component of item.candidate.visibleComponents) {
      const normalized = normalizedText(component);
      if (normalized && !componentMap.has(normalized)) componentMap.set(normalized, component.trim());
    }
  }
  const visibleComponents = [...componentMap.values()];
  const best = ranked[0]!;
  const alternative = distinctChoices[1];
  const reasons: VisionResolutionReason[] = [];

  if (visibleComponents.length >= 2) reasons.push('multiple_visible_components');
  if (alternative && best.score - alternative.score < CLOSE_SCORE_MARGIN) reasons.push('close_alternative');
  if (confidenceValue(best.candidate.confidence) < MINIMUM_AUTO_CONFIDENCE) reasons.push('low_provider_confidence');
  if (best.candidate.localScore < STRONG_LOCAL_SCORE) reasons.push('weak_local_match');
  if ((input.providerWarnings ?? []).some((warning) => warning.trim().length > 0)) reasons.push('provider_warning');

  return {
    mode: reasons.length === 0 ? 'auto_select' : 'confirm',
    bestIndex: best.index,
    choiceIndexes: distinctChoices.map((item) => item.index),
    reasons,
    visibleComponents,
  };
}
