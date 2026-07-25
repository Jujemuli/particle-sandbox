import type { SimulationSettings } from '../engine/types';

/**
 * A preset is a named partial settings patch. Presets never reach into the
 * engine — they are applied through the same `applySettings` path as the UI,
 * so new presets are pure data.
 */
export interface Preset {
  id: string;
  label: string;
  settings: Partial<SimulationSettings>;
}

export const PRESETS: Preset[] = [
  {
    id: 'flow',
    label: 'Flow',
    settings: {
      particleCount: 10_000,
      speed: 1,
      drag: 0.35,
      trailLength: 0.85,
      glowIntensity: 0.8,
      particleSize: 1.6,
      paletteId: 'aurora',
    },
  },
  {
    id: 'gravity',
    label: 'Gravity',
    settings: {
      particleCount: 14_000,
      speed: 1.2,
      drag: 0.12,
      gravityStrength: 1.6,
      trailLength: 0.92,
      glowIntensity: 0.9,
      particleSize: 1.3,
      paletteId: 'cosmic',
    },
  },
];
