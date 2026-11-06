import type { StoreProduct } from '../../lib/store';
import type { HeroLabel } from '../storefront/EntranceHero';

// /dev/ui ONLY. Fictional products and copy to show component states; never business data.
const day = 24 * 60 * 60 * 1000;
const svg = (tone: string, label: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="${tone}"/><text x="16" y="380" fill="#F7F6F3" font-family="sans-serif" font-size="14" letter-spacing="2">${label}</text></svg>`)}`;

type Variant = NonNullable<StoreProduct['variants']>[number];
const variant = (id: string, qty: number, extra: Partial<Variant> = {}): Variant => ({
  id, title: id, manage_inventory: true, inventory_quantity: qty, options: [],
  calculated_price: { calculated_amount: 95000, currency_code: 'ngn' }, ...extra,
});

function piece(id: string, title: string, label: string, opts: { variants?: Variant[]; madeToOrder?: boolean; createdDaysAgo?: number; colours?: Array<{ name: string; hex?: string }>; tone?: string } = {}): StoreProduct {
  const colours = opts.colours ?? [];
  const variants = opts.variants ?? (colours.length
    ? colours.map((colour, i) => variant(`${id}-${i}`, 5, { options: [{ option_id: `${id}-colour`, value: colour.name, option: { title: 'Colour' } }], metadata: colour.hex ? { swatch_hex: colour.hex } : {} }))
    : [variant(`${id}-0`, 5)]);
  return {
    id, handle: `gallery-${id}`, title, created_at: new Date(Date.now() - (opts.createdDaysAgo ?? 60) * day).toISOString(),
    images: [{ url: svg(opts.tone ?? '#2B3A2F', 'GALLERY ONLY') }, { url: svg('#46342B', 'SECOND IMAGE') }],
    options: colours.length ? [{ id: `${id}-colour`, title: 'Colour', values: colours.map(({ name }) => ({ value: name })) }] : [],
    variants, metadata: { label, ...(opts.madeToOrder ? { made_to_order: true } : {}) },
  };
}

/** One tile per badge state, plus both colour summaries. */
export const tilePermutations: StoreProduct[] = [
  piece('sold-out', 'Sold out', 'trybe', { variants: [variant('so-0', 0)], tone: '#18241C' }),
  piece('low-stock', 'Only 2 left', 'prime', { variants: [variant('ls-0', 2)], tone: '#222A3A' }),
  piece('made-to-order', 'Made to order', 'bridal', { madeToOrder: true, tone: '#D3CBBF' }),
  piece('new', 'New', 'next', { createdDaysAgo: 2, tone: '#4A2530' }),
  piece('swatches', 'Swatches (all hex)', 'fashion', { colours: [{ name: 'Forest', hex: '#2B3A2F' }, { name: 'Clay', hex: '#A46A49' }, { name: 'Ink', hex: '#242322' }], tone: '#3A2C40' }),
  piece('colours-text', '"n colours" (no hex)', 'men', { colours: [{ name: 'Natural' }, { name: 'Indigo' }], tone: '#46342B' }),
];

export const heroLabels: HeroLabel[] = [
  { slug: 'trybe', name: 'Lopa Trybe', introSummary: 'TODO_CONFIRM: label one-liner (D2)', image: { src: svg('#2B3A2F', 'TRYBE · GALLERY'), alt: '' } },
  { slug: 'prime', name: 'Lopa Prime', introSummary: null, image: { src: svg('#222A3A', 'PRIME · GALLERY'), alt: '' } },
  { slug: 'bridal', name: 'Lopa Bridal', introSummary: 'TODO_CONFIRM: label one-liner (D2)', image: null },
];

export const occasionLinks = [
  { label: 'Weddings', url: '/dev/ui#occasions' },
  { label: 'Owambe', url: '/dev/ui#occasions' },
  { label: 'Workwear', url: '/dev/ui#occasions' },
];
