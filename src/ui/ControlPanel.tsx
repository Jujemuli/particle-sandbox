import type { EngineStats, SimulationSettings } from '../engine/types';
import { PALETTES } from '../rendering/palettes';
import { PRESETS } from '../presets/presets';
import './ControlPanel.css';

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (v: number) => string;
  onChange: (value: number) => void;
}

function Slider({ label, min, max, step, value, format, onChange }: SliderProps) {
  return (
    <label className="cp-slider">
      <span className="cp-slider-label">
        {label}
        <span className="cp-slider-value">{format ? format(value) : value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export interface ControlPanelProps {
  settings: SimulationSettings;
  stats: EngineStats;
  visible: boolean;
  onChange: (patch: Partial<SimulationSettings>) => void;
  onPreset: (id: string) => void;
  onReset: () => void;
}

/**
 * Glassmorphism control panel. Purely declarative: it renders the current
 * settings snapshot and forwards patches upward; it never talks to the
 * engine directly.
 */
export function ControlPanel({
  settings,
  stats,
  visible,
  onChange,
  onPreset,
  onReset,
}: ControlPanelProps) {
  if (!visible) return null;

  return (
    <aside className="control-panel">
      <header className="cp-header">
        <h1>Chaos Engine</h1>
        <div className="cp-stats">
          <span>{stats.fps} fps</span>
          <span>{stats.frameTimeMs.toFixed(1)} ms</span>
          <span>{stats.particleCount.toLocaleString()} pts</span>
          <span>{Math.round(stats.renderScale * 100)}% res</span>
        </div>
      </header>

      <section className="cp-section">
        <h2>Presets</h2>
        <div className="cp-row">
          {PRESETS.map((preset) => (
            <button key={preset.id} onClick={() => onPreset(preset.id)}>
              {preset.label}
            </button>
          ))}
          <button onClick={onReset}>Reset</button>
        </div>
      </section>

      <section className="cp-section">
        <h2>Simulation</h2>
        <Slider
          label="Particles"
          min={1000}
          max={50000}
          step={1000}
          value={settings.particleCount}
          format={(v) => v.toLocaleString()}
          onChange={(v) => onChange({ particleCount: v })}
        />
        <Slider
          label="Speed"
          min={0.1}
          max={3}
          step={0.05}
          value={settings.speed}
          onChange={(v) => onChange({ speed: v })}
        />
        <Slider
          label="Drag"
          min={0}
          max={2}
          step={0.01}
          value={settings.drag}
          onChange={(v) => onChange({ drag: v })}
        />
      </section>

      <section className="cp-section">
        <h2>Forces</h2>
        <Slider
          label="Gravity"
          min={0}
          max={4}
          step={0.05}
          value={settings.gravityStrength}
          onChange={(v) => onChange({ gravityStrength: v })}
        />
        <Slider
          label="Repulsion"
          min={0}
          max={4}
          step={0.05}
          value={settings.repulsionStrength}
          onChange={(v) => onChange({ repulsionStrength: v })}
        />
      </section>

      <section className="cp-section">
        <h2>Rendering</h2>
        <Slider
          label="Glow"
          min={0.1}
          max={1}
          step={0.05}
          value={settings.glowIntensity}
          onChange={(v) => onChange({ glowIntensity: v })}
        />
        <Slider
          label="Trails"
          min={0}
          max={0.98}
          step={0.01}
          value={settings.trailLength}
          onChange={(v) => onChange({ trailLength: v })}
        />
        <Slider
          label="Size"
          min={0.5}
          max={4}
          step={0.1}
          value={settings.particleSize}
          onChange={(v) => onChange({ particleSize: v })}
        />
      </section>

      <section className="cp-section">
        <h2>Palette</h2>
        <div className="cp-row">
          {PALETTES.map((palette) => (
            <button
              key={palette.id}
              className={settings.paletteId === palette.id ? 'active' : ''}
              onClick={() => onChange({ paletteId: palette.id })}
            >
              {palette.label}
            </button>
          ))}
        </div>
      </section>

      <footer className="cp-footer">
        Drag to attract · Right-drag / Shift to repel · Scroll for strength
        <br />
        Space pause · R reset · G gravity · H hide UI
      </footer>
    </aside>
  );
}
