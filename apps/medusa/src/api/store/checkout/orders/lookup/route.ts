import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

type Body = { cart_id?: unknown; email?: unknown };

export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const cartId = typeof req.body.cart_id === 'string' ? req.body.cart_id : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!cartId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'A cart and checkout email are required.' });
    return;
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: 'order',
    fields: ['id', 'email', 'cart.id'],
    filters: { cart: { id: cartId } },
  });
  const order = orders.find((candidate) => candidate.cart?.id === cartId && candidate.email?.toLowerCase() === email);
  res.json({ orderId: order?.id ?? null });
}
