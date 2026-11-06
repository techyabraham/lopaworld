import { describe, expect, it, vi } from 'vitest';
import { addAllMessage, addAllSequentially, type AddAllItem } from './add-all';

const items: AddAllItem[] = [
  { handle: 'fila', variantId: 'v1', title: 'Matching fila' },
  { handle: 'slides', variantId: 'v2', title: 'Leather slides' },
  { handle: 'kids', variantId: 'v3', title: 'Children’s agbada' },
];

describe('addAllSequentially', () => {
  it('posts one piece at a time, in order', async () => {
    const order: string[] = [];
    let inFlight = 0;
    const post = vi.fn(async (item: AddAllItem) => {
      inFlight += 1;
      expect(inFlight).toBe(1);
      await new Promise((resolve) => setTimeout(resolve, 1));
      order.push(item.handle);
      inFlight -= 1;
      return true;
    });
    const result = await addAllSequentially(items, post);
    expect(order).toEqual(['fila', 'slides', 'kids']);
    expect(result.failed).toEqual([]);
  });

  it('keeps going after a failure or a thrown error and reports each one', async () => {
    const post = vi.fn(async (item: AddAllItem) => {
      if (item.handle === 'fila') throw new Error('network');
      return item.handle !== 'kids';
    });
    const result = await addAllSequentially(items, post);
    expect(post).toHaveBeenCalledTimes(3);
    expect(result.added.map(({ handle }) => handle)).toEqual(['slides']);
    expect(result.failed.map(({ handle }) => handle)).toEqual(['fila', 'kids']);
  });
});

describe('addAllMessage', () => {
  it('summarises full success', () => {
    expect(addAllMessage({ added: items, failed: [] })).toEqual({ tone: 'success', text: 'Added all 3 pieces to your bag.' });
  });
  it('names the pieces that failed in a partial result', () => {
    expect(addAllMessage({ added: [items[1]!], failed: [items[0]!, items[2]!] })).toEqual({ tone: 'partial', text: 'Added 1 of 3 pieces. We could not add: Matching fila, Children’s agbada.' });
  });
  it('reports a total failure as an error', () => {
    expect(addAllMessage({ added: [], failed: items }).tone).toBe('error');
  });
});
