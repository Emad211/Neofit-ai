import type { FoodSearchHit } from './search';

export type SupportedVisionMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface PreparedVisionImage {
  readonly base64: string;
  readonly mimeType: SupportedVisionMimeType;
  readonly width: number;
  readonly height: number;
  readonly byteLength: number;
  readonly fingerprint?: string;
}

export interface VisionRecognitionContext {
  readonly locale: 'fa' | 'en';
  readonly typedName?: string;
  readonly maxCandidates?: number;
}

export interface VisionCandidate {
  readonly label: string;
  readonly confidence: number | null;
  readonly visibleComponents: readonly string[];
  readonly preparationHints: readonly string[];
}

export interface SanitizedVisionObservation {
  readonly candidates: readonly VisionCandidate[];
  readonly warnings: readonly string[];
  readonly providerRequestId?: string;
}

export interface VisionTransport {
  recognize(
    image: PreparedVisionImage,
    context: VisionRecognitionContext,
  ): Promise<unknown>;
}

export interface VisionCandidateMatcher {
  matchLabel(label: string, limit: number): readonly FoodSearchHit[];
}

export interface ResolvedVisionCandidate {
  readonly observation: VisionCandidate;
  readonly matches: readonly FoodSearchHit[];
}

export interface ResolvedVisionResult {
  readonly candidates: readonly ResolvedVisionCandidate[];
  readonly warnings: readonly string[];
  readonly providerRequestId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown, maxLength: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxLength);
}

function fnv1a32(value: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    hash ^= code & 0xff;
    hash = Math.imul(hash, 0x01000193) >>> 0;
    hash ^= code >>> 8;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function createVisionRequestFingerprint(input: {
  readonly imageDataUrl: string;
  readonly description: string | undefined;
  readonly locale: 'fa' | 'en';
}): string {
  if (!input.imageDataUrl.startsWith('data:image/')) {
    throw new Error('Vision image must be an image data URL.');
  }
  const description = input.description?.trim().normalize('NFKC') ?? '';
  const material = [
    'vision-request-v1',
    input.locale,
    String(input.imageDataUrl.length),
    description,
    input.imageDataUrl,
  ].join('\u0000');
  const seeds = [0x811c9dc5, 0x9e3779b1, 0x85ebca77, 0xc2b2ae3d] as const;
  const digest = seeds
    .map((seed) => fnv1a32(material, seed).toString(16).padStart(8, '0'))
    .join('');
  return `vision-fnv1a128-v1:${digest}`;
}

function parseCandidate(value: unknown): VisionCandidate | null {
  if (!isRecord(value) || typeof value.label !== 'string' || value.label.trim() === '') {
    return null;
  }
  const rawConfidence = value.confidence;
  const confidence = typeof rawConfidence === 'number' && Number.isFinite(rawConfidence)
    ? Math.max(0, Math.min(1, rawConfidence))
    : null;
  return {
    label: value.label.trim(),
    confidence,
    visibleComponents: stringArray(value.visibleComponents, 12),
    preparationHints: stringArray(value.preparationHints, 8),
  };
}

export function sanitizeVisionObservation(
  raw: unknown,
  maxCandidates = 5,
): SanitizedVisionObservation {
  if (!Number.isInteger(maxCandidates) || maxCandidates <= 0 || maxCandidates > 20) {
    throw new RangeError('maxCandidates must be an integer between 1 and 20');
  }
  if (!isRecord(raw)) {
    return { candidates: [], warnings: ['invalid_provider_payload'] };
  }

  const rawCandidates = Array.isArray(raw.candidates) ? raw.candidates : [];
  const candidates = rawCandidates
    .map(parseCandidate)
    .filter((candidate): candidate is VisionCandidate => candidate !== null)
    .slice(0, maxCandidates);
  const warnings = stringArray(raw.warnings, 10);
  if (candidates.length === 0) {
    warnings.push('no_valid_candidates');
  }

  const base: SanitizedVisionObservation = { candidates, warnings };
  return typeof raw.providerRequestId === 'string' && raw.providerRequestId.trim() !== ''
    ? { ...base, providerRequestId: raw.providerRequestId.trim() }
    : base;
}

export function buildVisionRecognitionInstruction(maxCandidates = 5): string {
  return [
    'Identify visible foods in the image.',
    `Return at most ${maxCandidates} ranked food candidates.`,
    'For each candidate return: label, confidence from 0 to 1, visibleComponents, preparationHints.',
    'Do not calculate or guess calories, macros, micronutrients, weight, serving size or medical advice.',
    'Use uncertainty honestly and add warnings when the image is ambiguous or contains multiple dishes.',
    'Return JSON only with keys: candidates, warnings, providerRequestId.',
  ].join(' ');
}

export class VisionRecognitionService {
  public constructor(
    private readonly transport: VisionTransport,
    private readonly matcher: VisionCandidateMatcher,
  ) {}

  public async recognize(
    image: PreparedVisionImage,
    context: VisionRecognitionContext,
  ): Promise<ResolvedVisionResult> {
    if (image.base64.length === 0 || image.byteLength <= 0 || image.width <= 0 || image.height <= 0) {
      throw new Error('Prepared image is invalid');
    }
    const maxCandidates = context.maxCandidates ?? 5;
    const raw = await this.transport.recognize(image, context);
    const observation = sanitizeVisionObservation(raw, maxCandidates);
    const resolved = observation.candidates.map((candidate) => ({
      observation: candidate,
      matches: this.matcher.matchLabel(candidate.label, 5),
    }));
    const base: ResolvedVisionResult = {
      candidates: resolved,
      warnings: observation.warnings,
    };
    return observation.providerRequestId === undefined
      ? base
      : { ...base, providerRequestId: observation.providerRequestId };
  }
}
