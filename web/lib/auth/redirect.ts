const INTERNAL_BASE = new URL('https://neofit.invalid');

export function safeInternalPath(value: string | null | undefined, fallback: string): string {
  const candidate = value?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, INTERNAL_BASE);
    if (parsed.origin !== INTERNAL_BASE.origin) return fallback;

    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (!normalized.startsWith('/') || normalized.startsWith('//') || normalized.includes('\\')) {
      return fallback;
    }
    return normalized;
  } catch {
    return fallback;
  }
}
