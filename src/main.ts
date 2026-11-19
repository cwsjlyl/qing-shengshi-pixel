import Phaser from 'phaser';
import './style.css';
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

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-canvas-host',
  width: initialSize.width,
  height: initialSize.height,
  backgroundColor: '#1a100c',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  antialiasGL: false,
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
 * Still resize when the painted size actually changes.
 */
function syncGameToVisualViewport(): void {
  const { width, height } = readViewportSize();
  if (game.scale.width !== width || game.scale.height !== height) {
    game.scale.resize(width, height);
  }
  // refresh/updateBounds even when size is unchanged — clears stale page offsets
  game.scale.refresh();
}

window.addEventListener('resize', syncGameToVisualViewport);
window.addEventListener('orientationchange', () => {
  window.setTimeout(syncGameToVisualViewport, 50);
  window.setTimeout(syncGameToVisualViewport, 250);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncGameToVisualViewport);
  window.visualViewport.addEventListener('scroll', syncGameToVisualViewport);
}

