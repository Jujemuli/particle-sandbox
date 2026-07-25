import { ParticlePool } from './ParticlePool';
import type { Force, FrameContext, PointerState, SimulationSettings } from './types';

/** Fixed timestep in seconds. Decoupled from render rate for determinism. */
const FIXED_STEP = 1 / 120;
/** Cap on accumulated time so tab-switch stalls never cause a spiral. */
const MAX_ACCUMULATED = 0.1;

/**
 * Fixed-timestep particle simulation.
 *
 * Owns the particle pool and an ordered list of pluggable {@link Force}
 * modules. Rendering is entirely separate — callers advance the simulation
 * with wall-clock delta time and render the pool whenever they like.
 */
export class Simulation {
  readonly pool: ParticlePool;
  private readonly forces: Force[] = [];
  private accumulator = 0;
  private time = 0;
  /** Reused frame context to avoid per-step allocation. */
  private readonly ctx: FrameContext;

  private readonly settings: SimulationSettings;
  private readonly pointer: PointerState;

  constructor(capacity: number, settings: SimulationSettings, pointer: PointerState) {
    this.settings = settings;
    this.pointer = pointer;
    this.pool = new ParticlePool(capacity);
    this.ctx = {
      dt: FIXED_STEP,
      time: 0,
      width: 1,
      height: 1,
      pointer: this.pointer,
      settings: this.settings,
    };
  }

  addForce(force: Force): void {
    this.forces.push(force);
  }

  getForce(id: string): Force | undefined {
    return this.forces.find((f) => f.id === id);
  }

  resize(width: number, height: number): void {
    this.ctx.width = width;
    this.ctx.height = height;
  }

  /** Advances the simulation by `deltaSeconds` of wall-clock time. */
  update(deltaSeconds: number): void {
    if (this.settings.paused) return;
    this.accumulator = Math.min(this.accumulator + deltaSeconds, MAX_ACCUMULATED);
    while (this.accumulator >= FIXED_STEP) {
      this.step(FIXED_STEP * this.settings.speed);
      this.accumulator -= FIXED_STEP;
    }
  }

  private step(dt: number): void {
    const { pool, ctx } = this;
    this.time += dt;
    ctx.dt = dt;
    ctx.time = this.time;

    for (const force of this.forces) {
      if (force.enabled) force.apply(pool, ctx);
    }

    this.integrate(dt, ctx.width, ctx.height);
  }

  /** Semi-implicit Euler integration with drag and soft edge wrapping. */
  private integrate(dt: number, width: number, height: number): void {
    const { x, y, vx, vy, count } = this.pool;
    // Frame-rate independent exponential drag.
    const drag = Math.exp(-this.settings.drag * dt);
    const margin = 8;
    const w = width + margin * 2;
    const h = height + margin * 2;

    for (let i = 0; i < count; i++) {
      vx[i] *= drag;
      vy[i] *= drag;
      let px = x[i] + vx[i] * dt;
      let py = y[i] + vy[i] * dt;
      // Toroidal wrapping keeps density constant without hard bounces.
      if (px < -margin) px += w;
      else if (px > width + margin) px -= w;
      if (py < -margin) py += h;
      else if (py > height + margin) py -= h;
      x[i] = px;
      y[i] = py;
    }
  }
}
