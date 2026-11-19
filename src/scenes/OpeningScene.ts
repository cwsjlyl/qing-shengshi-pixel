import Phaser from 'phaser';
import { OPENING_TASK, STAGE_NAMES } from '../data/content';
import { CHAR_IDLE_FRAME, TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';
import { stopOtherScenes } from './exclusiveScene';

const SCENE_W = 576;
const SCENE_H = 432;

export class OpeningScene extends Phaser.Scene {
  constructor() {
    super('OpeningScene');
  }

  public create(data?: { stageName?: string }): void {
    stopOtherScenes(this);
    this.cameras.main.setBackgroundColor('#1b1629');
    this.fitViewport(this.scale.width, this.scale.height);

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.fitViewport(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
      // Never leave 「穿越清朝盛世」 over a later scene
      const main = document.getElementById('hud-main-layer');
      if (main?.querySelector('#btn-start-stage') || main?.querySelector('.dialogue-modal')) {
        const ui = this.registry.get('ui') as HudUI;
        ui.clearMainOverlay();
      }
    });

    const g = this.add.graphics();
    g.fillStyle(0x211b33, 1);
    g.fillRect(-500, -400, SCENE_W + 1000, SCENE_H + 800);

    // 左側現代香港天際線剪影
    const skyline = [
      [34, 118, 36, 134],
      [76, 86, 44, 166],
      [126, 128, 34, 124]
    ];
    for (const [bx, by, bw, bh] of skyline) {
      g.fillStyle(0x3a4a66, 1);
      g.fillRect(bx, by, bw, bh);
      g.fillStyle(0xffe48a, 0.85);
      for (let wy = by + 10; wy < by + bh - 12; wy += 16) {
        g.fillRect(bx + 7, wy, 7, 7);
        if (bw > 38) {
          g.fillRect(bx + 22, wy, 7, 7);
        }
      }
    }

    // 中央金色時空長橋
    g.fillStyle(0xf2c144, 0.24);
    g.fillRect(162, 206, 208, 34);
    g.fillStyle(0xffe694, 0.62);
    g.fillRect(162, 217, 208, 12);

    // 右側清代紫禁宮門與琉璃瓦城樓
    for (let i = 0; i < 6; i++) {
      const px = 384 + i * TILE_SIZE + 12;
      this.add.image(px, 122, 'palace_tiles', TileIndex.ROOF_GOLD_RIDGE);
      this.add.image(px, 146, 'palace_tiles', TileIndex.ROOF_GOLD_SLOPE);
      this.add.image(px, 170, 'palace_tiles', TileIndex.ROOF_EAVE_GOLD);
      this.add.image(px, 194, 'palace_tiles', TileIndex.RED_WALL_FRIEZE);
      this.add.image(px, 218, 'palace_tiles', TileIndex.RED_WALL_BASE);
      this.add.image(px, 242, 'palace_tiles', TileIndex.MARBLE_PATH_A);
    }
    this.add.image(384 + 2 * TILE_SIZE + 12, 218, 'palace_tiles', TileIndex.GATE_DOOR_LEFT);
    this.add.image(384 + 3 * TILE_SIZE + 12, 218, 'palace_tiles', TileIndex.GATE_DOOR_RIGHT);

    // 學生穿越動畫
    const traveler = this.add
      .sprite(180, 216, 'char_student', CHAR_IDLE_FRAME.right)
      .setScale(1.5);
    traveler.play('char_student_right');
    this.tweens.add({
      targets: traveler,
      x: 356,
      duration: 2600,
      repeat: -1
    });

    // 上方任務牌匾
    const banner = this.add.graphics();
    banner.fillStyle(0x6e1812, 0.95);
    banner.fillRect(42, 20, SCENE_W - 84, 54);
    banner.lineStyle(3, 0xe8ba4b, 1);
    banner.strokeRect(42, 20, SCENE_W - 84, 54);

    this.add
      .text(SCENE_W / 2, 47, OPENING_TASK, {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '17px',
        color: '#fff6db',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const stageLabel = data?.stageName || STAGE_NAMES[gameState.currentStage];
    const ui = this.registry.get('ui') as HudUI;
    ui.setNavigationHandlers({
      onGoTitle: () => this.scene.start('TitleScene'),
      onGoClassSelect:
        gameState.mode === 'class'
          ? () => this.scene.start('ClassSelectScene')
          : undefined
    });
    ui.renderOpeningScreen(stageLabel, () => {
      this.scene.start('ExploreScene');
    });
  }

  private fitViewport(w: number, h: number): void {
    const cam = this.cameras.main;
    const rawZoom = Math.min(w / SCENE_W, h / SCENE_H);
    const zoom = rawZoom >= 1 ? Math.max(1, Math.floor(rawZoom)) : rawZoom;
    cam.setZoom(zoom);
    cam.centerOn(SCENE_W / 2, SCENE_H / 2 + 24);
  }
}
