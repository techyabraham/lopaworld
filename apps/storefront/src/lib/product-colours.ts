import type { StoreProduct } from './store';

export type ProductColour = { name: string; hex: string | null };

const HEX = /^#[\da-f]{6}$/i;
const isColourOption = (title: string | undefined) => /colou?r/i.test(title ?? '');

/**
 * The product's colour values in option order, each with a hex only when a variant carrying that
 * value has a valid `metadata.swatch_hex`. Never infers a colour from its name.
 */
export function productColours(product: StoreProduct): ProductColour[] {
  const option = (product.options ?? []).find(({ title }) => isColourOption(title));
  if (!option) return [];
  const names = (option.values ?? []).map((value) => typeof value === 'string' ? value : value.value).filter((value): value is string => Boolean(value?.trim()));
  return [...new Set(names)].map((name) => {
    const variant = (product.variants ?? []).find((candidate) => candidate.options?.some((selected) => selected.value === name && (isColourOption(selected.option?.title) || selected.option_id === option.id)));
    const hex = variant?.metadata?.swatch_hex;
    return { name, hex: typeof hex === 'string' && HEX.test(hex) ? hex : null };
  });
}

/** Tile summary: up to four swatches (+n) when every colour has a hex; otherwise "n colours" text when there is more than one. */
export function tileColourSummary(colours: ProductColour[]): { swatches: ProductColour[]; more: number } | { text: string } | null {
  if (colours.length === 0) return null;
  if (colours.every(({ hex }) => hex)) return { swatches: colours.slice(0, 4), more: Math.max(0, colours.length - 4) };
  return colours.length > 1 ? { text: `${colours.length} colours` } : null;
}
