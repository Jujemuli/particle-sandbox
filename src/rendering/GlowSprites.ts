import type { Palette } from './palettes';

/** Number of pre-rendered color sprites sampled across the palette. */
export const SPRITE_COUNT = 24;
/** Base sprite texture size in device pixels (drawn scaled per particle). */
const SPRITE_SIZE = 64;

/**
 * Pre-renders soft radial-gradient glow sprites for a palette.
 *
 * Creating gradients per particle per frame is prohibitively slow, so we
 * bake `SPRITE_COUNT` offscreen canvases once per palette / glow change and
 * blit them with `drawImage`, which is the fastest Canvas 2D path.
 */
export function buildGlowSprites(palette: Palette, glowIntensity: number): HTMLCanvasElement[] {
  const sprites: HTMLCanvasElement[] = [];
  const stops = palette.stops;

  for (let i = 0; i < SPRITE_COUNT; i++) {
    const t = i / (SPRITE_COUNT - 1);
    // Sample the palette with linear interpolation between stops.
    const pos = t * (stops.length - 1);
    const idx = Math.min(Math.floor(pos), stops.length - 2);
    const f = pos - idx;
    const a = stops[idx];
    const b = stops[idx + 1];
    const h = a.h + (b.h - a.h) * f;
    const s = a.s + (b.s - a.s) * f;
    const l = a.l + (b.l - a.l) * f;

    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_SIZE;
    canvas.height = SPRITE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to acquire 2d context for sprite');

    const half = SPRITE_SIZE / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    const core = Math.min(l + 30, 100);
    const glow = 0.55 * glowIntensity;
    gradient.addColorStop(0, `hsla(${h}, ${s}%, ${core}%, 1)`);
    gradient.addColorStop(0.25, `hsla(${h}, ${s}%, ${l}%, ${0.8 * glowIntensity + 0.15})`);
    gradient.addColorStop(0.6, `hsla(${h}, ${s}%, ${l}%, ${glow * 0.35})`);
    gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    sprites.push(canvas);
  }

  return sprites;
}
