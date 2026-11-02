import { describe, it, expect } from 'vitest';
import { isWedgeScan } from '../wedgeScanner';

describe('isWedgeScan', () => {
  it('accepts a fast Enter-terminated burst (hardware scanner)', () => {
    expect(isWedgeScan({ text: '890123456789', elapsedMs: 120, enterTerminated: true })).toBe(true);
  });

  it('rejects slow human typing even with Enter', () => {
    expect(isWedgeScan({ text: 'shampoo', elapsedMs: 2000, enterTerminated: true })).toBe(false);
  });

  it('rejects bursts without Enter and codes that are too short', () => {
    expect(isWedgeScan({ text: '890123456789', elapsedMs: 120, enterTerminated: false })).toBe(false);
    expect(isWedgeScan({ text: 'ab', elapsedMs: 20, enterTerminated: true })).toBe(false);
  });
});
