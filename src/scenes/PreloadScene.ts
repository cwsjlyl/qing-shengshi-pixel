import Phaser from 'phaser';
import { OriginalArtLoader } from '../art/OriginalArtLoader';
import { TITLE } from '../data/content';
import { PixelArtGenerator } from '../gfx/PixelArtGenerator';
import { HudUI } from '../ui/HudUI';

export class PreloadScene extends Phaser.Scene {
  private progressFill?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('PreloadScene');
  }

  public preload(): void {
    const ui = this.registry.get('ui') as HudUI;
    ui.clearMainOverlay();
    ui.setNavigationHandlers({});

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1e120d');

    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const cardW = Math.min(380, Math.max(290, width - 32));

    this.add
      .rectangle(cx, cy, cardW, 112, 0x3b2017, 1)
      .setStrokeStyle(3, 0xe8ba4b);

    this.add
      .text(cx, cy - 26, TITLE, {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '19px',
        color: '#ffe48a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 4, '正在載入原創清代宮苑與江南像素圖檔……', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '13.5px',
        color: '#f5efe2'
      })
      .setOrigin(0.5);

    const barW = cardW - 56;
    this.add
      .rectangle(cx, cy + 34, barW, 10, 0x22110c, 1)
      .setStrokeStyle(1, 0x9e7b36);

    this.progressFill = this.add
      .rectangle(cx - barW / 2 + 2, cy + 34, 4, 6, 0xf2c138, 1)
      .setOrigin(0, 0.5);

    this.load.on('progress', (val: number) => {
      if (this.progressFill) {
        this.progressFill.width = Math.max(4, Math.floor((barW - 4) * val));
      }
    });

    // 載入 public/assets/ 下四張原創 PNG 圖集與角色表
    OriginalArtLoader.preloadAssets(this);
  }

  public create(): void {
    // 1. 先建立基底保底貼圖，確保所有既有鍵值齊備
    PixelArtGenerator.generateAll(this);

    // 2. 將已載入的原創 PNG 去棋盤格、內縮避格線，覆寫為高細節圖塊表、立體建築物件與五類角色四向動畫
    OriginalArtLoader.buildAllFromLoadedAssets(this);

    this.scene.start('TitleScene');
  }
}
