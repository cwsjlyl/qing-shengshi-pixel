import Phaser from 'phaser';
import {
  ExtraTileIndex,
  HD_PROPS_ATLAS_KEY,
  PALACE_TILES_HD_KEY,
  PropStampFrame,
  TILE_HD_PX
} from '../art/OriginalArtLoader';
import { STAGE_NAMES, TITLE, StageId } from '../data/content';
import { CHAR_HD_SCALE, toCssSize } from '../gfx/CrispVisuals';
import { CHAR_IDLE_FRAME, TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';
import { stopOtherScenes } from './exclusiveScene';

const SCENE_W = 576;

// 放寬主頁對焦寬度至完整宮苑全景 548px，讓 iPad 橫向螢幕完整看見東西兩翼宮殿與花木
const FOCAL_W = 548;
const FOCAL_TOP_Y = 6;
const FOCAL_BOTTOM_Y = 276;
const FOCAL_H = FOCAL_BOTTOM_Y - FOCAL_TOP_Y;
const FOCAL_CENTER_Y = Math.round((FOCAL_TOP_Y + FOCAL_BOTTOM_Y) / 2);

const COURTYARD_BRICK_VARIANTS = [
  TileIndex.COURTYARD_BRICK_A,
  TileIndex.COURTYARD_BRICK_B,
  TileIndex.COURTYARD_BRICK_C,
  ExtraTileIndex.COURTYARD_BRICK_D,
  ExtraTileIndex.COURTYARD_BRICK_E,
  ExtraTileIndex.COURTYARD_BRICK_F
];

const MARBLE_PATH_VARIANTS = [
  TileIndex.MARBLE_PATH_A,
  TileIndex.MARBLE_PATH_B,
  ExtraTileIndex.MARBLE_PATH_C,
  ExtraTileIndex.MARBLE_PATH_D
];

const GARDEN_GRASS_VARIANTS = [
  TileIndex.GRASS_A,
  TileIndex.GRASS_B,
  TileIndex.GRASS_FLOWER,
  ExtraTileIndex.GRASS_C,
  ExtraTileIndex.GRASS_D,
  ExtraTileIndex.GRASS_E
];

function spatialHash(col: number, row: number): number {
  let h = (col * 374761393 + row * 668265263) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export class TitleScene extends Phaser.Scene {
  private clouds: Phaser.GameObjects.Rectangle[] = [];
  private rafId: number | null = null;

  constructor() {
    super('TitleScene');
  }

  public create(): void {
    stopOtherScenes(this);
    this.cameras.main.setBackgroundColor('#244f73');

    // 1. 晴空漸層色帶
    const sky = this.add.graphics().setDepth(0);
    sky.fillStyle(0x234e75, 1);
    sky.fillRect(-960, -720, SCENE_W + 1920, 780);
    sky.fillStyle(0x376d99, 1);
    sky.fillRect(-960, 56, SCENE_W + 1920, 62);
    sky.fillStyle(0x639bc2, 1);
    sky.fillRect(-960, 118, SCENE_W + 1920, 48);
    sky.fillStyle(0x9ec2db, 1);
    sky.fillRect(-960, 166, SCENE_W + 1920, 34);

    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      const c = this.add
        .rectangle(
          -120 + i * 136,
          28 + (i % 3) * 22,
          64,
          12,
          0xfaf6eb,
          0.78
        )
        .setDepth(1);
      this.clouds.push(c);
    }

    // 2. 廣闊宮苑地面（採用 48x48 雙倍高清地磚烘焙至 RenderTexture）
    const hasHdTiles = this.textures.exists(PALACE_TILES_HD_KEY);
    const tileTexKey = hasHdTiles ? PALACE_TILES_HD_KEY : 'palace_tiles';
    const stepPx = hasHdTiles ? TILE_HD_PX : TILE_SIZE;
    const rtScale = TILE_SIZE / stepPx;

    const groundRt = this.add
      .renderTexture(-18 * TILE_SIZE, 8 * TILE_SIZE, 60 * stepPx, 26 * stepPx)
      .setOrigin(0, 0)
      .setScale(rtScale)
      .setDepth(2);
    groundRt.beginDraw();
    for (let r = 8; r <= 33; r++) {
      for (let c = -18; c <= 41; c++) {
        const h = spatialHash(c, r);
        let tileFrame: number;
        if (c >= 10 && c <= 13) {
          if (r >= 10 && (c === 11 || c === 12) && r % 3 === 1) {
            tileFrame =
              r % 2 === 0
                ? TileIndex.MARBLE_DRAGON_CARVING
                : ExtraTileIndex.CARVED_MEDALLION_STONE;
          } else {
            tileFrame = MARBLE_PATH_VARIANTS[h % MARBLE_PATH_VARIANTS.length];
          }
        } else if (c < -6 || c > 29) {
          tileFrame = GARDEN_GRASS_VARIANTS[h % GARDEN_GRASS_VARIANTS.length];
        } else {
          tileFrame =
            COURTYARD_BRICK_VARIANTS[h % COURTYARD_BRICK_VARIANTS.length];
        }
        groundRt.batchDrawFrame(
          tileTexKey,
          tileFrame,
          (c + 18) * stepPx,
          (r - 8) * stepPx
        );
      }
    }
    groundRt.endDraw();

    // 3. 屋簷與宮牆地面投影
    const shadowGfx = this.add.graphics().setDepth(3);
    shadowGfx.fillStyle(0x0d0907, 0.26);
    shadowGfx.fillRect(-960, 190, SCENE_W + 1920, 12);
    shadowGfx.fillStyle(0x0d0907, 0.18);
    shadowGfx.fillRect(176, 134, 224, 10);

    // 4. 立體紅牆黃瓦宮殿建築群與蒼松花樹
    const hasHdProps = this.textures.exists(HD_PROPS_ATLAS_KEY);

    if (hasHdProps) {
      const addProp = (
        x: number,
        y: number,
        frame: PropStampFrame,
        depth: number,
        flipX = false
      ) =>
        this.add
          .image(x, y, HD_PROPS_ATLAS_KEY, frame)
          .setDepth(depth)
          .setFlipX(flipX);

      for (const spanX of [-420, -180, 756, 996]) {
        addProp(spanX, 152, 'palace_wall_span', 5);
      }

      addProp(96, 158, 'palace_wing_left', 6);
      addProp(-48, 158, 'palace_wing_right', 6);
      addProp(480, 158, 'palace_wing_right', 6);
      addProp(624, 158, 'palace_wing_left', 6);

      for (let c = 8; c <= 15; c++) {
        const px = c * TILE_SIZE + TILE_SIZE / 2;
        this.add
          .image(px, 148, tileTexKey, TileIndex.RED_WALL_FRIEZE)
          .setScale(rtScale)
          .setDepth(7);

        let lowerWallFrame: number = TileIndex.RED_WALL_BASE;
        if (c === 11) lowerWallFrame = TileIndex.GATE_DOOR_LEFT;
        else if (c === 12) lowerWallFrame = TileIndex.GATE_DOOR_RIGHT;
        else if (c === 9 || c === 14) lowerWallFrame = TileIndex.PALACE_WINDOW;
        else if (c === 8 || c === 15)
          lowerWallFrame = ExtraTileIndex.PALACE_WINDOW_B;

        this.add
          .image(px, 172, tileTexKey, lowerWallFrame)
          .setScale(rtScale)
          .setDepth(7);
      }

      addProp(198, 162, 'palace_pillar_a', 8);
      addProp(254, 162, 'palace_pillar_b', 8);
      addProp(322, 162, 'palace_pillar_b', 8, true);
      addProp(378, 162, 'palace_pillar_a', 8, true);

      addProp(152, 108, 'palace_side_roof', 9);
      addProp(424, 108, 'palace_side_roof', 9, true);
      addProp(SCENE_W / 2, 102, 'palace_grand_roof', 10);

      for (let c = -16; c <= 39; c++) {
        if (c >= 10 && c <= 13) continue;
        const px = c * TILE_SIZE + TILE_SIZE / 2;
        this.add
          .image(px, 194, tileTexKey, TileIndex.TERRACE_BASE)
          .setScale(rtScale)
          .setDepth(8);
        if (c >= 4 && c <= 19 && c % 2 === 0) {
          this.add
            .image(px, 188, tileTexKey, TileIndex.MARBLE_BALUSTRADE_H)
            .setScale(rtScale)
            .setDepth(9);
        }
      }

      addProp(SCENE_W / 2 - 22, 198, 'marble_stairs_tall', 8);
      addProp(SCENE_W / 2 + 22, 198, 'marble_stairs_tall', 8);
      this.add
        .image(
          SCENE_W / 2,
          198,
          tileTexKey,
          TileIndex.MARBLE_DRAGON_CARVING
        )
        .setScale(rtScale)
        .setDepth(9);

      addProp(222, 228, 'stone_lantern_a', 13);
      addProp(354, 228, 'stone_lantern_b', 13);
      this.add
        .image(196, 206, tileTexKey, TileIndex.BRONZE_INCENSE)
        .setScale(rtScale)
        .setDepth(12);
      this.add
        .image(380, 206, tileTexKey, TileIndex.BRONZE_INCENSE)
        .setScale(rtScale)
        .setDepth(12);

      shadowGfx.fillStyle(0x0d0907, 0.24);
      shadowGfx.fillEllipse(142, 212, 46, 14);
      shadowGfx.fillEllipse(434, 212, 46, 14);
      shadowGfx.fillEllipse(42, 228, 48, 14);
      shadowGfx.fillEllipse(534, 228, 48, 14);

      addProp(142, 178, 'tree_cluster_a', 12);
      addProp(434, 178, 'tree_cluster_b', 12);
      addProp(42, 194, 'tree_blossom_a', 12);
      addProp(534, 194, 'tree_blossom_b', 12);
    } else {
      for (let c = 5; c <= 18; c++) {
        const px = c * TILE_SIZE + TILE_SIZE / 2;
        this.add.image(px, 96, 'palace_tiles', TileIndex.ROOF_GOLD_RIDGE).setDepth(8);
        this.add.image(px, 120, 'palace_tiles', TileIndex.ROOF_GOLD_SLOPE).setDepth(8);
        this.add.image(px, 144, 'palace_tiles', TileIndex.ROOF_EAVE_GOLD).setDepth(8);
        this.add.image(px, 168, 'palace_tiles', TileIndex.RED_WALL_BASE).setDepth(7);
      }
    }

    const ui = this.registry.get('ui') as HudUI;

    // 5. 殿前漢白玉御道上的康、雍、乾三朝皇帝（全解析度像素角色）
    const emperorY = 250;
    const emperors: Array<{
      id: StageId;
      key: string;
      shortName: string;
      x: number;
    }> = [
      { id: 'kangxi', key: 'char_kangxi_emperor', shortName: '康熙', x: SCENE_W / 2 - 68 },
      { id: 'yongzheng', key: 'char_yongzheng_emperor', shortName: '雍正', x: SCENE_W / 2 },
      { id: 'qianlong', key: 'char_qianlong_emperor', shortName: '乾隆', x: SCENE_W / 2 + 68 }
    ];

    const enterClassroomStage = (stageId: StageId) => {
      if (!this.sys.isActive() || ui.isModalOpen) return;
      gameState.selectClassStage(stageId);
      this.scene.start('OpeningScene', {
        stageName: STAGE_NAMES[stageId]
      });
    };

    this.input.setTopOnly(false);

    for (const emp of emperors) {
      shadowGfx.fillStyle(0x0d0907, 0.34);
      shadowGfx.fillEllipse(emp.x, emperorY + 1, 28, 9);

      const spr = this.add
        .sprite(emp.x, emperorY, emp.key, CHAR_IDLE_FRAME.down)
        .setOrigin(0.5, 0.92)
        .setScale(1.22 / CHAR_HD_SCALE)
        .setDepth(16);
      spr.play(`${emp.key}_down`);

      this.add
        .text(emp.x, emperorY + 5, emp.shortName, {
          fontSize: '11px',
          color: '#ffe89e',
          backgroundColor: 'rgba(68, 17, 12, 0.92)',
          padding: { x: 6, y: 1.5 },
          fontStyle: 'bold',
          stroke: '#240905',
          strokeThickness: 2
        })
        .setOrigin(0.5, 0)
        .setDepth(18);

      spr.setInteractive(
        new Phaser.Geom.Rectangle(
          -36 * CHAR_HD_SCALE,
          -78 * CHAR_HD_SCALE,
          72 * CHAR_HD_SCALE,
          90 * CHAR_HD_SCALE
        ),
        Phaser.Geom.Rectangle.Contains
      );
      spr.input!.cursor = 'pointer';
      spr.on('pointerdown', () => enterClassroomStage(emp.id));

      const pad = this.add
        .rectangle(emp.x, emperorY - 22, 82, 106, 0xffffff, 0.001)
        .setDepth(17)
        .setInteractive({ useHandCursor: true });
      pad.on('pointerdown', () => enterClassroomStage(emp.id));
    }

    // 6. 頂部描金宮匾標題
    const plaqueW = 352;
    const plaqueH = 56;
    const plaqueX = Math.floor((SCENE_W - plaqueW) / 2);
    const plaqueY = FOCAL_TOP_Y;

    const plaque = this.add.graphics().setDepth(25);
    plaque.fillStyle(0x781912, 0.96);
    plaque.fillRect(plaqueX, plaqueY, plaqueW, plaqueH);
    plaque.lineStyle(3, 0xf0c246, 1);
    plaque.strokeRect(plaqueX, plaqueY, plaqueW, plaqueH);
    plaque.lineStyle(1, 0x3b100b, 1);
    plaque.strokeRect(plaqueX + 5, plaqueY + 5, plaqueW - 10, plaqueH - 10);

    this.add
      .text(SCENE_W / 2, plaqueY + 20, TITLE, {
        fontSize: '19.5px',
        color: '#ffe89e',
        fontStyle: 'bold',
        stroke: '#2e0b06',
        strokeThickness: 3.5
      })
      .setOrigin(0.5)
      .setDepth(26);

    this.add
      .text(SCENE_W / 2, plaqueY + 42, '香港小學六年級常識科・單一主畫面高密度像素版', {
        fontSize: '12px',
        color: '#fff8ea',
        fontStyle: 'bold',
        stroke: '#2b0d08',
        strokeThickness: 2.5
      })
      .setOrigin(0.5)
      .setDepth(26);

    this.openTitleMenu();

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.syncViewportAndTitleDock(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
      if (this.rafId !== null) {
        window.cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      const main = document.getElementById('hud-main-layer');
      if (main?.querySelector('.title-dock')) {
        ui.clearMainOverlay();
      }
    });
  }

  private openTitleMenu(): void {
    const ui = this.registry.get('ui') as HudUI;
    ui.setNavigationHandlers({
      onResetSave: () => this.openTitleMenu()
    });
    ui.renderTitleScreen(
      () => {
        gameState.startSequentialMode();
        this.scene.start('OpeningScene', {
          stageName: STAGE_NAMES.kangxi
        });
      },
      () => {
        gameState.enterClassSelectMode();
        this.scene.start('ClassSelectScene');
      },
      () => {
        ui.setNavigationHandlers({
          onGoTitle: () => this.openTitleMenu()
        });
        ui.showQianlongRemonstrancePanel({
          entrySource: 'title',
          onFinish: () => this.openTitleMenu()
        });
      },
      () => {
        if (
          gameState.mode === 'class' &&
          gameState.completedClassStages.has(gameState.currentStage)
        ) {
          this.scene.start('ClassSelectScene');
        } else {
          this.scene.start('ExploreScene');
        }
      }
    );

    this.syncViewportAndTitleDock(this.scale.width, this.scale.height);
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
    }
    this.rafId = window.requestAnimationFrame(() => {
      if (this.scene.isActive()) {
        this.syncViewportAndTitleDock(this.scale.width, this.scale.height);
      }
    });
  }

  private syncViewportAndTitleDock(gameW: number, gameH: number): void {
    const { width: viewW, height: viewH, dpr } = toCssSize(gameW, gameH);

    const dock = document.querySelector<HTMLElement>(
      '#hud-main-layer .title-dock'
    );
    const btnStack = dock?.querySelector<HTMLElement>('.btn-stack');
    const buttons = dock?.querySelectorAll<HTMLButtonElement>(
      '.btn-stack .pixel-btn'
    );
    const noteEl = dock?.querySelector<HTMLElement>('.title-dock-note');

    const isCompactLandscape = viewW > viewH && viewH < 560;
    const isWideLandscape = viewW > viewH && viewW >= 580;

    if (dock && btnStack) {
      if (isCompactLandscape || isWideLandscape) {
        dock.style.padding = isCompactLandscape ? '6px 10px' : '9px 14px';
        dock.style.bottom = isCompactLandscape ? '6px' : '12px';
        dock.style.width = 'min(95vw, 660px)';
        dock.style.gap = isCompactLandscape ? '4px' : '6px';

        btnStack.style.display = 'flex';
        btnStack.style.flexDirection = 'row';
        btnStack.style.gap = '7px';

        buttons?.forEach((btn) => {
          btn.style.flex = '1 1 0';
          btn.style.padding = isCompactLandscape ? '7px 8px' : '9px 11px';
          btn.style.fontSize = isCompactLandscape ? '13px' : '14.5px';
        });

        if (noteEl) {
          noteEl.style.fontSize = isCompactLandscape ? '11px' : '12px';
          noteEl.style.display = viewH < 380 ? 'none' : 'block';
        }
      } else {
        dock.style.cssText = '';
        btnStack.style.cssText = '';
        buttons?.forEach((btn) => {
          btn.style.cssText = '';
        });
        if (noteEl) {
          noteEl.style.cssText = '';
        }
      }
    }

    const dockRect = dock?.getBoundingClientRect();
    const dockTop =
      dockRect && dockRect.height > 0 ? dockRect.top : viewH - 120;

    const safeTop = 6;
    const safeBottom = Math.max(
      safeTop + 170,
      Math.min(viewH - 6, dockTop - 6)
    );
    const availH = safeBottom - safeTop;

    // 支援 0.5 階梯廣角縮放（如 1.5 * dpr(2) = 3.0 整數物理像素），讓 iPad 完整呈現宮苑全景而不裁切兩翼
    const rawZoom = Math.min(viewW / FOCAL_W, availH / FOCAL_H);
    const snappedZoom = Math.floor(rawZoom * 2) / 2;
    const cssZoom = Math.max(1, Math.min(2, snappedZoom >= 1 ? snappedZoom : rawZoom));

    const safeCenterScreenY = (safeTop + safeBottom) / 2;
    const camWorldY = Math.round(
      FOCAL_CENTER_Y + (viewH / 2 - safeCenterScreenY) / cssZoom
    );

    const cam = this.cameras.main;
    cam.setZoom(cssZoom * dpr);
    cam.centerOn(SCENE_W / 2, camWorldY);
  }

  public update(_time: number, delta: number): void {
    for (const c of this.clouds) {
      c.x += delta * 0.014;
      if (c.x > SCENE_W + 260) {
        c.x = -260;
      }
    }
  }
}
