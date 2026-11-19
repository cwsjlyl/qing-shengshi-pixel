import type Phaser from 'phaser';

/**
 * Convert browser client coordinates to scene world space using a FRESH
 * canvas.getBoundingClientRect(). Survives iPad visualViewport scroll,
 * stale Phaser canvasBounds, and CSS canvas stretch.
 */
export function clientToWorld(
  scene: Phaser.Scene,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const canvas = scene.game.canvas;
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, rect.width);
  const cssH = Math.max(1, rect.height);
  const localX = ((clientX - rect.left) / cssW) * scene.scale.width;
  const localY = ((clientY - rect.top) / cssH) * scene.scale.height;
  return scene.cameras.main.getWorldPoint(localX, localY);
}

/** Inverse: world → client (for playtests / HUD layout checks). */
export function worldToClient(
  scene: Phaser.Scene,
  worldX: number,
  worldY: number
): { x: number; y: number } {
  const canvas = scene.game.canvas;
  const rect = canvas.getBoundingClientRect();
  const cam = scene.cameras.main;
  const screenX = (worldX - cam.midPoint.x) * cam.zoom + cam.width / 2;
  const screenY = (worldY - cam.midPoint.y) * cam.zoom + cam.height / 2;
  const cssW = Math.max(1, rect.width);
  const cssH = Math.max(1, rect.height);
  return {
    x: rect.left + (screenX / scene.scale.width) * cssW,
    y: rect.top + (screenY / scene.scale.height) * cssH
  };
}
