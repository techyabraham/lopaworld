// A minimal stand-in for the Medusa Store API, for local screenshots and Playwright tests that need
// a catalogue but not a booted Medusa. TEST FIXTURES ONLY: every product, price, size, stock level
// and colour below is fictional and must never be copied into Payload or shown as Lopaworld data.
//
// Usage: node e2e/support/mock-medusa.mjs [port]   (default 9100)
// Point the storefront at it with MEDUSA_BACKEND_URL=http://127.0.0.1:<port> and any
// NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY that does not start with "replace-".
import { createServer } from 'node:http';

const port = Number(process.argv[2] ?? process.env.MOCK_MEDUSA_PORT ?? 9100);
const base = `http://127.0.0.1:${port}`;
const region = { id: 'reg_test_ngn', name: 'Nigeria (test)', currency_code: 'ngn', countries: [{ iso_2: 'ng' }] };

const tones = ['#2B3A2F', '#3D5244', '#46342B', '#222A3A', '#3A2C40', '#4A2530', '#D3CBBF', '#2A2724'];
// data: URLs because the storefront's CSP only allows https: and data: images.
const image = (n, i) => ({ id: `img_${n}_${i}`, url: `data:image/svg+xml,${encodeURIComponent(svg(`${n}-${i}`))}`, metadata: { alt: `Test image ${i + 1}` } });
const categories = [
  { id: 'pcat_agbada', name: 'Agbada', handle: 'agbada' },
  { id: 'pcat_dresses', name: 'Dresses', handle: 'dresses' },
  { id: 'pcat_accessories', name: 'Accessories', handle: 'accessories' },
];
const labels = ['trybe', 'next', 'prime', 'men', 'fashion', 'bridal'];
const day = 24 * 60 * 60 * 1000;

function variant(productId, index, colour, size, qty, amount, extra = {}) {
  const options = [];
  if (colour) options.push({ option_id: `${productId}_opt_colour`, value: colour.name, option: { title: 'Colour' } });
  if (size) options.push({ option_id: `${productId}_opt_size`, value: size, option: { title: 'Size' } });
  return {
    id: `${productId}_var_${index}`, title: [colour?.name, size].filter(Boolean).join(' / ') || 'Default', sku: `TEST-${productId}-${index}`,
    manage_inventory: true, allow_backorder: false, inventory_quantity: qty, options,
    calculated_price: { calculated_amount: amount, original_amount: amount, currency_code: 'ngn' },
    metadata: colour?.hex ? { swatch_hex: colour.hex } : {}, ...extra,
  };
}

function product(n, { title, subtitle, label, category, colours = [], sizes = [], stock = {}, amount = 85000, images = 4, metadata = {}, created = 30 }) {
  const id = `prod_test_${n}`;
  const variants = [];
  const colourList = colours.length ? colours : [null];
  const sizeList = sizes.length ? sizes : [null];
  let index = 0;
  for (const colour of colourList) for (const size of sizeList) {
    const key = [colour?.name, size].filter(Boolean).join('/');
    variants.push(variant(id, index++, colour, size, stock[key] ?? stock[size] ?? stock.default ?? 5, amount));
  }
  const options = [];
  if (colours.length) options.push({ id: `${id}_opt_colour`, title: 'Colour', values: colours.map(({ name }) => ({ value: name })) });
  if (sizes.length) options.push({ id: `${id}_opt_size`, title: 'Size', values: sizes.map((value) => ({ value })) });
  return {
    id, handle: `test-${n}`, title, subtitle: subtitle ?? null, description: `Fictional test product ${n} for local screenshots and end-to-end tests.`,
    created_at: new Date(Date.now() - created * day).toISOString(), thumbnail: null,
    images: Array.from({ length: images }, (_, i) => image(n, i)), options, variants,
    categories: category ? [categories.find(({ handle }) => handle === category)] : [],
    type: null, metadata: { label, ...metadata },
  };
}

const forest = { name: 'Forest', hex: '#2B3A2F' };
const ivory = { name: 'Ivory gold', hex: '#B9A57E' };
const midnight = { name: 'Midnight', hex: '#1A1F2B' };

