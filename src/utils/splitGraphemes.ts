export function splitGraphemes(input: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(seg.segment(input), (s) => s.segment);
  }
  return Array.from(input);
}
