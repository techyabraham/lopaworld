import { describe, expect, it } from 'vitest';
import { productBadge } from './product-badges';
import { productColours, tileColourSummary } from './product-colours';
import type { StoreProduct, StoreVariant } from './store';

const now = Date.parse('2026-11-06T12:00:00Z');
const variant = (overrides: Partial<StoreVariant> = {}): StoreVariant => ({ id: 'v', title: 'v', manage_inventory: true, allow_backorder: false, inventory_quantity: 10, ...overrides });
const product = (overrides: Partial<StoreProduct> = {}): StoreProduct => ({ id: 'p', title: 'Piece', handle: 'piece', variants: [variant()], created_at: '2026-01-01T00:00:00Z', ...overrides });

describe('productBadge', () => {
  it('shows Sold out when every tracked variant is out of stock', () => {
    expect(productBadge(product({ variants: [variant({ inventory_quantity: 0 }), variant({ inventory_quantity: -1 })] }), now)).toEqual({ kind: 'sold-out', label: 'Sold out', variant: 'default' });
  });

  it.each([[1], [2], [3]])('shows Only %i left as a signal badge', (left) => {
    expect(productBadge(product({ variants: [variant({ inventory_quantity: left })] }), now)).toEqual({ kind: 'low-stock', label: `Only ${left} left`, variant: 'signal' });
  });

  it('sums stock across variants for the low-stock count', () => {
    expect(productBadge(product({ variants: [variant({ inventory_quantity: 1 }), variant({ inventory_quantity: 2 }), variant({ inventory_quantity: 0 })] }), now)?.label).toBe('Only 3 left');
  });

  it('shows no low-stock badge above 3 or when any variant is untracked or backorderable', () => {
    expect(productBadge(product({ variants: [variant({ inventory_quantity: 4 })] }), now)).toBeNull();
    expect(productBadge(product({ variants: [variant({ inventory_quantity: 1 }), variant({ manage_inventory: false, inventory_quantity: 0 })] }), now)).toBeNull();
    expect(productBadge(product({ variants: [variant({ inventory_quantity: 1, allow_backorder: true })] }), now)).toBeNull();
  });

  it('prefers Made to order over stock badges and never marks it sold out', () => {
    expect(productBadge(product({ metadata: { made_to_order: true }, variants: [variant({ inventory_quantity: 0 })] }), now)?.kind).toBe('made-to-order');
    expect(productBadge(product({ metadata: { made_to_order: true }, variants: [variant({ inventory_quantity: 2 })] }), now)?.kind).toBe('made-to-order');
  });

  it('prefers Sold out and low stock over New', () => {
    expect(productBadge(product({ created_at: '2026-11-05T00:00:00Z', variants: [variant({ inventory_quantity: 0 })] }), now)?.kind).toBe('sold-out');
    expect(productBadge(product({ created_at: '2026-11-05T00:00:00Z', variants: [variant({ inventory_quantity: 2 })] }), now)?.kind).toBe('low-stock');
  });

  it('shows New within 14 days of creation only', () => {
    expect(productBadge(product({ created_at: '2026-10-24T12:00:00Z' }), now)?.kind).toBe('new');
    expect(productBadge(product({ created_at: '2026-10-22T11:59:00Z' }), now)).toBeNull();
    expect(productBadge(product({ created_at: '2026-11-07T00:00:00Z' }), now)).toBeNull();
    expect(productBadge(product({ created_at: null }), now)).toBeNull();
  });

  it('never invents a delivery badge', () => {
    expect(productBadge(product({ metadata: { delivery_note: 'Lagos same-day' } }), now)).toBeNull();
  });
});

describe('productColours and tileColourSummary', () => {
  const colourProduct = (hexes: Record<string, string | undefined>) => product({
    options: [{ id: 'opt_colour', title: 'Colour', values: Object.keys(hexes).map((value) => ({ value })) }],
    variants: Object.entries(hexes).map(([name, hex]) => variant({ id: name, options: [{ value: name, option_id: 'opt_colour', option: { title: 'Colour' } }], metadata: hex ? { swatch_hex: hex } : null })),
  });

  it('returns a hex only when metadata.swatch_hex is a valid #rrggbb', () => {
    expect(productColours(colourProduct({ Forest: '#2B3A2F', Ivory: 'ivory', Midnight: undefined }))).toEqual([
      { name: 'Forest', hex: '#2B3A2F' }, { name: 'Ivory', hex: null }, { name: 'Midnight', hex: null },
    ]);
  });

  it('shows up to four swatches plus a count when every colour has a hex', () => {
    const summary = tileColourSummary(productColours(colourProduct({ A: '#111111', B: '#222222', C: '#333333', D: '#444444', E: '#555555' })));
    expect(summary).toEqual({ swatches: expect.arrayContaining([{ name: 'A', hex: '#111111' }]), more: 1 });
    expect('swatches' in (summary ?? {}) && (summary as { swatches: unknown[] }).swatches).toHaveLength(4);
  });

  it('falls back to "n colours" text when any colour lacks a hex, and to nothing for a single colour', () => {
    expect(tileColourSummary(productColours(colourProduct({ Forest: '#2B3A2F', Ivory: undefined })))).toEqual({ text: '2 colours' });
    expect(tileColourSummary(productColours(colourProduct({ Ivory: undefined })))).toBeNull();
  });

  it('returns no colours for products without a colour option', () => {
    expect(productColours(product({ options: [{ title: 'Size', values: ['M'] }] }))).toEqual([]);
  });
});
