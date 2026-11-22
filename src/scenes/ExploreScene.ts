import Phaser from 'phaser';
import {
  HD_PROPS_ATLAS_KEY,
  PALACE_TILES_HD_KEY,
  TILE_HD_PX
} from '../art/OriginalArtLoader';
import { SCHOOL_EXTERIOR_KEY } from '../art/schoolExteriorUri';
import {
  DIALOGUES,
  ENDING_TEXT,
  EXIT_QUIZZES,
  JIGSAWS,
  PASSWORDS,
  STAGE_NAMES,
  StageId
} from '../data/content';
import {
  CHAR_HD_SCALE,
  attachCrispCameraZoom,
  upgradeSceneTextsToHd
} from '../gfx/CrispVisuals';
import {
  CHAR_IDLE_FRAME,
  TILE_SIZE,
  TileIndex
} from '../gfx/PixelArtGenerator';
import { STAGE_CHOICE_DELTAS } from '../data/learningEnhancements';
import { clientToWorldPoint } from '../input/pointerMap';
import { attachRawPointerBridge } from '../input/rawPointerBridge';
import {
  MapTrigger,
  StageMapData,
  buildStageMap
} from '../maps/stageMaps';
import { CameraZoomPreset, gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';
import { startExclusiveScene } from './exclusiveScene';
import { launchMinigameScene } from './lazyMinigames';

const COMPACT_HUD_STYLE_ID = 'compact-explore-hud-style';

export class ExploreScene extends Phaser.Scene {
  private mapData!: StageMapData;
  private player!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private playerRing!: Phaser.GameObjects.Graphics;
  private playerDir: 'down' | 'left' | 'right' | 'up' = 'down';
  private charLogicalScale = 1 / CHAR_HD_SCALE;

  private activeTrigger: MapTrigger | null = null;
  private markerSprites = new Map<string, Phaser.GameObjects.Text>();
  private npcSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private royalBoatSprite: Phaser.GameObjects.Image | null = null;
  private dockFleetBoats: Phaser.GameObjects.Image[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    enter: Phaser.Input.Keyboard.Key;
  };

  private walkTarget: {
    x: number;
    y: number;
    pendingTrigger?: MapTrigger;
  } | null = null;
  private walkMarker: Phaser.GameObjects.Arc | null = null;

  private isEndingView = false;
  private isDepartingCutscene = false;

  private userPinchZoomMultiplier = 1;
  private pinchStartDist = 0;
  private pinchStartMult = 1;

  constructor() {
    super('ExploreScene');
  }

  create(): void {
    this.ensureCompactHudStyle();
    this.isEndingView = false;
    this.isDepartingCutscene = false;
    this.activeTrigger = null;
    this.walkTarget = null;
    this.markerSprites.clear();
    this.npcSprites.clear();
    this.royalBoatSprite = null;
    this.dockFleetBoats = [];
    this.userPinchZoomMultiplier = 1;

    const stageId = gameState.currentStage;
    this.mapData = buildStageMap(stageId);

    // 確保康熙關「漢族人」正面朝向玩家顯示（不以背面示人）
    for (const trig of this.mapData.triggers) {
      if (trig.id === 'han_person') {
        trig.facing = 'down';
      }
    }

    const studentTex = this.textures.get('char_student');
    const sFrame0 = studentTex?.get(0);
    this.charLogicalScale =
      sFrame0 && sFrame0.width >= 120 ? 32 / sFrame0.width : 1;

    const worldW = this.mapData.cols * TILE_SIZE;
    const worldH = this.mapData.rows * TILE_SIZE;
    this.cameras.main.setBackgroundColor('#160f0c');
    this.cameras.main.setRoundPixels(true);
    attachCrispCameraZoom(this.cameras.main);
    this.input.setTopOnly(false);

    // 1. 烘焙雙倍高清靜態底圖（RenderTexture 48px/tile）
    const useHdTiles = this.textures.exists(PALACE_TILES_HD_KEY);
    const bakeScale = useHdTiles ? TILE_HD_PX / TILE_SIZE : 1;
    const tileTexKey = useHdTiles ? PALACE_TILES_HD_KEY : 'palace_tiles';

    const groundBakeRT = this.add
      .renderTexture(0, 0, worldW * bakeScale, worldH * bakeScale)
      .setOrigin(0, 0)
      .setScale(1 / bakeScale)
      .setDepth(0);
    groundBakeRT.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const stampTile = this.make.image({ key: tileTexKey, add: false }).setOrigin(0, 0);

    groundBakeRT.beginDraw();
    for (let y = 0; y < this.mapData.rows; y++) {
      for (let x = 0; x < this.mapData.cols; x++) {
        const gIdx = this.mapData.ground[y][x];
        stampTile.setFrame(gIdx);
        groundBakeRT.batchDraw(stampTile, x * TILE_SIZE * bakeScale, y * TILE_SIZE * bakeScale);

        const dIdx = this.mapData.decor[y][x];
        if (dIdx >= 0 && !this.mapData.solid[y][x]) {
          stampTile.setFrame(dIdx);
          groundBakeRT.batchDraw(stampTile, x * TILE_SIZE * bakeScale, y * TILE_SIZE * bakeScale);
        }
      }
    }
    groundBakeRT.endDraw();

    const shadowGraphics = this.add.graphics().setDepth(2);
    shadowGraphics.fillStyle(0x0d0805, 0.22);

    for (let y = 0; y < this.mapData.rows; y++) {
      for (let x = 0; x < this.mapData.cols; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (
          this.mapData.solid[y][x] &&
          y + 1 < this.mapData.rows &&
          !this.mapData.solid[y + 1][x]
        ) {
          shadowGraphics.fillRect(px, py + TILE_SIZE - 2, TILE_SIZE, 9);
        }

        const dIdx = this.mapData.decor[y][x];
        if (dIdx >= 0 && this.mapData.solid[y][x]) {
          this.add
            .image(px, py, tileTexKey, dIdx)
            .setOrigin(0, 0)
            .setDisplaySize(TILE_SIZE, TILE_SIZE)
            .setDepth(3 + y * 0.08);
        }
      }
    }
    stampTile.destroy();

    // 2. 立體建築飛簷、獨立分簇樹冠、石獅、銅鶴與軍營原木疊加層
    const hasHdAtlas = this.textures.exists(HD_PROPS_ATLAS_KEY);
    if (hasHdAtlas && this.mapData.propStamps) {
      for (const prop of this.mapData.propStamps) {
        const px = Math.round(prop.tileX * TILE_SIZE);
        const py = Math.round(prop.tileY * TILE_SIZE);
        const sortTileY = prop.sortY ?? prop.tileY;
        const baseDepth = prop.aboveCanopy ? 22 : 4.2 + sortTileY * 0.1;

        this.add
          .ellipse(
            px,
            py - 2,
            Math.max(18, Math.round(prop.displayW * 0.68)),
            Math.max(8, Math.round(prop.displayH * 0.2)),
            0x0a0604,
            prop.aboveCanopy ? 0.12 : 0.22
          )
          .setDepth(2.1);

        const img = this.add
          .image(px, py, HD_PROPS_ATLAS_KEY, prop.frame)
          .setOrigin(0.5, 1)
          .setDisplaySize(prop.displayW, prop.displayH)
          .setFlipX(Boolean(prop.flipX))
          .setDepth(baseDepth);

        if (prop.alpha !== undefined) {
          img.setAlpha(prop.alpha);
        }
      }
    }

    // 3. 乾隆南巡船隊（1 艘大型雕龍御船 ＋ 6 艘隨扈畫舫伴航）
    if (this.mapData.boatPosition) {
      const bx = Math.round(this.mapData.boatPosition.tileX * TILE_SIZE);
      const by = Math.round(this.mapData.boatPosition.tileY * TILE_SIZE);

      const escortOffsets: Array<{
        dx: number;
        dy: number;
        scale: number;
        flipX?: boolean;
      }> = [
        { dx: -158, dy: -22, scale: 0.72 },
        { dx: -92, dy: 28, scale: 0.76 },
        { dx: -24, dy: -32, scale: 0.7 },
        { dx: 96, dy: 26, scale: 0.78 },
        { dx: 164, dy: -20, scale: 0.74 },
        { dx: 232, dy: 20, scale: 0.7 }
      ];

      for (let i = 0; i < escortOffsets.length; i++) {
        const esc = escortOffsets[i];
        const ex = bx + esc.dx;
        const ey = by + esc.dy;
        const escortBoat = this.add
          .image(ex, ey, 'royal_boat')
          .setScale(esc.scale)
          .setFlipX(Boolean(esc.flipX))
          .setTint(0xf5e6c8)
          .setDepth(8.1 + (ey / TILE_SIZE) * 0.02);

        this.tweens.add({
          targets: escortBoat,
          y: ey - 2.5,
          duration: 1250 + i * 140,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        this.dockFleetBoats.push(escortBoat);
      }

      this.royalBoatSprite = this.add
        .image(bx, by, 'royal_boat')
        .setScale(1.38)
        .setDepth(8.8);
      this.royalBoatSprite.setInteractive(
        new Phaser.Geom.Rectangle(-64, -44, 128, 88),
        Phaser.Geom.Rectangle.Contains
      );
      this.royalBoatSprite.input!.cursor = 'pointer';

      this.royalBoatSprite.on('pointerdown', () => {
        const ui = this.registry.get('ui') as HudUI;
        if (ui.isModalOpen || this.isDepartingCutscene) return;
        const exitTrig = this.mapData.triggers.find(
          (t) => t.id === 'qianlong_exit'
        );
        if (!exitTrig) return;
        if (this.isNearTrigger(exitTrig, 84)) {
          this.clearWalkTarget();
          this.handleTriggerAction(exitTrig);
        } else {
          this.setTapWalkTarget(
            exitTrig.tileX * TILE_SIZE + TILE_SIZE / 2,
            exitTrig.tileY * TILE_SIZE + TILE_SIZE / 2,
            exitTrig
          );
        }
      });

      this.tweens.add({
        targets: this.royalBoatSprite,
        y: by - 3.5,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 4. 場景地標名牌
    for (const sign of this.mapData.signs) {
      const sx = Math.round(sign.tileX * TILE_SIZE);
      const sy = Math.round(sign.tileY * TILE_SIZE);

      const labelText = this.add
        .text(sx, sy, ` ${sign.text} `, {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '12px',
          color: '#fff6d6',
          backgroundColor: '#4e1f14e6',
          padding: { x: 5, y: 2 },
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(19);

      labelText.setShadow(0, 1, '#120905', 2, true, true);
    }

    // 5. NPC 角色與互動觸發點建立
    for (const trig of this.mapData.triggers) {
      const tx = trig.tileX * TILE_SIZE + TILE_SIZE / 2;
      const ty = trig.tileY * TILE_SIZE + TILE_SIZE / 2;

      if (trig.kind === 'npc' && trig.spriteKey) {
        this.add
          .ellipse(tx, ty + 3, 20, 8, 0x0a0604, 0.38)
          .setDepth(9.8 + trig.tileY * 0.1);

        const facing = trig.id === 'han_person' ? 'down' : trig.facing || 'down';
        const frame = CHAR_IDLE_FRAME[facing];
        const npcSprite = this.add
          .sprite(tx, ty + 2, trig.spriteKey, frame)
          .setOrigin(0.5, 0.92)
          .setScale(this.charLogicalScale)
          .setDepth(10 + trig.tileY * 0.1);

        const hitW = Math.round(56 / this.charLogicalScale);
        const hitH = Math.round(64 / this.charLogicalScale);
        npcSprite.setInteractive(
          new Phaser.Geom.Rectangle(-hitW / 2, -hitH * 0.85, hitW, hitH),
          Phaser.Geom.Rectangle.Contains
        );
        npcSprite.input!.cursor = 'pointer';

        npcSprite.on('pointerdown', () => {
          const ui = this.registry.get('ui') as HudUI;
          if (ui.isModalOpen || this.isDepartingCutscene) return;
          if (this.isNearTrigger(trig, 58)) {
            this.clearWalkTarget();
            const opp = this.getOppositeFacing(this.playerDir);
            const talkFacing = opp === 'up' ? 'down' : opp;
            npcSprite.setFrame(CHAR_IDLE_FRAME[talkFacing]);
            this.handleTriggerAction(trig);
          } else {
            this.setTapWalkTarget(tx, ty + 14, trig);
          }
        });

        this.npcSprites.set(trig.id, npcSprite);

        this.add
          .text(tx, ty + 9, trig.label, {
            fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
            fontSize: '11px',
            color: '#fff8e7',
            backgroundColor: '#261710d9',
            padding: { x: 4, y: 1 },
            fontStyle: 'bold'
          })
          .setOrigin(0.5, 0)
          .setDepth(20);
      } else {
        const hitZone = this.add
          .rectangle(tx, ty, 44, 44, 0xffffff, 0.001)
          .setDepth(18)
          .setInteractive({ useHandCursor: true });

        hitZone.on('pointerdown', () => {
          const ui = this.registry.get('ui') as HudUI;
          if (ui.isModalOpen || this.isDepartingCutscene) return;
          if (this.isNearTrigger(trig, 58)) {
            this.clearWalkTarget();
            this.handleTriggerAction(trig);
          } else {
            this.setTapWalkTarget(tx, ty + 10, trig);
          }
        });

        const tagColor =
          trig.kind === 'exit'
            ? '#ffe98a'
            : trig.kind === 'minigame'
              ? '#ffd6a0'
              : '#e8f4ff';

        this.add
          .text(tx, ty + 11, trig.label, {
            fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
            fontSize: '11px',
            color: tagColor,
            backgroundColor: '#261710d9',
            padding: { x: 4, y: 1 },
            fontStyle: 'bold'
          })
          .setOrigin(0.5, 0)
          .setDepth(20);
      }

      const isExit = trig.kind === 'exit';
      const badge = this.add
        .text(tx, ty - 38, isExit ? '★' : '!', {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '14px',
          color: isExit ? '#2b1b0e' : '#ffffff',
          backgroundColor: isExit ? '#f2c138' : '#d9483b',
          padding: { x: 5, y: 1 },
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(25);

      this.tweens.add({
        targets: badge,
        y: ty - 43,
        duration: 620,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.markerSprites.set(trig.id, badge);
    }

    this.refreshTriggerBadges();

    // 6. 建立玩家主角與點地行走目標光圈
    const spawnX =
      this.mapData.playerSpawn.tileX * TILE_SIZE + TILE_SIZE / 2;
    const spawnY =
      this.mapData.playerSpawn.tileY * TILE_SIZE + TILE_SIZE / 2;

    this.walkMarker = this.add
      .circle(spawnX, spawnY, 9, 0xffe484, 0.25)
      .setStrokeStyle(2, 0xffe484, 0.9)
      .setVisible(false)
      .setDepth(9.2);

    this.playerRing = this.add.graphics().setDepth(9.6);
    this.playerRing.lineStyle(2, 0xf5c84c, 0.9);
    this.playerRing.strokeEllipse(0, 0, 24, 11);
    this.playerRing.setPosition(spawnX, spawnY + 2);

    this.playerShadow = this.add
      .ellipse(spawnX, spawnY + 2, 18, 7, 0x090503, 0.42)
      .setDepth(9.7);

    this.player = this.add
      .sprite(spawnX, spawnY + 2, 'char_student', CHAR_IDLE_FRAME.down)
      .setOrigin(0.5, 0.92)
      .setScale(this.charLogicalScale)
      .setDepth(10 + this.mapData.playerSpawn.tileY * 0.1);

    // 點地自動尋路行走（Tap-to-Walk）
    this.input.on(
      'pointerdown',
      (
        pointer: Phaser.Input.Pointer,
        currentlyOver: Phaser.GameObjects.GameObject[]
      ) => {
        const ui = this.registry.get('ui') as HudUI;
        if (
          ui.isModalOpen ||
          this.isEndingView ||
          this.isDepartingCutscene ||
          currentlyOver.length > 0
        ) {
          return;
        }
        this.setTapWalkTarget(pointer.worldX, pointer.worldY);
      }
    );

    const detachRawPointer = attachRawPointerBridge(
      this,
      (clientX: number, clientY: number) => {
        const ui = this.registry.get('ui') as HudUI;
        if (ui.isModalOpen || this.isEndingView || this.isDepartingCutscene) {
          return;
        }
        const { worldX, worldY } = clientToWorldPoint(
          this.game.canvas,
          this.cameras.main,
          clientX,
          clientY
        );

        let nearest: MapTrigger | null = null;
        let bestDist = Infinity;
        for (const trig of this.mapData.triggers) {
          const tx = trig.tileX * TILE_SIZE + TILE_SIZE / 2;
          const ty = trig.tileY * TILE_SIZE + TILE_SIZE / 2;
          const distClick = Phaser.Math.Distance.Between(worldX, worldY, tx, ty - 8);
          if (distClick <= 34 && distClick < bestDist) {
            bestDist = distClick;
            nearest = trig;
          }
        }
        if (nearest) {
          if (this.isNearTrigger(nearest, 58)) {
            this.clearWalkTarget();
            const spr = this.npcSprites.get(nearest.id);
            if (spr) {
              const opp = this.getOppositeFacing(this.playerDir);
              spr.setFrame(CHAR_IDLE_FRAME[opp === 'up' ? 'down' : opp]);
            }
            this.handleTriggerAction(nearest);
          } else {
            this.setTapWalkTarget(
              nearest.tileX * TILE_SIZE + TILE_SIZE / 2,
              nearest.tileY * TILE_SIZE + TILE_SIZE / 2 + 10,
              nearest
            );
          }
          return;
        }
        this.setTapWalkTarget(worldX, worldY);
      }
    );

    // 7. 攝影機跟隨與 iPad 廣角視野（預設擴大可視地圖面積 4 倍，並支援雙指縮放）
    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player, true, 0.18, 0.18);
    this.applyResponsiveZoom(this.scale.width, this.scale.height);

    const detachPinch = this.attachTwoFingerPinchZoom();

    const onResize = (gameSize: Phaser.Structs.Size) => {
      if (!this.isEndingView) {
        this.applyResponsiveZoom(gameSize.width, gameSize.height);
      }
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
      detachRawPointer();
      detachPinch();
    });

    // 8. 鍵盤輸入綁定
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        enter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
      };

      const tryInteract = () => {
        const ui = this.registry.get('ui') as HudUI;
        if (ui.isModalOpen || this.isEndingView || this.isDepartingCutscene) return;
        if (this.activeTrigger) {
          this.clearWalkTarget();
          this.handleTriggerAction(this.activeTrigger);
        }
      };

      this.wasd.space.on('down', tryInteract);
      this.wasd.enter.on('down', tryInteract);
    }

    upgradeSceneTextsToHd(this);

    this.updateNearbyTrigger();
    this.renderExplorePanel();
    this.refreshMinimap();
  }

  private setTapWalkTarget(
    worldX: number,
    worldY: number,
    pendingTrigger?: MapTrigger
  ): void {
    const worldW = this.mapData.cols * TILE_SIZE;
    const worldH = this.mapData.rows * TILE_SIZE;
    const tx = Phaser.Math.Clamp(worldX, 16, worldW - 16);
    const ty = Phaser.Math.Clamp(worldY, 16, worldH - 16);
    this.walkTarget = { x: tx, y: ty, pendingTrigger };
    if (this.walkMarker) {
      this.walkMarker.setPosition(tx, ty);
      this.walkMarker.setVisible(true);
    }
  }

  private clearWalkTarget(): void {
    this.walkTarget = null;
    this.walkMarker?.setVisible(false);
  }

  private ensureCompactHudStyle(): void {
    if (document.getElementById(COMPACT_HUD_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = COMPACT_HUD_STYLE_ID;
    style.textContent = `
      .hud-status-card {
        max-width: min(300px, calc(100vw - 160px)) !important;
        padding: 7px 10px !important;
        gap: 4px !important;
        backdrop-filter: blur(3px);
      }
      .hud-status-card .hud-hint-line {
        font-size: 12px !important;
        line-height: 1.32 !important;
      }
      @media (max-width: 640px) {
        .hud-status-card {
          max-width: calc(100vw - 104px) !important;
          padding: 6px 9px !important;
        }
        .hud-status-card .hud-stage-badge {
          font-size: 12px !important;
        }
        .hud-status-card .hud-hint-line {
          font-size: 11px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private computeBaseZoomForPreset(
    w: number,
    h: number,
    preset: CameraZoomPreset
  ): number {
    const minDim = Math.min(w, h);
    if (preset === 'wide') {
      if (minDim >= 900) return 1.5;
      if (minDim >= 680) return 1.25;
      return 1.25;
    }
    if (preset === 'close') {
      if (minDim >= 900) return 2.5;
      if (minDim >= 680) return 2.25;
      return 2.0;
    }
    if (minDim >= 900) return 1.75;
    if (minDim >= 680) return 1.5;
    return 1.5;
  }

  private applyResponsiveZoom(w: number, h: number): void {
    const base = this.computeBaseZoomForPreset(w, h, gameState.cameraZoomPreset);
    const raw = Phaser.Math.Clamp(base * this.userPinchZoomMultiplier, 1.0, 3.25);
    const snapped = Math.round(raw * 4) / 4;
    this.cameras.main.setZoom(snapped);
  }

  private attachTwoFingerPinchZoom(): () => void {
    const host = this.game.canvas;
    if (!host) return () => {};

    const touchDist = (t1: Touch, t2: Touch): number => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length === 2) {
        this.pinchStartDist = touchDist(ev.touches[0], ev.touches[1]);
        this.pinchStartMult = this.userPinchZoomMultiplier;
        this.clearWalkTarget();
      }
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length === 2 && this.pinchStartDist > 24) {
        const curDist = touchDist(ev.touches[0], ev.touches[1]);
        const ratio = curDist / this.pinchStartDist;
        this.userPinchZoomMultiplier = Phaser.Math.Clamp(
          this.pinchStartMult * ratio,
          0.7,
          1.85
        );
        this.applyResponsiveZoom(this.scale.width, this.scale.height);
      }
    };

    const onWheel = (ev: WheelEvent) => {
      const ui = this.registry.get('ui') as HudUI;
      if (ui.isModalOpen || this.isEndingView) return;
      const delta = ev.deltaY < 0 ? 0.12 : -0.12;
      this.userPinchZoomMultiplier = Phaser.Math.Clamp(
        this.userPinchZoomMultiplier + delta,
        0.7,
        1.85
      );
      this.applyResponsiveZoom(this.scale.width, this.scale.height);
    };

    host.addEventListener('touchstart', onTouchStart, { passive: true });
    host.addEventListener('touchmove', onTouchMove, { passive: true });
    host.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      host.removeEventListener('touchstart', onTouchStart);
      host.removeEventListener('touchmove', onTouchMove);
      host.removeEventListener('wheel', onWheel);
    };
  }

  private getCurrentZoneName(): string {
    const tx = this.player.x / TILE_SIZE;
    const ty = this.player.y / TILE_SIZE;
    for (const z of this.mapData.zones) {
      if (tx >= z.x1 && tx <= z.x2 && ty >= z.y1 && ty <= z.y2) {
        return z.name;
      }
    }
    return STAGE_NAMES[gameState.currentStage];
  }

  private isNearTrigger(trig: MapTrigger, maxDist = 42): boolean {
    const tx = trig.tileX * TILE_SIZE + TILE_SIZE / 2;
    const ty = trig.tileY * TILE_SIZE + TILE_SIZE / 2;
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, tx, ty) <= maxDist;
  }

  private getOppositeFacing(
    dir: 'down' | 'left' | 'right' | 'up'
  ): 'down' | 'left' | 'right' | 'up' {
    switch (dir) {
      case 'down':
        return 'up';
      case 'up':
        return 'down';
      case 'left':
        return 'right';
      case 'right':
        return 'left';
    }
  }

  private isTriggerCompleted(trig: MapTrigger): boolean {
    const stageId = gameState.currentStage;
    if (trig.kind === 'npc' || trig.kind === 'clue') {
      return gameState.hasVisited(stageId, trig.id);
    }
    if (trig.kind === 'minigame') {
      if (trig.id === 'archery_minigame') return gameState.kangxiArcheryDone;
      if (trig.id === 'talent_minigame') return gameState.kangxiTalentDone;
      if (trig.id === 'whack_minigame') return gameState.yongzhengWhackDone;
      if (trig.id === 'southern_tour_minigame') {
        return gameState.qianlongTourDone;
      }
    }
    if (trig.kind === 'exit') {
      return gameState.canExitCurrentStage();
    }
    return false;
  }

  private refreshTriggerBadges(): void {
    for (const trig of this.mapData.triggers) {
      const badge = this.markerSprites.get(trig.id);
      if (!badge) continue;

      if (trig.kind === 'exit') {
        const ready = gameState.canExitCurrentStage();
        badge.setText(ready ? '★' : '🔒');
        badge.setStyle({
          backgroundColor: ready ? '#2fb36d' : '#6e655f',
          color: '#ffffff'
        });
      } else {
        const done = this.isTriggerCompleted(trig);
        badge.setText(done ? '✓' : '!');
        badge.setStyle({
          backgroundColor: done ? '#2fb36d' : '#d9483b',
          color: '#ffffff'
        });
      }
    }
  }

  private renderExplorePanel(): void {
    const ui = this.registry.get('ui') as HudUI;
    const stageId = gameState.currentStage;
    const hintText = this.computeCurrentStageHint();

    ui.renderExploreHud({
      stageName: STAGE_NAMES[stageId],
      zoneName: this.getCurrentZoneName(),
      hintText,
      nearbyLabel: this.activeTrigger?.label || null,
      onInteract: () => this.interactWithNearest(),
      onCycleZoom: () => {
        this.userPinchZoomMultiplier = 1;
        this.applyResponsiveZoom(this.scale.width, this.scale.height);
      },
      onZoomPresetChanged: () => {
        this.userPinchZoomMultiplier = 1;
        this.applyResponsiveZoom(this.scale.width, this.scale.height);
      },
      onReturnTitleRequested: () => {
        startExclusiveScene(this, 'TitleScene');
      }
    });
    this.refreshMinimap();
  }

  private refreshMinimap(): void {
    const ui = this.registry.get('ui') as HudUI;
    if (!this.mapData || !this.player) return;

    const cam = this.cameras.main;
    const worldView = cam.worldView;
    const viewTiles = {
      x1: worldView.x / TILE_SIZE,
      y1: worldView.y / TILE_SIZE,
      x2: (worldView.x + worldView.width) / TILE_SIZE,
      y2: (worldView.y + worldView.height) / TILE_SIZE
    };

    ui.updateExploreMinimap({
      cols: this.mapData.cols,
      rows: this.mapData.rows,
      solid: this.mapData.solid,
      triggers: this.mapData.triggers.map((t) => ({
        id: t.id,
        kind: t.kind,
        tileX: t.tileX,
        tileY: t.tileY
      })),
      playerTileX: this.player.x / TILE_SIZE,
      playerTileY: this.player.y / TILE_SIZE,
      viewTiles
    });
  }

  private computeCurrentStageHint(): string {
    const stage = gameState.currentStage;
    if (stage === 'kangxi') {
      const talkDone =
        gameState.hasVisited('kangxi', 'kangxi_emperor') &&
        gameState.hasVisited('kangxi', 'manchu_person') &&
        gameState.hasVisited('kangxi', 'han_person');

      if (!talkDone) {
        return '探索中軸宮殿、東配殿與西校場：與康熙皇帝、滿族人、漢族人對話（可點地面直接行走）';
      }
      if (!gameState.kangxiArcheryDone || !gameState.kangxiTalentDone) {
        return '前往西校場完成「射箭平三藩」，並於東配殿完成「任用人才」小遊戲';
      }
      if (!gameState.jigsawSolved.kangxi) {
        return '線索已齊備！前往北端「御書房通道」拼合歷史知識拼圖過關';
      }
      return '前往北端「御書房通道」回答出關題目或輸入密碼過關';
    }

    if (stage === 'yongzheng') {
      const talkDone =
        gameState.hasVisited('yongzheng', 'yongzheng_emperor') &&
        gameState.hasVisited('yongzheng', 'corrupt_a') &&
        gameState.hasVisited('yongzheng', 'corrupt_b') &&
        gameState.hasVisited('yongzheng', 'treasury_clue');

      if (!talkDone) {
        return '探索正殿、西庫房與東長廊：與雍正、貪官甲、貪官乙對話並調查國庫銀箱';
      }
      if (!gameState.yongzhengWhackDone) {
        return '前往正殿右側查辦案桌完成「打擊貪官」小遊戲';
      }
      if (!gameState.jigsawSolved.yongzheng) {
        return '線索已齊備！前往北端「殿門出口」拼合歷史知識拼圖過關';
      }
      return '前往北端「殿門出口」回答出關題目或輸入密碼過關';
    }

    const talkDone =
      gameState.hasVisited('qianlong', 'qianlong_emperor') &&
      gameState.hasVisited('qianlong', 'qing_soldier') &&
      gameState.hasVisited('qianlong', 'heshen') &&
      gameState.hasVisited('qianlong', 'farmer');

    if (!talkDone) {
      return '探索行宮、軍營、江南水鄉與農田：與乾隆、清兵、和珅、農夫對話';
    }
    if (!gameState.qianlongTourDone) {
      return '前往江南石拱橋東側「南巡水道起點」完成「六下江南」划船小遊戲';
    }
    if (!gameState.jigsawSolved.qianlong) {
      return '前往東南「大運河碼頭」登上雕龍御船完成拼圖返回現代！';
    }
    return '前往東南「大運河碼頭」登上雕龍御船回答題目，乘船穿越回現代！';
  }

  private interactWithNearest(): void {
    const ui = this.registry.get('ui') as HudUI;
    if (ui.isModalOpen || this.isEndingView || this.isDepartingCutscene) return;
    if (this.activeTrigger) {
      const npc = this.npcSprites.get(this.activeTrigger.id);
      if (npc) {
        const opp = this.getOppositeFacing(this.playerDir);
        npc.setFrame(CHAR_IDLE_FRAME[opp === 'up' ? 'down' : opp]);
      }
      this.handleTriggerAction(this.activeTrigger);
    } else {
      ui.showDialogue('探索提示', [
        '請先走近帶有「!」或「★」標記的人物、物件或出口（亦可直接點按地面自動走過去）。'
      ]);
    }
  }

  update(_time: number, delta: number): void {
    if (this.isEndingView || this.isDepartingCutscene) return;

    const ui = this.registry.get('ui') as HudUI;
    if (ui.isModalOpen) {
      this.stopPlayerAnim();
      return;
    }

    let vx = 0;
    let vy = 0;

    if (this.cursors) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
    }

    if (ui.dirState.left) vx -= 1;
    if (ui.dirState.right) vx += 1;
    if (ui.dirState.up) vy -= 1;
    if (ui.dirState.down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      this.clearWalkTarget();
    } else if (this.walkTarget) {
      const dx = this.walkTarget.x - this.player.x;
      const dy = this.walkTarget.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (
        this.walkTarget.pendingTrigger &&
        this.isNearTrigger(this.walkTarget.pendingTrigger, 44)
      ) {
        const trig = this.walkTarget.pendingTrigger;
        this.clearWalkTarget();
        this.stopPlayerAnim();
        const spr = this.npcSprites.get(trig.id);
        if (spr) {
          const opp = this.getOppositeFacing(this.playerDir);
          spr.setFrame(CHAR_IDLE_FRAME[opp === 'up' ? 'down' : opp]);
        }
        this.handleTriggerAction(trig);
        return;
      }

      if (dist <= 6) {
        this.clearWalkTarget();
      } else {
        vx = dx / dist;
        vy = dy / dist;
      }
    }

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len;
      vy /= len;

      const speed = 152;
      const stepX = vx * speed * (delta / 1000);
      const stepY = vy * speed * (delta / 1000);

      const movedX = this.tryMovePlayer(stepX, 0);
      const movedY = this.tryMovePlayer(0, stepY);

      if (!movedX && !movedY && this.walkTarget) {
        this.clearWalkTarget();
      }

      if (Math.abs(vx) >= Math.abs(vy)) {
        this.playerDir = vx < 0 ? 'left' : 'right';
      } else {
        this.playerDir = vy < 0 ? 'up' : 'down';
      }

      const animKey = `char_student_${this.playerDir}`;
      if (this.player.anims.currentAnim?.key !== animKey) {
        this.player.play(animKey, true);
      }
    } else {
      this.stopPlayerAnim();
    }

    this.playerShadow.setPosition(this.player.x, this.player.y);
    this.playerRing.setPosition(this.player.x, this.player.y);
    this.player.setDepth(10 + (this.player.y / TILE_SIZE) * 0.1);

    this.updateNearbyTrigger();

    ui.updateExploreStatus(
      this.computeCurrentStageHint(),
      this.getCurrentZoneName(),
      this.activeTrigger?.label || null
    );
    this.refreshMinimap();
  }

  private tryMovePlayer(dx: number, dy: number): boolean {
    const nextX = this.player.x + dx;
    const nextY = this.player.y + dy;

    const halfW = 7;
    const topOff = 8;
    const botOff = 2;

    const corners = [
      { x: nextX - halfW, y: nextY - topOff },
      { x: nextX + halfW, y: nextY - topOff },
      { x: nextX - halfW, y: nextY + botOff },
      { x: nextX + halfW, y: nextY + botOff }
    ];

    for (const c of corners) {
      const tx = Math.floor(c.x / TILE_SIZE);
      const ty = Math.floor(c.y / TILE_SIZE);
      if (
        tx < 0 ||
        ty < 0 ||
        tx >= this.mapData.cols ||
        ty >= this.mapData.rows ||
        this.mapData.solid[ty][tx]
      ) {
        return false;
      }
    }

    this.player.x = nextX;
    this.player.y = nextY;
    return true;
  }

  private stopPlayerAnim(): void {
    if (this.player?.anims.isPlaying) {
      this.player.anims.stop();
    }
    this.player?.setFrame(CHAR_IDLE_FRAME[this.playerDir]);
  }

  private updateNearbyTrigger(): void {
    let closest: MapTrigger | null = null;
    let minDist = 40;

    for (const trig of this.mapData.triggers) {
      const tx = trig.tileX * TILE_SIZE + TILE_SIZE / 2;
      const ty = trig.tileY * TILE_SIZE + TILE_SIZE / 2;
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        tx,
        ty
      );
      if (d <= minDist) {
        minDist = d;
        closest = trig;
      }
    }

    this.activeTrigger = closest;
  }

  private handleTriggerAction(trig: MapTrigger): void {
    const ui = this.registry.get('ui') as HudUI;
    const stageId = gameState.currentStage;

    if (trig.kind === 'npc' || trig.kind === 'clue') {
      const lines = DIALOGUES[trig.id];
      if (!lines) return;

      const firstVisit = !gameState.hasVisited(stageId, trig.id);
      gameState.markVisited(stageId, trig.id);
      if (firstVisit && STAGE_CHOICE_DELTAS[trig.id]) {
        gameState.applyMeterDelta(STAGE_CHOICE_DELTAS[trig.id], `${trig.label}：${lines[0]}`);
      } else {
        gameState.recordClue(stageId, `${trig.label}：${lines[0]}`);
      }

      this.refreshTriggerBadges();

      ui.showDialogue(trig.label, lines, () => {
        this.renderExplorePanel();
      });
      return;
    }

    if (trig.kind === 'minigame') {
      const firstDone = !this.isTriggerCompleted(trig);
      if (trig.id === 'archery_minigame') {
        if (firstDone && STAGE_CHOICE_DELTAS[trig.id]) {
          gameState.applyMeterDelta(
            STAGE_CHOICE_DELTAS[trig.id],
            '完成「射箭平三藩」：成功平定三藩之亂，鞏固清初統治。'
          );
        }
        void launchMinigameScene(this, 'ArcheryMinigame');
      } else if (trig.id === 'talent_minigame') {
        if (firstDone && STAGE_CHOICE_DELTAS[trig.id]) {
          gameState.applyMeterDelta(
            STAGE_CHOICE_DELTAS[trig.id],
            '完成「任用人才」：不分滿漢唯才是用，促進滿漢一家。'
          );
        }
        void launchMinigameScene(this, 'TalentMinigame');
      } else if (trig.id === 'whack_minigame') {
        if (firstDone && STAGE_CHOICE_DELTAS[trig.id]) {
          gameState.applyMeterDelta(
            STAGE_CHOICE_DELTAS[trig.id],
            '完成「打擊貪官」：鐵腕肅貪追贓，國庫轉為充裕。'
          );
        }
        void launchMinigameScene(this, 'WhackMinigame');
      } else if (trig.id === 'southern_tour_minigame') {
        if (firstDone && STAGE_CHOICE_DELTAS[trig.id]) {
          gameState.applyMeterDelta(
            STAGE_CHOICE_DELTAS[trig.id],
            '完成「六下江南」：親歷南巡排場與國庫銀両消耗。'
          );
        }
        void launchMinigameScene(this, 'SouthernTourMinigame');
      }
      return;
    }

    if (trig.kind === 'exit') {
      this.tryOpenExitGate(stageId);
    }
  }

  private tryOpenExitGate(stageId: StageId): void {
    const ui = this.registry.get('ui') as HudUI;

    if (!gameState.canExitCurrentStage()) {
      ui.showDialogue(
        '過關提示',
        [
          '你尚未收集齊本關的歷史線索或完成小遊戲！',
          this.computeCurrentStageHint()
        ],
        () => this.renderExplorePanel()
      );
      return;
    }

    const openExitQuizStep = () => {
      ui.showExitQuizModal({
        stageName: STAGE_NAMES[stageId],
        questions: EXIT_QUIZZES[stageId],
        expectedPassword: PASSWORDS[stageId],
        onPassed: () => {
          ui.showCerReflectionModal(stageId, () => {
            this.completeCurrentStage(stageId);
          });
        },
        onCancel: () => {
          this.renderExplorePanel();
        }
      });
    };

    if (!gameState.jigsawSolved[stageId]) {
      ui.showJigsawModal(
        JIGSAWS[stageId],
        () => {
          gameState.markJigsawSolved(stageId);
          this.refreshTriggerBadges();
          openExitQuizStep();
        },
        () => {
          this.renderExplorePanel();
        }
      );
    } else {
      openExitQuizStep();
    }
  }

  private completeCurrentStage(stageId: StageId): void {
    const ui = this.registry.get('ui') as HudUI;

    if (gameState.mode === 'class') {
      gameState.markClassStageCompleted(stageId);
      if (stageId === 'qianlong') {
        this.playRoyalBoatDeparture(() => {
          ui.renderClassCompleteModal(
            STAGE_NAMES[stageId],
            () => startExclusiveScene(this, 'ClassSelectScene'),
            true
          );
        });
      } else {
        ui.renderClassCompleteModal(
          STAGE_NAMES[stageId],
          () => startExclusiveScene(this, 'ClassSelectScene'),
          false
        );
      }
      return;
    }

    if (stageId === 'kangxi') {
      gameState.advanceToStage('yongzheng');
      startExclusiveScene(this, 'OpeningScene', {
        stageName: STAGE_NAMES.yongzheng
      });
      return;
    }

    if (stageId === 'yongzheng') {
      gameState.advanceToStage('qianlong');
      startExclusiveScene(this, 'OpeningScene', {
        stageName: STAGE_NAMES.qianlong
      });
      return;
    }

    this.playRoyalBoatDeparture(() => {
      this.showModernEndingView();
    });
  }

  private playRoyalBoatDeparture(onArrived: () => void): void {
    const ui = this.registry.get('ui') as HudUI;
    ui.clearMainLayer();
    this.isDepartingCutscene = true;

    if (!this.royalBoatSprite) {
      onArrived();
      return;
    }

    this.tweens.killTweensOf(this.royalBoatSprite);
    for (const esc of this.dockFleetBoats) {
      this.tweens.killTweensOf(esc);
    }

    this.playerRing.setVisible(false);
    this.playerShadow.setVisible(false);
    this.player.setPosition(
      this.royalBoatSprite.x - 4,
      this.royalBoatSprite.y - 8
    );
    this.player.setFrame(CHAR_IDLE_FRAME.right);
    this.player.setDepth(9.5);

    this.cameras.main.startFollow(this.royalBoatSprite, true, 0.12, 0.12);

    const flash = this.add
      .rectangle(
        this.royalBoatSprite.x,
        this.royalBoatSprite.y,
        1200,
        900,
        0xfff2c2,
        0
      )
      .setDepth(50);

    for (const esc of this.dockFleetBoats) {
      this.tweens.add({
        targets: esc,
        x: esc.x + 250,
        duration: 2100,
        ease: 'Cubic.easeIn'
      });
    }

    this.tweens.add({
      targets: [this.royalBoatSprite, this.player],
      x: '+=260',
      duration: 2100,
      ease: 'Cubic.easeIn',
      onUpdate: () => {
        flash.setPosition(this.royalBoatSprite!.x, this.royalBoatSprite!.y);
      }
    });

    this.tweens.add({
      targets: flash,
      alpha: 1,
      delay: 1350,
      duration: 750,
      onComplete: () => {
        onArrived();
      }
    });
  }

  private showModernEndingView(): void {
    this.isEndingView = true;
    const ui = this.registry.get('ui') as HudUI;

    this.children.removeAll(true);

    const cam = this.cameras.main;
    cam.stopFollow();
    cam.removeBounds();
    cam.setBackgroundColor('#161c2e');

    const W = 576;
    const H = 432;

    const fitEnding = () => {
      const rawZ = Math.min(this.scale.width / W, this.scale.height / H);
      const z = rawZ >= 1 ? Math.max(1, Math.floor(rawZ)) : rawZ;
      cam.setZoom(z);
      cam.centerOn(W / 2, H / 2 + 28);
    };
    fitEnding();

    const g = this.add.graphics();
    g.fillGradientStyle(0xb9e3fa, 0xd4effc, 0xe8f6fd, 0xe8f6fd, 1);
    g.fillRect(0, 0, W, 248);

    g.fillStyle(0xd8d3c8, 1);
    g.fillRect(0, 224, W, 24);
    g.fillStyle(0x4c5460, 1);
    g.fillRect(0, 248, W, H - 248);

    if (
      this.textures.exists(SCHOOL_EXTERIOR_KEY) &&
      this.textures.get(SCHOOL_EXTERIOR_KEY).key !== '__MISSING'
    ) {
      this.add
        .image(W / 2, 132, SCHOOL_EXTERIOR_KEY)
        .setDisplaySize(316, 212)
        .setDepth(3);
    }

    const student = this.add
      .sprite(W / 2, 232, 'char_student', CHAR_IDLE_FRAME.down)
      .setScale(this.charLogicalScale * 1.45)
      .setDepth(6);
    student.play('char_student_down');

    this.add
      .text(W / 2, 24, '✨ 已穿越時空旋渦平安返回彩雲聖若瑟小學 ✨', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '16px',
        color: '#1b2838',
        backgroundColor: '#fff8e7e6',
        padding: { x: 10, y: 4 },
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(8);

    upgradeSceneTextsToHd(this);

    ui.renderSequentialEndingScreen(ENDING_TEXT, () => {
      startExclusiveScene(this, 'TitleScene');
    });
  }
}
