import Phaser from 'phaser';
import { MODE_CLASS_LABEL, STAGE_NAMES, StageId } from '../data/content';
import { CHAR_HD_SCALE, toCssSize } from '../gfx/CrispVisuals';
import { CHAR_IDLE_FRAME, TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';
import { stopOtherScenes } from './exclusiveScene';

const SCENE_W = 576;
const SCENE_H = 432;

export class ClassSelectScene extends Phaser.Scene {
  constructor() {
    super('ClassSelectScene');
  }

  public create(): void {
    stopOtherScenes(this);

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
        fontSize: '19px',
        color: '#ffe89e',
        fontStyle: 'bold',
        stroke: '#2e0b06',
        strokeThickness: 3
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

    let picking = false;
    const pickStage = (stageId: StageId) => {
      if (picking) return;
      picking = true;
      gameState.selectClassStage(stageId);
      this.scene.start('OpeningScene', {
        stageName: STAGE_NAMES[stageId]
      });
    };

    this.input.setTopOnly(false);

    const cardHitBoxes: { id: StageId; cx: number; cy: number; w: number; h: number }[] =
      [];

    cards.forEach((c, idx) => {
      const cx = 112 + idx * 176;
      const cy = 196;
      const done = gameState.completedClassStages.has(c.id);

      const card = this.add
        .rectangle(cx, cy, 170, 232, c.bg, 0.96)
        .setStrokeStyle(3, done ? 0x6ee6a8 : 0xe8ba4b)
        .setInteractive({ useHandCursor: true });

      card.on('pointerdown', () => pickStage(c.id));

      const emp = this.add
        .sprite(cx, cy - 32, c.sprite, CHAR_IDLE_FRAME.down)
        .setScale(2.36 / CHAR_HD_SCALE)
        .setDepth(5);
      emp.play(`${c.sprite}_down`);
      emp.setInteractive(
        new Phaser.Geom.Rectangle(
          -40 * CHAR_HD_SCALE,
          -52 * CHAR_HD_SCALE,
          80 * CHAR_HD_SCALE,
          96 * CHAR_HD_SCALE
        ),
        Phaser.Geom.Rectangle.Contains
      );
      emp.input!.cursor = 'pointer';
      emp.on('pointerdown', () => pickStage(c.id));

      const pad = this.add
        .rectangle(cx, cy, 178, 240, 0xffffff, 0.001)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });
      pad.on('pointerdown', () => pickStage(c.id));

      cardHitBoxes.push({ id: c.id, cx, cy, w: 178, h: 240 });

      this.add
        .text(cx, cy + 40, STAGE_NAMES[c.id], {
          fontSize: '15px',
          color: '#fff9ed',
          fontStyle: 'bold',
          stroke: '#1c100a',
          strokeThickness: 2.5
        })
        .setOrigin(0.5)
        .setDepth(7);

      this.add
        .text(cx, cy + 66, c.desc, {
          fontSize: '12.5px',
          color: '#f5efe2',
          fontStyle: 'bold',
          stroke: '#1c100a',
          strokeThickness: 2
        })
        .setOrigin(0.5)
        .setDepth(7);

      if (done) {
        this.add
          .text(cx, cy + 91, '✓ 已完成本關', {
            fontSize: '13px',
            color: '#98ffd0',
            fontStyle: 'bold',
            stroke: '#123324',
            strokeThickness: 2.5
          })
          .setOrigin(0.5)
          .setDepth(7);
      }
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      for (const box of cardHitBoxes) {
        if (
          Math.abs(w.x - box.cx) <= box.w / 2 &&
          Math.abs(w.y - box.cy) <= box.h / 2
        ) {
          pickStage(box.id);
          return;
        }
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

    this.time.delayedCall(0, () => {
      if (this.scene.isActive()) {
        this.fitViewport(this.scale.width, this.scale.height);
      }
    });
  }

  private fitViewport(gameW: number, gameH: number): void {
    const { width: w, height: h, dpr } = toCssSize(gameW, gameH);
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
    const cssZoom = rawZoom >= 1 ? Math.max(1, Math.floor(rawZoom)) : rawZoom;
    cam.setZoom(cssZoom * dpr);

    const safeCenterScreenY = (8 + safeBottom) / 2;
    const camWorldY = Math.round(
      SCENE_H / 2 + 8 + (h / 2 - safeCenterScreenY) / cssZoom
    );
    cam.centerOn(SCENE_W / 2, camWorldY);
  }
}
