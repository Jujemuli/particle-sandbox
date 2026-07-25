import type { ParticlePool } from '../engine/ParticlePool';
import type { Force, FrameContext } from '../engine/types';
import { curl } from '../shared/noise';

/** Spatial frequency of the flow field (1 / feature size in px). */
const FREQUENCY = 1 / 380;
/** How fast the field itself evolves over time. */
const TIME_SCALE = 0.06;

/**
 * Curl-noise flow field. Particles drift along a divergence-free vector
 * field derived from value noise, producing organic currents reminiscent of
 * smoke or deep water. Replaces the Phase 1 trigonometric drift.
 */
export class NoiseFlowForce implements Force {
  readonly id = 'noiseFlow';
  enabled = true;
  /** Reused output vector for curl sampling — no per-particle allocation. */
  private readonly flow = new Float32Array(2);

  apply(pool: ParticlePool, ctx: FrameContext): void {
    const { dt, time, settings } = ctx;
    const strength = settings.turbulence * 340 * dt;
    if (strength === 0) return;

    const z = time * TIME_SCALE;
    const { x, y, vx, vy, shade, count } = pool;
    const flow = this.flow;

    for (let i = 0; i < count; i++) {
      curl(x[i] * FREQUENCY, y[i] * FREQUENCY, z + shade[i] * 0.15, flow);
      vx[i] += flow[0] * strength;
      vy[i] += flow[1] * strength;
    }
  }
}
