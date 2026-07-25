import type { ParticlePool } from './ParticlePool';
import type { FrameContext } from './types';

/**
 * Renderer contract. The engine talks to renderers exclusively through this
 * interface, so a WebGL implementation can replace the Canvas 2D one without
 * touching the simulation or application code.
 */
export interface Renderer {
  /**
   * Resizes backing buffers. `renderScale` (0..1] lets adaptive quality trade
   * internal resolution for frame rate without resizing the element.
   */
  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number, renderScale: number): void;

  /** Draws the current particle state. Must not mutate the pool. */
  render(pool: ParticlePool, ctx: FrameContext): void;

  /** Clears persistent buffers (e.g. trail accumulation). */
  clear(): void;

  /** Releases GPU/canvas resources. */
  dispose(): void;
}
