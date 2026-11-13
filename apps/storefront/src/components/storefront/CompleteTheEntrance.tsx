'use client';

import { useState } from 'react';
import { addAllMessage, addAllSequentially, postToBag, type AddAllItem } from '../../lib/add-all';
import { trackStoreEvent } from '../../lib/analytics';

/**
 * "Add all" for Complete the Entrance. Rendered only when the server confirmed every piece has
 * exactly one purchasable variant; adds them one by one and reports partial failures.
 */
export function AddAllButton({ items, totalText }: { items: AddAllItem[]; totalText: string | null }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<ReturnType<typeof addAllMessage> | null>(null);

  async function addAll() {
    setBusy(true); setMessage(null);
    const result = await addAllSequentially(items, postToBag);
    if (result.added.length) {
      window.dispatchEvent(new Event('lw:cart-updated'));
      trackStoreEvent({ name: 'add_to_bag', params: { item_id: result.added.map(({ handle }) => handle).join(','), item_name: 'Complete the Entrance', quantity: result.added.length } });
    }
    setMessage(addAllMessage(result));
    setBusy(false);
  }

  const count = items.length === 2 ? 'both' : items.length === 3 ? 'all three' : `all ${items.length}`;
  return <div className="complete-actions">
    <button type="button" className="lw-button complete-add-all" disabled={busy} onClick={() => void addAll()}>{busy ? 'Adding…' : `Add ${count}${totalText ? ` · ${totalText}` : ''}`}</button>
    <p className="complete-status" role={message?.tone === 'error' ? 'alert' : 'status'} data-tone={message?.tone}>{message && <>{message.text} {message.tone !== 'error' && <a href="/bag">View bag</a>}</>}</p>
  </div>;
}
