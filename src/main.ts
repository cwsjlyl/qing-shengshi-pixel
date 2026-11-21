import Phaser from 'phaser';
import './art/assetUrl';
import './style.css';
import { getCanvasDpr, installCrispChineseTextPatch } from './gfx/CrispVisuals';
import { ArcheryMinigame } from './minigames/ArcheryMinigame';
import { SouthernTourMinigame } from './minigames/SouthernTourMinigame';
import { TalentMinigame } from './minigames/TalentMinigame';
import { WhackMinigame } from './minigames/WhackMinigame';
import { BootScene } from './scenes/BootScene';
import { ClassSelectScene } from './scenes/ClassSelectScene';
import { ExploreScene } from './scenes/ExploreScene';
import { OpeningScene } from './scenes/OpeningScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { HudUI } from './ui/HudUI';

// 啟動前安裝繁體中文字 4x 高解析平滑渲染修補
installCrispChineseTextPatch();

const ui = new HudUI('hud-overlay');

/** iPad Safari: prefer visualViewport so Phaser size matches the painted canvas. */
function readViewportSize(): { width: number; height: number } {
  const vv = window.visualViewport;
  if (vv && vv.width > 0 && vv.height > 0) {
    return {
      width: Math.max(1, Math.floor(vv.width)),
      height: Math.max(1, Math.floor(vv.height))
    };
  }
  return {
    width: Math.max(1, Math.floor(window.innerWidth)),
    height: Math.max(1, Math.floor(window.innerHeight))
  };
}

const initialSize = readViewportSize();
const initialDpr = getCanvasDpr();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-canvas-host',
  width: Math.max(1, Math.floor(initialSize.width * initialDpr)),
  height: Math.max(1, Math.floor(initialSize.height * initialDpr)),
  backgroundColor: '#1a100c',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  antialiasGL: false,
  loader: {
    maxParallelDownloads: 4
  },
  input: {
    activePointers: 3,
    smoothFactor: 0
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  callbacks: {
    preBoot: (game) => {
      game.registry.set('ui', ui);
    }
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    OpeningScene,
    ClassSelectScene,
    ExploreScene,
    TalentMinigame,
    WhackMinigame,
    ArcheryMinigame,
    SouthernTourMinigame
  ]
};

const game = new Phaser.Game(config);

/**
 * Always refresh cached canvasBounds (iPad Safari visualViewport can scroll /
 * offset without a size change; stale bounds make touches miss the boat).
 * Render backing buffer at Retina DPR (up to 2x) while CSS stays 100% viewport.
 */
function syncGameToVisualViewport(): void {
  const { width, height } = readViewportSize();
  const dpr = getCanvasDpr();
  const targetW = Math.max(1, Math.floor(width * dpr));
  const targetH = Math.max(1, Math.floor(height * dpr));
  if (game.scale.width !== targetW || game.scale.height !== targetH) {
    game.scale.resize(targetW, targetH);
  }
  // refresh/updateBounds even when size is unchanged — syncs displayScale & page offsets
  game.scale.refresh();
}

window.requestAnimationFrame(syncGameToVisualViewport);
window.addEventListener('resize', syncGameToVisualViewport);
window.addEventListener('orientationchange', () => {
  window.setTimeout(syncGameToVisualViewport, 50);
  window.setTimeout(syncGameToVisualViewport, 250);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncGameToVisualViewport);
  window.visualViewport.addEventListener('scroll', syncGameToVisualViewport);
}

// 正式部署環境啟用課堂離線與二次秒開快取（兼容 Google Sites iframe 權限防護）
if (window.__CLASSROOM_PROD__ && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Ignore Service Worker restriction in private browsing or cross-origin iframes
      });
    } catch {
      // Ignore synchronous SecurityError in restricted iframes
    }
  });
}
