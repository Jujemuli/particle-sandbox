import { clamp } from '../shared/math';

/** Adaptive quality bounds for internal render resolution. */
const MIN_RENDER_SCALE = 0.5;
const MAX_RENDER_SCALE = 1;
/** Bounds for the second-stage particle density reduction. */
const MIN_DENSITY_SCALE = 0.4;
const MAX_DENSITY_SCALE = 1;
/** Frame-time targets (ms). Above HIGH we degrade, below LOW we recover. */
const DEGRADE_ABOVE_MS = 15;
const RECOVER_BELOW_MS = 9;
/** How often adaptive decisions are made (ms). */
const ADJUST_INTERVAL_MS = 500;

/**
 * Tracks smoothed FPS / frame time and drives two-stage adaptive quality:
 *
 * 1. Lower internal render resolution (`renderScale`) — cheap, invisible.
 * 2. Only when resolution is at its floor, reduce active particle density
 *    (`densityScale`) — visible, so it is the last resort.
 *
 * Recovery happens in reverse order. Hysteresis between the degrade and
 * recover thresholds prevents oscillation.
 */
export class PerformanceMonitor {
  private smoothedFrameMs = 8;
  private lastAdjustTime = 0;
  renderScale = MAX_RENDER_SCALE;
  densityScale = MAX_DENSITY_SCALE;

  /** Records one frame's duration; returns true if any quality changed. */
  record(frameMs: number, now: number): boolean {
    // Exponential moving average; ignore absurd stalls (tab switches).
    const sample = Math.min(frameMs, 100);
    this.smoothedFrameMs += (sample - this.smoothedFrameMs) * 0.08;

    if (now - this.lastAdjustTime < ADJUST_INTERVAL_MS) return false;
    this.lastAdjustTime = now;

    let nextRender = this.renderScale;
    let nextDensity = this.densityScale;

    if (this.smoothedFrameMs > DEGRADE_ABOVE_MS) {
      if (nextRender > MIN_RENDER_SCALE) nextRender -= 0.1;
      else nextDensity -= 0.1;
    } else if (this.smoothedFrameMs < RECOVER_BELOW_MS) {
      if (nextDensity < MAX_DENSITY_SCALE) nextDensity += 0.05;
      else nextRender += 0.05;
    }

    nextRender = clamp(nextRender, MIN_RENDER_SCALE, MAX_RENDER_SCALE);
    nextDensity = clamp(nextDensity, MIN_DENSITY_SCALE, MAX_DENSITY_SCALE);

    if (nextRender !== this.renderScale || nextDensity !== this.densityScale) {
      this.renderScale = nextRender;
      this.densityScale = nextDensity;
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
