import type { PointerState } from '../engine/types';
import { clamp } from '../shared/math';

/**
 * Normalizes mouse, touch and pen events into the shared {@link PointerState}.
 *
 * - Left press / touch: attraction.
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

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.element.setPointerCapture(e.pointerId);
    this.state.active = true;
    this.state.x = e.clientX;
    this.state.y = e.clientY;
    this.updateMode(e.buttons);
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    this.state.x = e.clientX;
    this.state.y = e.clientY;
    if (this.state.active) this.updateMode(e.buttons);
  };

  private readonly onPointerUp = (): void => {
    this.state.active = false;
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
    this.shiftHeld = false;
  };
}
