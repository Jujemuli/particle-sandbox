import type { ParticlePool } from './ParticlePool';

/** Pointer interaction modes shared between input handling and forces. */
export type PointerMode = 'attract' | 'repel';

/**
 * Normalized interaction state. Mouse, touch and keyboard all mutate this
 * single object; the simulation reads it once per fixed step.
 */
export interface PointerState {
  /** Pointer position in simulation (CSS pixel) space. */
  x: number;
  y: number;
  /** Whether the pointer is currently pressed on the canvas. */
  active: boolean;
  mode: PointerMode;
  /** User-adjustable force strength multiplier (scroll wheel). */
  strength: number;
}

/** Tunable simulation parameters, mutated by the UI and presets. */
export interface SimulationSettings {
  particleCount: number;
  /** Global speed multiplier applied to integration. */
  speed: number;
  /** Velocity damping per second (0 = frictionless). */
  drag: number;
  gravityStrength: number;
  repulsionStrength: number;
  /** Base particle radius in CSS pixels. */
  particleSize: number;
  /** Glow sprite intensity, 0..1. */
  glowIntensity: number;
  /** Trail persistence, 0 (none) .. 1 (long trails). */
  trailLength: number;
  paletteId: string;
  paused: boolean;
}

/** Immutable per-frame context handed to forces, emitters and renderers. */
export interface FrameContext {
  /** Fixed simulation step in seconds (already scaled by `settings.speed`). */
  dt: number;
  /** Total simulation time in seconds. */
  time: number;
  /** Viewport size in CSS pixels. */
  width: number;
  height: number;
  pointer: Readonly<PointerState>;
  settings: Readonly<SimulationSettings>;
}

/**
 * A pluggable force. Forces are registered on the simulation and applied in
 * order to every active particle each fixed step. Adding a new behavior only
 * requires implementing this interface — the engine never changes.
 */
export interface Force {
  readonly id: string;
  enabled: boolean;
  apply(pool: ParticlePool, ctx: FrameContext): void;
}

/**
 * A pluggable emitter. Emitters spawn or re-seed particles. They share the
 * same frame context as forces so they can react to interaction state.
 */
export interface Emitter {
  readonly id: string;
  emit(pool: ParticlePool, ctx: FrameContext): void;
}

/** Live performance statistics surfaced to the UI. */
export interface EngineStats {
  fps: number;
  frameTimeMs: number;
  particleCount: number;
  renderScale: number;
}
