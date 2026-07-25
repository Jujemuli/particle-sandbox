import type { ParticlePool } from '../engine/ParticlePool';
import type { Force, FrameContext } from '../engine/types';

/**
 * Wind: a global directional push whose heading and gust strength wander
 * slowly over time, so it feels like weather instead of a constant vector.
 */
export class WindForce implements Force {
  readonly id = 'wind';
  enabled = false;

  apply(pool: ParticlePool, ctx: FrameContext): void {
    const { dt, time, settings } = ctx;
    const base = settings.windStrength * 60;
    if (base === 0) return;

    // Slowly meandering heading with gusty magnitude.
    const heading = Math.sin(time * 0.11) * 0.9 + Math.sin(time * 0.043) * 1.6;
    const gust = 0.65 + 0.35 * Math.sin(time * 0.7 + Math.sin(time * 0.23) * 2);
    const ax = Math.cos(heading) * base * gust * dt;
    const ay = Math.sin(heading) * base * gust * dt;

    const { vx, vy, count } = pool;
    for (let i = 0; i < count; i++) {
      vx[i] += ax;
      vy[i] += ay;
    }
  }
}
