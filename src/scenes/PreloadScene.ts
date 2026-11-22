import Phaser from 'phaser';
import { ClassroomAssetPipeline } from '../art/ClassroomAssetPipeline';
import { TITLE } from '../data/content';
import { toCssSize } from '../gfx/CrispVisuals';
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

    const { width, height, dpr } = toCssSize(this.scale.width, this.scale.height);
    this.cameras.main.setBackgroundColor('#1e120d');
    this.cameras.main.setZoom(dpr);
    this.cameras.main.centerOn(width / 2, height / 2);

    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const cardW = Math.min(392, Math.max(296, width - 32));

    this.add
      .rectangle(cx, cy, cardW, 116, 0x3b2017, 1)
      .setStrokeStyle(3, 0xe8ba4b);

    this.add
      .text(cx, cy - 27, TITLE, {
        fontSize: '20px',
        color: '#ffe48a',
        fontStyle: 'bold',
        stroke: '#260d08',
        strokeThickness: 2.5
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(cx, cy + 4, '正在載入課堂像素圖集…… 0%', {
        fontSize: '14px',
        color: '#fff8ec',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const barW = cardW - 56;
    this.barInnerWidth = barW - 4;

    this.add
      .rectangle(cx, cy + 35, barW, 10, 0x22110c, 1)
      .setStrokeStyle(1, 0x9e7b36);

    this.progressFill = this.add
      .rectangle(cx - barW / 2 + 2, cy + 35, 4, 6, 0xf2c138, 1)
      .setOrigin(0, 0.5);

    this.load.on('progress', (val: number) => {
      const pct = Math.round(val * 80);
      this.updateProgressUI(val * 0.8, `正在載入課堂像素圖集…… ${pct}%`);
    });

    // 載入原創圖集、學校外觀與角色表（優先使用無損 WebP 並支援 PNG 斷線保底重試）
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
