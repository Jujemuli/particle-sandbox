import type { ParticlePool } from '../engine/ParticlePool';
import type { Force, FrameContext } from '../engine/types';

/**
 * Ambient drift: a cheap time-varying trigonometric flow field that keeps
 * the scene alive when no interaction is happening. This is intentionally
 * lighter than true curl noise (Phase 3) but produces similar organic,
 * smoke-like motion at near-zero cost per particle.
 */
export class DriftForce implements Force {
  readonly id = 'drift';
  enabled = true;

  apply(pool: ParticlePool, ctx: FrameContext): void {
    const { dt, time } = ctx;
    const { x, y, vx, vy, shade, count } = pool;
    const strength = 26 * dt;
    const t1 = time * 0.21;
    const t2 = time * 0.17;
    const inv = 1 / 340;

    for (let i = 0; i < count; i++) {
      const px = x[i] * inv;
      const py = y[i] * inv;
      // Divergence-poor pseudo-flow assembled from orthogonal sine waves.
      const angle =
        Math.sin(px + t1 + Math.cos(py * 1.3 - t2)) * 2.4 +
        Math.cos(py * 0.8 - t1) * 1.7 +
        shade[i] * 0.9;
      vx[i] += Math.cos(angle) * strength;
      vy[i] += Math.sin(angle) * strength;
    }
  }
}
