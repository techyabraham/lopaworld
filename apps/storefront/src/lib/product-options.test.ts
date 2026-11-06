import { describe, expect, it } from 'vitest';
import type { StoreOption, StoreVariant } from './store';
import {
  addToBagLabel, displayPrice, initialSelection, lowStockValues, optionKind, optionValues,
  productHasMadeToMeasure, selectedVariant, unavailableValues,
} from './product-options';

const colour: StoreOption = { id: 'opt_colour', title: 'Colour' };
const size: StoreOption = { id: 'opt_size', title: 'Size' };
const options = [colour, size];

const v = (id: string, c: string, s: string, qty: number, amount = 100000, extra: Partial<StoreVariant> = {}): StoreVariant => ({
  id, title: `${c} / ${s}`, inventory_quantity: qty, manage_inventory: true,
  options: [{ option_id: 'opt_colour', value: c }, { option_id: 'opt_size', value: s }],
  calculated_price: { calculated_amount: amount, currency_code: 'ngn' }, ...extra,
});

const variants = [
  v('a', 'Forest', '40', 4), v('b', 'Forest', '42', 1), v('c', 'Forest', '44', 0),
  v('d', 'Ivory', '40', 0, 120000), v('e', 'Ivory', '42', 6, 120000), v('f', 'Ivory', '44', 2, 120000),
];

describe('optionKind', () => {
  it('recognises colour and size titles in either spelling', () => {
    expect(optionKind({ title: 'Color' })).toBe('colour');
    expect(optionKind({ title: 'Colour' })).toBe('colour');
    expect(optionKind({ title: 'Size' })).toBe('size');
    expect(optionKind({ title: 'Length' })).toBe('other');
  });
});

describe('initialSelection', () => {
  it('pre-selects the first available colour but never a size when there are several', () => {
    expect(initialSelection(options, variants)).toEqual({ opt_colour: 'Forest' });
  });

  it('pre-selects the only size of a single-size piece', () => {
    expect(initialSelection(options, [v('x', 'Forest', 'One size', 3)])).toEqual({ opt_colour: 'Forest', opt_size: 'One size' });
  });
});

describe('unavailable and low-stock values', () => {
  it('marks sizes sold out for the chosen colour only', () => {
    expect(unavailableValues(size, options, variants, { opt_colour: 'Forest' })).toEqual(['44']);
    expect(unavailableValues(size, options, variants, { opt_colour: 'Ivory' })).toEqual(['40']);
  });

  it('treats every value as available for made-to-order pieces', () => {
    expect(unavailableValues(size, options, variants, { opt_colour: 'Forest' }, true)).toEqual([]);
  });

  it('reports 1-3 left only for tracked stock', () => {
    expect(lowStockValues(size, options, variants, { opt_colour: 'Forest' })).toEqual({ '42': 1 });
    expect(lowStockValues(size, options, variants, { opt_colour: 'Ivory' })).toEqual({ '44': 2 });
    expect(lowStockValues(size, options, variants, { opt_colour: 'Ivory' }, true)).toEqual({});
    const untracked = variants.map((variant) => ({ ...variant, manage_inventory: false }));
    expect(lowStockValues(size, options, untracked, { opt_colour: 'Forest' })).toEqual({});
  });
});

describe('selectedVariant and displayPrice', () => {
  it('needs every option chosen', () => {
    expect(selectedVariant(options, variants, { opt_colour: 'Forest' })).toBeUndefined();
    expect(selectedVariant(options, variants, { opt_colour: 'Ivory', opt_size: '42' })?.id).toBe('e');
  });

  it('shows the lowest matching price until a variant is chosen', () => {
    expect(displayPrice(options, variants, {})?.calculated_amount).toBe(100000);
    expect(displayPrice(options, variants, { opt_colour: 'Ivory' })?.calculated_amount).toBe(120000);
  });
});

describe('addToBagLabel', () => {
  const base = { busy: false, options, available: true, priced: true };
  it('asks for a size until one is chosen', () => {
    expect(addToBagLabel({ ...base, selection: { opt_colour: 'Forest' } })).toBe('Choose a size');
  });
  it('names the size once chosen', () => {
    const selection = { opt_colour: 'Forest', opt_size: '42' };
    expect(addToBagLabel({ ...base, selection, variant: selectedVariant(options, variants, selection) })).toBe('Add to bag — size 42');
  });
  it('reports sold out and busy states', () => {
    const selection = { opt_colour: 'Forest', opt_size: '44' };
    const variant = selectedVariant(options, variants, selection);
    expect(addToBagLabel({ ...base, selection, variant, available: false })).toBe('Sold out');
    expect(addToBagLabel({ ...base, selection, variant, busy: true })).toBe('Adding…');
  });
  it('says Add to bag for a piece without options', () => {
    expect(addToBagLabel({ ...base, options: [], selection: {}, variant: variants[0] })).toBe('Add to bag');
  });
});

describe('productHasMadeToMeasure', () => {
  it('needs a Fit option with a Made to measure value', () => {
    const fit: StoreOption = { id: 'opt_fit', title: 'Fit' };
    const withFit = [{ ...v('m', 'Forest', '40', 1), options: [{ option_id: 'opt_fit', value: 'Made to measure' }] }];
    expect(productHasMadeToMeasure({ id: 'p', title: 'P', handle: 'p', options: [fit], variants: withFit })).toBe(true);
    expect(productHasMadeToMeasure({ id: 'p', title: 'P', handle: 'p', options, variants })).toBe(false);
    expect(optionValues(fit, withFit)).toEqual(['Made to measure']);
  });
});
