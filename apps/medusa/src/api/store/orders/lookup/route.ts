import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

type Body = { order_number?: unknown; email?: unknown };

/** Guest lookup deliberately returns a small status summary, never addresses or line items. */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const orderNumber = typeof req.body.order_number === 'string' ? req.body.order_number.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^\d{1,12}$/.test(orderNumber) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Enter the order number and checkout email.' });
    return;
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: 'order',
    fields: ['id', 'display_id', 'email', 'created_at', 'status', 'payment_status', 'fulfillment_status'],
    filters: { display_id: Number(orderNumber) },
  });
  const order = orders.find((candidate) => candidate.email?.toLowerCase() === email);
  if (!order) {
    res.status(404).json({ error: 'We could not find an order with those details.' });
    return;
  }

  res.json({
    order: {
      orderNumber: order.display_id,
      createdAt: order.created_at,
      status: order.status,
      paymentStatus: order.payment_status,
      fulfillmentStatus: order.fulfillment_status,
    },
  });
}
