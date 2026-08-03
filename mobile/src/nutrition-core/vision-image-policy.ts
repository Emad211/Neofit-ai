export const VISION_IMAGE_MAX_DIMENSION = 1_024;
export const VISION_IMAGE_MAX_BYTES = 1_500_000;
export const VISION_IMAGE_JPEG_QUALITY = 0.68;

export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

function positiveDimension(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite positive number`);
  }
  return value;
}

export function calculateVisionResize(
  width: number,
  height: number,
  maximumDimension = VISION_IMAGE_MAX_DIMENSION,
): ImageDimensions {
  positiveDimension(width, 'width');
  positiveDimension(height, 'height');
  positiveDimension(maximumDimension, 'maximumDimension');
  const largest = Math.max(width, height);
  if (largest <= maximumDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const factor = maximumDimension / largest;
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}

export function estimateBase64ByteLength(base64: string): number {
  const normalized = base64.replace(/\s+/g, '');
  if (normalized.length === 0) return 0;
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

export function validatePreparedVisionImage(input: {
  readonly width: number;
  readonly height: number;
  readonly byteLength: number;
}): void {
  positiveDimension(input.width, 'width');
  positiveDimension(input.height, 'height');
  if (Math.max(input.width, input.height) > VISION_IMAGE_MAX_DIMENSION) {
    throw new RangeError(`Vision image exceeds ${VISION_IMAGE_MAX_DIMENSION}px.`);
  }
  if (!Number.isInteger(input.byteLength) || input.byteLength <= 0) {
    throw new RangeError('Vision image byteLength must be a positive integer.');
  }
  if (input.byteLength > VISION_IMAGE_MAX_BYTES) {
    throw new RangeError(`Vision image exceeds ${VISION_IMAGE_MAX_BYTES} bytes.`);
  }
}
