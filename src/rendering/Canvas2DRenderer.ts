import type { ParticlePool } from '../engine/ParticlePool';
import type { Renderer } from '../engine/Renderer';
import type { FrameContext } from '../engine/types';
import { buildGlowSprites, SPRITE_COUNT } from './GlowSprites';
import { getPalette, type Palette } from './palettes';

/**
 * Canvas 2D renderer with additive glow and fading trails.
 *
 * Performance strategy:
 * - Particles are blitted from pre-rendered glow sprites (no per-frame
 *   gradients or paths).
 * - Trails come from partially clearing the persistent canvas with the
 *   background color each frame instead of storing history.
 * - Additive blending (`lighter`) creates light interactions where glows
 *   overlap.
 * - An internal `renderScale` lets adaptive quality lower resolution under
 *   load without affecting simulation space.
 */
export class Canvas2DRenderer implements Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private sprites: HTMLCanvasElement[] = [];
  private palette: Palette;
  private paletteId = '';
  private glowIntensity = -1;
  /** Combined DPR * renderScale factor mapping CSS px -> device px. */
  private pixelScale = 1;
  private needsClear = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.palette = getPalette('');
  }

  resize(cssWidth: number, cssHeight: number, dpr: number, renderScale: number): void {
    this.pixelScale = dpr * renderScale;
    const w = Math.max(1, Math.round(cssWidth * this.pixelScale));
    const h = Math.max(1, Math.round(cssHeight * this.pixelScale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.needsClear = true;
    }
  }

  render(pool: ParticlePool, frame: FrameContext): void {
    const { ctx } = this;
    const { settings } = frame;
    this.ensureSprites(settings.paletteId, settings.glowIntensity);

    const scale = this.pixelScale;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Fade the previous frame toward the background to form trails.
    ctx.globalCompositeOperation = 'source-over';
    if (this.needsClear) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.palette.background;
      ctx.fillRect(0, 0, w, h);
      this.needsClear = false;
    } else {
      // trailLength 0 -> full clear, 1 -> very slow fade.
      const fade = 1 - Math.min(settings.trailLength, 0.98) ** 0.5;
      ctx.globalAlpha = Math.max(fade, 0.02);
      ctx.fillStyle = this.palette.background;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // Additive particle pass. Audio modulates size (bass swells) and
    // shifts colors around the palette (highs), keeping visuals musical.
    ctx.globalCompositeOperation = 'lighter';
    const { x, y, scale: pScale, shade, count } = pool;
    const sprites = this.sprites;
    const audio = frame.audio;
    const sizeBoost = audio.active ? 1 + audio.bass * 0.6 : 1;
    const shadeShift = audio.active ? audio.high * 0.5 : 0;
    const baseSize = settings.particleSize * 4 * scale * sizeBoost;
    const maxShade = SPRITE_COUNT - 1;

    for (let i = 0; i < count; i++) {
      const size = baseSize * pScale[i];
      const dx = x[i] * scale - size / 2;
      const dy = y[i] * scale - size / 2;
      // Viewport culling: skip sprites fully outside the canvas.
      if (dx + size < 0 || dx > w || dy + size < 0 || dy > h) continue;
      const sprite = sprites[(((shade[i] + shadeShift) % 1) * maxShade) | 0];
      ctx.drawImage(sprite, dx, dy, size, size);
    }
  }

  clear(): void {
    this.needsClear = true;
  }

  dispose(): void {
    this.sprites = [];
  }

  /** Rebuilds sprites only when palette or glow settings change. */
  private ensureSprites(paletteId: string, glowIntensity: number): void {
    if (this.paletteId === paletteId && this.glowIntensity === glowIntensity) return;
    this.palette = getPalette(paletteId);
    this.sprites = buildGlowSprites(this.palette, glowIntensity);
    this.paletteId = paletteId;
    this.glowIntensity = glowIntensity;
    this.needsClear = true;
  }
}
