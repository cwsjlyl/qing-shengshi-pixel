import Phaser from 'phaser';
import {
  HD_PROPS_ATLAS_KEY,
  PALACE_TILES_HD_KEY,
  PropStampFrame
} from '../art/OriginalArtLoader';
import { SCHOOL_EXTERIOR_KEY } from '../art/schoolExteriorUri';
import { OPENING_TASK, STAGE_NAMES, StageId } from '../data/content';
import { upgradeSceneTextsToHd } from '../gfx/CrispVisuals';
import {
  CHAR_IDLE_FRAME,
  ExtraTileIndex,
  TileIndex
} from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';
import { startExclusiveScene } from './exclusiveScene';

const SCENE_W = 576;
const SCENE_H = 432;

const VORTEX_OUTER_KEY = 'opening_vortex_outer_tex';
const VORTEX_INNER_KEY = 'opening_vortex_inner_tex';

interface OpeningSceneData {
  stageName?: string;
}

interface VortexSpark {
  dot: Phaser.GameObjects.Arc;
  angle: number;
  radius: number;
  speed: number;
}

export class OpeningScene extends Phaser.Scene {
  private stageLabel = STAGE_NAMES.kangxi;
  private traveler!: Phaser.GameObjects.Sprite;
  private travelerBaseScale = 0.25;
  private vortexOuter!: Phaser.GameObjects.Image;
  private vortexInner!: Phaser.GameObjects.Image;
  private vortexCoreRing!: Phaser.GameObjects.Arc;
  private landingRipple!: Phaser.GameObjects.Ellipse;
  private vortexSparks: VortexSpark[] = [];
  private elapsedCutsceneMs = 0;

  private readonly vortexCenterX = 288;
  private readonly vortexCenterY = 166;

  constructor() {
    super('OpeningScene');
  }

  init(data?: OpeningSceneData): void {
    this.stageLabel = data?.stageName || STAGE_NAMES[gameState.currentStage];
  }

  create(): void {
    const ui = this.registry.get('ui') as HudUI;
    const stageId: StageId = gameState.currentStage;
    this.elapsedCutsceneMs = 0;
    this.vortexSparks = [];

    this.cameras.main.setBackgroundColor('#120c1c');
    this.cameras.main.setRoundPixels(true);

    this.ensureVortexTextures();

    // 1. 深邃時空背景底層
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x161026, 0x161026, 0x0b0714, 0x0b0714, 1);
    bg.fillRect(0, 0, SCENE_W, SCENE_H);

    // 2. 頂部核心探究問題宮匾（置於安全區頂端）
    this.add
      .rectangle(SCENE_W / 2, 34, 536, 46, 0x6e1812, 0.96)
      .setStrokeStyle(2, 0xe8ba4b)
      .setDepth(30);