const products = [
  product('agbada', {
    title: 'Test agbada', subtitle: 'Fictional three-piece fixture', label: 'trybe', category: 'agbada', colours: [forest, ivory, midnight],
    sizes: ['38', '40', '42', '44', '46', '48'], stock: { '38': 0, '42': 1, '48': 0, default: 6 }, amount: 450000,
    metadata: { fit: 'Test fit note.', fabric: 'Test fabric note.', care: 'Test care note.', complete_the_look: ['test-cap', 'test-slides', 'test-scarf'] },
  }),
  product('cap', { title: 'Test cap', label: 'trybe', category: 'accessories', amount: 25000, images: 1 }),
  product('slides', { title: 'Test slides', label: 'men', category: 'accessories', amount: 40000, images: 1 }),
  product('scarf', { title: 'Test scarf', label: 'fashion', category: 'accessories', amount: 18000, images: 1 }),
  ...Array.from({ length: 12 }, (_, i) => product(`piece-${i + 1}`, {
    title: `Test piece ${i + 1}`, label: labels[i % labels.length], category: i % 2 ? 'dresses' : 'agbada',
    colours: i % 3 === 0 ? [forest, ivory] : i % 3 === 1 ? [{ name: 'Natural' }, { name: 'Indigo' }] : [],
    sizes: ['S', 'M', 'L'], stock: i === 4 ? { default: 0 } : i === 5 ? { default: 1 } : {}, amount: 60000 + i * 7500, images: 2,
    metadata: i === 6 ? { made_to_order: true, lead_time_days: 21 } : {}, created: i < 3 ? 3 : 40,
  })),
];

// One flat-rate delivery option and a Paystack provider stand-in. The payment session returns a
// checkout.paystack.com URL that tests intercept; completion always succeeds (fictional).
const shippingOption = { id: 'so_test_flat', name: 'Test delivery (fictional)', price_type: 'flat', amount: 5000, calculated_price: { calculated_amount: 5000, currency_code: 'ngn' } };
const orders = new Map();
const carts = new Map();
let cartSeq = 0;

function cartView(cart) {
  const items = cart.items.map((item) => {
    const owner = products.find((p) => p.variants.some((v) => v.id === item.variant_id));
    const v = owner.variants.find((candidate) => candidate.id === item.variant_id);
    const unit = v.calculated_price.calculated_amount;
    return { id: item.id, title: owner.title, quantity: item.quantity, unit_price: unit, subtotal: unit * item.quantity, total: unit * item.quantity, thumbnail: owner.images[0]?.url ?? null, metadata: item.metadata ?? null, product: { title: owner.title, handle: owner.handle, thumbnail: owner.images[0]?.url ?? null, metadata: owner.metadata }, variant: { id: v.id, title: v.title, manage_inventory: v.manage_inventory, allow_backorder: v.allow_backorder, inventory_quantity: v.inventory_quantity, options: v.options } };
  });
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = cart.shipping_method ? shippingOption.amount : 0;
  return {
    id: cart.id, region_id: region.id, currency_code: 'ngn', completed_at: cart.completed_at ?? null, items, subtotal,
    shipping_total: shipping, tax_total: 0, total: subtotal + shipping, email: cart.email ?? null,
    shipping_address: cart.shipping_address ?? null, billing_address: cart.billing_address ?? null,
    shipping_methods: cart.shipping_method ? [{ shipping_option_id: shippingOption.id, name: shippingOption.name, amount: shipping, total: shipping }] : [],
    payment_collection: cart.payment_collection ?? null,
  };
}

