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

    // iPad: allow taps on overlapping card / doll hit pads
    this.input.setTopOnly(false);

    cards.forEach((c, idx) => {
      const cx = 112 + idx * 176;
      const cy = 196;
      const done = gameState.completedClassStages.has(c.id);

      const card = this.add
        .rectangle(cx, cy, 170, 230, c.bg, 0.96)
        .setStrokeStyle(3, done ? 0x6ee6a8 : 0xe8ba4b)
        .setInteractive({ useHandCursor: true });

      card.on('pointerdown', () => pickStage(c.id));

      const emp = this.add
        .sprite(cx, cy - 34, c.sprite, CHAR_IDLE_FRAME.down)
        .setScale(2.2)
        .setDepth(5);
      emp.play(`${c.sprite}_down`);
      emp.setInteractive(
        new Phaser.Geom.Rectangle(-28, -40, 56, 72),
        Phaser.Geom.Rectangle.Contains
      );
      emp.input!.cursor = 'pointer';
      emp.on('pointerdown', () => pickStage(c.id));

      // Extra generous pad over whole card (covers doll + labels)
      const pad = this.add
        .rectangle(cx, cy, 178, 240, 0xffffff, 0.001)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      pad.on('pointerdown', () => pickStage(c.id));

      this.add
        .text(cx, cy + 36, STAGE_NAMES[c.id], {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '14.5px',
          color: '#fff8e7',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(7);

      this.add
        .text(cx, cy + 62, c.desc, {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '12px',
          color: '#e8dec8'
        })
        .setOrigin(0.5)
        .setDepth(7);

      if (done) {
        this.add
          .text(cx, cy + 88, '✓ 已完成本關', {
            fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
            fontSize: '13px',
            color: '#98ffd0',
            fontStyle: 'bold'
          })
          .setOrigin(0.5)
          .setDepth(7);
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

    // Re-fit after dock HTML mounts so cards stay above the dock on iPad
    this.time.delayedCall(0, () => {
      if (this.scene.isActive()) {
        this.fitViewport(this.scale.width, this.scale.height);
      }
    });
  }

  private fitViewport(w: number, h: number): void {
    const cam = this.cameras.main;
    const dock = document.querySelector<HTMLElement>(
      '#hud-main-layer .class-select-dock'
    );
    const dockRect = dock?.getBoundingClientRect();
    const dockTop =
      dockRect && dockRect.height > 0 ? dockRect.top : h - 120;
    const safeBottom = Math.max(180, Math.min(h - 4, dockTop - 8));
    const availH = Math.max(180, safeBottom - 8);

    const rawZoom = Math.min(w / SCENE_W, availH / SCENE_H);
    const zoom = rawZoom >= 1 ? Math.max(1, Math.floor(rawZoom)) : rawZoom;
    cam.setZoom(zoom);

    // Keep cards centred in the safe band above the dock
    const safeCenterScreenY = (8 + safeBottom) / 2;
    const camWorldY = Math.round(
      SCENE_H / 2 + 8 + (h / 2 - safeCenterScreenY) / zoom
    );
    cam.centerOn(SCENE_W / 2, camWorldY);
  }
}
