import Phaser from 'phaser';
import {
  HD_PROPS_ATLAS_KEY,
  PALACE_TILES_HD_KEY,
  PropStampFrame
} from '../art/OriginalArtLoader';
import {
  SCHOOL_EXTERIOR_KEY,
  ensureSchoolExteriorTexture
} from '../art/schoolExteriorUri';
import { OPENING_TASK, STAGE_NAMES, StageId } from '../data/content';
import { CHAR_HD_SCALE, toCssSize } from '../gfx/CrispVisuals';
import { CHAR_IDLE_FRAME, TileIndex } from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';
import { stopOtherScenes } from './exclusiveScene';

const SCENE_W = 576;
const SCENE_H = 432;

const VORTEX_OUTER_KEY = 'opening_vortex_outer_tex';
const VORTEX_INNER_KEY = 'opening_vortex_inner_tex';

interface VortexSpark {
  dot: Phaser.GameObjects.Arc;
  angle: number;
  radius: number;
  speed: number;
}

export class OpeningScene extends Phaser.Scene {
  private stageLabel = STAGE_NAMES.kangxi;
  private traveler!: Phaser.GameObjects.Sprite;
  private travelerBaseScale = 1.48 / CHAR_HD_SCALE;
  private vortexOuter!: Phaser.GameObjects.Image;
  private vortexInner!: Phaser.GameObjects.Image;
  private vortexCoreRing!: Phaser.GameObjects.Arc;
  private landingRipple!: Phaser.GameObjects.Ellipse;
  private vortexSparks: VortexSpark[] = [];
  private elapsedCutsceneMs = 0;

  private readonly vortexCenterX = 288;
  private readonly vortexCenterY = 168;

  constructor() {
    super('OpeningScene');
  }

  public create(data?: { stageName?: string }): void {
    stopOtherScenes(this);

    this.stageLabel = data?.stageName || STAGE_NAMES[gameState.currentStage];
    const stageId: StageId = gameState.currentStage;
    this.elapsedCutsceneMs = 0;
    this.vortexSparks = [];

    this.cameras.main.setBackgroundColor('#120c1c');
    this.cameras.main.setRoundPixels(true);

    ensureSchoolExteriorTexture(this);
    this.ensureVortexTextures();

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.fitViewport(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
      const main = document.getElementById('hud-main-layer');
      if (
        main?.querySelector('#btn-start-stage') ||
        main?.querySelector('.dialogue-modal')
      ) {
        const ui = this.registry.get('ui') as HudUI;
        ui.clearMainOverlay();
      }
    });

