import { useRef } from 'react';
import { useEngine } from './useEngine';
import { ControlPanel } from '../ui/ControlPanel';
import './App.css';

/**
 * Application shell: a fullscreen canvas driven by the engine plus the
 * overlay control panel. All simulation work happens outside React.
 */
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
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
  } = useEngine(canvasRef);

  return (
    <div className="app">
      <canvas ref={canvasRef} className="stage" />
      <div className="vignette" aria-hidden />
      {settings && (
        <ControlPanel
          settings={settings}
          stats={stats}
          visible={uiVisible}
          forceStates={forceStates}
          audioActive={audioActive}
          onToggleForce={toggleForce}
          onToggleMicrophone={() => void toggleMicrophone()}
          onAudioFile={(file) => void loadAudioFile(file)}
          onChange={applySettings}
          onPreset={applyPreset}
          onReset={reset}
        />
      )}
    </div>
  );
}
