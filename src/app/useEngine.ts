import { useCallback, useEffect, useRef, useState } from 'react';
import { Engine } from '../engine/Engine';
import type { EngineStats, SimulationSettings } from '../engine/types';
import { PRESETS } from '../presets/presets';

const EMPTY_STATS: EngineStats = { fps: 0, frameTimeMs: 0, particleCount: 0, renderScale: 1 };

/**
 * Bridges the imperative {@link Engine} into React.
 *
 * The engine owns all per-frame state; React only holds a settings snapshot
 * (for controlled inputs) and throttled stats. Settings changes flow one
 * way: UI -> `applySettings` -> snapshot update.
 */
export function useEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<Engine | null>(null);
  const [settings, setSettings] = useState<SimulationSettings | null>(null);
  const [stats, setStats] = useState<EngineStats>(EMPTY_STATS);
  const [uiVisible, setUiVisible] = useState(true);
  const [forceStates, setForceStates] = useState<Record<string, boolean>>({});
  const [audioActive, setAudioActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new Engine(canvas);
    engineRef.current = engine;
    setSettings({ ...engine.settings });
    setForceStates(engine.getForceStates());
    engine.onStats(setStats);
    engine.start();
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [canvasRef]);

  const applySettings = useCallback((patch: Partial<SimulationSettings>) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.applySettings(patch);
    setSettings({ ...engine.settings });
  }, []);

  const applyPreset = useCallback(
    (id: string) => {
      const preset = PRESETS.find((p) => p.id === id);
      const engine = engineRef.current;
      if (!preset || !engine) return;
      applySettings(preset.settings);
      for (const forceId of Object.keys(engine.getForceStates())) {
        engine.setForceEnabled(forceId, preset.forces.includes(forceId));
      }
      setForceStates(engine.getForceStates());
      engine.reset();
    },
    [applySettings],
  );

  const reset = useCallback(() => {
    engineRef.current?.reset();
  }, []);

  const toggleForce = useCallback((id: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setForceEnabled(id, !engine.isForceEnabled(id));
    setForceStates(engine.getForceStates());
  }, []);

  const toggleMicrophone = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.audio.active) {
      engine.audio.disable();
      setAudioActive(false);
    } else {
      try {
        await engine.audio.enableMicrophone();
        setAudioActive(true);
      } catch {
        setAudioActive(false);
      }
    }
  }, []);

  const loadAudioFile = useCallback(async (file: File) => {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      await engine.audio.loadFile(file);
      setAudioActive(true);
    } catch {
      setAudioActive(false);
    }
  }, []);

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          engineRef.current?.togglePause();
          break;
        case 'KeyR':
          reset();
          break;
        case 'KeyG':
          toggleForce('gravity');
          break;
        case 'KeyV':
          toggleForce('vortex');
          break;
        case 'KeyN':
          toggleForce('noiseFlow');
          break;
        case 'KeyO':
          toggleForce('orbit');
          break;
        case 'KeyA':
          void toggleMicrophone();
          break;
        case 'KeyH':
          setUiVisible((v) => !v);
          break;
        default: {
          // Digit presets: 1..9 map onto the preset list.
          if (e.code.startsWith('Digit')) {
            const index = Number(e.code.slice(5)) - 1;
            const preset = PRESETS[index];
            if (preset) applyPreset(preset.id);
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [applyPreset, reset, toggleForce, toggleMicrophone]);

  return {
    settings,
    stats,
    uiVisible,
    forceStates,
    audioActive,
    applySettings,
    applyPreset,
    reset,
    toggleForce,
    toggleMicrophone,
    loadAudioFile,
  };
}
