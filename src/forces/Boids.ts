import type { ParticlePool } from '../engine/ParticlePool';
import type { Force, FrameContext } from '../engine/types';
import { SpatialGrid } from '../engine/SpatialGrid';

/** Perception radius for cohesion/alignment, in CSS pixels. */
const PERCEPTION = 34;
const PERCEPTION_SQ = PERCEPTION * PERCEPTION;
/** Separation kicks in below this distance. */
const SEPARATION = 13;
const SEPARATION_SQ = SEPARATION * SEPARATION;
/** Neighbor cap keeps worst-case cost bounded in dense clusters. */
const MAX_NEIGHBORS = 10;

const SEPARATION_WEIGHT = 240;
const ALIGNMENT_WEIGHT = 4.5;
const COHESION_WEIGHT = 2.2;
/** Cruise speed boids accelerate toward. */
const TARGET_SPEED = 90;

/**
 * Flocking (boids): separation, alignment and cohesion over a spatial hash
 * grid. The grid rebuild and neighbor pass run every other fixed step (with
 * doubled dt) — flocking is a low-frequency steering behavior, so halving
 * its rate is imperceptible but roughly halves its cost.
 */
export class BoidsForce implements Force {
  readonly id = 'boids';
  enabled = false;
  private readonly grid: SpatialGrid;
  private stepParity = 0;

  constructor(capacity: number) {
    this.grid = new SpatialGrid(capacity, PERCEPTION);
  }

  apply(pool: ParticlePool, ctx: FrameContext): void {
    this.stepParity ^= 1;
    if (this.stepParity === 0) return;
    const dt = ctx.dt * 2;

    const { x, y, vx, vy, count } = pool;
    this.grid.build(pool, ctx.width, ctx.height);

    for (let i = 0; i < count; i++) {
      const px = x[i];
      const py = y[i];
      let sepX = 0;
      let sepY = 0;
      let avgVX = 0;
      let avgVY = 0;
      let avgX = 0;
      let avgY = 0;
      let neighbors = 0;

      this.grid.forEachNeighbor(px, py, (j) => {
        if (j === i) return true;
        const dx = x[j] - px;
        const dy = y[j] - py;
        const distSq = dx * dx + dy * dy;
        if (distSq >= PERCEPTION_SQ) return true;

        if (distSq < SEPARATION_SQ && distSq > 0) {
          const inv = 1 / distSq;
          sepX -= dx * inv;
          sepY -= dy * inv;
        }
        avgVX += vx[j];
        avgVY += vy[j];
        avgX += dx;
        avgY += dy;
        neighbors++;
        return neighbors < MAX_NEIGHBORS;
      });

      if (neighbors > 0) {
        const inv = 1 / neighbors;
        vx[i] +=
          (sepX * SEPARATION_WEIGHT +
            (avgVX * inv - vx[i]) * ALIGNMENT_WEIGHT +
            avgX * inv * COHESION_WEIGHT) *
          dt;
        vy[i] +=
          (sepY * SEPARATION_WEIGHT +
            (avgVY * inv - vy[i]) * ALIGNMENT_WEIGHT +
            avgY * inv * COHESION_WEIGHT) *
          dt;
      }

      // Speed regulation: accelerate stragglers, damp runaways.
      const speedSq = vx[i] * vx[i] + vy[i] * vy[i];
      if (speedSq > 1) {
        const speed = Math.sqrt(speedSq);
        const adjust = 1 + ((TARGET_SPEED - speed) / speed) * 1.4 * dt;
        vx[i] *= adjust;
        vy[i] *= adjust;
      }
    }
  }
}
