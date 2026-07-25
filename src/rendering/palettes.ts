/**
 * Color palettes. Each palette is a list of HSL stops; the renderer samples
 * them across the 0..1 `shade` value of each particle.
 */
export interface PaletteStop {
  h: number;
  s: number;
  l: number;
}

export interface Palette {
  id: string;
  label: string;
  stops: PaletteStop[];
  /** Background color used for trail fading. */
  background: string;
}

export const PALETTES: Palette[] = [
  {
    id: 'ocean',
    label: 'Ocean',
    stops: [
      { h: 190, s: 95, l: 62 },
      { h: 205, s: 90, l: 58 },
      { h: 225, s: 85, l: 60 },
      { h: 170, s: 80, l: 55 },
    ],
    background: '#020610',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    stops: [
      { h: 140, s: 90, l: 55 },
      { h: 170, s: 85, l: 55 },
      { h: 260, s: 80, l: 62 },
      { h: 300, s: 70, l: 58 },
    ],
    background: '#030308',
  },
  {
    id: 'cosmic',
    label: 'Cosmic',
    stops: [
      { h: 265, s: 85, l: 62 },
      { h: 290, s: 80, l: 58 },
      { h: 220, s: 90, l: 62 },
      { h: 330, s: 75, l: 60 },
    ],
    background: '#050208',
  },
  {
    id: 'fire',
    label: 'Fire',
    stops: [
      { h: 10, s: 95, l: 55 },
      { h: 30, s: 100, l: 55 },
      { h: 45, s: 100, l: 60 },
      { h: 0, s: 85, l: 50 },
    ],
    background: '#080202',
  },
  {
    id: 'neon',
    label: 'Neon Cyberpunk',
    stops: [
      { h: 180, s: 100, l: 55 },
      { h: 315, s: 100, l: 60 },
      { h: 265, s: 95, l: 62 },
      { h: 55, s: 100, l: 60 },
    ],
    background: '#040108',
  },
];

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
