// "Complete the Entrance" → "Add all": add each piece to the bag in sequence (the cart route
// creates the cart on the first call, so parallel posts could race into two carts) and report
// which ones failed instead of stopping at the first error.

export type AddAllItem = { handle: string; variantId: string; title: string };
export type AddAllResult = { added: AddAllItem[]; failed: AddAllItem[] };
export type PostItem = (item: AddAllItem) => Promise<boolean>;

export async function addAllSequentially(items: AddAllItem[], post: PostItem): Promise<AddAllResult> {
  const result: AddAllResult = { added: [], failed: [] };
  for (const item of items) {
    let ok = false;
    try { ok = await post(item); } catch { ok = false; }
    (ok ? result.added : result.failed).push(item);
  }
  return result;
}

/** A customer-facing summary. Never includes server error text (B12). */
export function addAllMessage({ added, failed }: AddAllResult): { tone: 'success' | 'partial' | 'error'; text: string } {
  if (!failed.length) return { tone: 'success', text: `Added ${added.length === 1 ? 'the piece' : `all ${added.length} pieces`} to your bag.` };
  const names = failed.map(({ title }) => title).join(', ');
  if (!added.length) return { tone: 'error', text: `We could not add these pieces to your bag: ${names}. Please try again.` };
  return { tone: 'partial', text: `Added ${added.length} of ${added.length + failed.length} pieces. We could not add: ${names}.` };
}

/** Posts one piece to the bag through the existing cart route. */
export const postToBag: PostItem = async ({ handle, variantId }) => {
  const response = await fetch('/api/cart/items', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ handle, variantId, quantity: 1 }),
  });
  return response.ok;
};
