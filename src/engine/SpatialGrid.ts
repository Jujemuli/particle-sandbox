import type { ParticlePool } from './ParticlePool';

/**
 * Uniform spatial hash grid built with a counting sort over typed arrays.
 *
 * Rebuilt in O(n) with zero allocations after construction. Neighborhood
 * queries iterate the 3×3 cell block around a position, which is exactly
 * what flocking and other local-interaction forces need.
 */
export class SpatialGrid {
  private readonly cellSize: number;
  private cols = 0;
  private rows = 0;
  /** Prefix-summed particle counts per cell (length cols*rows + 1). */
  private cellStart: Int32Array = new Int32Array(0);
  /** Particle indices sorted by cell. */
  private readonly indices: Int32Array;
  /** Scratch copy of cellStart used while scattering. */
  private cursor: Int32Array = new Int32Array(0);

  constructor(capacity: number, cellSize: number) {
    this.cellSize = cellSize;
    this.indices = new Int32Array(capacity);
  }

  /** Rebuilds the grid for the current particle positions. */
  build(pool: ParticlePool, width: number, height: number): void {
    const cols = Math.max(1, Math.ceil(width / this.cellSize));
    const rows = Math.max(1, Math.ceil(height / this.cellSize));
    if (cols !== this.cols || rows !== this.rows) {
      this.cols = cols;
      this.rows = rows;
      this.cellStart = new Int32Array(cols * rows + 1);
      this.cursor = new Int32Array(cols * rows + 1);
    }

    const { x, y, count } = pool;
    const start = this.cellStart;
    start.fill(0);

    for (let i = 0; i < count; i++) {
      start[this.cellIndex(x[i], y[i]) + 1]++;
    }
    for (let c = 1; c < start.length; c++) start[c] += start[c - 1];

    this.cursor.set(start);
    for (let i = 0; i < count; i++) {
      this.indices[this.cursor[this.cellIndex(x[i], y[i])]++] = i;
    }
  }

  /**
   * Invokes `visit` for every particle index in the 3×3 cells around
   * (px, py). The callback returns false to stop early (neighbor caps).
   */
  forEachNeighbor(px: number, py: number, visit: (index: number) => boolean): void {
    const cx = this.clampCol(px);
    const cy = this.clampRow(py);
    const x0 = Math.max(0, cx - 1);
    const x1 = Math.min(this.cols - 1, cx + 1);
    const y0 = Math.max(0, cy - 1);
    const y1 = Math.min(this.rows - 1, cy + 1);

    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const cell = gy * this.cols + gx;
        const end = this.cellStart[cell + 1];
        for (let k = this.cellStart[cell]; k < end; k++) {
          if (!visit(this.indices[k])) return;
        }
      }
    }
  }

  private clampCol(x: number): number {
    const c = (x / this.cellSize) | 0;
    return c < 0 ? 0 : c >= this.cols ? this.cols - 1 : c;
  }

  private clampRow(y: number): number {
    const r = (y / this.cellSize) | 0;
    return r < 0 ? 0 : r >= this.rows ? this.rows - 1 : r;
  }

  private cellIndex(x: number, y: number): number {
    return this.clampRow(y) * this.cols + this.clampCol(x);
  }
}
