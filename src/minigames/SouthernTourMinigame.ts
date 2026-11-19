import Phaser from 'phaser';
import { TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';

const STAGE_W = 528;
const STAGE_H = 396;
const LANE_Y = [156, 222, 288];
const INITIAL_TREASURY = 1200;

interface VoyageStop {
  voyageNo: number;
  city: string;
  note: string;
  costSilver: number;
}

interface CanalObstacle {
  sprite: Phaser.GameObjects.Container;
  laneIdx: number;
  kind: 'rock' | 'inspect';
  handled: boolean;
}

const VOYAGES: VoyageStop[] = [
  { voyageNo: 1, city: '江蘇・揚州', note: '巡視運河樞紐，接駕排場盛大', costSilver: 180 },
  { voyageNo: 2, city: '江蘇・南京', note: '體察江寧民情，賞賜地方官民', costSilver: 180 },
  { voyageNo: 3, city: '江蘇・蘇州', note: '視察江南商貿，修繕行宮園林', costSilver: 180 },
  { voyageNo: 4, city: '浙江・杭州', note: '督導治理河道與海塘工程', costSilver: 180 },
  { voyageNo: 5, city: '長江三角洲・蘇州', note: '再次南巡蘇浙，隨行耗費浩繁', costSilver: 180 },
  { voyageNo: 6, city: '長江三角洲・杭州', note: '第六次遊江南，國庫銀兩大減', costSilver: 180 }
];

export class SouthernTourMinigame extends Phaser.Scene {
  private currentLane = 1;
  private boat!: Phaser.GameObjects.Image;
  private boatDragging = false;
  private boatDragOffX = 0;
  private boatDragOffY = 0;
  private voyageIdx = 0;
  private treasurySilver = INITIAL_TREASURY;
  private hullHp = 4;
  private distanceElapsed = 0;
  private ended = false;

  private titleText!: Phaser.GameObjects.Text;
  private silverText!: Phaser.GameObjects.Text;
  private silverBarFill!: Phaser.GameObjects.Rectangle;
  private cityBannerText!: Phaser.GameObjects.Text;

  private obstacles: CanalObstacle[] = [];
  private bankProps: Phaser.GameObjects.Image[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('SouthernTourMinigame');
  }

  public create(): void {
    this.currentLane = 1;
    this.voyageIdx = 0;
    this.treasurySilver = INITIAL_TREASURY;
    this.hullHp = 4;
    this.distanceElapsed = 0;
    this.ended = false;
    this.obstacles = [];
    this.bankProps = [];

    this.cameras.main.setBackgroundColor('#216878');
    this.input.setTopOnly(false);
    this.fitViewport(this.scale.width, this.scale.height);

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.fitViewport(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
    });

    // 江南運河兩岸青石堤岸、粉牆與垂柳全幅背景
    for (let x = -4; x < 28; x++) {
      const px = x * TILE_SIZE + 12;
      this.add.image(px, 84, 'palace_tiles', TileIndex.GRASS_A);
      this.add.image(px, 108, 'palace_tiles', TileIndex.WATER_BANK_TOP);
      this.add.image(px, 344, 'palace_tiles', TileIndex.STONE_PAVING);
      this.add.image(px, 368, 'palace_tiles', TileIndex.GRASS_B);
    }

    for (let i = 0; i < 8; i++) {
      const wx = i * 76;
      const wTop = this.add
        .image(wx, 82, 'palace_tiles', TileIndex.WILLOW_CANOPY)
        .setScale(1.35)
        .setDepth(8);
      const wBot = this.add
        .image(wx + 32, 358, 'palace_tiles', TileIndex.WILLOW_CANOPY)
        .setScale(1.35)
        .setDepth(8);
      this.bankProps.push(wTop, wBot);
    }

    // 三條水路航道分隔線（僅視覺參考；船隻可在運河內自由移動）
    const laneGraphics = this.add.graphics();
    laneGraphics.lineStyle(1.5, 0x7cd1e3, 0.45);
    for (let x = 12; x < STAGE_W; x += 28) {
      laneGraphics.lineBetween(x, 189, x + 14, 189);
      laneGraphics.lineBetween(x, 255, x + 14, 255);
    }

    // Large invisible water pad for grab-anywhere boat control (iPad-friendly)
    const waterPad = this.add
      .rectangle(STAGE_W / 2, 222, STAGE_W + 40, 220, 0xffffff, 0.001)
      .setDepth(14);

    // 頂部雙列資訊牌匾與國庫存銀遞減條
    this.add
      .rectangle(STAGE_W / 2, 38, STAGE_W - 12, 68, 0x362018, 0.96)
      .setStrokeStyle(2.5, 0xf0c246)
      .setDepth(30);

    this.titleText = this.add
      .text(16, 14, '', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '14px',
        color: '#ffe89e',
        fontStyle: 'bold'
      })
      .setDepth(31);

    this.cityBannerText = this.add
      .text(16, 40, '', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '13px',
        color: '#d5f0e5',
        fontStyle: 'bold'
      })
      .setDepth(31);

    this.add
      .text(312, 14, '國庫存銀：', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '13px',
        color: '#fff8e7',
        fontStyle: 'bold'
      })
      .setDepth(31);

    this.silverText = this.add
      .text(382, 14, '', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '14px',
        color: '#ffd54f',
        fontStyle: 'bold'
      })
      .setDepth(31);

    this.add
      .rectangle(410, 48, 192, 16, 0x1a0f0a, 1)
      .setStrokeStyle(1.5, 0xc9962c)
      .setDepth(31);

    this.silverBarFill = this.add
      .rectangle(316, 48, 188, 12, 0xf2c138, 1)
      .setOrigin(0, 0.5)
      .setDepth(32);

    // 雕龍御船：觸控拖曳可在運河內上下左右移動；鍵盤亦可操控
    this.boat = this.add
      .image(102, LANE_Y[this.currentLane], 'royal_boat')
      .setScale(0.75)
      .setDepth(20);

    const pointerWorld = (p: Phaser.Input.Pointer) => {
      const cam = this.cameras.main;
      return cam.getWorldPoint(p.x, p.y);
    };
    const clampBoat = (x: number, y: number) => {
      const nx = Phaser.Math.Clamp(x, 56, STAGE_W - 72);
      const ny = Phaser.Math.Clamp(y, 138, 318);
      this.boat.setPosition(nx, ny);
      // Keep lane index for HUD / legacy; collision uses free Y
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < LANE_Y.length; i++) {
        const d = Math.abs(ny - LANE_Y[i]);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      this.currentLane = best;
    };
    const beginBoatDrag = (p: Phaser.Input.Pointer) => {
      if (this.ended) return;
      const w = pointerWorld(p);
      // Accept grab near boat OR anywhere on water pad (no tiny hit box)
      const nearBoat =
        Math.abs(w.x - this.boat.x) < 90 && Math.abs(w.y - this.boat.y) < 70;
      const onWater =
        w.y >= 130 && w.y <= 330 && w.x >= 20 && w.x <= STAGE_W - 20;
      if (!nearBoat && !onWater) return;
      this.boatDragging = true;
      this.boatDragOffX = this.boat.x - w.x;
      this.boatDragOffY = this.boat.y - w.y;
      if (nearBoat || onWater) {
        clampBoat(w.x + this.boatDragOffX, w.y + this.boatDragOffY);
      }
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => beginBoatDrag(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.boatDragging || this.ended) return;
      const w = pointerWorld(p);
      clampBoat(w.x + this.boatDragOffX, w.y + this.boatDragOffY);
    });
    const endDrag = () => {
      this.boatDragging = false;
    };
    this.input.on('pointerup', endDrag);
    this.input.on('pointerupoutside', endDrag);
    // Keep pad reference so it is not GC-optimized away from scene graph
    waterPad.setVisible(true);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    this.applyVoyageTransition(0);

    this.spawnTimer = this.time.addEvent({
      delay: 920,
      loop: true,
      callback: () => this.spawnCanalItem()
    });

    const ui = this.registry.get('ui') as HudUI;
    ui.setNavigationHandlers({
      onGoTitle: () => this.scene.start('TitleScene'),
      onGoClassSelect:
        gameState.mode === 'class'
          ? () => this.scene.start('ClassSelectScene')
          : undefined
    });
    ui.renderMinigamePanel({
      title: '六次乘船下江南挑戰（乾隆朝）',
      instruction:
        '用手指拖動御船（或按方向鍵）在運河內上下左右移動，避開暗礁，完成六次遊江南航程，並觀察上方國庫存銀遞減！',
      onRetry: () => this.scene.restart(),
      onLeave: () => this.scene.start('ExploreScene')
    });
  }

  private fitViewport(w: number, h: number): void {
    const cam = this.cameras.main;
    const usableH = Math.max(250, h - 84);
    const rawZoom = Math.min(w / STAGE_W, usableH / STAGE_H);
    const zoom = rawZoom >= 1 ? Math.max(1, Math.floor(rawZoom)) : rawZoom;
    cam.setZoom(zoom);
    cam.centerOn(STAGE_W / 2, STAGE_H / 2 + 18);
  }

  private setBoatLane(lane: number): void {
    this.currentLane = lane;
    this.tweens.add({
      targets: this.boat,
      x: Phaser.Math.Clamp(this.boat.x, 56, STAGE_W - 72),
      y: LANE_Y[lane],
      duration: 130,
      ease: 'Sine.easeOut'
    });
  }

  private applyVoyageTransition(idx: number): void {
    const stop = VOYAGES[idx];
    this.treasurySilver = Math.max(120, this.treasurySilver - stop.costSilver);
    this.refreshTopHud();

    const costFloat = this.add
      .text(
        408,
        74,
        `第 ${stop.voyageNo} 次南巡開支 -${stop.costSilver}萬兩`,
        {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '13px',
          color: '#ff9e99',
          fontStyle: 'bold',
          stroke: '#24120c',
          strokeThickness: 3
        }
      )
      .setOrigin(0.5)
      .setDepth(38);

    this.tweens.add({
      targets: costFloat,
      y: 94,
      alpha: 0,
      duration: 1500,
      onComplete: () => costFloat.destroy()
    });

    const archBanner = this.add
      .text(
        STAGE_W / 2,
        124,
        `第 ${stop.voyageNo} 次遊江南：抵達 ${stop.city}`,
        {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '14px',
          color: '#ffe89e',
          backgroundColor: '#7d1c14',
          padding: { x: 10, y: 4 },
          fontStyle: 'bold'
        }
      )
      .setOrigin(0.5)
      .setDepth(35);

    this.tweens.add({
      targets: archBanner,
      alpha: 0,
      delay: 1500,
      duration: 500,
      onComplete: () => archBanner.destroy()
    });
  }

  private refreshTopHud(): void {
    const stop = VOYAGES[Math.min(this.voyageIdx, VOYAGES.length - 1)];
    this.titleText.setText(
      `航程：第 ${stop.voyageNo} / 6 次南巡　｜　船身穩固：${'♥'.repeat(this.hullHp)}`
    );
    this.cityBannerText.setText(`${stop.city} — ${stop.note}`);
    this.silverText.setText(`${this.treasurySilver} 萬兩`);

    const ratio = Phaser.Math.Clamp(
      this.treasurySilver / INITIAL_TREASURY,
      0.08,
      1
    );
    this.silverBarFill.width = 188 * ratio;
    this.silverBarFill.setFillStyle(ratio <= 0.35 ? 0xe0533c : 0xf2c138, 1);
  }

  private spawnCanalItem(): void {
    if (this.ended) return;
    const laneIdx = Phaser.Math.Between(0, 2);
    const isInspect = Math.random() < 0.35;
    const cont = this.add
      .container(STAGE_W + 44, LANE_Y[laneIdx])
      .setDepth(16);

    if (isInspect) {
      const flag = this.add
        .image(0, 0, 'palace_tiles', TileIndex.FLEET_BANNER)
        .setScale(1.45);
      const lbl = this.add
        .text(0, -22, '治河民情', {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '11px',
          color: '#d5f0e5',
          backgroundColor: '#1e5c45',
          padding: { x: 3, y: 1 }
        })
        .setOrigin(0.5);
      cont.add([flag, lbl]);
    } else {
      const rock = this.add
        .image(0, 2, 'palace_tiles', TileIndex.TAIHU_ROCK)
        .setScale(1.3);
      const lbl = this.add
        .text(0, -22, '暗礁', {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '11px',
          color: '#ffd6d1',
          backgroundColor: '#6e1c14',
          padding: { x: 3, y: 1 }
        })
        .setOrigin(0.5);
      cont.add([rock, lbl]);
    }

    this.obstacles.push({
      sprite: cont,
      laneIdx,
      kind: isInspect ? 'inspect' : 'rock',
      handled: false
    });
  }

  public update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = delta / 1000;
    const scrollSpeed = 152;

    // Keyboard free movement inside the canal
    if (!this.boatDragging && this.cursors) {
      let kx = 0;
      let ky = 0;
      if (this.cursors.left?.isDown) kx -= 1;
      if (this.cursors.right?.isDown) kx += 1;
      if (this.cursors.up?.isDown) ky -= 1;
      if (this.cursors.down?.isDown) ky += 1;
      if (kx !== 0 || ky !== 0) {
        const speed = 170 * dt;
        const mag = Math.hypot(kx, ky) || 1;
        const nx = Phaser.Math.Clamp(
          this.boat.x + (kx / mag) * speed,
          56,
          STAGE_W - 72
        );
        const ny = Phaser.Math.Clamp(
          this.boat.y + (ky / mag) * speed,
          138,
          318
        );
        this.boat.setPosition(nx, ny);
        let best = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < LANE_Y.length; i++) {
          const d = Math.abs(ny - LANE_Y[i]);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        }
        this.currentLane = best;
      }
    }

    for (const prop of this.bankProps) {
      prop.x -= scrollSpeed * 0.65 * dt;
      if (prop.x < -36) {
        prop.x = STAGE_W + 36;
      }
    }

    this.distanceElapsed += dt;
    const targetIdx = Math.floor(this.distanceElapsed / 3.4);
    if (targetIdx > this.voyageIdx) {
      if (targetIdx >= VOYAGES.length) {
        this.finishVoyage(true);
        return;
      }
      this.voyageIdx = targetIdx;
      this.applyVoyageTransition(this.voyageIdx);
    }

    for (const obs of this.obstacles) {
      obs.sprite.x -= scrollSpeed * dt;
      if (
        !obs.handled &&
        Math.abs(obs.sprite.y - this.boat.y) < 40 &&
        Math.abs(obs.sprite.x - this.boat.x) < 48
      ) {
        obs.handled = true;
        if (obs.kind === 'rock') {
          this.hullHp--;
          this.cameras.main.shake(160, 0.008);
          this.refreshTopHud();
          obs.sprite.setVisible(false);
          if (this.hullHp <= 0) {
            this.finishVoyage(false);
            return;
          }
        } else {
          obs.sprite.setVisible(false);
          const praise = this.add
            .text(this.boat.x, this.boat.y - 28, '瞭解民情・治理河道！', {
              fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
              fontSize: '13px',
              color: '#98ffd0',
              fontStyle: 'bold',
              stroke: '#16382b',
              strokeThickness: 3
            })
            .setOrigin(0.5)
            .setDepth(35);
          this.tweens.add({
            targets: praise,
            y: praise.y - 20,
            alpha: 0,
            duration: 700,
            onComplete: () => praise.destroy()
          });
        }
      }
    }

    this.obstacles = this.obstacles.filter((o) => {
      if (o.sprite.x < -60) {
        o.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  private finishVoyage(won: boolean): void {
    this.ended = true;
    this.spawnTimer?.remove(false);

    const ui = this.registry.get('ui') as HudUI;

    if (won) {
      gameState.markMinigameCompleted('tour_game', 'qianlong');
      ui.updateMinigameStatus(
        '<span style="color:#98ffd0;font-weight:800;">✓ 已完成「六下江南挑戰」！看見南巡花費龐大耗減國庫，同時能瞭解民情、治理河道。</span>'
      );
    } else {
      ui.updateMinigameStatus(
        '<span style="color:#ffb4a8;font-weight:800;">御船撞上太多暗礁受損，請點按重試完成六次南巡航程！</span>'
      );
    }

    const modal = this.add.container(0, 0).setDepth(60);
    const box = this.add
      .rectangle(
        STAGE_W / 2,
        STAGE_H / 2 + 10,
        460,
        198,
        won ? 0x1e4a38 : 0x5c1914,
        0.97
      )
      .setStrokeStyle(3, 0xf2c749);

    const summary = won
      ? '六次乘船下江南完成！\n經過揚州、南京、蘇州、杭州（江南長江三角洲）。\n國庫由 1200 萬兩減至 120 萬兩：可見南巡花費龐大，\n耗用人力物力；但同時也能瞭解民情、治理河道！'
      : '御船多次觸礁需要修整。\n請避開暗礁，重新完成六次下江南航程！';

    const txt = this.add
      .text(STAGE_W / 2, STAGE_H / 2 - 18, summary, {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '14px',
        color: '#fff8e7',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 5
      })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(STAGE_W / 2, STAGE_H / 2 + 70, 226, 38, 0xf0c451, 1)
      .setStrokeStyle(2, 0x523809)
      .setInteractive({ useHandCursor: true });

    const btnLabel = this.add
      .text(
        STAGE_W / 2,
        STAGE_H / 2 + 70,
        won ? '完成挑戰，返回碼頭 ▶' : '重新啟航 ↻',
        {
          fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
          fontSize: '15px',
          color: '#2b1808',
          fontStyle: 'bold'
        }
      )
      .setOrigin(0.5);

    btn.on('pointerdown', () => {
      if (won) {
        this.scene.start('ExploreScene');
      } else {
        this.scene.restart();
      }
    });

    modal.add([box, txt, btn, btnLabel]);
  }
}
