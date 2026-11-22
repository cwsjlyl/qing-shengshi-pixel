import Phaser from 'phaser';
import { OriginalArtLoader } from '../art/OriginalArtLoader';
import { ClassroomAssetPipeline } from '../art/ClassroomAssetPipeline';
import {
  SCHOOL_EXTERIOR_DATA_URI,
  SCHOOL_EXTERIOR_KEY
} from '../art/schoolExteriorUri';
import {
  enhanceAllCharacterTexturesCached,
  restoreIntactSchoolboySheet
} from '../gfx/CrispVisuals';
import { PixelArtGenerator } from '../gfx/PixelArtGenerator';
import { extractAllCharacterPortraits } from '../ui/portraitAndCert';
import { HudUI } from '../ui/HudUI';
import { startExclusiveScene } from './exclusiveScene';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const ui = this.registry.get('ui') as HudUI | undefined;
    ui?.renderLoadingProgress(0.05, '正在連接清宮檔案館...');

    ClassroomAssetPipeline.attachWebpPreferenceWithPngFallback(this);
    OriginalArtLoader.preloadAssets(this);
    this.load.image(SCHOOL_EXTERIOR_KEY, SCHOOL_EXTERIOR_DATA_URI);

    this.load.on('progress', (val: number) => {
      ui?.renderLoadingProgress(
        0.05 + val * 0.65,
        `載入原創歷史像素素材（${Math.round(val * 100)}%）`
      );
    });
  }

  async create(): Promise<void> {
    const ui = this.registry.get('ui') as HudUI | undefined;
    ui?.renderLoadingProgress(0.75, '正在組裝高清地磚與清宮人物圖集...');

    await new Promise<void>((r) => setTimeout(r, 16));

    if (this.textures.exists(SCHOOL_EXTERIOR_KEY)) {
      this.textures
        .get(SCHOOL_EXTERIOR_KEY)
        .setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    PixelArtGenerator.generateAll(this);
    OriginalArtLoader.buildAllFromLoadedAssets(this);
    restoreIntactSchoolboySheet(this);

    ui?.renderLoadingProgress(0.9, '正在啟用 4x 高清角色貼圖快取...');
    await enhanceAllCharacterTexturesCached(this);

    extractAllCharacterPortraits(this);
    ui?.renderLoadingProgress(1, '準備就緒！');

    const canvas = this.game.canvas;
    if (canvas) {
      canvas.style.imageRendering = 'pixelated';
    }

    startExclusiveScene(this, 'TitleScene');
  }
}
