import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#1a100c');
    this.scene.start('PreloadScene');
  }
}
