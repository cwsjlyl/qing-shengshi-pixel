import Phaser from 'phaser';
import { clientToWorld } from './pointerMap';

export type RawPointerHandlers = {
  onDown?: (worldX: number, worldY: number, clientX: number, clientY: number) => void;
  onMove?: (worldX: number, worldY: number, clientX: number, clientY: number) => void;
  onUp?: (worldX: number, worldY: number, clientX: number, clientY: number) => void;
};

/** HUD / chrome that must keep receiving real taps (do not steal for game). */
const HUD_BLOCK_SELECTOR = [
  'button',
  'input',
  'a',
  'textarea',
  'select',
  'label',
  '.pixel-btn',
  '.settings-fab',
  '.joystick-zone',
  '.interact-zone',
  '.minigame-bar-actions',
  '.class-select-dock',
  '.hud-interact-btn',
  '#btn-mg-retry',
  '#btn-mg-leave',
  '#btn-class',
  '#btn-settings'
].join(',');

function isHudControlTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(HUD_BLOCK_SELECTOR);
}

/**
 * Window-capture touch/pointer bridge for iPad Safari when an HTML overlay
 * sits above the Phaser canvas (backdrop-filter / stacking context quirks).
 * Converts with fresh getBoundingClientRect → world via pointerMap.
 * Dedupes so one finger does not fire both touch* and pointer* handlers.
 */
export function bindRawPointerBridge(
  scene: Phaser.Scene,
  handlers: RawPointerHandlers
): () => void {
  let activePointerId: number | null = null;
  let activeTouchId: number | null = null;
  /** Ignore pointer events that duplicate an active touch gesture. */
  let touchOwnsGesture = false;

  const emit = (
    kind: 'down' | 'move' | 'up',
    clientX: number,
    clientY: number
  ): void => {
    if (!scene.sys.isActive()) return;
    const w = clientToWorld(scene, clientX, clientY);
    if (kind === 'down') handlers.onDown?.(w.x, w.y, clientX, clientY);
    else if (kind === 'move') handlers.onMove?.(w.x, w.y, clientX, clientY);
    else handlers.onUp?.(w.x, w.y, clientX, clientY);
  };

  const onTouchStart = (ev: TouchEvent): void => {
    if (isHudControlTarget(ev.target)) return;
    if (activeTouchId !== null) return;
    const t = ev.changedTouches[0];
    if (!t) return;
    activeTouchId = t.identifier;
    touchOwnsGesture = true;
    emit('down', t.clientX, t.clientY);
  };

  const onTouchMove = (ev: TouchEvent): void => {
    if (activeTouchId === null) return;
    for (let i = 0; i < ev.changedTouches.length; i++) {
      const t = ev.changedTouches[i];
      if (t.identifier === activeTouchId) {
        emit('move', t.clientX, t.clientY);
        break;
      }
    }
  };

  const endTouch = (ev: TouchEvent): void => {
    if (activeTouchId === null) return;
    for (let i = 0; i < ev.changedTouches.length; i++) {
      const t = ev.changedTouches[i];
      if (t.identifier === activeTouchId) {
        emit('up', t.clientX, t.clientY);
        activeTouchId = null;
        window.setTimeout(() => {
          touchOwnsGesture = false;
        }, 80);
        break;
      }
    }
  };

  const onPointerDown = (ev: PointerEvent): void => {
    if (touchOwnsGesture || activeTouchId !== null) return;
    if (isHudControlTarget(ev.target)) return;
    if (activePointerId !== null) return;
    activePointerId = ev.pointerId;
    emit('down', ev.clientX, ev.clientY);
  };

  const onPointerMove = (ev: PointerEvent): void => {
    if (touchOwnsGesture || activeTouchId !== null) return;
    if (activePointerId === null || ev.pointerId !== activePointerId) return;
    if ((ev.buttons & 1) === 0 && ev.pointerType === 'mouse') return;
    emit('move', ev.clientX, ev.clientY);
  };

  const onPointerUp = (ev: PointerEvent): void => {
    if (touchOwnsGesture || activeTouchId !== null) return;
    if (activePointerId === null || ev.pointerId !== activePointerId) return;
    activePointerId = null;
    emit('up', ev.clientX, ev.clientY);
  };

  const opts: AddEventListenerOptions = { capture: true, passive: true };
  window.addEventListener('touchstart', onTouchStart, opts);
  window.addEventListener('touchmove', onTouchMove, opts);
  window.addEventListener('touchend', endTouch, opts);
  window.addEventListener('touchcancel', endTouch, opts);
  window.addEventListener('pointerdown', onPointerDown, opts);
  window.addEventListener('pointermove', onPointerMove, opts);
  window.addEventListener('pointerup', onPointerUp, opts);
  window.addEventListener('pointercancel', onPointerUp, opts);

  const cleanup = (): void => {
    window.removeEventListener('touchstart', onTouchStart, true);
    window.removeEventListener('touchmove', onTouchMove, true);
    window.removeEventListener('touchend', endTouch, true);
    window.removeEventListener('touchcancel', endTouch, true);
    window.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', onPointerUp, true);
    activePointerId = null;
    activeTouchId = null;
    touchOwnsGesture = false;
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
  return cleanup;
}
