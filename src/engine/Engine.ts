import { Simulation } from './Simulation';
import { Canvas2DRenderer } from '../rendering/Canvas2DRenderer';
import type { Renderer } from './Renderer';
import type { EngineStats, FrameContext, PointerState, SimulationSettings } from './types';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PointerInput } from '../input/PointerInput';
import { UniformEmitter } from '../emitters/UniformEmitter';
import { GravityForce } from '../forces/Gravity';
import { RepulsionForce } from '../forces/Repulsion';
import { NoiseFlowForce } from '../forces/NoiseFlow';
import { VortexForce } from '../forces/Vortex';
import { WindForce } from '../forces/Wind';
import { AttractorForce } from '../forces/Attractor';
import { BoidsForce } from '../forces/Boids';
import { AudioPulseForce } from '../forces/AudioPulse';
import { AudioAnalyzer, type AudioLevels } from '../audio/AudioAnalyzer';

/** Hard cap on pool allocation; the active count can be anything below. */
const MAX_PARTICLES = 50_000;
/** Cap device pixel ratio; ultra-high DPR wastes fill rate invisibly. */
const MAX_DPR = 2;
const DEFAULT_SEED = 1337;

export const DEFAULT_SETTINGS: SimulationSettings = {
  particleCount: 10_000,
  speed: 1,
  drag: 0.35,
  gravityStrength: 1,
  repulsionStrength: 1,
  vortexStrength: 1,
  turbulence: 1,
  windStrength: 1,
  particleSize: 1.6,
  glowIntensity: 0.8,
  trailLength: 0.85,
  paletteId: 'aurora',
  paused: false,
  audioSensitivity: 1.4,
};

/**
 * Application-facing façade that owns the simulation, renderer, input and
 * the requestAnimationFrame loop. React interacts only with this class —
 * per-frame work never touches React state.
 */
export class Engine {
  readonly settings: SimulationSettings = { ...DEFAULT_SETTINGS };
  private readonly pointer: PointerState = {
    x: 0,
    y: 0,
    active: false,
    mode: 'attract',
    strength: 1,
  };

  /** Shared with every frame context; mutated in place by the analyzer. */
  private readonly audioLevels: AudioLevels = {
    bass: 0,
    mid: 0,
    high: 0,
    level: 0,
    active: false,
  };
  readonly audio: AudioAnalyzer = new AudioAnalyzer(this.audioLevels);

  private readonly simulation: Simulation;
  private readonly renderer: Renderer;
  private readonly monitor = new PerformanceMonitor();
  private readonly input: PointerInput;
  private readonly seeder = new UniformEmitter(DEFAULT_SEED);
  private readonly canvas: HTMLCanvasElement;
  private readonly resizeObserver: ResizeObserver;

  private rafId = 0;
  private lastTime = 0;
  private running = false;
  private cssWidth = 1;
  private cssHeight = 1;
  private statsListener: ((stats: EngineStats) => void) | null = null;
  private lastStatsEmit = 0;
  /** Reused context handed to the renderer/emitters (no per-frame alloc). */
  private readonly sharedCtx: FrameContext;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.sharedCtx = {
      dt: 0,
      time: 0,
      width: 1,
      height: 1,
      pointer: this.pointer,
      settings: this.settings,
      audio: this.audioLevels,
    };
    this.simulation = new Simulation(MAX_PARTICLES, this.settings, this.pointer, this.audioLevels);
    this.renderer = new Canvas2DRenderer(canvas);
    this.input = new PointerInput(canvas, this.pointer);

    this.simulation.addForce(new NoiseFlowForce());
    this.simulation.addForce(new GravityForce());
    this.simulation.addForce(new RepulsionForce());
    this.simulation.addForce(new VortexForce());
    this.simulation.addForce(new WindForce());
    this.simulation.addForce(new AttractorForce());
    this.simulation.addForce(new BoidsForce(MAX_PARTICLES));
    this.simulation.addForce(new AudioPulseForce());

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas);
    this.handleResize();
    this.reset();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  dispose(): void {
    this.stop();
    this.input.dispose();
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.audio.dispose();
  }

  /** Re-seeds all particles deterministically and clears trails. */
  reset(): void {
    const pool = this.simulation.pool;
    pool.setCount(this.settings.particleCount);
    this.seeder.seedRange(pool, this.frameContext(), 0, pool.count);
    this.renderer.clear();
  }

  /** Applies a partial settings update, handling side effects. */
  applySettings(patch: Partial<SimulationSettings>): void {
    const prevCount = this.settings.particleCount;
    Object.assign(this.settings, patch);

    if (patch.particleCount !== undefined && patch.particleCount !== prevCount) {
      const pool = this.simulation.pool;
      const oldCount = pool.count;
      pool.setCount(patch.particleCount);
      if (pool.count > oldCount) {
        this.seeder.seedRange(pool, this.frameContext(), oldCount, pool.count);
      }
    }
    if (patch.paletteId !== undefined) this.renderer.clear();
  }

  togglePause(): void {
    this.settings.paused = !this.settings.paused;
  }

  setForceEnabled(id: string, enabled: boolean): void {
    const force = this.simulation.getForce(id);
    if (force) force.enabled = enabled;
  }

  isForceEnabled(id: string): boolean {
    return this.simulation.getForce(id)?.enabled ?? false;
  }

  /** Snapshot of every registered force's enabled flag, for the UI. */
  getForceStates(): Record<string, boolean> {
    const states: Record<string, boolean> = {};
    for (const force of this.simulation.listForces()) {
      states[force.id] = force.enabled;
    }
    return states;
  }

  onStats(listener: ((stats: EngineStats) => void) | null): void {
    this.statsListener = listener;
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return;
    const delta = Math.min((now - this.lastTime) / 1000, 0.25);
    this.lastTime = now;

    this.audio.update(this.settings.audioSensitivity);
    this.simulation.update(delta);
    this.renderer.render(this.simulation.pool, this.frameContext());

    if (this.monitor.record(delta * 1000, now)) {
      this.applyRenderScale();
    }
    this.emitStats(now);
    this.rafId = requestAnimationFrame(this.frame);
  };

  private handleResize(): void {
    this.cssWidth = Math.max(1, this.canvas.clientWidth);
    this.cssHeight = Math.max(1, this.canvas.clientHeight);
    this.simulation.resize(this.cssWidth, this.cssHeight);
    this.applyRenderScale();
  }

  private applyRenderScale(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.renderer.resize(this.cssWidth, this.cssHeight, dpr, this.monitor.renderScale);
  }

  /** Returns the shared read-only frame context for seeding/rendering. */
  private frameContext(): FrameContext {
    this.sharedCtx.width = this.cssWidth;
    this.sharedCtx.height = this.cssHeight;
    return this.sharedCtx;
  }

  private emitStats(now: number): void {
    if (!this.statsListener || now - this.lastStatsEmit < 250) return;
    this.lastStatsEmit = now;
    this.statsListener({
      fps: Math.round(this.monitor.fps),
      frameTimeMs: this.monitor.frameTimeMs,
      particleCount: this.simulation.pool.count,
      renderScale: this.monitor.renderScale,
    });
  }
}
