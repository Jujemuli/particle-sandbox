/** Smoothed band levels, each normalized to roughly 0..1. */
export interface AudioLevels {
  bass: number;
  mid: number;
  high: number;
  /** Overall loudness. */
  level: number;
  /** True while a source (mic or file) is connected. */
  active: boolean;
}

/** Band split points in Hz. */
const BASS_MAX = 250;
const MID_MAX = 2000;
const HIGH_MAX = 8000;

const FFT_SIZE = 1024;
/** Per-band attack/decay smoothing (higher = snappier). */
const ATTACK = 0.55;
const DECAY = 0.12;

/**
 * WebAudio frequency analyzer for microphone or uploaded audio files.
 *
 * Produces smoothed bass/mid/high levels with fast attack and slow decay so
 * beats feel punchy while the visualization never flickers. The instance
 * mutates a caller-owned {@link AudioLevels} object, letting the engine share
 * one reference with every frame context at zero per-frame cost.
 */
export class AudioAnalyzer {
  private readonly levels: AudioLevels;
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private bins: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private micStream: MediaStream | null = null;
  private sourceNode: AudioNode | null = null;
  private audioElement: HTMLAudioElement | null = null;

  constructor(levels: AudioLevels) {
    this.levels = levels;
  }

  get active(): boolean {
    return this.levels.active;
  }

  /** Requests microphone access and starts analysis. */
  async enableMicrophone(): Promise<void> {
    this.disable();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = this.ensureContext();
    this.micStream = stream;
    this.sourceNode = context.createMediaStreamSource(stream);
    this.sourceNode.connect(this.getAnalyser());
    this.levels.active = true;
  }

  /** Plays an uploaded audio file and analyzes it (audible). */
  async loadFile(file: File): Promise<void> {
    this.disable();
    const context = this.ensureContext();
    const element = new Audio(URL.createObjectURL(file));
    element.loop = true;
    this.audioElement = element;
    const source = context.createMediaElementSource(element);
    source.connect(this.getAnalyser());
    source.connect(context.destination);
    this.sourceNode = source;
    await element.play();
    this.levels.active = true;
  }

  /** Stops all sources and zeroes the levels. */
  disable(): void {
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    if (this.audioElement) {
      this.audioElement.pause();
      URL.revokeObjectURL(this.audioElement.src);
      this.audioElement = null;
    }
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this.levels.active = false;
    this.levels.bass = this.levels.mid = this.levels.high = this.levels.level = 0;
  }

  dispose(): void {
    this.disable();
    this.context?.close();
    this.context = null;
  }

  /** Reads the FFT and updates the shared levels. Call once per frame. */
  update(sensitivity: number): void {
    const analyser = this.analyser;
    if (!analyser || !this.levels.active) return;
    analyser.getByteFrequencyData(this.bins);

    const nyquist = (this.context?.sampleRate ?? 44100) / 2;
    const hzPerBin = nyquist / this.bins.length;
    const bassEnd = Math.min(Math.ceil(BASS_MAX / hzPerBin), this.bins.length);
    const midEnd = Math.min(Math.ceil(MID_MAX / hzPerBin), this.bins.length);
    const highEnd = Math.min(Math.ceil(HIGH_MAX / hzPerBin), this.bins.length);

    const bass = this.bandAverage(1, bassEnd) * sensitivity;
    const mid = this.bandAverage(bassEnd, midEnd) * sensitivity;
    const high = this.bandAverage(midEnd, highEnd) * sensitivity * 1.6;

    const l = this.levels;
    l.bass = this.smooth(l.bass, Math.min(bass, 1.5));
    l.mid = this.smooth(l.mid, Math.min(mid, 1.5));
    l.high = this.smooth(l.high, Math.min(high, 1.5));
    l.level = (l.bass + l.mid + l.high) / 3;
  }

  private smooth(current: number, target: number): number {
    return current + (target - current) * (target > current ? ATTACK : DECAY);
  }

  private bandAverage(start: number, end: number): number {
    if (end <= start) return 0;
    let sum = 0;
    for (let i = start; i < end; i++) sum += this.bins[i];
    return sum / ((end - start) * 255);
  }

  private ensureContext(): AudioContext {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  private getAnalyser(): AnalyserNode {
    if (!this.analyser) {
      const context = this.ensureContext();
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.4;
      this.bins = new Uint8Array(this.analyser.frequencyBinCount);
    }
    return this.analyser;
  }
}
