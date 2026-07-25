/**
 * Structure-of-arrays particle storage backed by typed arrays.
 *
 * All particle state lives in contiguous Float32Arrays for cache-friendly
 * iteration and zero per-frame allocations. The pool is sized once at its
 * maximum capacity; `count` controls how many particles are active, so
 * changing particle count never reallocates.
 */
export class ParticlePool {
  readonly capacity: number;

  /** Positions in CSS pixel space. */
  readonly x: Float32Array;
  readonly y: Float32Array;
  /** Velocities in CSS pixels per second. */
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  /** Per-particle size multiplier (varies visual scale + depth illusion). */
  readonly scale: Float32Array;
  /** Palette position 0..1; the renderer maps this to a color sprite. */
  readonly shade: Float32Array;

  /** Number of currently active particles (a prefix of the arrays). */
  count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.x = new Float32Array(capacity);
    this.y = new Float32Array(capacity);
    this.vx = new Float32Array(capacity);
    this.vy = new Float32Array(capacity);
    this.scale = new Float32Array(capacity);
    this.shade = new Float32Array(capacity);
  }

  /** Sets the active count, clamped to capacity. */
  setCount(count: number): void {
    this.count = Math.max(0, Math.min(this.capacity, Math.floor(count)));
  }
}