function svg(name) {
  const [n, i] = name.split(/-(?=\d+$)/);
  const tone = tones[(n.length + Number(i)) % tones.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="${tone}"/><text x="40" y="1150" fill="#F7F6F3" font-family="sans-serif" font-size="36" letter-spacing="4">TEST ${n.toUpperCase()} · ${Number(i) + 1}</text></svg>`;
}

const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((resolve) => { let data = ''; req.on('data', (chunk) => { data += chunk; }); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } }); });

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', base);
  const path = url.pathname;
  if (path === '/health') return json(res, 200, { ok: true });
  if (path === '/store/regions') return json(res, 200, { regions: [region] });
  if (path === '/store/product-categories') return json(res, 200, { product_categories: categories });
  if (path === '/store/product-collections') return json(res, 200, { product_collections: [] });
  if (path === '/store/products') {
    let list = products;
    const handle = url.searchParams.get('handle');
    const q = url.searchParams.get('q')?.toLowerCase();
    const category = url.searchParams.get('category_id');
    if (handle) list = list.filter((p) => p.handle === handle);
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q));
    if (category) list = list.filter((p) => p.categories.some(({ id }) => id === category));
    if (url.searchParams.get('order') === '-created_at') list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 100);
    return json(res, 200, { products: list.slice(offset, offset + limit), count: list.length, offset, limit });
  }
  if (path === '/store/carts' && req.method === 'POST') {
    const cart = { id: `cart_test_${++cartSeq}`, items: [] };
    carts.set(cart.id, cart);
    return json(res, 200, { cart: cartView(cart) });
  }
  const cartMatch = path.match(/^\/store\/carts\/([^/]+)(?:\/([a-z-]+))?(?:\/([^/]+))?$/);
  if (cartMatch) {
    const cart = carts.get(decodeURIComponent(cartMatch[1]));
    if (!cart) return json(res, 404, { message: 'Cart not found' });
    const [, , action, itemId] = cartMatch;
    if (action === 'line-items' && !itemId && req.method === 'POST') {
      const body = await readBody(req);
      const existing = cart.items.find((item) => item.variant_id === body.variant_id);
      if (existing) existing.quantity += body.quantity; else cart.items.push({ id: `item_${cart.id}_${cart.items.length + 1}`, variant_id: body.variant_id, quantity: body.quantity, metadata: body.metadata });
    } else if (action === 'line-items' && itemId && req.method === 'DELETE') {
      cart.items = cart.items.filter((item) => item.id !== itemId);
    } else if (action === 'line-items' && itemId && req.method === 'POST') {
      const body = await readBody(req);
      const item = cart.items.find(({ id }) => id === itemId);
      if (item) item.quantity = body.quantity;
    } else if (action === 'shipping-methods' && req.method === 'POST') {
      const body = await readBody(req);
      if (body.option_id !== shippingOption.id) return json(res, 400, { message: 'Unknown shipping option' });
      cart.shipping_method = true;
    } else if (action === 'complete' && req.method === 'POST') {
      // Idempotent, like Medusa: completing an already-completed cart returns the same order.
      if (orders.has(cart.id)) return json(res, 200, { type: 'order', order: orders.get(cart.id) });
      if (!cart.payment_collection?.payment_sessions?.length) return json(res, 200, { type: 'cart', error: { type: 'payment_authorization_error' }, cart: cartView(cart) });
      const order = { id: `order_test_${orders.size + 1}`, display_id: orders.size + 1 };
      orders.set(cart.id, order);
      cart.completed_at = new Date().toISOString();
      return json(res, 200, { type: 'order', order });
    } else if (!action && req.method === 'POST') {
      const body = await readBody(req);
      for (const key of ['email', 'shipping_address', 'billing_address']) if (key in body) cart[key] = body[key];
    }
    return json(res, 200, { cart: cartView(cart) });
  }
  if (path === '/store/shipping-options') return json(res, 200, { shipping_options: carts.has(url.searchParams.get('cart_id')) ? [shippingOption] : [] });
  if (path === '/store/payment-providers') return json(res, 200, { payment_providers: [{ id: 'pp_paystack_paystack' }] });
  if (path === '/store/payment-collections' && req.method === 'POST') {
    const body = await readBody(req);
    const cart = carts.get(body.cart_id);
    if (!cart) return json(res, 404, { message: 'Cart not found' });
    cart.payment_collection = { id: `paycol_${cart.id}`, payment_sessions: [] };
    return json(res, 200, { payment_collection: cart.payment_collection });
  }
  const sessionMatch = path.match(/^\/store\/payment-collections\/([^/]+)\/payment-sessions$/);
  if (sessionMatch && req.method === 'POST') {
    const body = await readBody(req);
    const cart = [...carts.values()].find((candidate) => candidate.payment_collection?.id === sessionMatch[1]);
    if (!cart) return json(res, 404, { message: 'Payment collection not found' });
    cart.payment_collection.payment_sessions = [{ provider_id: body.provider_id, data: { authorization_url: `https://checkout.paystack.com/mock-${cart.id}` } }];
    return json(res, 200, { payment_collection: cart.payment_collection });
  }
  if (path === '/store/checkout/orders/lookup' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, 200, { orderId: orders.get(body.cart_id)?.id ?? null });
  }
  json(res, 404, { message: `Mock Medusa has no route for ${req.method} ${path}` });
}).listen(port, '127.0.0.1', () => console.log(`mock medusa on ${base} (${products.length} fictional products)`));
