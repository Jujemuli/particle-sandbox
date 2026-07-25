import type { ParticlePool } from '../engine/ParticlePool';
import type { Emitter, FrameContext } from '../engine/types';
import { Random } from '../shared/random';
import { TAU } from '../shared/math';

/**
 * Seeds the pool with uniformly distributed particles. Used on reset and
 * whenever the particle count grows. Deterministic via the shared seed.
 */
export class UniformEmitter implements Emitter {
  readonly id = 'uniform';
  private readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  emit(pool: ParticlePool, ctx: FrameContext): void {
    this.seedRange(pool, ctx, 0, pool.count);
  }

  /** Initializes particles in [start, end) without touching the rest. */
  seedRange(pool: ParticlePool, ctx: FrameContext, start: number, end: number): void {
    const rng = new Random(this.seed + start * 7919);
    const { x, y, vx, vy, scale, shade } = pool;

    for (let i = start; i < end; i++) {
      x[i] = rng.range(0, ctx.width);
      y[i] = rng.range(0, ctx.height);
      const angle = rng.range(0, TAU);
      const speed = rng.range(4, 30);
      vx[i] = Math.cos(angle) * speed;
      vy[i] = Math.sin(angle) * speed;
      // Squared distribution: many small particles, few large — depth cue.
      const r = rng.next();
      scale[i] = 0.35 + r * r * 1.4;
      shade[i] = rng.next();
    }
  }
}
