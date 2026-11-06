/** Roving-tabindex keyboard model for the Entrance hero label index (WAI-ARIA tabs pattern). */
export function heroKeyReducer(index: number, key: string, count: number): number {
  if (count <= 0) return 0;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return Math.min(Math.max(index, 0), count - 1);
  }
}

/** Splits a campaign headline at its first full stop: "Look important. Be important." -> two lines. */
export function splitHeadline(headline: string): [string, string | null] {
  const match = headline.trim().match(/^(.+?\.)\s+(\S.*)$/);
  return match ? [match[1], match[2]] : [headline.trim(), null];
}

/** Data Saver: keep colour and text changes but do not swap hero media or preload extra images. */
export function prefersReducedData(connection: { saveData?: boolean; effectiveType?: string } | undefined): boolean {
  return Boolean(connection?.saveData) || /2g|3g/.test(connection?.effectiveType ?? '');
}
