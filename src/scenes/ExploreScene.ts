import Phaser from 'phaser';
import { PROMPTS, STAGES, STAGE_NAMES, StageId } from '../data/content';
import {
  CHAR_IDLE_FRAME,
  TILE_SIZE,
  TileIndex
} from '../gfx/PixelArtGenerator';
import {
  MapPropPlacement,
  MapTrigger,
  StageMapData,
  buildStageMap
} from '../maps/stageMaps';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';

const WATER_FRAMES = [TileIndex.WATER_1, TileIndex.WATER_2, TileIndex.WATER_3];
const COMPACT_HUD_STYLE_ID = 'explore-compact-hud-style';

export class ExploreScene extends Phaser.Scene {
  private mapData!: StageMapData;
  private player!: Phaser.GameObjects.Sprite;
  private playerDir: 'down' | 'left' | 'right' | 'up' = 'up';
  /** Sticky axis for joystick chatter around 0 so facing does not flicker. */
  private facingAxis: 'x' | 'y' = 'y';
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    ENTER: Phaser.Input.Keyboard.Key;
  };

  private waterTiles: Phaser.GameObjects.Image[] = [];
  private waterFrameIdx = 0;
  private waterTimer = 0;

  private roofContainer!: Phaser.GameObjects.Container;
  private canopyPropSprites: Phaser.GameObjects.Image[] = [];
  private npcBadges: Map<string, Phaser.GameObjects.Image> = new Map();
  private guideArrow!: Phaser.GameObjects.Image;
  private worldTargetIndicator!: Phaser.GameObjects.Arc;
  private royalBoatSprite: Phaser.GameObjects.Image | null = null;
  private royalBoatIdleTween: Phaser.Tweens.Tween | null = null;

  private activeTrigger: MapTrigger | null = null;
  private isDepartingCutscene = false;

  constructor() {
    super('ExploreScene');
  }

  public create(): void {
    this.ensureCompactStatusCardStyle();

    this.isDepartingCutscene = false;
    this.waterTiles = [];
    this.canopyPropSprites = [];
    this.waterFrameIdx = 0;
    this.waterTimer = 0;
    this.npcBadges.clear();
    this.activeTrigger = null;

    const stageId = gameState.currentStage;
    const progress = gameState.getStageProgress(stageId);
    this.mapData = buildStageMap(stageId);

    const worldW = this.mapData.cols * TILE_SIZE;
    const worldH = this.mapData.rows * TILE_SIZE;
    this.cameras.main.setBackgroundColor('#160f0c');
    this.cameras.main.setRoundPixels(true);
    this.input.setTopOnly(false);

    // 1. 原創多變體地面層、建築投影陰影層與基礎瓷磚裝飾層
    const shadowGraphics = this.add.graphics().setDepth(2);
    shadowGraphics.fillStyle(0x0c0705, 0.24);

    // 若某格已放置原創大型石燈／帳篷立體部件，隱藏底層舊色塊圖示但保留碰撞格
    const suppressedDecoCoords = this.collectSuppressedDecoTiles(
      this.mapData.props || []
    );

    for (let y = 0; y < this.mapData.rows; y++) {
      for (let x = 0; x < this.mapData.cols; x++) {
        const gIdx = this.mapData.ground[y][x];
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;

        const gImg = this.add
          .image(px, py, 'palace_tiles', gIdx)
          .setDepth(1);
        if (gIdx === TileIndex.WATER_1) {
          this.waterTiles.push(gImg);
        }

        if (this.mapData.shadow[y][x]) {
          shadowGraphics.fillRect(
            x * TILE_SIZE,
            y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        }

        const dIdx = this.mapData.deco[y][x];
        if (dIdx !== TileIndex.EMPTY && !suppressedDecoCoords.has(`${x},${y}`)) {
          this.add
            .image(px, py, 'palace_tiles', dIdx)
            .setDepth(5 + y * 0.02);
        }
      }
    }

    // 2. 原創高細節大型立體部件層（hd_art_props：宮殿重簷、廊柱、石燈、江南民居、樹冠、營帳、柵欄、火砲、木船）
    this.renderOriginalMapProps(this.mapData.props || []);

    // 3. 乾隆關東岸雕龍御船
    this.royalBoatSprite = null;
    this.royalBoatIdleTween = null;
    if (this.mapData.boatPosition) {
      const boatPx = Math.round(this.mapData.boatPosition.tileX * TILE_SIZE);
      const boatPy = Math.round(this.mapData.boatPosition.tileY * TILE_SIZE);
      this.royalBoatSprite = this.add
        .image(boatPx, boatPy, 'royal_boat')
        .setScale(1.42)
        .setDepth(8.6);
      this.royalBoatSprite.setInteractive(
        new Phaser.Geom.Rectangle(-70, -48, 140, 96),
        Phaser.Geom.Rectangle.Contains
      );
      this.royalBoatSprite.input!.cursor = 'pointer';

      // Six additional pier/escort boats are placed via stageMaps props.
      // Main royal boat stays the large interactive boarding vessel.

      this.royalBoatSprite.on('pointerdown', () => {
        const ui = this.registry.get('ui') as HudUI;
        const exitTrig = this.mapData.triggers.find((t) => t.kind === 'exit');
        if (
          !ui.isModalOpen &&
          !this.isDepartingCutscene &&
          exitTrig &&
          this.isNearTrigger(exitTrig, 68)
        ) {
          this.handleTriggerAction(exitTrig);
        }
      });

      this.royalBoatIdleTween = this.tweens.add({
        targets: this.royalBoatSprite,
        y: this.royalBoatSprite.y + 3,
        duration: 1150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 4. 五類原創高細節角色精靈與頭頂互動玉牌
    for (const trig of this.mapData.triggers) {
      const tx = trig.tileX * TILE_SIZE + TILE_SIZE / 2;
      const ty = trig.tileY * TILE_SIZE + TILE_SIZE / 2;

      if (trig.spriteKey) {
        const facing = trig.facing || 'down';
        const frame = CHAR_IDLE_FRAME[facing];
        const npcSprite = this.add
          .sprite(tx, ty + 2, trig.spriteKey, frame)
          .setOrigin(0.5, 0.92)
          .setDepth(10 + trig.tileY * 0.1);
        npcSprite.setInteractive(
          new Phaser.Geom.Rectangle(-28, -52, 56, 64),
          Phaser.Geom.Rectangle.Contains
        );
        npcSprite.input!.cursor = 'pointer';

        npcSprite.on('pointerdown', () => {
          const ui = this.registry.get('ui') as HudUI;
          if (
            !ui.isModalOpen &&
            !this.isDepartingCutscene &&
            this.isNearTrigger(trig, 58)
          ) {
            // 面向前來傾談的主角後觸發對話
            npcSprite.setFrame(
              CHAR_IDLE_FRAME[this.getOppositeFacing(this.playerDir)]
            );
            this.handleTriggerAction(trig);
          }
        });
      }

      if (
        trig.kind === 'npc' ||
        trig.kind === 'clue' ||
        trig.kind === 'minigame'
      ) {
        const badgeOffsetY = trig.spriteKey ? -38 : -30;
        const badge = this.add
          .image(tx, ty + badgeOffsetY, 'npc_badge')
          .setDepth(36);
        this.tweens.add({
          targets: badge,
          y: ty + badgeOffsetY - 4,
          duration: 620,
          yoyo: true,
          repeat: -1
        });
        this.npcBadges.set(trig.id, badge);
      }
    }

    this.refreshBadges();

    // 5. 玩家主角精靈（原創四向走路循環，貼地陰影原點）
    const startTileX = progress.playerTileX ?? this.mapData.spawnX;
    const startTileY = progress.playerTileY ?? this.mapData.spawnY;

    this.player = this.add
      .sprite(
        startTileX * TILE_SIZE + TILE_SIZE / 2,
        startTileY * TILE_SIZE + TILE_SIZE / 2 + 2,
        'char_student',
        CHAR_IDLE_FRAME.up
      )
      .setOrigin(0.5, 0.92)
      .setDepth(12);

    // 6. 屋簷飛檐前景遮擋層（走入下方自動半透明；獨立樹冠如已由 hd_art_props 繪製則不重複畫色塊冠）
    const treeCanopySuppression = this.collectTreeCanopySuppressedTiles(
      this.mapData.props || []
    );
    this.roofContainer = this.add.container(0, 0).setDepth(28);
    for (let y = 0; y < this.mapData.rows; y++) {
      for (let x = 0; x < this.mapData.cols; x++) {
        const rIdx = this.mapData.roof[y][x];
        if (
          rIdx !== TileIndex.EMPTY &&
          !treeCanopySuppression.has(`${x},${y}`)
        ) {
          const rImg = this.add.image(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            'palace_tiles',
            rIdx
          );
          this.roofContainer.add(rImg);
        }
      }
    }

    // 7. 地面互動光圈與目標指引金箭嘴
    this.worldTargetIndicator = this.add
      .circle(0, 0, 13)
      .setStrokeStyle(2, 0xffe48a, 0.95)
      .setDepth(4)
      .setVisible(false);

    this.guideArrow = this.add
      .image(0, 0, 'guide_arrow')
      .setDepth(45)
      .setVisible(false);

    // 8. 單一主畫面整數倍像素縮放攝影機（絕不模糊）
    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    this.applyCameraIntegerZoom(this.scale.width, this.scale.height);
    cam.startFollow(this.player, true, 1, 1);

    const onResize = (gameSize: Phaser.Structs.Size) => {
      if (!this.isDepartingCutscene) {
        this.applyCameraIntegerZoom(gameSize.width, gameSize.height);
      }
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
    });

    // 9. 鍵盤輸入（WASD／方向鍵／空白鍵／Enter）
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        ENTER: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
      };

      const keyTrigger = () => {
        const ui = this.registry.get('ui') as HudUI;
        if (!ui.isModalOpen && !this.isDepartingCutscene) {
          this.interactWithNearest();
        }
      };
      this.wasd.SPACE.on('down', keyTrigger);
      this.wasd.ENTER.on('down', keyTrigger);
    }

    // 10. 註冊右上角「設定」選單返回處理
    const ui = this.registry.get('ui') as HudUI;
    const savePos = () => {
      if (!this.isDepartingCutscene && this.player) {
        gameState.savePlayerPosition(
          Math.floor(this.player.x / TILE_SIZE),
          Math.floor(this.player.y / TILE_SIZE)
        );
      }
    };
    ui.setNavigationHandlers({
      onGoTitle: () => {
        savePos();
        this.scene.start('TitleScene');
      },
      onGoClassSelect:
        gameState.mode === 'class'
          ? () => {
              savePos();
              this.scene.start('ClassSelectScene');
            }
          : undefined
    });

    this.updateNearbyTrigger();
    this.renderExplorePanel();
    this.refreshMinimap();
  }

  /**
   * 在不改動 HudUI.ts 原始碼的前提下，為探索畫面左上狀態卡注入響應式精簡樣式，
   * 避免在手機橫向、直向或 iPad 佔據過大視野。
   */
  private ensureCompactStatusCardStyle(): void {
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
      #hud-overlay.explore-with-minimap .hud-status-card {
        /* keep beside / below minimap from global CSS */
      }
      .hud-status-card .hud-hint-line {
        font-size: 12px !important;
        line-height: 1.32 !important;
      }
      .hud-status-card .checklist-wrap {
        gap: 4px !important;
      }
      .hud-status-card .check-chip {
        padding: 2px 6px !important;
        font-size: 11px !important;
      }
      @media (max-height: 520px), (max-width: 680px) {
        .hud-status-card {
          max-width: min(278px, calc(100vw - 108px)) !important;
          padding: 5px 8px !important;
        }
        .hud-status-card .hud-stage-pill {
          font-size: 11px !important;
          padding: 1px 6px !important;
        }
        .hud-status-card .hud-zone-text {
          font-size: 12px !important;
        }
        .hud-status-card .hud-hint-line {
          font-size: 11px !important;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hud-status-card .check-chip {
          padding: 1px 5px !important;
          font-size: 10.5px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 當 hd_art_props 可用時，收集已被立體部件覆蓋的舊版單格燈柱／營帳／樹幹座標，
   * 避免舊色塊在高清原創部件背後露邊，同時保留地圖碰撞。
   */
  private collectSuppressedDecoTiles(props: MapPropPlacement[]): Set<string> {
    const set = new Set<string>();
    if (!this.textures.exists('hd_art_props')) return set;
    const tex = this.textures.get('hd_art_props');

    for (const p of props) {
      if (!tex.has(p.frame)) continue;
      if (p.frame.startsWith('stone_lantern_')) {
        set.add(`${Math.round(p.tileX)},${Math.round(p.tileY + 0.15)}`);
      } else if (p.frame.startsWith('camp_tent_')) {
        const baseX = Math.floor(p.tileX);
        const baseY = Math.round(p.tileY + 0.2);
        set.add(`${baseX},${baseY}`);
        set.add(`${baseX + 1},${baseY}`);
      } else if (p.frame.startsWith('tree_cluster_')) {
        set.add(`${Math.round(p.tileX)},${Math.round(p.tileY + 0.55)}`);
      }
    }
    return set;
  }

  private collectTreeCanopySuppressedTiles(
    props: MapPropPlacement[]
  ): Set<string> {
    const set = new Set<string>();
    if (!this.textures.exists('hd_art_props')) return set;
    const tex = this.textures.get('hd_art_props');

    for (const p of props) {
      if (!tex.has(p.frame)) continue;
      if (p.frame.startsWith('tree_cluster_')) {
        const tx = Math.round(p.tileX);
        const trunkY = Math.round(p.tileY + 0.55);
        set.add(`${tx},${trunkY - 1}`);
      }
    }
    return set;
  }

  /**
   * 繪製來自原創 PNG（宮廷、江南下半部獨立樹與石、軍營碼頭）的高細節立體部件
   */
  private renderOriginalMapProps(props: MapPropPlacement[]): void {
    if (!this.textures.exists('hd_art_props')) return;
    const propTex = this.textures.get('hd_art_props');

    for (const prop of props) {
      if (!propTex.has(prop.frame)) continue;

      const px = Math.round(
        prop.tileX * TILE_SIZE + TILE_SIZE / 2 + (prop.offsetX ?? 0)
      );
      const py = Math.round(
        prop.tileY * TILE_SIZE + TILE_SIZE / 2 + (prop.offsetY ?? 0)
      );

      const img = this.add.image(px, py, 'hd_art_props', prop.frame);
      if (prop.flipX) img.setFlipX(true);
      if (prop.scale !== undefined) img.setScale(prop.scale);
      if (prop.alpha !== undefined) img.setAlpha(prop.alpha);

      if (prop.layer === 'ground_decor') {
        img.setOrigin(0.5, 0.5).setDepth(3.4 + prop.tileY * 0.01);
      } else if (prop.layer === 'building') {
        const isBoat = prop.frame.startsWith('pier_boat_');
        img
          .setOrigin(0.5, isBoat ? 0.62 : 0.88)
          .setDepth(isBoat ? 7.8 + prop.tileY * 0.05 : 10 + prop.tileY * 0.1);

        if (isBoat) {
          this.tweens.add({
            targets: img,
            y: py + 2,
            duration: 1280 + ((px * 13) % 320),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      } else {
        // canopy 層：重簷大殿屋頂、江南屋舍屋頂與分簇大樹冠（玩家走入正下方時個別半透明）
        const isTree = prop.frame.startsWith('tree_cluster_');
        img
          .setOrigin(0.5, isTree ? 0.62 : 0.55)
          .setDepth(29 + prop.tileY * 0.02);
        this.canopyPropSprites.push(img);
      }
    }
  }

  private getOppositeFacing(
    dir: 'down' | 'left' | 'right' | 'up'
  ): 'down' | 'left' | 'right' | 'up' {
    switch (dir) {
      case 'up':
        return 'down';
      case 'down':
        return 'up';
      case 'left':
        return 'right';
      case 'right':
        return 'left';
    }
  }

  private applyCameraIntegerZoom(viewW: number, viewH: number): void {
    const minDim = Math.min(viewW, viewH);
    const zoom = minDim >= 960 ? 3 : 2;
    this.cameras.main.setZoom(zoom);
  }

  private renderExplorePanel(overrideHint?: string): void {
    const ui = this.registry.get('ui') as HudUI;
    const hint = overrideHint ?? this.computeCurrentStageHint();
    ui.renderExploreHUD({
      zoneName: this.getCurrentZoneName(),
      hintText: hint,
      nearbyLabel: this.activeTrigger?.label || null,
      onInteract: () => this.interactWithNearest()
    });
    this.refreshMinimap();
  }

  /** Top-left semi-transparent virtual map: buildings, investigate targets, exits, player. */
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
    const stageId = gameState.currentStage;
    const stageCfg = STAGES[stageId];
    const prog = gameState.getStageProgress(stageId);

    if (
      stageId === 'qianlong' &&
      (prog.qianlongEndingPhase === 'find_qianlong' ||
        prog.qianlongEndingPhase === 'teacher_password')
    ) {
      return PROMPTS.FIND_QIANLONG_AGAIN;
    }
    if (stageId === 'qianlong' && prog.qianlongEndingPhase === 'ask_qianlong') {
      return PROMPTS.ASK_QIANLONG_HUD;
    }
    if (prog.quizPassed && !prog.passwordPassed) {
      return PROMPTS.QUIZ_PASSED;
    }
    if (gameState.isAllStageRequirementsReady(stageId)) {
      return stageCfg.evidenceReadyMessage;
    }
    if (
      gameState.areRequiredNpcsVisited(stageId) &&
      !gameState.areRequiredMinigamesDone(stageId)
    ) {
      return '人物證據已收齊！請跟著箭嘴完成本關小遊戲挑戰，再前往出口。';
    }
    return '請拖曳左下搖桿移動探索，靠近人物、線索或挑戰桌按右下「調查／傾談」。';
  }

  private refreshBadges(): void {
    const prog = gameState.getStageProgress();
    for (const trig of this.mapData.triggers) {
      const badge = this.npcBadges.get(trig.id);
      if (!badge) continue;

      if (trig.kind === 'npc' || trig.kind === 'clue') {
        const visited = prog.visitedNpcs.has(trig.id);
        if (
          trig.id === 'qianlong_emperor' &&
          (prog.qianlongEndingPhase === 'find_qianlong' ||
            prog.qianlongEndingPhase === 'teacher_password' ||
            prog.qianlongEndingPhase === 'ask_qianlong')
        ) {
          badge.setVisible(true);
        } else {
          badge.setVisible(!visited);
        }
      } else if (trig.kind === 'minigame' && trig.minigameId) {
        badge.setVisible(!prog.completedMinigames.has(trig.minigameId));
      }
    }
  }

  public update(time: number, delta: number): void {
    // 三幀原創水面波紋循環
    this.waterTimer += delta;
    if (this.waterTimer >= 420) {
      this.waterTimer = 0;
      this.waterFrameIdx = (this.waterFrameIdx + 1) % WATER_FRAMES.length;
      const frame = WATER_FRAMES[this.waterFrameIdx];
      for (const wt of this.waterTiles) {
        wt.setFrame(frame);
      }
    }

    const ui = this.registry.get('ui') as HudUI;
    if (ui.isModalOpen || this.isDepartingCutscene) {
      this.player.anims.stop();
      this.player.setFrame(CHAR_IDLE_FRAME[this.playerDir]);
      return;
    }

    // 結合左下圓形虛擬搖桿連續向量與鍵盤方向鍵
    let vx = ui.joyVector.x;
    let vy = ui.joyVector.y;

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) vx = -1;
    else if (this.cursors?.right.isDown || this.wasd?.D.isDown) vx = 1;

    if (this.cursors?.up.isDown || this.wasd?.W.isDown) vy = -1;
    else if (this.cursors?.down.isDown || this.wasd?.S.isDown) vy = 1;

    const mag = Math.hypot(vx, vy);
    if (mag > 0.05) {
      const clampedMag = Math.min(1, mag);
      const speed = 118 * clampedMag * (delta / 1000);
      const dx = (vx / mag) * speed;
      const dy = (vy / mag) * speed;

      this.tryMovePlayer(dx, 0);
      this.tryMovePlayer(0, dy);

      // Facing hysteresis: prefer current axis until the other clearly dominates
      const ax = Math.abs(vx);
      const ay = Math.abs(vy);
      if (this.facingAxis === 'x') {
        if (ay > ax * 1.35) this.facingAxis = 'y';
      } else {
        if (ax > ay * 1.35) this.facingAxis = 'x';
      }
      if (this.facingAxis === 'x' && ax > 0.08) {
        this.playerDir = vx < 0 ? 'left' : 'right';
      } else if (ay > 0.08) {
        this.playerDir = vy < 0 ? 'up' : 'down';
      } else if (ax > 0.08) {
        this.playerDir = vx < 0 ? 'left' : 'right';
      }
      // Sheet already has left/right rows — never flipX at runtime
      this.player.setFlipX(false);
      this.player.play(`char_student_${this.playerDir}`, true);
    } else {
      this.player.anims.stop();
      this.player.setFlipX(false);
      this.player.setFrame(CHAR_IDLE_FRAME[this.playerDir]);
    }

    this.player.setDepth(10 + (this.player.y / TILE_SIZE) * 0.1);

    // 屋簷瓷磚層與大型立體樹冠／殿頂前景半透明偵測（不遮擋人物）
    const ptx = Math.floor(this.player.x / TILE_SIZE);
    const pty = Math.floor((this.player.y - 10) / TILE_SIZE);
    const underRoof =
      pty >= 0 &&
      pty < this.mapData.rows &&
      ptx >= 0 &&
      ptx < this.mapData.cols &&
      this.mapData.roof[pty][ptx] !== TileIndex.EMPTY;
    this.roofContainer.setAlpha(underRoof ? 0.42 : 1);

    const playerBodyX = this.player.x;
    const playerBodyY = this.player.y - 14;
    for (const canopyImg of this.canopyPropSprites) {
      const bounds = canopyImg.getBounds();
      const inside =
        playerBodyX >= bounds.left + 6 &&
        playerBodyX <= bounds.right - 6 &&
        playerBodyY >= bounds.top + 6 &&
        playerBodyY <= bounds.bottom - 4;
      canopyImg.setAlpha(inside ? 0.42 : 1);
    }

    this.updateNearbyTrigger();
    this.updateGuideArrow(time);

    ui.updateExploreDynamicStatus(
      this.getCurrentZoneName(),
      this.activeTrigger?.label || null
    );
    this.refreshMinimap();
  }

  private tryMovePlayer(dx: number, dy: number): void {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    const halfW = 6.5;
    const topOff = -7;
    const botOff = 1.5;

    const corners = [
      [nx - halfW, ny + topOff],
      [nx + halfW, ny + topOff],
      [nx - halfW, ny + botOff],
      [nx + halfW, ny + botOff]
    ];

    for (const [cx, cy] of corners) {
      const tx = Math.floor(cx / TILE_SIZE);
      const ty = Math.floor(cy / TILE_SIZE);
      if (
        tx < 0 ||
        ty < 0 ||
        tx >= this.mapData.cols ||
        ty >= this.mapData.rows ||
        this.mapData.solid[ty][tx]
      ) {
        return;
      }
    }

    this.player.x = nx;
    this.player.y = ny;
  }

  private getCurrentZoneName(): string {
    const tx = Math.floor(this.player.x / TILE_SIZE);
    const ty = Math.floor(this.player.y / TILE_SIZE);
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
    return (
      Phaser.Math.Distance.Between(this.player.x, this.player.y, tx, ty) <=
      maxDist
    );
  }

  private updateNearbyTrigger(): void {
    let best: MapTrigger | null = null;
    let bestDist = 42;

    for (const trig of this.mapData.triggers) {
      const tx = trig.tileX * TILE_SIZE + TILE_SIZE / 2;
      const ty = trig.tileY * TILE_SIZE + TILE_SIZE / 2;
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        tx,
        ty
      );
      if (d < bestDist) {
        bestDist = d;
        best = trig;
      }
    }

    this.activeTrigger = best;
    if (best) {
      this.worldTargetIndicator
        .setPosition(
          best.tileX * TILE_SIZE + TILE_SIZE / 2,
          best.tileY * TILE_SIZE + TILE_SIZE / 2 + 2
        )
        .setVisible(true);
    } else {
      this.worldTargetIndicator.setVisible(false);
    }
  }

  private getArrowTargetTrigger(): MapTrigger | null {
    const stageId = gameState.currentStage;
    const prog = gameState.getStageProgress(stageId);

    if (
      stageId === 'qianlong' &&
      (prog.qianlongEndingPhase === 'find_qianlong' ||
        prog.qianlongEndingPhase === 'teacher_password' ||
        prog.qianlongEndingPhase === 'ask_qianlong')
    ) {
      return (
        this.mapData.triggers.find((t) => t.id === 'qianlong_emperor') || null
      );
    }

    if (gameState.isAllStageRequirementsReady(stageId)) {
      return this.mapData.triggers.find((t) => t.kind === 'exit') || null;
    }

    if (
      gameState.areRequiredNpcsVisited(stageId) &&
      !gameState.areRequiredMinigamesDone(stageId)
    ) {
      return (
        this.mapData.triggers.find(
          (t) =>
            t.kind === 'minigame' &&
            t.minigameId &&
            !prog.completedMinigames.has(t.minigameId)
        ) || null
      );
    }

    return null;
  }

  private updateGuideArrow(time: number): void {
    const target = this.getArrowTargetTrigger();
    if (!target || this.isDepartingCutscene) {
      this.guideArrow.setVisible(false);
      return;
    }

    const tx = target.tileX * TILE_SIZE + TILE_SIZE / 2;
    const ty = target.tileY * TILE_SIZE + TILE_SIZE / 2;
    const dist = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      tx,
      ty
    );

    const pulse = Math.sin(time * 0.008) * 4;
    this.guideArrow.setVisible(true);

    if (dist < 64) {
      this.guideArrow.setPosition(tx, ty - 42 + pulse);
      this.guideArrow.setRotation(0);
    } else {
      const angle = Math.atan2(ty - this.player.y, tx - this.player.x);
      const radius = 78 + pulse;
      const ax = Phaser.Math.Clamp(
        this.player.x + Math.cos(angle) * radius,
        20,
        this.mapData.cols * TILE_SIZE - 20
      );
      const ay = Phaser.Math.Clamp(
        this.player.y - 10 + Math.sin(angle) * radius,
        20,
        this.mapData.rows * TILE_SIZE - 20
      );
      this.guideArrow.setPosition(ax, ay);
      this.guideArrow.setRotation(angle - Math.PI / 2);
    }
  }

  private interactWithNearest(): void {
    const ui = this.registry.get('ui') as HudUI;
    if (ui.isModalOpen || this.isDepartingCutscene) return;

    if (!this.activeTrigger) {
      ui.showDialogue(
        '探索提示',
        ['附近沒有可傾談或調查的對象。請走近人物、線索、挑戰桌或出口再按互動鍵。'],
        () => this.renderExplorePanel()
      );
      return;
    }

    this.handleTriggerAction(this.activeTrigger);
  }

  private handleTriggerAction(trig: MapTrigger): void {
    const stageId = gameState.currentStage;
    const stageCfg = STAGES[stageId];
    const prog = gameState.getStageProgress(stageId);
    const ui = this.registry.get('ui') as HudUI;

    if (trig.kind === 'decor_note') {
      ui.showDialogue(
        trig.label,
        [trig.decorMessage || '此處並非出口。'],
        () => this.renderExplorePanel()
      );
      return;
    }

    if (trig.kind === 'minigame' && trig.sceneKey) {
      const ptx = Math.floor(this.player.x / TILE_SIZE);
      const pty = Math.floor(this.player.y / TILE_SIZE);
      gameState.savePlayerPosition(ptx, pty);
      this.scene.start(trig.sceneKey);
      return;
    }

    if (trig.kind === 'npc' || trig.kind === 'clue') {
      if (
        stageId === 'qianlong' &&
        trig.id === 'qianlong_emperor' &&
        (prog.qianlongEndingPhase === 'find_qianlong' ||
          prog.qianlongEndingPhase === 'teacher_password' ||
          prog.qianlongEndingPhase === 'ask_qianlong')
      ) {
        this.runQianlongFinalSequence();
        return;
      }

      const npcData = stageCfg.npcs[trig.id];
      if (!npcData) return;

      ui.showDialogue(npcData.name, npcData.lines, () => {
        gameState.markNpcVisited(npcData.id, stageId);
        this.refreshBadges();
        this.renderExplorePanel();
      });
      return;
    }

    if (trig.kind === 'exit') {
      this.handleExitInteraction();
    }
  }

  private handleExitInteraction(): void {
    const stageId = gameState.currentStage;
    const stageCfg = STAGES[stageId];
    const prog = gameState.getStageProgress(stageId);
    const ui = this.registry.get('ui') as HudUI;

    if (
      stageId === 'qianlong' &&
      prog.passwordPassed &&
      prog.qianlongEndingPhase !== 'none'
    ) {
      ui.showDialogue('御船船夫', [PROMPTS.FIND_QIANLONG_AGAIN], () => {
        this.renderExplorePanel();
      });
      return;
    }

    if (!gameState.areRequiredNpcsVisited(stageId)) {
      ui.showDialogue('提示', [stageCfg.lockedExitMessage], () => {
        this.renderExplorePanel();
      });
      return;
    }

    if (!gameState.areRequiredMinigamesDone(stageId)) {
      const pendingNames = stageCfg.minigames
        .filter((m) => !prog.completedMinigames.has(m.id))
        .map((m) => `「${m.stationName}」`)
        .join('、');

      ui.showDialogue(
        '提示',
        [
          `人物與線索證據已收齊！請先跟著箭嘴完成本關的${pendingNames}，再回來進行答題。`
        ],
        () => {
          this.renderExplorePanel();
        }
      );
      return;
    }

    if (!prog.quizPassed) {
      ui.showStageQuiz(
        stageCfg.quizzes,
        () => {
          prog.quizPassed = true;
          ui.showDialogue('答題完成', [PROMPTS.QUIZ_PASSED], () => {
            this.openStagePasswordPad(stageId);
          });
        },
        () => {
          this.renderExplorePanel();
        }
      );
      return;
    }

    if (!prog.passwordPassed) {
      this.openStagePasswordPad(stageId);
    }
  }

  private openStagePasswordPad(stageId: StageId): void {
    const stageCfg = STAGES[stageId];
    const prog = gameState.getStageProgress(stageId);
    const ui = this.registry.get('ui') as HudUI;

    ui.showPasswordPad({
      title: `${stageCfg.shortTitle}出關密碼`,
      hint: PROMPTS.QUIZ_PASSED,
      expectedPassword: stageCfg.password,
      allowCancel: true,
      onCancel: () => {
        this.renderExplorePanel();
      },
      onSuccess: () => {
        prog.passwordPassed = true;
        this.onStagePasswordVerified(stageId);
      }
    });
  }

  private onStagePasswordVerified(stageId: StageId): void {
    const prog = gameState.getStageProgress(stageId);
    const ui = this.registry.get('ui') as HudUI;

    if (stageId === 'qianlong') {
      prog.qianlongEndingPhase = 'find_qianlong';
      this.refreshBadges();
      ui.showDialogue('過關提示', [PROMPTS.QIANLONG_AFTER_789_ARROW], () => {
        this.renderExplorePanel(PROMPTS.FIND_QIANLONG_AGAIN);
      });
      return;
    }

    if (gameState.mode === 'class') {
      gameState.completedClassStages.add(stageId);
      ui.showDialogue('完成本關', [PROMPTS.CLASS_STAGE_DONE], () => {
        this.scene.start('ClassSelectScene');
      });
      return;
    }

    const nextStage: StageId = stageId === 'kangxi' ? 'yongzheng' : 'qianlong';
    gameState.advanceToStage(nextStage);
    this.scene.start('OpeningScene', {
      stageName: STAGE_NAMES[nextStage]
    });
  }

  private runQianlongFinalSequence(): void {
    const prog = gameState.getStageProgress('qianlong');
    const ui = this.registry.get('ui') as HudUI;

    const launchAskStep = () => {
      prog.qianlongEndingPhase = 'ask_qianlong';
      ui.showDialogue('乾隆皇帝', [PROMPTS.QIANLONG_FINAL_ASK_LINE], () => {
        ui.showQianlongAskPanel(() => {
          this.playRoyalBoatDeparture();
        });
      });
    };

    if (prog.qianlongEndingPhase === 'ask_qianlong') {
      launchAskStep();
      return;
    }

    ui.showDialogue('乾隆皇帝', [PROMPTS.QIANLONG_WAIT_TEACHER], () => {
      prog.qianlongEndingPhase = 'teacher_password';
      ui.showTeacherPasswordPad(() => {
        launchAskStep();
      });
    });
  }

  private playRoyalBoatDeparture(): void {
    const prog = gameState.getStageProgress('qianlong');
    prog.qianlongEndingPhase = 'departing';
    this.isDepartingCutscene = true;
    this.guideArrow.setVisible(false);
    this.worldTargetIndicator.setVisible(false);

    if (gameState.mode === 'class') {
      gameState.completedClassStages.add('qianlong');
    }

    const ui = this.registry.get('ui') as HudUI;
    ui.clearMainOverlay();
    ui.isModalOpen = true;

    const cam = this.cameras.main;
    if (this.royalBoatSprite) {
      this.royalBoatIdleTween?.stop();
      this.player.setVisible(false);

      cam.stopFollow();
      cam.setBounds(
        0,
        0,
        this.mapData.cols * TILE_SIZE + 260,
        this.mapData.rows * TILE_SIZE
      );
      cam.pan(
        this.royalBoatSprite.x + 28,
        this.royalBoatSprite.y,
        700,
        'Sine.easeOut'
      );

      this.time.delayedCall(750, () => {
        if (!this.royalBoatSprite) return;
        cam.startFollow(this.royalBoatSprite, true, 0.08, 0.08);
        this.tweens.add({
          targets: this.royalBoatSprite,
          x: this.royalBoatSprite.x + 220,
          duration: 2600,
          ease: 'Quad.easeIn'
        });
        this.tweens.add({
          targets: this.royalBoatSprite,
          y: this.royalBoatSprite.y + 4,
          duration: 420,
          yoyo: true,
          repeat: 5
        });
      });

      this.time.delayedCall(3450, () => {
        this.showModernEndingView();
      });
    } else {
      this.showModernEndingView();
    }
  }

  private showModernEndingView(): void {
    const prog = gameState.getStageProgress('qianlong');
    prog.qianlongEndingPhase = 'returned_modern';

    const END_W = 576;
    const END_H = 432;
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.removeBounds();
    const rawZoom = Math.min(
      this.scale.width / END_W,
      this.scale.height / END_H
    );
    cam.setZoom(rawZoom >= 1 ? Math.max(1, Math.floor(rawZoom)) : rawZoom);
    cam.centerOn(END_W / 2, END_H / 2 + 24);

    const overlay = this.add.container(0, 0).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x182233, 1);
    bg.fillRect(-600, -400, END_W + 1200, END_H + 800);

    // 現代維港夜景與摩天大樓燈火（僅用於穿越返回現代結局畫面）
    const buildings = [
      [34, 130, 46, 132],
      [92, 96, 54, 166],
      [158, 142, 42, 120],
      [212, 82, 60, 180],
      [284, 118, 50, 144],
      [346, 98, 58, 164],
      [416, 132, 48, 130],
      [476, 110, 52, 152]
    ];
    for (const [bx, by, bw, bh] of buildings) {
      bg.fillStyle(0x34496b, 1);
      bg.fillRect(bx, by, bw, bh);
      bg.fillStyle(0xffe48a, 0.86);
      for (let wy = by + 12; wy < by + bh - 14; wy += 18) {
        bg.fillRect(bx + 8, wy, 8, 8);
        if (bw > 44) {
          bg.fillRect(bx + 26, wy, 8, 8);
        }
      }
    }

    bg.fillStyle(0x13334d, 1);
    bg.fillRect(-600, 262, END_W + 1200, 420);
    bg.fillStyle(0x5ec2d6, 0.45);
    for (let i = 0; i < 9; i++) {
      bg.fillRect(28 + i * 62, 282 + (i % 3) * 16, 38, 4);
    }

    bg.fillStyle(0x781912, 0.96);
    bg.fillRect(46, 16, END_W - 92, 58);
    bg.lineStyle(3, 0xf0c246, 1);
    bg.strokeRect(46, 16, END_W - 92, 58);
    overlay.add(bg);

    const t1 = this.add
      .text(END_W / 2, 45, '已乘御船穿越時空返回現代', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '21px',
        color: '#ffe89e',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const student = this.add
      .sprite(END_W / 2, 224, 'char_student', CHAR_IDLE_FRAME.down)
      .setScale(2);
    student.play('char_student_down');

    overlay.add([t1, student]);

    const ui = this.registry.get('ui') as HudUI;
    ui.setNavigationHandlers({
      onGoTitle: () => this.scene.start('TitleScene'),
      onGoClassSelect:
        gameState.mode === 'class'
          ? () => this.scene.start('ClassSelectScene')
          : undefined
    });
    ui.renderEndingScreen(
      () => this.scene.start('TitleScene'),
      () => this.scene.start('ClassSelectScene')
    );
  }
}
