import Phaser from 'phaser';
import { MODE_CLASS_LABEL, STAGES, STAGE_NAMES, StageId } from '../data/content';
import { CHAR_HD_SCALE, toCssSize } from '../gfx/CrispVisuals';
import { CHAR_IDLE_FRAME, TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { MEDAL_LABELS, gameState } from '../state/gameState';
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
    const bgRt = this.add
      .renderTexture(-6 * TILE_SIZE, -4 * TILE_SIZE, 36 * TILE_SIZE, 26 * TILE_SIZE)
      .setOrigin(0, 0)
      .setAlpha(0.38);
    bgRt.beginDraw();
    for (let y = -4; y < 22; y++) {
      for (let x = -6; x < 30; x++) {
        bgRt.batchDrawFrame(
          'palace_tiles',
          (x + y) % 2 === 0
            ? TileIndex.HALL_GOLD_BRICK_A
            : TileIndex.HALL_GOLD_BRICK_B,
          (x + 6) * TILE_SIZE,
          (y + 4) * TILE_SIZE
        );
      }
    }
    bgRt.endDraw();

    this.add
      .rectangle(SCENE_W / 2, 38, SCENE_W - 84, 46, 0x731912, 0.96)
      .setStrokeStyle(3, 0xe8ba4b);

    const headerTitle = gameState.isAllClassStagesCompleted()
      ? `${MODE_CLASS_LABEL} — 三朝全通關！可於下方領取史官證書`
      : `${MODE_CLASS_LABEL} — 請點選要探索的朝代`;

    this.add
      .text(SCENE_W / 2, 38, headerTitle, {
        fontSize: '18px',
        color: '#ffe89e',
        fontStyle: 'bold',
        stroke: '#2e0b06',
        strokeThickness: 3
      })
      .setOrigin(0.5);

    const ui = this.registry.get('ui') as HudUI;

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
      if (picking || ui.isModalOpen) return;
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
        .rectangle(cx, cy, 170, 236, c.bg, 0.96)
        .setStrokeStyle(3, done ? 0x6ee6a8 : 0xe8ba4b)
        .setInteractive({ useHandCursor: true });

      card.on('pointerdown', () => pickStage(c.id));

      const emp = this.add
        .sprite(cx, cy - 34, c.sprite, CHAR_IDLE_FRAME.down)
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
        .text(cx, cy + 38, STAGE_NAMES[c.id], {
          fontSize: '15px',
          color: '#fff9ed',
          fontStyle: 'bold',
          stroke: '#1c100a',
          strokeThickness: 2.5
        })
        .setOrigin(0.5)
        .setDepth(7);

      this.add
        .text(cx, cy + 63, c.desc, {
          fontSize: '12.5px',
          color: '#f5efe2',
          fontStyle: 'bold',
          stroke: '#1c100a',
          strokeThickness: 2
        })
        .setOrigin(0.5)
        .setDepth(7);

      const firstMgId = STAGES[c.id].minigames[0]?.id;
      const medal = firstMgId ? gameState.minigameMedals[firstMgId] : undefined;

      if (done) {
        this.add
          .text(cx, cy + 90, medal ? `✓ ${MEDAL_LABELS[medal]}` : '✓ 已完成本關', {
            fontSize: '12px',
            color: '#98ffd0',
            fontStyle: 'bold',
            stroke: '#123324',
            strokeThickness: 2.5
          })
          .setOrigin(0.5)
          .setDepth(7);
      } else if (medal) {
        this.add
          .text(cx, cy + 90, MEDAL_LABELS[medal], {
            fontSize: '11.5px',
            color: '#ffe48a',
            fontStyle: 'bold',
            stroke: '#241508',
            strokeThickness: 2
          })
          .setOrigin(0.5)
          .setDepth(7);
      }
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (ui.isModalOpen) return;
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

    ui.setNavigationHandlers({
      onGoTitle: () => this.scene.start('TitleScene'),
      onResetSave: () => this.scene.restart()
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
