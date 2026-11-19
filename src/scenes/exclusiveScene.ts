import type Phaser from 'phaser';
import type { HudUI } from '../ui/HudUI';

/**
 * Phaser `game.scene.start(key)` does NOT stop other active scenes.
 * Only `this.scene.start(key)` from inside a scene shuts that scene down.
 * If Title/Opening/another minigame stay active, their cameras keep painting
 * and emperor/title handlers can open 「穿越清朝盛世」 over a minigame.
 * Call this at the start of each exclusive scene's create().
 */
export function stopOtherScenes(self: Phaser.Scene): void {
  const mine = self.scene.key;
  for (const sc of self.scene.manager.getScenes(true)) {
    const key = sc.scene.key;
    if (key !== mine) {
      self.scene.stop(key);
    }
  }
}

/** Drop leftover Title / Opening HTML if still in #hud-main-layer. */
export function clearStaleTitleOrOpeningHud(self: Phaser.Scene): void {
  const ui = self.registry.get('ui') as HudUI | undefined;
  if (!ui) return;
  const main = document.getElementById('hud-main-layer');
  if (!main) return;
  const stale =
    !!main.querySelector('.title-dock') ||
    !!main.querySelector('#btn-start-stage') ||
    !!main.querySelector('#btn-seq') ||
    !!main.querySelector('#btn-class') ||
    (main.textContent || '').includes('穿越清朝盛世') ||
    (main.textContent || '').includes('進入關卡探索');
  if (stale) {
    ui.clearMainOverlay();
  }
}
