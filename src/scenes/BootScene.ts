import Phaser from 'phaser';
import { detectWebpSupport } from '../art/assetUrl';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#1a100c');
    void detectWebpSupport().finally(() => {
      if (this.sys.isActive()) {
        this.scene.start('PreloadScene');
      }
    });
  }
}
