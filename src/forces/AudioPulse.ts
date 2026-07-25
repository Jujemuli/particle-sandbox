import type { ParticlePool } from '../engine/ParticlePool';
import type { Force, FrameContext } from '../engine/types';

/** Bass level that must be crossed (rising edge) to fire a beat pulse. */
const BEAT_THRESHOLD = 0.55;

/**
 * Audio-reactive force. Maps analyzed bands to motion:
 * - Bass beats fire radial shockwaves from the screen center.
 * - Mids raise overall particle energy (speed boost).
 * - Highs add fine turbulent shimmer.
 *
 * Musicality comes from edge-triggered beats (not continuous force) and from
 * scaling everything by the smoothed band levels.
 */
export class AudioPulseForce implements Force {
  readonly id = 'audio';
  enabled = true;
  private wasAboveThreshold = false;

  apply(pool: ParticlePool, ctx: FrameContext): void {
    const { audio, dt, time } = ctx;
    if (!audio.active) return;

    const { x, y, vx, vy, shade, count } = pool;

    // --- Bass: edge-triggered radial shockwave from the center. ---
    const isAbove = audio.bass > BEAT_THRESHOLD;
    const beat = isAbove && !this.wasAboveThreshold;
    this.wasAboveThreshold = isAbove;
    if (beat) {
      const cx = ctx.width / 2;
      const cy = ctx.height / 2;
      const kick = 90 + audio.bass * 160;
      for (let i = 0; i < count; i++) {
        const dx = x[i] - cx;
        const dy = y[i] - cy;
        const invDist = 1 / (Math.sqrt(dx * dx + dy * dy) + 40);
        vx[i] += dx * invDist * kick;
        vy[i] += dy * invDist * kick;
      }
    }

    // --- Mids: proportional speed boost. --- Highs: shimmer jitter. ---
    const boost = 1 + audio.mid * 1.1 * dt;
    const shimmer = audio.high * 46 * dt;
    if (boost > 1 || shimmer > 0) {
      for (let i = 0; i < count; i++) {
        vx[i] *= boost;
        vy[i] *= boost;
        if (shimmer > 0) {
          // Cheap deterministic jitter keyed on particle shade and time.
          const angle = shade[i] * 37 + time * 13 + i;
          vx[i] += Math.cos(angle) * shimmer;
          vy[i] += Math.sin(angle * 1.3) * shimmer;
        }
      }
    }
  }
}
