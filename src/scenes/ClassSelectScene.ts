import Phaser from 'phaser';
import { MODE_CLASS_LABEL, STAGE_NAMES, StageId } from '../data/content';
import { CHAR_IDLE_FRAME, TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';

const SCENE_W = 576;
const SCENE_H = 432;

export class ClassSelectScene extends Phaser.Scene {
  constructor() {
    super('ClassSelectScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#261712');
    this.fitViewport(this.scale.width, this.scale.height);

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.fitViewport(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
    });

    // 宮廷金磚暗紋底圖
    for (let y = -4; y < 22; y++) {
      for (let x = -6; x < 30; x++) {
        this.add
          .image(
            x * TILE_SIZE + 12,
            y * TILE_SIZE + 12,
            'palace_tiles',
            (x + y) % 2 === 0
              ? TileIndex.HALL_GOLD_BRICK_A
              : TileIndex.HALL_GOLD_BRICK_B
          )
          .setAlpha(0.38);
      }
    }

    this.add
      .rectangle(SCENE_W / 2, 38, SCENE_W - 96, 46, 0x731912, 0.96)
      .setStrokeStyle(3, 0xe8ba4b);

    this.add
      .text(SCENE_W / 2, 38, `${MODE_CLASS_LABEL} — 請點選要探索的朝代`, {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '19px',
        color: '#ffe48a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const cards: {
      id: StageId;
      sprite: string;
      bg: number;
      desc: string;
    }[] = [
      {
        id: 'kangxi',
        sprite: 'char_kangxi_emperor',
        bg: 0x295948,
        desc: '外庭・蓮池・太和殿院'
      },
      {
        id: 'yongzheng',
        sprite: 'char_yongzheng_emperor',
        bg: 0x6b2c23,
        desc: '丹墀・勤政大殿・國庫'
      },
      {
        id: 'qianlong',
        sprite: 'char_qianlong_emperor',
        bg: 0x2c4b6b,
        desc: '校場・旱田・江南碼頭'
      }
    ];

    const pickStage = (stageId: StageId) => {
      gameState.selectClassStage(stageId);
      this.scene.start('OpeningScene', {
        stageName: STAGE_NAMES[stageId]
      });
    };

    cards.forEach((c, idx) => {
      const cx = 112 + idx * 176;
      const cy = 196;
      const done = gameState.completedClassStages.has(c.id);

      const card = this.add
        .rectangle(cx, cy, 158, 214, c.bg, 0.96)
        .setStrokeStyle(3, done ? 0x6ee6a8 : 0xe8ba4b)
        .setInteractive({ useHandCursor: true });

      card.on('pointerdown', () => pickStage(c.id));

      const emp = this.add
        .sprite(cx, cy - 34, c.sprite, CHAR_IDLE_FRAME.down)
        .setScale(2.2);
      emp.play(`${c.sprite}_down`);

      this.add
        .text(cx, cy + 36, STAGE_NAMES[c.id], {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '14.5px',
          color: '#fff8e7',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      this.add
        .text(cx, cy + 62, c.desc, {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '12px',
          color: '#e8dec8'
        })
        .setOrigin(0.5);

      if (done) {
        this.add
          .text(cx, cy + 88, '✓ 已完成本關', {
            fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
            fontSize: '13px',
            color: '#98ffd0',
            fontStyle: 'bold'
          })
          .setOrigin(0.5);
      }
    });

    const ui = this.registry.get('ui') as HudUI;
    ui.setNavigationHandlers({
      onGoTitle: () => this.scene.start('TitleScene')
    });
    ui.renderClassSelectScreen(
      (stageId) => pickStage(stageId),
      () => this.scene.start('TitleScene')
    );
  }

  private fitViewport(w: number, h: number): void {
    const cam = this.cameras.main;
    const rawZoom = Math.min(w / SCENE_W, h / SCENE_H);
    const zoom = rawZoom >= 1 ? Math.max(1, Math.floor(rawZoom)) : rawZoom;
    cam.setZoom(zoom);
    cam.centerOn(SCENE_W / 2, SCENE_H / 2 + 16);
  }
}
