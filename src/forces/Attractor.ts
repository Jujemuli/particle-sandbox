import type { ParticlePool } from '../engine/ParticlePool';
import type { Force, FrameContext } from '../engine/types';
import { TAU } from '../shared/math';

/** Number of invisible orbital attractors. */
const ATTRACTOR_COUNT = 3;
const SOFTENING = 2500; // px^2

/**
 * Orbit mode: invisible attractors that particles circle.
 *
 * Each attractor pulls radially while a velocity-correction term nudges
 * particles toward the ideal circular-orbit speed, so clouds settle into
 * stable rings instead of collapsing. Attractors drift slowly around the
 * viewport to keep compositions evolving.
 */
export class AttractorForce implements Force {
  readonly id = 'orbit';
  enabled = false;
  /** Scratch attractor positions, refreshed each step (no allocation). */
  private readonly ax = new Float32Array(ATTRACTOR_COUNT);
  private readonly ay = new Float32Array(ATTRACTOR_COUNT);

  apply(pool: ParticlePool, ctx: FrameContext): void {
    const { dt, time, width, height } = ctx;
    const { ax, ay } = this;

    // Attractors orbit the screen center on slow, incommensurate paths.
    for (let a = 0; a < ATTRACTOR_COUNT; a++) {
      const phase = (a / ATTRACTOR_COUNT) * TAU;
      ax[a] = width * (0.5 + 0.3 * Math.cos(time * 0.05 + phase));
      ay[a] = height * (0.5 + 0.3 * Math.sin(time * 0.037 + phase * 1.3));
    }

    const mu = 5.2e5; // gravitational parameter per attractor
    const { x, y, vx, vy, count } = pool;

    for (let i = 0; i < count; i++) {
      // Each particle binds to one attractor (stable partition by index).
      const a = i % ATTRACTOR_COUNT;
      const dx = ax[a] - x[i];
      const dy = ay[a] - y[i];
      const distSq = dx * dx + dy * dy + SOFTENING;
      const dist = Math.sqrt(distSq);
      const invDist = 1 / dist;

      // Radial gravity.
      const accel = (mu / distSq) * invDist * dt;
      vx[i] += dx * accel;
      vy[i] += dy * accel;

      // Nudge tangential speed toward circular-orbit velocity.
      const ideal = Math.sqrt(mu / dist);
      const tx = -dy * invDist;
      const ty = dx * invDist;
      const tangential = vx[i] * tx + vy[i] * ty;
      const correction = (ideal * Math.sign(tangential || 1) - tangential) * 0.6 * dt;
      vx[i] += tx * correction;
      vy[i] += ty * correction;
    }
  }
}
