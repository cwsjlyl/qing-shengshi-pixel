import Phaser from 'phaser';
import { ClassroomAssetPipeline } from '../art/ClassroomAssetPipeline';
import { TITLE } from '../data/content';
import { HudUI } from '../ui/HudUI';

export class PreloadScene extends Phaser.Scene {
  private progressFill?: Phaser.GameObjects.Rectangle;
  private statusText?: Phaser.GameObjects.Text;
  private barInnerWidth = 240;

  constructor() {
    super('PreloadScene');
  }

  public preload(): void {
    document.getElementById('boot-splash')?.remove();

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

    this.statusText = this.add
      .text(cx, cy + 4, '正在載入課堂像素圖集…… 0%', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '13.5px',
        color: '#f5efe2'
      })
      .setOrigin(0.5);

    const barW = cardW - 56;
    this.barInnerWidth = barW - 4;

    this.add
      .rectangle(cx, cy + 34, barW, 10, 0x22110c, 1)
      .setStrokeStyle(1, 0x9e7b36);

    this.progressFill = this.add
      .rectangle(cx - barW / 2 + 2, cy + 34, 4, 6, 0xf2c138, 1)
      .setOrigin(0, 0.5);

    this.load.on('progress', (val: number) => {
      const pct = Math.round(val * 80);
      this.updateProgressUI(val * 0.8, `正在載入課堂像素圖集…… ${pct}%`);
    });

    // 載入原創圖集與角色表（優先使用無損 WebP 並支援 PNG 斷線保底重試）
    ClassroomAssetPipeline.preloadAssets(this);
  }

  public create(): void {
    void ClassroomAssetPipeline.buildAllTexturesStaged(this, (ratio, status) => {
      this.updateProgressUI(ratio, status);
    }).then(() => {
      if (this.sys.isActive()) {
        this.scene.start('TitleScene');
      }
    });
  }

  private updateProgressUI(ratio: number, status: string): void {
    const clamped = Math.max(0, Math.min(1, ratio));
    if (this.progressFill) {
      this.progressFill.width = Math.max(4, Math.floor(this.barInnerWidth * clamped));
    }
    if (this.statusText) {
      this.statusText.setText(status);
    }
  }
}