    this.add
      .text(SCENE_W / 2, 34, OPENING_TASK, {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '15px',
        color: '#fff8e7',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 510 }
      })
      .setOrigin(0.5)
      .setDepth(31);

    // 3. 左邊：現代學校場景（彩雲聖若瑟小學真實像素外觀）
    this.buildLeftSchoolScene();

    // 4. 右邊：清朝盛世場景（依康熙／雍正／乾隆關卡動態呈現清代宮廷與江南風貌）
    this.buildRightQingScene(stageId);

    // 5. 中間：深邃黑色時空旋渦（多層反向與同向旋轉黑洞＋吸力粒子）
    this.buildCenterBlackVortex();

    // 6. 主角由左邊學校場景出發 -> 旋轉轉入中間黑色旋渦 -> 跌落右邊清朝盛世場景
    const studentTex = this.textures.get('char_student');
    const fw = studentTex?.get(0)?.width ?? 32;
    const charScale = fw >= 120 ? 32 / fw : 1;
    this.travelerBaseScale = charScale * 1.18;

    this.landingRipple = this.add
      .ellipse(422, 224, 34, 12, 0xf2ca52, 0)
      .setStrokeStyle(2, 0xffe484, 0.85)
      .setAlpha(0)
      .setDepth(18);

    this.traveler = this.add
      .sprite(116, 204, 'char_student', CHAR_IDLE_FRAME.right)
      .setOrigin(0.5, 0.52)
      .setScale(this.travelerBaseScale)
      .setDepth(24);
    this.traveler.play('char_student_right');

    upgradeSceneTextsToHd(this);

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.fitViewport(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
    });

    ui.renderOpeningScreen(this.stageLabel, () => {
      startExclusiveScene(this, 'ExploreScene');
    });

    this.fitViewport(this.scale.width, this.scale.height);
    this.time.delayedCall(0, () => {
      if (this.scene.isActive()) {
        this.fitViewport(this.scale.width, this.scale.height);
      }
    });
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(64, delta);
    this.elapsedCutsceneMs += dt;

    // 持續旋轉中央黑色旋渦
    if (this.vortexOuter) {
      this.vortexOuter.rotation += dt * 0.0024;
    }
    if (this.vortexInner) {
      this.vortexInner.rotation += dt * 0.0046;
      const pulse = 1 + Math.sin(this.elapsedCutsceneMs * 0.005) * 0.05;
      this.vortexInner.setScale(pulse);
    }
    if (this.vortexCoreRing) {
      const coreScale = 1 + Math.cos(this.elapsedCutsceneMs * 0.0065) * 0.06;
      this.vortexCoreRing.setScale(coreScale);
    }

    // 旋渦周邊暗金微粒向黑洞中心吸入
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

  /**
   * 三段式穿越動畫（循環展示，4.4 秒一週期）：
   * 1) 由左方彩雲聖若瑟小學校門向右跑近旋渦
   * 2) 被中央黑色旋渦吸起並高速自轉捲入黑洞中心
   * 3) 由旋渦右側旋轉拋出、跌落清朝宮廷地面並站穩張望
   */
  private updateTravelerVortexJourney(): void {
    if (!this.traveler) return;

    const cycleMs = 4400;
    const t = (this.elapsedCutsceneMs % cycleMs) / cycleMs;
    const S = this.travelerBaseScale;

    if (t < 0.27) {
      // 階段一：在學校門前向右奔向旋渦邊緣
      const p = t / 0.27;
      const ease = p * p * (3 - 2 * p);
      const x = Phaser.Math.Linear(108, 228, ease);
      const y = Phaser.Math.Linear(208, 192, ease) - Math.abs(Math.sin(p * Math.PI * 3)) * 4;
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
      // 階段二：旋轉住轉入中間黑色旋渦中心
      const p = (t - 0.27) / 0.3;
      const spiralRadius = (1 - p) * 58;
      const spiralTheta = Math.PI * 0.88 + p * Math.PI * 3.4;
      const cx =
        Phaser.Math.Linear(234, this.vortexCenterX, Math.pow(p, 0.72)) +
        Math.cos(spiralTheta) * spiralRadius * 0.42;
      const cy =
        Phaser.Math.Linear(190, this.vortexCenterY, Math.pow(p, 0.72)) +
        Math.sin(spiralTheta) * spiralRadius * 0.48;

      this.traveler.setPosition(cx, cy);
      // 順時針高速旋轉 3 圈半捲入黑洞
      this.traveler.setRotation(p * Math.PI * 7);
      const shrink = Math.max(0.1, 1 - Math.pow(p, 1.35) * 0.9);
      this.traveler.setScale(S * shrink);
      this.traveler.setAlpha(p > 0.84 ? Math.max(0.08, 1 - (p - 0.84) / 0.16) : 1);
      this.landingRipple.setAlpha(0);
      return;
    }

    if (t < 0.85) {
      // 階段三：由黑色旋渦右側旋轉跌出，拋物線落入清朝場景
      const p = (t - 0.57) / 0.28;
      const easeOut = 1 - Math.pow(1 - p, 2.2);
      const x = Phaser.Math.Linear(this.vortexCenterX + 8, 422, easeOut);

      // 拋物線跌落＋觸地輕微彈跳
      let y: number;
      if (p < 0.78) {
        const fp = p / 0.78;
        const arcLift = Math.sin(fp * Math.PI) * 34;
        y = Phaser.Math.Linear(this.vortexCenterY - 4, 208, fp * fp) - arcLift;
      } else {
        const bp = (p - 0.78) / 0.22;
        y = 208 - Math.sin(bp * Math.PI) * 9;
      }

      // 旋轉跌出並在落地前轉正身軀
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

      if (p > 0.8 && this.traveler.anims.currentAnim?.key !== 'char_student_down') {
        this.traveler.play('char_student_down', true);
      }
      return;
    }

    // 階段四：成功跌入清朝盛世，站穩於宮廷御道上環顧四周
    this.traveler.setPosition(422, 208);
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
    // 晴朗現代校園天空與校門外行人路底襯
    g.fillGradientStyle(0xb9e3fa, 0xd4effc, 0xe8f6fd, 0xe8f6fd, 1);
    g.fillRect(leftX, topY, boxW, 146);
    // 校門前現代行人磚與馬路延伸
    g.fillStyle(0xd8d3c8, 1);
    g.fillRect(leftX, topY + 142, boxW, 18);
    g.fillStyle(0x5c636e, 1);
    g.fillRect(leftX, topY + 160, boxW, 34);
    g.fillStyle(0xe8d98c, 0.85);
    for (let dashX = leftX + 12; dashX < leftX + boxW - 24; dashX += 34) {
      g.fillRect(dashX, topY + 175, 18, 3);
    }

    // 顯示上傳的「彩雲聖若瑟小學」像素校舍外觀圖
    if (
      this.textures.exists(SCHOOL_EXTERIOR_KEY) &&
      this.textures.get(SCHOOL_EXTERIOR_KEY).key !== '__MISSING'
    ) {
      this.add
        .image(leftX + boxW / 2, topY + 78, SCHOOL_EXTERIOR_KEY)
        .setDisplaySize(boxW, 145)
        .setDepth(4);
    } else {
      // 安全後備校園剪影（正常情況會直接載入完整學校圖片）
      g.fillStyle(0x9ecfc2, 1);
      g.fillRect(leftX + 24, topY + 34, 168, 108);
    }

    // 邊框與柔和時空過渡陰影
    const rim = this.add.graphics().setDepth(6);
    rim.lineStyle(2, 0x8cc6db, 0.85);
    rim.strokeRect(leftX, topY, boxW, boxH);
    rim.fillGradientStyle(0x0b0714, 0x0b0714, 0x0b0714, 0x0b0714, 0, 0.88, 0, 0.88);
    rim.fillRect(leftX + boxW - 26, topY, 28, boxH);

    // 左下場景標題牌
    this.add
      .rectangle(leftX + 102, topY + boxH - 13, 178, 20, 0x162436, 0.88)
      .setStrokeStyle(1, 0x9cd8f7)
      .setDepth(16);
    this.add
      .text(leftX + 102, topY + boxH - 13, '現代・彩雲聖若瑟小學', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
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
    // 清朝盛世晴空與金輝天際
    if (stageId === 'yongzheng') {
      g.fillGradientStyle(0x3a1c18, 0x59291e, 0xc98b42, 0xe3b464, 1);
    } else if (stageId === 'qianlong') {
      g.fillGradientStyle(0x2d638c, 0x4c8ab0, 0xb8dfeb, 0xe8dca8, 1);
    } else {
      g.fillGradientStyle(0x284b73, 0x3b6994, 0xd4aa6a, 0xedd098, 1);
    }
    g.fillRect(rightX, topY, boxW, 118);

    // 鋪設高清清宮青磚與漢白玉丹陛御道地磚
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
          frame = relCol === 5 ? ExtraTileIndex.CANAL_STONE_EDGE : TileIndex.WATER_1;
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

    // 清代紅牆與金門殿宇背景
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
      const stampProp = (
        frame: PropStampFrame,
        px: number,
        py: number,
        dw: number,
        dh: number,
        depth: number
      ) => {
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

    // 該關卡對應之清朝皇帝佇立殿前迎接
    const empKey =
      stageId === 'yongzheng'
        ? 'char_yongzheng_emperor'
        : stageId === 'qianlong'
          ? 'char_qianlong_emperor'
          : 'char_kangxi_emperor';
    if (this.textures.exists(empKey)) {
      const empFw = this.textures.get(empKey)?.get(0)?.width ?? 32;
      const empScale = (empFw >= 120 ? 32 / empFw : 1) * 1.08;
      const emp = this.add
        .sprite(rightX + 148, 206, empKey, CHAR_IDLE_FRAME.down)
        .setOrigin(0.5, 0.55)
        .setScale(empScale)
        .setDepth(15);
      emp.play(`${empKey}_down`);
    }

    // 邊框與左側旋渦銜接暗影
    const rim = this.add.graphics().setDepth(7);
    rim.lineStyle(2, 0xe8ba4b, 0.88);
    rim.strokeRect(rightX, topY, boxW, boxH);
    rim.fillGradientStyle(0x0b0714, 0x0b0714, 0x0b0714, 0x0b0714, 0.88, 0, 0.88, 0);
    rim.fillRect(rightX - 2, topY, 28, boxH);

    // 右下清朝場景標題牌
    this.add
      .rectangle(rightX + 112, topY + boxH - 13, 184, 20, 0x42120d, 0.9)
      .setStrokeStyle(1, 0xe8ba4b)
      .setDepth(16);
    this.add
      .text(rightX + 112, topY + boxH - 13, `清朝・${this.stageLabel}`, {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
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

    // 時空裂縫深黑底暈
    const rift = this.add.graphics().setDepth(8);
    rift.fillStyle(0x05030a, 0.95);
    rift.fillEllipse(vx, vy, 152, 186);
    rift.lineStyle(2, 0x3b2666, 0.55);
    rift.strokeEllipse(vx, vy, 146, 178);

    this.vortexOuter = this.add
      .image(vx, vy, VORTEX_OUTER_KEY)
      .setDepth(10);

    this.vortexInner = this.add
      .image(vx, vy, VORTEX_INNER_KEY)
      .setDepth(11);

    // 純黑事件視界核心
    this.vortexCoreRing = this.add
      .circle(vx, vy, 21, 0x000000, 1)
      .setStrokeStyle(2, 0x6c4da6, 0.72)
      .setDepth(12);

    // 吸入旋渦的時空微粒
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

    // 中央上方「時空旋渦」微標記
    this.add
      .text(vx, 76, '🌀 時空旋渦', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '11.5px',
        color: '#dfd2ff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(17);
  }

  /**
   * 建立像素風雙層黑色旋渦紋理（深黑中心＋6 道暗紫黑螺旋臂）
   */
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
    const step = 2; // 2x2 清脆像素顆粒感

    for (let py = 0; py < size; py += step) {
      for (let px = 0; px < size; px += step) {
        const dx = px + 1 - half;
        const dy = py + 1 - half;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normR = dist / half;
        if (normR > 0.98) continue;

        const theta = Math.atan2(dy, dx);
        const twist = theta * arms + Math.pow(normR, 0.78) * (isOuter ? 11.5 : 14.5);
        const wave = Math.sin(twist);

        let r = 4;
        let g = 2;
        let b = 10;
        let a = 0;

        if (normR < 0.26) {
          // 中央純黑深淵黑洞
          r = 2;
          g = 1;
          b = 5;
          a = 250;
        } else if (wave > -0.15) {
          const fade = Math.max(0, 1 - Math.pow(normR, 1.8));
          if (wave > 0.78 && normR > 0.3 && normR < 0.88) {
            // 旋渦邊緣微光絲線
            r = isOuter ? 68 : 112;
            g = isOuter ? 46 : 78;
            b = isOuter ? 112 : 168;
            a = Math.round(215 * fade);
          } else {
            // 主體深黑旋渦臂
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

  /**
   * 動態對齊底部任務對話卡上方安全可視區域（支援 iPad 4:3、橫向與手機螢幕）
   */
  private fitViewport(w: number, h: number): void {
    const cam = this.cameras.main;
    const modal = document.querySelector<HTMLElement>(
      '#hud-main-layer .dialogue-modal'
    );
    const modalRect = modal?.getBoundingClientRect();
    const modalTop =
      modalRect && modalRect.height > 0 ? modalRect.top : h * 0.62;

    const topPad = 8;
    const safeBottom = Math.max(170, Math.min(h - 8, modalTop - 8));
    const availH = Math.max(160, safeBottom - topPad);
    const contentTop = 6;
    const contentBottom = 266;
    const contentH = contentBottom - contentTop;

    const rawZoom = Math.min((w - 12) / SCENE_W, availH / contentH);
    const zoom =
      rawZoom >= 1 ? Math.max(1, Math.round(rawZoom * 4) / 4) : rawZoom;
    cam.setZoom(zoom);

    const contentMidY = (contentTop + contentBottom) / 2;
    const safeMidScreenY = (topPad + safeBottom) / 2;
    const camWorldY = Math.round(
      contentMidY + (h / 2 - safeMidScreenY) / zoom
    );
    cam.centerOn(SCENE_W / 2, camWorldY);
  }
}
