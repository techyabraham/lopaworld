import { cookies } from 'next/headers';

/**
 * Remembers the order this browser last completed so the confirmation page can render it.
 * It must never stand in for completing the current cart.
 */
export const orderCookie = 'lw_order_id';

/** Call when a new checkout starts so an earlier order cannot be mistaken for this one. */
export async function clearCompletedOrderCookie() {
  (await cookies()).delete(orderCookie);
}
