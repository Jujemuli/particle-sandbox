import type { ParticlePool } from './ParticlePool';
import type { AudioLevels } from '../audio/AudioAnalyzer';

/** Pointer interaction modes shared between input handling and forces. */
export type PointerMode = 'attract' | 'repel';

/** Maximum simultaneous contact points (multitouch gravity wells). */
export const MAX_POINTERS = 8;

/**
 * Normalized interaction state. Mouse, touch, pen and keyboard all mutate
 * this single object; the simulation reads it once per fixed step.
 *
 * Multiple simultaneous contacts are stored in fixed typed arrays so every
 * finger becomes an independent force center with zero allocation.
 */
export interface PointerState {
  /** Primary pointer position (last moved), in CSS pixel space. */
  x: number;
  y: number;
  /** Whether any contact point is currently pressed on the canvas. */
  active: boolean;
  mode: PointerMode;
  /** User-adjustable force strength multiplier (scroll wheel). */
  strength: number;
  /** Number of active contact points (prefix of the arrays below). */
  count: number;
  /** Active contact positions, length {@link MAX_POINTERS}. */
  px: Float32Array;
  py: Float32Array;
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
  vortexStrength: number;
  /** Curl-noise flow field intensity. */
  turbulence: number;
  windStrength: number;
  /** Base particle radius in CSS pixels. */
  particleSize: number;
  /** Glow sprite intensity, 0..1. */
  glowIntensity: number;
  /** Trail persistence, 0 (none) .. 1 (long trails). */
  trailLength: number;
  paletteId: string;
  paused: boolean;
  /** Gain applied to analyzed audio levels. */
  audioSensitivity: number;
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
  /** Live audio band levels (zeroed when no source is active). */
  audio: Readonly<AudioLevels>;
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
