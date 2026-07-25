import type { ParticlePool } from '../engine/ParticlePool';
import type { Force, FrameContext } from '../engine/types';

/** Radius within which repulsion acts, in CSS pixels. */
const RADIUS = 260;
const RADIUS_SQ = RADIUS * RADIUS;

/**
 * Pointer repulsion. Active on right-click / Shift+drag. Uses a smooth
 * quadratic falloff inside a finite radius so the push feels like a
 * pressure wave instead of a hard shove.
 */
export class RepulsionForce implements Force {
  readonly id = 'repulsion';
  enabled = true;

  apply(pool: ParticlePool, ctx: FrameContext): void {
    const { pointer, settings, dt } = ctx;
    if (!pointer.active || pointer.mode !== 'repel') return;

    const strength = settings.repulsionStrength * pointer.strength * 5200;
    const { x, y, vx, vy, count } = pool;

    // Every active contact point pushes independently.
    for (let p = 0; p < pointer.count; p++) {
      const px = pointer.px[p];
      const py = pointer.py[p];
      for (let i = 0; i < count; i++) {
        const dx = x[i] - px;
        const dy = y[i] - py;
        const distSq = dx * dx + dy * dy;
        if (distSq >= RADIUS_SQ || distSq === 0) continue;
        const dist = Math.sqrt(distSq);
        const falloff = 1 - dist / RADIUS;
        const accel = (strength * falloff * falloff * dt) / dist;
        vx[i] += dx * accel;
        vy[i] += dy * accel;
      }
    }
  }
}
