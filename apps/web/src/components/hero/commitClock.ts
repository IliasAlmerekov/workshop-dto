import { useCallback, useEffect, useRef } from "react";
import type { Language } from "@/lib/workshop/types";

/**
 * Seconds since the track was committed, measured on the three.js clock.
 *
 * Three parts of the scene need this number and all three need the *same* one:
 * the camera's dolly, each slab's fan and light impulse, and the lens surge in
 * the composer. Kept as one hook rather than three copies of the same
 * `startedAt` ref, because three copies latch on whichever frame each happened
 * to run first and the effects then drift apart by a frame or two — which is
 * exactly long enough to stop reading as one event.
 *
 * The start is latched on the first frame after the commit rather than in an
 * effect, so it is a render clock reading and not a wall-clock one: it cannot
 * fall behind a frame the browser spent compiling something.
 *
 * Returns null while no track is committed, which is also the reset — clearing
 * the selection rearms the clock for the next commit.
 */
export function useCommitElapsed(selectedTrack: Language | null) {
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedTrack) {
      startedAt.current = null;
    }
  }, [selectedTrack]);

  return useCallback(
    (now: number): number | null => {
      if (!selectedTrack) {
        return null;
      }
      if (startedAt.current === null) {
        startedAt.current = now;
      }
      return now - startedAt.current;
    },
    [selectedTrack],
  );
}
