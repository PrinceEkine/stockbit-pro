/**
 * USB/Bluetooth "wedge" barcode scanners pretend to be keyboards: they type
 * the code very fast and hit Enter. This classifier tells wedge scans apart
 * from human typing so the POS can auto-add scanned items without the camera
 * modal open.
 *
 * A burst counts as a scan when it is long enough, typed fast enough on
 * average, and terminated by Enter.
 */

export interface KeyBurst {
  /** Characters typed since the burst started (excluding Enter). */
  text: string;
  /** Milliseconds from the first keystroke to Enter. */
  elapsedMs: number;
  /** Was the burst terminated by Enter? */
  enterTerminated: boolean;
}

export const MIN_SCAN_LENGTH = 4;
export const MAX_AVG_MS_PER_CHAR = 50;

export const isWedgeScan = (burst: KeyBurst): boolean => {
  if (!burst.enterTerminated) return false;
  if (burst.text.length < MIN_SCAN_LENGTH) return false;
  if (burst.elapsedMs < 0) return false;
  return burst.elapsedMs / burst.text.length <= MAX_AVG_MS_PER_CHAR;
};
