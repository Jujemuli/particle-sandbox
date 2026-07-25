/**
 * Lightweight 2D value noise used as a scalar potential field.
 *
 * Curl noise samples the potential's gradient and rotates it 90°, giving a
 * divergence-free velocity field — the classic technique for organic,
 * smoke-like particle flow without solving fluid equations.
 */

/** Deterministic lattice hash -> [0, 1). */
function hash(ix: number, iy: number): number {
  let h = (ix * 374761393 + iy * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Single-octave value noise in [0, 1). `z` selects a lattice slice (time). */
export function valueNoise(x: number, y: number, z: number): number {
  const zi = Math.floor(z);
  const zf = smooth(z - zi);
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);

  // Two z-slices blended for smooth temporal evolution.
  let result = 0;
  for (let s = 0; s <= 1; s++) {
    const zo = (zi + s) * 2749;
    const a = hash(ix + zo, iy);
    const b = hash(ix + 1 + zo, iy);
    const c = hash(ix + zo, iy + 1);
    const d = hash(ix + 1 + zo, iy + 1);
    const value = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    result += s === 0 ? value * (1 - zf) : value * zf;
  }
  return result;
}

const EPS = 0.35;
const INV_2EPS = 1 / (2 * EPS);

/**
 * Samples the curl of the noise potential at (x, y), writing the resulting
 * unit-scale flow vector into `out` ([vx, vy]) to avoid allocation.
 */
export function curl(x: number, y: number, z: number, out: Float32Array): void {
  const dy = valueNoise(x, y + EPS, z) - valueNoise(x, y - EPS, z);
  const dx = valueNoise(x + EPS, y, z) - valueNoise(x - EPS, y, z);
  out[0] = dy * INV_2EPS;
  out[1] = -dx * INV_2EPS;
}
