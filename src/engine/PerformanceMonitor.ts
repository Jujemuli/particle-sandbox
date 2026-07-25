import { clamp } from '../shared/math';

/** Adaptive quality bounds for internal render resolution. */
const MIN_RENDER_SCALE = 0.5;
const MAX_RENDER_SCALE = 1;
/** Frame-time targets (ms). Above HIGH we degrade, below LOW we recover. */
const DEGRADE_ABOVE_MS = 15;
const RECOVER_BELOW_MS = 9;
/** How often adaptive decisions are made (ms). */
const ADJUST_INTERVAL_MS = 500;

/**
 * Tracks smoothed FPS / frame time and drives adaptive quality.
 *
 * When sustained frame time exceeds the budget the render scale is lowered
 * (resolution before particle fidelity); when there is ample headroom it is
 * raised back. Hysteresis between the two thresholds prevents oscillation.
 */
export class PerformanceMonitor {
  private smoothedFrameMs = 8;
  private lastAdjustTime = 0;
  renderScale = MAX_RENDER_SCALE;

  /** Records one frame's duration; returns true if renderScale changed. */
  record(frameMs: number, now: number): boolean {
    // Exponential moving average; ignore absurd stalls (tab switches).
    const sample = Math.min(frameMs, 100);
    this.smoothedFrameMs += (sample - this.smoothedFrameMs) * 0.08;

    if (now - this.lastAdjustTime < ADJUST_INTERVAL_MS) return false;
    this.lastAdjustTime = now;

    let next = this.renderScale;
    if (this.smoothedFrameMs > DEGRADE_ABOVE_MS) next -= 0.1;
    else if (this.smoothedFrameMs < RECOVER_BELOW_MS) next += 0.05;
    next = clamp(next, MIN_RENDER_SCALE, MAX_RENDER_SCALE);

    if (next !== this.renderScale) {
      this.renderScale = next;
      return true;
    }
    return false;
  }

  get fps(): number {
    return this.smoothedFrameMs > 0 ? 1000 / this.smoothedFrameMs : 0;
  }

  get frameTimeMs(): number {
    return this.smoothedFrameMs;
  }
}
