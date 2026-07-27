import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import {
  VISION_IMAGE_JPEG_QUALITY,
  VISION_IMAGE_MAX_BYTES,
  calculateVisionResize,
  estimateBase64ByteLength,
  validatePreparedVisionImage,
} from '@/nutrition-core';

export interface PreparedVisionUpload {
  readonly imageDataUrl: string;
  readonly mimeType: 'image/jpeg';
  readonly width: number;
  readonly height: number;
  readonly byteLength: number;
  readonly quality: number;
}

const QUALITY_STEPS = [VISION_IMAGE_JPEG_QUALITY, 0.52, 0.38] as const;

export async function prepareVisionImage(input: {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
}): Promise<PreparedVisionUpload> {
  if (!input.uri.trim()) throw new Error('Image URI is missing.');
  const target = calculateVisionResize(input.width, input.height);
  const context = ImageManipulator.manipulate(input.uri);
  if (target.width !== Math.round(input.width) || target.height !== Math.round(input.height)) {
    context.resize({ width: target.width, height: target.height });
  }
  const rendered = await context.renderAsync();

  for (const quality of QUALITY_STEPS) {
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: quality,
      base64: true,
    });
    if (!saved.base64) continue;
    const byteLength = estimateBase64ByteLength(saved.base64);
    if (byteLength <= VISION_IMAGE_MAX_BYTES) {
      validatePreparedVisionImage({
        width: saved.width,
        height: saved.height,
        byteLength,
      });
      return {
        imageDataUrl: `data:image/jpeg;base64,${saved.base64}`,
        mimeType: 'image/jpeg',
        width: saved.width,
        height: saved.height,
        byteLength,
        quality,
      };
    }
  }

  throw new Error(
    `The prepared image is still larger than ${Math.round(VISION_IMAGE_MAX_BYTES / 1_000)} KB. Choose a simpler or smaller photo.`,
  );
}
