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
import { gameState } from './state/gameState';

const ui = new HudUI('hud-overlay');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-canvas-host',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a100c',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  antialiasGL: false,
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
