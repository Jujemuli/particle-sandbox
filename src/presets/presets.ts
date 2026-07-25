import type { SimulationSettings } from '../engine/types';

/**
 * A preset is pure data: a settings patch plus force enable flags. Presets
 * are applied through the same `applySettings` / `setForceEnabled` paths as
 * the UI, so adding one never touches engine code.
 */
export interface Preset {
  id: string;
  label: string;
  settings: Partial<SimulationSettings>;
  /** Force ids to enable; every force not listed is disabled. */
  forces: string[];
}

export const PRESETS: Preset[] = [
  {
    id: 'flow',
    label: 'Flow',
    settings: {
      particleCount: 10_000,
      speed: 1,
      drag: 0.35,
      turbulence: 1,
      trailLength: 0.85,
      glowIntensity: 0.8,
      particleSize: 1.6,
      paletteId: 'aurora',
    },
    forces: ['noiseFlow', 'gravity', 'repulsion', 'audio'],
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    settings: {
      particleCount: 20_000,
      speed: 1.1,
      drag: 0.05,
      vortexStrength: 1.7,
      turbulence: 0.15,
      trailLength: 0.9,
      glowIntensity: 0.85,
      particleSize: 1.1,
      paletteId: 'cosmic',
    },
    forces: ['vortex', 'noiseFlow', 'repulsion', 'audio'],
  },
  {
    id: 'aurora',
    label: 'Aurora',
    settings: {
      particleCount: 14_000,
      speed: 0.45,
      drag: 0.6,
      turbulence: 1.3,
      windStrength: 0.5,
      trailLength: 0.94,
      glowIntensity: 0.9,
      particleSize: 2.2,
      paletteId: 'aurora',
    },
    forces: ['noiseFlow', 'wind', 'gravity', 'repulsion', 'audio'],
  },
  {
    id: 'nebula',
    label: 'Nebula',
    settings: {
      particleCount: 24_000,
      speed: 0.3,
      drag: 0.8,
      turbulence: 0.8,
      trailLength: 0.9,
      glowIntensity: 1,
      particleSize: 2.6,
      paletteId: 'sunset',
    },
    forces: ['noiseFlow', 'gravity', 'repulsion', 'audio'],
  },
  {
    id: 'plasma',
    label: 'Plasma',
    settings: {
      particleCount: 12_000,
      speed: 2.2,
      drag: 0.15,
      turbulence: 3.2,
      trailLength: 0.7,
      glowIntensity: 1,
      particleSize: 1.4,
      paletteId: 'neon',
    },
    forces: ['noiseFlow', 'gravity', 'repulsion', 'audio'],
  },
  {
    id: 'swarm',
    label: 'Swarm',
    settings: {
      particleCount: 8_000,
      speed: 1,
      drag: 0.08,
      turbulence: 0.25,
      trailLength: 0.75,
      glowIntensity: 0.75,
      particleSize: 1.5,
      paletteId: 'ocean',
    },
    forces: ['boids', 'noiseFlow', 'repulsion', 'audio'],
  },
  {
    id: 'orbit',
    label: 'Orbit',
    settings: {
      particleCount: 16_000,
      speed: 1,
      drag: 0.1,
      turbulence: 0.1,
      trailLength: 0.92,
      glowIntensity: 0.85,
      particleSize: 1.2,
      paletteId: 'ice',
    },
    forces: ['orbit', 'noiseFlow', 'repulsion', 'audio'],
  },
  {
    id: 'rain',
    label: 'Rain',
    settings: {
      particleCount: 12_000,
      speed: 1.5,
      drag: 0.25,
      turbulence: 0.4,
      windStrength: 2.4,
      trailLength: 0.8,
      glowIntensity: 0.7,
      particleSize: 1.1,
      paletteId: 'monochrome',
    },
    forces: ['wind', 'noiseFlow', 'repulsion', 'audio'],
  },
];
