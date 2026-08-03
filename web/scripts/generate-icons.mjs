import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

const OUTPUT_DIR = path.resolve('public/icons');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);
  const projection = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + projection * dx), py - (ay + projection * dy));
}

function makeIcon(size, { maskable = false } = {}) {
  const rowBytes = size * 4 + 1;
  const raw = Buffer.alloc(rowBytes * size);
  const pulse = [
    [0.25, 0.53],
    [0.38, 0.53],
    [0.44, 0.39],
    [0.54, 0.65],
    [0.62, 0.48],
    [0.75, 0.48],
  ];
  const safeInset = maskable ? 0.16 : 0.08;

  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0;
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      const offset = rowOffset + 1 + x * 4;
      const glow = Math.max(0, 1 - Math.hypot(nx - 0.25, ny - 0.18) / 0.9);
      let red = Math.round(18 + glow * 12);
      let green = Math.round(92 + glow * 26);
      let blue = Math.round(59 + glow * 18);

      const inset = safeInset;
      const inner = nx > inset && nx < 1 - inset && ny > inset && ny < 1 - inset;
      if (inner) {
        red = 15;
        green = 81;
        blue = 53;
      }

      const distanceFromCenter = Math.hypot(nx - 0.5, ny - 0.5);
      if (distanceFromCenter < 0.285) {
        red = 244;
        green = 247;
        blue = 242;
      }

      const ringDistance = Math.abs(distanceFromCenter - 0.34);
      if (ringDistance < 0.018 && ny > 0.29) {
        red = 217;
        green = 164;
        blue = 65;
      }

      let pulseDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < pulse.length - 1; index += 1) {
        const [ax, ay] = pulse[index];
        const [bx, by] = pulse[index + 1];
        pulseDistance = Math.min(pulseDistance, distanceToSegment(nx, ny, ax, ay, bx, by));
      }
      if (pulseDistance < 0.026) {
        red = 23;
        green = 107;
        blue = 71;
      }

      if (Math.hypot(nx - 0.71, ny - 0.31) < 0.034) {
        red = 217;
        green = 164;
        blue = 65;
      }

      raw[offset] = red;
      raw[offset + 1] = green;
      raw[offset + 2] = blue;
      raw[offset + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

await mkdir(OUTPUT_DIR, { recursive: true });
const icons = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, false],
];

for (const [name, size, maskable] of icons) {
  await writeFile(path.join(OUTPUT_DIR, name), makeIcon(size, { maskable }));
}

console.log(`Generated ${icons.length} NeoFit PWA icons in ${OUTPUT_DIR}`);
