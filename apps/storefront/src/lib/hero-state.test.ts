import { describe, expect, it } from 'vitest';
import { heroKeyReducer, prefersReducedData, splitHeadline } from './hero-state';

describe('heroKeyReducer', () => {
  it('moves right and left with wrap-around', () => {
    expect(heroKeyReducer(0, 'ArrowRight', 6)).toBe(1);
    expect(heroKeyReducer(5, 'ArrowRight', 6)).toBe(0);
    expect(heroKeyReducer(0, 'ArrowLeft', 6)).toBe(5);
    expect(heroKeyReducer(3, 'ArrowUp', 6)).toBe(2);
    expect(heroKeyReducer(3, 'ArrowDown', 6)).toBe(4);
  });

  it('jumps to the ends with Home and End', () => {
    expect(heroKeyReducer(4, 'Home', 6)).toBe(0);
    expect(heroKeyReducer(1, 'End', 6)).toBe(5);
  });

  it('ignores other keys and clamps out-of-range indexes', () => {
    expect(heroKeyReducer(2, 'Enter', 6)).toBe(2);
    expect(heroKeyReducer(9, 'a', 6)).toBe(5);
    expect(heroKeyReducer(0, 'ArrowRight', 0)).toBe(0);
  });
});

describe('splitHeadline', () => {
  it('splits at the first full stop into a display line and a voice line', () => {
    expect(splitHeadline('Look important. Be important.')).toEqual(['Look important.', 'Be important.']);
  });

  it('keeps a headline without an inner full stop on one line', () => {
    expect(splitHeadline('Lopaworld')).toEqual(['Lopaworld', null]);
    expect(splitHeadline('One line only.')).toEqual(['One line only.', null]);
  });
});

describe('prefersReducedData', () => {
  it('is true for Save-Data and slow connections only', () => {
    expect(prefersReducedData({ saveData: true })).toBe(true);
    expect(prefersReducedData({ effectiveType: '3g' })).toBe(true);
    expect(prefersReducedData({ effectiveType: 'slow-2g' })).toBe(true);
    expect(prefersReducedData({ effectiveType: '4g' })).toBe(false);
    expect(prefersReducedData(undefined)).toBe(false);
  });
});
