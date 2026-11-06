import type { StoreOption, StoreProduct, StoreVariant } from './store';

// Pure PDP purchase logic, shared by ProductPurchasePanel (client) and its unit tests.
// Type-only imports from ./store keep this module free of server code.

export type Selection = Record<string, string>;
export type OptionKind = 'colour' | 'size' | 'other';

export const optionKey = (option: StoreOption) => option.id ?? option.title;

export function optionKind(option: StoreOption): OptionKind {
  if (/colou?r/i.test(option.title)) return 'colour';
  if (/size/i.test(option.title)) return 'size';
  return 'other';
}

export function variantIsAvailable(variant: StoreVariant, madeToOrder = false): boolean {
  if (madeToOrder || variant.allow_backorder || variant.manage_inventory === false) return true;
  return (variant.inventory_quantity ?? 0) > 0;
}

const variantValue = (variant: StoreVariant, option: StoreOption) =>
  variant.options?.find((item) => item.option_id === option.id || item.option?.title === option.title)?.value;

/** Every value the variants carry for this option, in first-seen order. */
export function optionValues(option: StoreOption, variants: StoreVariant[]): string[] {
  return [...new Set(variants.map((variant) => variantValue(variant, option)).filter((value): value is string => Boolean(value)))];
}

/** Variants that agree with the selection on every option except `ignore` (and ignore options not yet chosen). */
function matching(variants: StoreVariant[], options: StoreOption[], selection: Selection, ignore?: StoreOption) {
  return variants.filter((variant) => options.every((option) => {
    if (ignore && optionKey(option) === optionKey(ignore)) return true;
    const chosen = selection[optionKey(option)];
    return !chosen || variantValue(variant, option) === chosen;
  }));
}

/** The values of `option` that have no purchasable variant given the other choices. */
export function unavailableValues(option: StoreOption, options: StoreOption[], variants: StoreVariant[], selection: Selection, madeToOrder = false): string[] {
  const candidates = matching(variants, options, selection, option);
  return optionValues(option, variants).filter((value) => !candidates.some((variant) => variantValue(variant, option) === value && variantIsAvailable(variant, madeToOrder)));
}

/**
 * Stock left per value, only for values whose matching variants are all stock-tracked and that have
 * 1-3 left, the same threshold as the tile badge. Made-to-order pieces never show low stock.
 */
export function lowStockValues(option: StoreOption, options: StoreOption[], variants: StoreVariant[], selection: Selection, madeToOrder = false): Record<string, number> {
  if (madeToOrder) return {};
  const candidates = matching(variants, options, selection, option);
  const result: Record<string, number> = {};
  for (const value of optionValues(option, variants)) {
    const forValue = candidates.filter((variant) => variantValue(variant, option) === value);
    if (!forValue.length || forValue.some((variant) => variant.manage_inventory === false || variant.allow_backorder)) continue;
    const left = forValue.reduce((sum, variant) => sum + Math.max(0, variant.inventory_quantity ?? 0), 0);
    if (left >= 1 && left <= 3) result[value] = left;
  }
  return result;
}

export function selectedVariant(options: StoreOption[], variants: StoreVariant[], selection: Selection): StoreVariant | undefined {
  if (options.length === 0) return variants[0];
  return variants.find((variant) => options.every((option) => {
    const chosen = selection[optionKey(option)];
    return Boolean(chosen) && variantValue(variant, option) === chosen;
  }));
}

/**
 * The opening selection: every option of the first available variant except size, which the
 * customer always chooses, unless the piece comes in a single size.
 */
export function initialSelection(options: StoreOption[], variants: StoreVariant[], madeToOrder = false): Selection {
  const first = variants.find((variant) => variantIsAvailable(variant, madeToOrder)) ?? variants[0];
  const selection: Selection = {};
  if (!first) return selection;
  for (const option of options) {
    const value = variantValue(first, option);
    if (!value) continue;
    if (optionKind(option) === 'size' && optionValues(option, variants).length > 1) continue;
    selection[optionKey(option)] = value;
  }
  return selection;
}

/** Price to show: the selected variant's, else the lowest among variants matching the partial selection. */
export function displayPrice(options: StoreOption[], variants: StoreVariant[], selection: Selection, chosen?: StoreVariant) {
  if (chosen?.calculated_price?.calculated_amount !== undefined) return chosen.calculated_price;
  const priced = matching(variants, options, selection).map(({ calculated_price }) => calculated_price).filter((price) => typeof price?.calculated_amount === 'number');
  return priced.sort((a, b) => (a?.calculated_amount ?? 0) - (b?.calculated_amount ?? 0))[0] ?? null;
}

export function formatPrice(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(amount);
}

/** The add-to-bag button text for the current state. */
export function addToBagLabel(state: { busy: boolean; options: StoreOption[]; selection: Selection; variant?: StoreVariant; available: boolean; priced: boolean }): string {
  if (state.busy) return 'Adding…';
  const missing = state.options.find((option) => !state.selection[optionKey(option)]);
  if (missing) return optionKind(missing) === 'size' ? 'Choose a size' : `Choose a ${missing.title.toLowerCase()}`;
  if (!state.variant) return 'Choose an option';
  if (!state.available) return 'Sold out';
  if (!state.priced) return 'Not available';
  const size = state.options.find((option) => optionKind(option) === 'size');
  const sizeValue = size ? state.selection[optionKey(size)] : undefined;
  return sizeValue ? `Add to bag — size ${sizeValue}` : 'Add to bag';
}

export function productHasMadeToMeasure(product: StoreProduct): boolean {
  const fit = (product.options ?? []).find((option) => /^fit$/i.test(option.title.trim()));
  return Boolean(fit && optionValues(fit, product.variants ?? []).some((value) => /made to measure/i.test(value)));
}
