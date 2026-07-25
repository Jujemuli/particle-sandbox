import { MAX_POINTERS, type PointerState } from '../engine/types';
import { clamp } from '../shared/math';

/**
 * Normalizes mouse, touch and pen events into the shared {@link PointerState}.
 *
 * - Left press / touch: attraction. Every simultaneous touch becomes its own
 *   force center (multitouch gravity wells).
 * - Right press or Shift+press: repulsion.
 * - Wheel: adjusts force strength.
 *
 * Event handlers only mutate the state object; the simulation consumes it
 * during fixed steps, so event floods have no per-event cost.
 */
export class PointerInput {
  private readonly element: HTMLElement;
  private readonly state: PointerState;
  private readonly abort = new AbortController();
  private shiftHeld = false;
  private lastButtons = 0;
  /** pointerId of each active contact slot (parallel to state.px/py). */
  private readonly ids = new Int32Array(MAX_POINTERS).fill(-1);

  constructor(element: HTMLElement, state: PointerState) {
    this.element = element;
    this.state = state;
    const opts = { signal: this.abort.signal };

    element.addEventListener('pointerdown', this.onPointerDown, opts);
    element.addEventListener('pointermove', this.onPointerMove, opts);
    window.addEventListener('pointerup', this.onPointerUp, opts);
    window.addEventListener('pointercancel', this.onPointerUp, opts);
    element.addEventListener('wheel', this.onWheel, { ...opts, passive: false });
    element.addEventListener('contextmenu', (e) => e.preventDefault(), opts);
    window.addEventListener('keydown', this.onKey, opts);
    window.addEventListener('keyup', this.onKey, opts);
    window.addEventListener('blur', this.onBlur, opts);
  }

  dispose(): void {
    this.abort.abort();
  }

  private updateMode(buttons: number): void {
    this.lastButtons = buttons;
    this.state.mode = (buttons & 2) !== 0 || this.shiftHeld ? 'repel' : 'attract';
  }

  private slotOf(pointerId: number): number {
    for (let i = 0; i < this.state.count; i++) {
      if (this.ids[i] === pointerId) return i;
    }
    return -1;
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.element.setPointerCapture(e.pointerId);
    const s = this.state;
    if (this.slotOf(e.pointerId) === -1 && s.count < MAX_POINTERS) {
      const slot = s.count++;
      this.ids[slot] = e.pointerId;
      s.px[slot] = e.clientX;
      s.py[slot] = e.clientY;
    }
    s.active = s.count > 0;
    s.x = e.clientX;
    s.y = e.clientY;
    this.updateMode(e.buttons);
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    const s = this.state;
    s.x = e.clientX;
    s.y = e.clientY;
    const slot = this.slotOf(e.pointerId);
    if (slot !== -1) {
      s.px[slot] = e.clientX;
      s.py[slot] = e.clientY;
    }
    if (s.active) this.updateMode(e.buttons);
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    const s = this.state;
    const slot = this.slotOf(e.pointerId);
    if (slot !== -1) {
      // Swap-remove to keep active contacts as a dense prefix.
      const last = --s.count;
      this.ids[slot] = this.ids[last];
      s.px[slot] = s.px[last];
      s.py[slot] = s.py[last];
      this.ids[last] = -1;
    }
    s.active = s.count > 0;
  };

  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.11;
    this.state.strength = clamp(this.state.strength * factor, 0.1, 8);
  };

  private readonly onKey = (e: KeyboardEvent): void => {
    this.shiftHeld = e.shiftKey;
    if (this.state.active) this.updateMode(this.lastButtons);
  };

  private readonly onBlur = (): void => {
    this.state.active = false;
    this.state.count = 0;
    this.ids.fill(-1);
    this.shiftHeld = false;
  };
}
