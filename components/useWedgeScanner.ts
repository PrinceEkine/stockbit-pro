import { useEffect, useRef } from 'react';
import { isWedgeScan } from '../lib/wedgeScanner';

/**
 * Auto-captures USB/Bluetooth "wedge" barcode scanners, which type the code
 * fast and hit Enter. While active, rapid Enter-terminated bursts typed
 * outside of form fields are treated as scans — no camera modal needed.
 */
export const useWedgeScanner = (active: boolean, onScan: (code: string) => void) => {
  const buffer = useRef('');
  const startedAt = useRef(0);
  const lastKey = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!active) return;
    const IDLE_RESET_MS = 120;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;

      if (e.key === 'Enter') {
        const text = buffer.current;
        buffer.current = '';
        if (isWedgeScan({ text, elapsedMs: performance.now() - startedAt.current, enterTerminated: true })) {
          e.preventDefault();
          onScanRef.current(text);
        }
        return;
      }
      if (e.key.length !== 1) return;
      const now = performance.now();
      if (!buffer.current || now - lastKey.current > IDLE_RESET_MS) {
        buffer.current = e.key;
        startedAt.current = now;
      } else {
        buffer.current += e.key;
      }
      lastKey.current = now;
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);
};
