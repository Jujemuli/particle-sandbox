import type { ParticlePool } from '../engine/ParticlePool';
import type { Force, FrameContext } from '../engine/types';

/** Softening radius so acceleration stays finite near the pointer. */
const SOFTENING = 900; // px^2

/**
 * Pointer gravity well. Particles accelerate toward the pointer with an
 * inverse-square falloff (softened), producing orbit-like slingshots rather
 * than a uniform pull.
 */
export class GravityForce implements Force {
  readonly id = 'gravity';
  enabled = true;

  apply(pool: ParticlePool, ctx: FrameContext): void {
    const { pointer, settings, dt } = ctx;
    if (!pointer.active || pointer.mode !== 'attract') return;

    const strength = settings.gravityStrength * pointer.strength * 3.2e6;
    const { x, y, vx, vy, count } = pool;
    const px = pointer.x;
    const py = pointer.y;

    for (let i = 0; i < count; i++) {
      const dx = px - x[i];
      const dy = py - y[i];
      const distSq = dx * dx + dy * dy + SOFTENING;
      const invDist = 1 / Math.sqrt(distSq);
      const accel = (strength / distSq) * invDist * dt;
      vx[i] += dx * accel;
      vy[i] += dy * accel;
    }
  }
}