    // 1. 深邃時空背景底層
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x130d21, 1);
    bg.fillRect(-500, -400, SCENE_W + 1000, SCENE_H + 800);

    // 2. 頂部核心探究問題牌匾
    const banner = this.add.graphics().setDepth(30);
    banner.fillStyle(0x6e1812, 0.96);
    banner.fillRect(28, 12, SCENE_W - 56, 46);
    banner.lineStyle(2.5, 0xe8ba4b, 1);
    banner.strokeRect(28, 12, SCENE_W - 56, 46);

    this.add
      .text(SCENE_W / 2, 35, OPENING_TASK, {
        fontSize: '16px',
        color: '#fff8e7',
        fontStyle: 'bold',
        stroke: '#2a0b07',
        strokeThickness: 2.5
      })
      .setOrigin(0.5)
      .setDepth(31);

    // 3. 左邊：現代學校場景（彩雲聖若瑟小學真實像素外觀）
    this.buildLeftSchoolScene();

    // 4. 右邊：清朝盛世場景（康熙庭院／雍正大殿／乾隆江南與皇宮）
    this.buildRightQingScene(stageId);

    // 5. 中間：旋轉黑色時空旋渦
    this.buildCenterBlackVortex();

    // 6. 主角由學校場景經過黑色旋渦旋轉跌入清朝
    const studentTex = this.textures.get('char_student');
    const fw = studentTex?.get(0)?.width ?? 128;
    this.travelerBaseScale = fw >= 120 ? 1.48 / CHAR_HD_SCALE : 1.48;

    this.landingRipple = this.add
      .ellipse(422, 226, 34, 12, 0xf2ca52, 0)
      .setStrokeStyle(2, 0xffe484, 0.85)
      .setAlpha(0)
      .setDepth(18);

    this.traveler = this.add
      .sprite(112, 208, 'char_student', CHAR_IDLE_FRAME.right)
      .setOrigin(0.5, 0.52)
      .setScale(this.travelerBaseScale)
      .setDepth(24);
    this.traveler.play('char_student_right');

    const ui = this.registry.get('ui') as HudUI;
    ui.setNavigationHandlers({
      onGoTitle: () => this.scene.start('TitleScene'),
      onGoClassSelect:
        gameState.mode === 'class'
          ? () => this.scene.start('ClassSelectScene')
          : undefined
    });
    ui.renderOpeningScreen(this.stageLabel, () => {
      this.scene.start('ExploreScene');
    });

    this.fitViewport(this.scale.width, this.scale.height);
    this.time.delayedCall(0, () => {
      if (this.scene.isActive()) {
        this.fitViewport(this.scale.width, this.scale.height);
      }
    });
  }

  public update(_time: number, delta: number): void {
    const dt = Math.min(64, delta);
    this.elapsedCutsceneMs += dt;

    if (this.vortexOuter) {
      this.vortexOuter.rotation += dt * 0.0024;
    }
    if (this.vortexInner) {
      this.vortexInner.rotation += dt * 0.0048;
      const pulse = 1 + Math.sin(this.elapsedCutsceneMs * 0.005) * 0.05;
      this.vortexInner.setScale(pulse);
    }
    if (this.vortexCoreRing) {
      const coreScale = 1 + Math.cos(this.elapsedCutsceneMs * 0.0065) * 0.06;
      this.vortexCoreRing.setScale(coreScale);
    }

    for (const sp of this.vortexSparks) {
      sp.angle += sp.speed * (dt / 16.67);
      sp.radius -= 0.42 * (dt / 16.67);
      if (sp.radius < 10) {
        sp.radius = 62 + (sp.angle % 14);
      }
      const ratio = Math.min(1, sp.radius / 68);
      sp.dot.setPosition(
        this.vortexCenterX + Math.cos(sp.angle) * sp.radius,
        this.vortexCenterY + Math.sin(sp.angle) * sp.radius * 0.86
      );
      sp.dot.setAlpha(0.2 + (1 - ratio) * 0.7);
    }

    this.updateTravelerVortexJourney();
  }

  private updateTravelerVortexJourney(): void {
    if (!this.traveler) return;

    const cycleMs = 4400;
    const t = (this.elapsedCutsceneMs % cycleMs) / cycleMs;
    const S = this.travelerBaseScale;

    if (t < 0.27) {
      const p = t / 0.27;
      const ease = p * p * (3 - 2 * p);
      const x = Phaser.Math.Linear(108, 228, ease);
      const y =
        Phaser.Math.Linear(210, 194, ease) -
        Math.abs(Math.sin(p * Math.PI * 3)) * 4;
      this.traveler.setPosition(x, y);
      this.traveler.setRotation(0);
      this.traveler.setScale(S);
      this.traveler.setAlpha(1);
      if (this.traveler.anims.currentAnim?.key !== 'char_student_right') {
        this.traveler.play('char_student_right', true);
      }
      this.landingRipple.setAlpha(0);
      return;
    }

    if (t < 0.57) {
      const p = (t - 0.27) / 0.3;
      const spiralRadius = (1 - p) * 58;
      const spiralTheta = Math.PI * 0.88 + p * Math.PI * 3.4;
      const cx =
        Phaser.Math.Linear(234, this.vortexCenterX, Math.pow(p, 0.72)) +
        Math.cos(spiralTheta) * spiralRadius * 0.42;
      const cy =
        Phaser.Math.Linear(192, this.vortexCenterY, Math.pow(p, 0.72)) +
        Math.sin(spiralTheta) * spiralRadius * 0.48;

      this.traveler.setPosition(cx, cy);
      this.traveler.setRotation(p * Math.PI * 7);
      const shrink = Math.max(0.1, 1 - Math.pow(p, 1.35) * 0.9);
      this.traveler.setScale(S * shrink);
      this.traveler.setAlpha(
        p > 0.84 ? Math.max(0.08, 1 - (p - 0.84) / 0.16) : 1
      );
      this.landingRipple.setAlpha(0);
      return;
    }

    if (t < 0.85) {
      const p = (t - 0.57) / 0.28;
      const easeOut = 1 - Math.pow(1 - p, 2.2);
      const x = Phaser.Math.Linear(this.vortexCenterX + 8, 422, easeOut);

      let y: number;
      if (p < 0.78) {
        const fp = p / 0.78;
        const arcLift = Math.sin(fp * Math.PI) * 34;
        y =
          Phaser.Math.Linear(this.vortexCenterY - 4, 210, fp * fp) - arcLift;
      } else {
        const bp = (p - 0.78) / 0.22;
        y = 210 - Math.sin(bp * Math.PI) * 9;
      }

      const remainSpin = Math.pow(1 - p, 1.65) * Math.PI * 4;
      const grow = 0.14 + 0.86 * Math.min(1, Math.pow(p, 0.58));

      this.traveler.setPosition(x, y);
      this.traveler.setRotation(remainSpin);
      this.traveler.setScale(S * grow);
      this.traveler.setAlpha(Math.min(1, 0.2 + p * 3.2));

      if (p >= 0.76) {
        const rp = (p - 0.76) / 0.24;
        this.landingRipple.setScale(0.6 + rp * 0.9);
        this.landingRipple.setAlpha((1 - rp) * 0.85);
      } else {
        this.landingRipple.setAlpha(0);
      }

      if (
        p > 0.8 &&
        this.traveler.anims.currentAnim?.key !== 'char_student_down'
      ) {
        this.traveler.play('char_student_down', true);
      }
      return;
    }

    this.traveler.setPosition(422, 210);
    this.traveler.setRotation(0);
    this.traveler.setScale(S);
    this.traveler.setAlpha(1);
    this.landingRipple.setAlpha(0);
    if (this.traveler.anims.currentAnim?.key !== 'char_student_down') {
      this.traveler.play('char_student_down', true);
    }
  }

  private buildLeftSchoolScene(): void {
    const leftX = 12;
    const topY = 66;
    const boxW = 216;
    const boxH = 194;

    const g = this.add.graphics().setDepth(2);
    g.fillGradientStyle(0xb9e3fa, 0xd4effc, 0xe8f6fd, 0xe8f6fd, 1);
    g.fillRect(leftX, topY, boxW, 146);
    g.fillStyle(0xd8d3c8, 1);
    g.fillRect(leftX, topY + 142, boxW, 18);
    g.fillStyle(0x5c636e, 1);
    g.fillRect(leftX, topY + 160, boxW, 34);
    g.fillStyle(0xe8d98c, 0.85);
    for (let dashX = leftX + 12; dashX < leftX + boxW - 24; dashX += 34) {
      g.fillRect(dashX, topY + 175, 18, 3);
    }

    if (this.textures.exists(SCHOOL_EXTERIOR_KEY)) {
      this.add
        .image(leftX + boxW / 2, topY + 78, SCHOOL_EXTERIOR_KEY)
        .setDisplaySize(boxW, 145)
        .setDepth(4);
    }

    const rim = this.add.graphics().setDepth(6);
    rim.lineStyle(2, 0x8cc6db, 0.85);
    rim.strokeRect(leftX, topY, boxW, boxH);
    rim.fillGradientStyle(
      0x0b0714,
      0x0b0714,
      0x0b0714,
      0x0b0714,
      0,
      0.88,
      0,
      0.88
    );
    rim.fillRect(leftX + boxW - 26, topY, 28, boxH);

    this.add
      .rectangle(leftX + 102, topY + boxH - 13, 178, 20, 0x162436, 0.88)
      .setStrokeStyle(1, 0x9cd8f7)
      .setDepth(16);
    this.add
      .text(leftX + 102, topY + boxH - 13, '現代・彩雲聖若瑟小學', {
        fontSize: '11.5px',
        color: '#eef9ff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(17);
  }

  private buildRightQingScene(stageId: StageId): void {
    const rightX = 348;
    const topY = 66;
    const boxW = 216;
    const boxH = 194;

    const tileKey = this.textures.exists(PALACE_TILES_HD_KEY)
      ? PALACE_TILES_HD_KEY
      : 'palace_tiles';
    const hasProps = this.textures.exists(HD_PROPS_ATLAS_KEY);

    const g = this.add.graphics().setDepth(2);
    if (stageId === 'yongzheng') {
      g.fillGradientStyle(0x3a1c18, 0x59291e, 0xc98b42, 0xe3b464, 1);
    } else if (stageId === 'qianlong') {
      g.fillGradientStyle(0x2d638c, 0x4c8ab0, 0xb8dfeb, 0xe8dca8, 1);
    } else {
      g.fillGradientStyle(0x284b73, 0x3b6994, 0xd4aa6a, 0xedd098, 1);
    }
    g.fillRect(rightX, topY, boxW, 118);

    const cell = 24;
    for (let gy = topY + 114; gy < topY + boxH; gy += cell) {
      for (let gx = rightX; gx < rightX + boxW; gx += cell) {
        let frame: number = TileIndex.COURTYARD_BRICK_A;
        const relCol = Math.floor((gx - rightX) / cell);
        const relRow = Math.floor((gy - (topY + 114)) / cell);

        if (stageId === 'yongzheng') {
          frame =
            relCol >= 2 && relCol <= 5
              ? TileIndex.RED_CARPET_CENTER
              : TileIndex.HALL_GOLD_BRICK_A;
        } else if (stageId === 'qianlong' && relRow >= 2 && relCol >= 5) {
          frame = relCol === 5 ? TileIndex.MARBLE_PATH_A : TileIndex.WATER_1;
        } else if (relCol >= 2 && relCol <= 5) {
          frame =
            relRow === 1 && (relCol === 3 || relCol === 4)
              ? TileIndex.MARBLE_DRAGON_CARVING
              : TileIndex.MARBLE_PATH_A;
        }

        this.add
          .image(gx + cell / 2, gy + cell / 2, tileKey, frame)
          .setDisplaySize(cell, cell)
          .setDepth(3);
      }
    }

    const wallY = topY + 102;
    for (let gx = rightX + 12; gx < rightX + boxW - 12; gx += 24) {
      const isDoorL = gx === rightX + 84;
      const isDoorR = gx === rightX + 108;
      const wallFrame = isDoorL
        ? TileIndex.GATE_DOOR_LEFT
        : isDoorR
          ? TileIndex.GATE_DOOR_RIGHT
          : TileIndex.RED_WALL_BASE;
      this.add
        .image(gx + 12, wallY, tileKey, wallFrame)
        .setDisplaySize(24, 24)
        .setDepth(4);
    }

    if (hasProps) {
      const propTex = this.textures.get(HD_PROPS_ATLAS_KEY);
      const stampProp = (
        frame: PropStampFrame,
        px: number,
        py: number,
        dw: number,
        dh: number,
        depth: number
      ) => {
        if (!propTex.has(frame)) return;
        this.add
          .image(px, py, HD_PROPS_ATLAS_KEY, frame)
          .setDisplaySize(dw, dh)
          .setDepth(depth);
      };

      stampProp('palace_grand_roof', rightX + 108, topY + 62, 168, 52, 5);
      stampProp('palace_pillar_b', rightX + 54, topY + 98, 18, 40, 5.2);
      stampProp('palace_pillar_b', rightX + 162, topY + 98, 18, 40, 5.2);
      stampProp('stone_lantern_a', rightX + 52, topY + 134, 22, 28, 6);

      if (stageId === 'qianlong') {
        stampProp('tree_cluster_b', rightX + 184, topY + 104, 52, 52, 6);
        this.add
          .image(rightX + 178, topY + 158, tileKey, TileIndex.LOTUS_FLOWER)
          .setDisplaySize(24, 24)
          .setDepth(5.5);
      } else if (stageId === 'yongzheng') {
        this.add
          .image(rightX + 176, topY + 136, tileKey, TileIndex.TREASURY_CHEST)
          .setDisplaySize(26, 26)
          .setDepth(6);
        this.add
          .image(rightX + 144, topY + 132, tileKey, TileIndex.BRONZE_INCENSE)
          .setDisplaySize(24, 24)
          .setDepth(6);
      } else {
        stampProp('tree_blossom_a', rightX + 182, topY + 102, 52, 52, 6);
      }
    }

    const empKey =
      stageId === 'yongzheng'
        ? 'char_yongzheng_emperor'
        : stageId === 'qianlong'
          ? 'char_qianlong_emperor'
          : 'char_kangxi_emperor';
    if (this.textures.exists(empKey)) {
      const empFw = this.textures.get(empKey)?.get(0)?.width ?? 128;
      const empScale = empFw >= 120 ? 1.32 / CHAR_HD_SCALE : 1.32;
      const emp = this.add
        .sprite(rightX + 148, 208, empKey, CHAR_IDLE_FRAME.down)
        .setOrigin(0.5, 0.55)
        .setScale(empScale)
        .setDepth(15);
      emp.play(`${empKey}_down`);
    }

    const rim = this.add.graphics().setDepth(7);
    rim.lineStyle(2, 0xe8ba4b, 0.88);
    rim.strokeRect(rightX, topY, boxW, boxH);
    rim.fillGradientStyle(
      0x0b0714,
      0x0b0714,
      0x0b0714,
      0x0b0714,
      0.88,
      0,
      0.88,
      0
    );
    rim.fillRect(rightX - 2, topY, 28, boxH);

    this.add
      .rectangle(rightX + 112, topY + boxH - 13, 184, 20, 0x42120d, 0.9)
      .setStrokeStyle(1, 0xe8ba4b)
      .setDepth(16);
    this.add
      .text(rightX + 112, topY + boxH - 13, `清朝・${this.stageLabel}`, {
        fontSize: '11.5px',
        color: '#fff4d2',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(17);
  }

  private buildCenterBlackVortex(): void {
    const vx = this.vortexCenterX;
    const vy = this.vortexCenterY;

    const rift = this.add.graphics().setDepth(8);
    rift.fillStyle(0x05030a, 0.96);
    rift.fillEllipse(vx, vy, 152, 186);
    rift.lineStyle(2, 0x3b2666, 0.55);
    rift.strokeEllipse(vx, vy, 146, 178);

    this.vortexOuter = this.add.image(vx, vy, VORTEX_OUTER_KEY).setDepth(10);
    this.vortexInner = this.add.image(vx, vy, VORTEX_INNER_KEY).setDepth(11);

    this.vortexCoreRing = this.add
      .circle(vx, vy, 21, 0x000000, 1)
      .setStrokeStyle(2, 0x6c4da6, 0.72)
      .setDepth(12);

    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const radius = 16 + (i % 5) * 11;
      const color = i % 3 === 0 ? 0xe8ba4b : 0x7c5cba;
      const dot = this.add
        .circle(
          vx + Math.cos(angle) * radius,
          vy + Math.sin(angle) * radius * 0.86,
          i % 2 === 0 ? 2 : 1.5,
          color,
          0.75
        )
        .setDepth(13);
      this.vortexSparks.push({
        dot,
        angle,
        radius,
        speed: 0.065 + (i % 4) * 0.015
      });
    }

    this.add
      .text(vx, 76, '🌀 黑色時空旋渦', {
        fontSize: '11.5px',
        color: '#dfd2ff',
        fontStyle: 'bold',
        stroke: '#090512',
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(17);
  }

  private ensureVortexTextures(): void {
    if (!this.textures.exists(VORTEX_OUTER_KEY)) {
      const size = 156;
      const c = this.textures.createCanvas(VORTEX_OUTER_KEY, size, size);
      if (c) {
        this.paintPixelVortexCanvas(c.getContext(), size, 6, true);
        c.refresh();
        c.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }

    if (!this.textures.exists(VORTEX_INNER_KEY)) {
      const size = 104;
      const c = this.textures.createCanvas(VORTEX_INNER_KEY, size, size);
      if (c) {
        this.paintPixelVortexCanvas(c.getContext(), size, 5, false);
        c.refresh();
        c.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
  }

  private paintPixelVortexCanvas(
    ctx: CanvasRenderingContext2D,
    size: number,
    arms: number,
    isOuter: boolean
  ): void {
    ctx.clearRect(0, 0, size, size);
    const imgData = ctx.createImageData(size, size);
    const d = imgData.data;
    const half = size / 2;
    const step = 2;

    for (let py = 0; py < size; py += step) {
      for (let px = 0; px < size; px += step) {
        const dx = px + 1 - half;
        const dy = py + 1 - half;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normR = dist / half;
        if (normR > 0.98) continue;

        const theta = Math.atan2(dy, dx);
        const twist =
          theta * arms + Math.pow(normR, 0.78) * (isOuter ? 11.5 : 14.5);
        const wave = Math.sin(twist);

        let r = 4;
        let g = 2;
        let b = 10;
        let a = 0;

        if (normR < 0.26) {
          r = 2;
          g = 1;
          b = 5;
          a = 250;
        } else if (wave > -0.15) {
          const fade = Math.max(0, 1 - Math.pow(normR, 1.8));
          if (wave > 0.78 && normR > 0.3 && normR < 0.88) {
            r = isOuter ? 68 : 112;
            g = isOuter ? 46 : 78;
            b = isOuter ? 112 : 168;
            a = Math.round(215 * fade);
          } else {
            r = 8;
            g = 5;
            b = 18;
            a = Math.round(242 * fade);
          }
        } else if (normR < 0.72) {
          r = 14;
          g = 9;
          b = 28;
          a = Math.round(165 * (1 - normR));
        }

        if (a <= 0) continue;

        for (let sy = 0; sy < step && py + sy < size; sy++) {
          for (let sx = 0; sx < step && px + sx < size; sx++) {
            const idx = ((py + sy) * size + (px + sx)) * 4;
            d[idx] = r;
            d[idx + 1] = g;
            d[idx + 2] = b;
            d[idx + 3] = a;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  private fitViewport(gameW: number, gameH: number): void {
    const { width: w, height: h, dpr } = toCssSize(gameW, gameH);
    const cam = this.cameras.main;

    const modal = document.querySelector<HTMLElement>(
      '#hud-main-layer .dialogue-modal'
    );
    const modalRect = modal?.getBoundingClientRect();
    const modalTopCss =
      modalRect && modalRect.height > 0 ? modalRect.top : h * 0.62;

    const topPad = 8;
    const safeBottom = Math.max(170, Math.min(h - 8, modalTopCss - 8));
    const availH = Math.max(156, safeBottom - topPad);
    const contentTop = 8;
    const contentBottom = 266;
    const contentH = contentBottom - contentTop;

    const rawZoom = Math.min((w - 12) / SCENE_W, availH / contentH);
    const cssZoom =
      rawZoom >= 1 ? Math.max(1, Math.round(rawZoom * 4) / 4) : rawZoom;
    cam.setZoom(cssZoom * dpr);

    const contentMidY = (contentTop + contentBottom) / 2;
    const safeMidScreenY = (topPad + safeBottom) / 2;
    const camWorldY = Math.round(
      contentMidY + (h / 2 - safeMidScreenY) / cssZoom
    );
    cam.centerOn(SCENE_W / 2, camWorldY);
  }
}
