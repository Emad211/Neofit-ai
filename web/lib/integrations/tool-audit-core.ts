import { createHash } from 'node:crypto';

export function toolQueryFingerprint(query: string): string {
  return createHash('sha256').update(query.trim(), 'utf8').digest('hex');
}
