import type { ParticlePool } from '../engine/ParticlePool';
import type { Force, FrameContext } from '../engine/types';

/** Softening keeps tangential speed finite at the vortex core. */
const SOFTENING = 4000; // px^2

/**
 * Vortex: swirls particles around a center, producing spiral-galaxy motion.
 * Combines a tangential component (rotation) with a weak inward pull so the
 * spiral tightens instead of dispersing. Centers on the pointer while
 * pressed, otherwise on the screen center.
 */
export class VortexForce implements Force {
  readonly id = 'vortex';
  enabled = false;

  apply(pool: ParticlePool, ctx: FrameContext): void {
    const { pointer, settings, dt } = ctx;
    const cx = pointer.active ? pointer.x : ctx.width / 2;
    const cy = pointer.active ? pointer.y : ctx.height / 2;
    const strength = settings.vortexStrength * pointer.strength * 5.4e5;

    const { x, y, vx, vy, count } = pool;
    for (let i = 0; i < count; i++) {
      const dx = cx - x[i];
      const dy = cy - y[i];
      const distSq = dx * dx + dy * dy + SOFTENING;
      const invDist = 1 / Math.sqrt(distSq);
      const accel = (strength / distSq) * invDist * dt;
      // Tangential (perpendicular) swirl + 25% radial pull.
      vx[i] += (-dy + dx * 0.25) * accel;
      vy[i] += (dx + dy * 0.25) * accel;
    }
  }
}
