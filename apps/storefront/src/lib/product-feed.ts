import 'server-only';
import { LABELS } from '@lopaworld/types';
import { publicSiteUrl } from './seo';
import { listStoreProducts, type StoreProduct } from './store';

const labelNames = new Map<string, string>(LABELS.map(({ slug, name }) => [slug, name]));
const xml = (value: unknown) => String(value ?? '').replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!);

export async function renderProductFeed() {
  const origin = publicSiteUrl();
  if (!origin) return { status: 503, body: '<?xml version="1.0" encoding="UTF-8"?><error>Store origin is not configured.</error>' };
  try {
    const first = await listStoreProducts({ limit: 100, offset: 0 });
    const products = [...first.products];
    for (let offset = products.length; offset < Math.min(first.count, 1000); offset += 100) {
      const page = await listStoreProducts({ limit: 100, offset });
      products.push(...page.products);
      if (!page.products.length) break;
    }
    const items = products.flatMap((product) => feedItems(product, origin.toString()));
    const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Lopaworld product catalogue</title><link>${xml(origin.toString())}</link><description>Published products available from Lopaworld.</description>${items.join('')}</channel></rss>`;
    return { status: 200, body };
  } catch {
    return { status: 503, body: '<?xml version="1.0" encoding="UTF-8"?><error>Catalogue feed is temporarily unavailable.</error>' };
  }
}

function feedItems(product: StoreProduct, origin: string) {
  const label = typeof product.metadata?.label === 'string' ? product.metadata.label : '';
  const brand = labelNames.get(label);
  const description = product.description?.trim();
  const image = product.thumbnail ?? product.images?.[0]?.url;
  if (!brand || !description || !image || !product.handle) return [];
  const path = `${origin.replace(/\/$/, '')}/p/${encodeURIComponent(product.handle)}`;
  const optionValues = (variant: NonNullable<StoreProduct['variants']>[number]) => (variant.options ?? []).map((entry) => ({ name: entry.option?.title ?? 'Option', value: entry.value }));
  return (product.variants ?? []).flatMap((variant) => {
    const amount = variant.calculated_price?.calculated_amount;
    const currency = variant.calculated_price?.currency_code?.toUpperCase();
    if (!variant.id || typeof amount !== 'number' || !currency) return [];
    const values = optionValues(variant);
    const availability = product.metadata?.made_to_order === true || variant.allow_backorder || variant.manage_inventory === false || (variant.inventory_quantity ?? 0) > 0 ? 'in_stock' : 'out_of_stock';
    const title = [product.title, ...values.map(({ value }) => value)].filter(Boolean).join(' · ');
    const condition = product.metadata?.condition;
    const validCondition = condition === 'new' || condition === 'used' || condition === 'refurbished' ? condition : undefined;
    const tags = [
      ['id', variant.sku || variant.id], ['item_group_id', product.id], ['title', title], ['description', description],
      ['link', path], ['image_link', image], ['availability', availability], ['price', `${amount} ${currency}`], ['brand', brand],
      ...(validCondition ? [['condition', validCondition]] : []),
      ...values.filter(({ name }) => name.toLowerCase().includes('size')).map(({ value }) => ['size', value]),
      ...values.filter(({ name }) => name.toLowerCase().includes('color') || name.toLowerCase().includes('colour')).map(({ value }) => ['color', value]),
    ];
    return [`<item>${tags.map(([name, value]) => `<g:${name}>${xml(value)}</g:${name}>`).join('')}</item>`];
  });
}
