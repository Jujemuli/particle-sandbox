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
  const { settings, stats, uiVisible, applySettings, applyPreset, reset } = useEngine(canvasRef);

  return (
    <div className="app">
      <canvas ref={canvasRef} className="stage" />
      <div className="vignette" aria-hidden />
      {settings && (
        <ControlPanel
          settings={settings}
          stats={stats}
          visible={uiVisible}
          onChange={applySettings}
          onPreset={applyPreset}
          onReset={reset}
        />
      )}
    </div>
  );
}
