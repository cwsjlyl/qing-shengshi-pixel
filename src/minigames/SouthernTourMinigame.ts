import Phaser from 'phaser';
import { toCssSize } from '../gfx/CrispVisuals';
import { TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { bindRawPointerBridge } from '../input/rawPointerBridge';
import { MEDAL_LABELS, MedalRank, gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';
import { clearStaleTitleOrOpeningHud, stopOtherScenes } from '../scenes/exclusiveScene';

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
  kind: 'rock' | 'inspect' | 'luxury';
  handled: boolean;
}

const VOYAGES: VoyageStop[] = [
  { voyageNo: 1, city: '江蘇・揚州', note: '巡視運河樞紐，接駕排場盛大', costSilver: 165 },
  { voyageNo: 2, city: '江蘇・南京', note: '體察江寧民情，賞賜地方官民', costSilver: 165 },
  { voyageNo: 3, city: '江蘇・蘇州', note: '視察江南商貿，修繕行宮園林', costSilver: 165 },
  { voyageNo: 4, city: '浙江・杭州', note: '督導治理河道與海塘工程', costSilver: 165 },
  { voyageNo: 5, city: '長江三角洲・蘇州', note: '再次南巡蘇浙，隨行耗費浩繁', costSilver: 165 },
  { voyageNo: 6, city: '長江三角洲・杭州', note: '第六次遊江南，國庫銀兩大減', costSilver: 165 }
];

export class SouthernTourMinigame extends Phaser.Scene {
  private currentLane = 1;
  private boat!: Phaser.GameObjects.Image;
  private boatDragging = false;
  private boatDragOffX = 0;
  private boatDragOffY = 0;
  private voyageIdx = 0;
  private treasurySilver = INITIAL_TREASURY;
  private inspectCount = 0;
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
    this.inspectCount = 0;
    this.hullHp = 4;
    this.distanceElapsed = 0;
    this.ended = false;
    this.obstacles = [];
    this.bankProps = [];

    stopOtherScenes(this);
    clearStaleTitleOrOpeningHud(this);

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

    const laneGraphics = this.add.graphics();
    laneGraphics.lineStyle(1.5, 0x7cd1e3, 0.45);
    for (let x = 12; x < STAGE_W; x += 28) {
      laneGraphics.lineBetween(x, 189, x + 14, 189);
      laneGraphics.lineBetween(x, 255, x + 14, 255);
    }

    this.add
      .rectangle(STAGE_W / 2, 38, STAGE_W - 12, 68, 0x362018, 0.96)
      .setStrokeStyle(2.5, 0xf0c246)
      .setDepth(30);

    this.titleText = this.add
      .text(16, 14, '', {
        fontSize: '14px',
        color: '#ffe89e',
        fontStyle: 'bold',
        stroke: '#1e100a',
        strokeThickness: 2
      })
      .setDepth(31);

    this.cityBannerText = this.add
      .text(16, 40, '', {
        fontSize: '13px',
        color: '#dff6ec',
        fontStyle: 'bold',
        stroke: '#1e100a',
        strokeThickness: 2
      })
      .setDepth(31);

    this.add
      .text(312, 14, '國庫存銀：', {
        fontSize: '13px',
        color: '#fff8e7',
        fontStyle: 'bold',
        stroke: '#1e100a',
        strokeThickness: 2
      })
      .setDepth(31);

    this.silverText = this.add
      .text(382, 14, '', {
        fontSize: '14px',
        color: '#ffd54f',
        fontStyle: 'bold',
        stroke: '#1e100a',
        strokeThickness: 2
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

    this.boat = this.add
      .image(102, LANE_Y[this.currentLane], 'royal_boat')
      .setScale(0.75)
      .setDepth(20);

    const clampBoat = (x: number, y: number) => {
      const nx = Phaser.Math.Clamp(x, 56, STAGE_W - 72);
      const ny = Phaser.Math.Clamp(y, 138, 318);
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
    };

    const inPlayfield = (wx: number, wy: number) =>
      wx >= -40 && wx <= STAGE_W + 40 && wy >= 90 && wy <= STAGE_H + 20;

    bindRawPointerBridge(this, {
      onDown: (wx, wy) => {
        if (this.ended || !inPlayfield(wx, wy)) return;
        this.boatDragging = true;
        this.boatDragOffX = this.boat.x - wx;
        this.boatDragOffY = this.boat.y - wy;
        clampBoat(wx + this.boatDragOffX, wy + this.boatDragOffY);
      },
      onMove: (wx, wy) => {
        if (!this.boatDragging || this.ended) return;
        clampBoat(wx + this.boatDragOffX, wy + this.boatDragOffY);
      },
      onUp: () => {
        this.boatDragging = false;
      }
    });

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    this.applyVoyageTransition(0);

    this.spawnTimer = this.time.addEvent({
      delay: 880,
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
        '拖動御船避開「暗礁」與耗銀「奢華宴樂」，多收集綠色「治河民情」節省開支爭取御賜金印！',
      onRetry: () => this.scene.restart(),
      onLeave: () => this.scene.start('ExploreScene')
    });
  }

  private fitViewport(gameW: number, gameH: number): void {
    const { width: w, height: h, dpr } = toCssSize(gameW, gameH);
    const cam = this.cameras.main;
    const usableH = Math.max(250, h - 84);
    const rawZoom = Math.min(w / STAGE_W, usableH / STAGE_H);
    const cssZoom = rawZoom >= 1 ? Math.max(1, Math.floor(rawZoom)) : rawZoom;
    cam.setZoom(cssZoom * dpr);
    cam.centerOn(STAGE_W / 2, STAGE_H / 2 + 18);
  }

  private applyVoyageTransition(idx: number): void {
    const stop = VOYAGES[idx];
    this.treasurySilver = Math.max(80, this.treasurySilver - stop.costSilver);
    this.refreshTopHud();

    const costFloat = this.add
      .text(
        408,
        74,
        `第 ${stop.voyageNo} 次南巡開支 -${stop.costSilver}萬兩`,
        {
          fontSize: '13.5px',
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
          fontSize: '14.5px',
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
      `第 ${stop.voyageNo}/6 次南巡　｜　船身：${'♥'.repeat(this.hullHp)}　｜　治河：${this.inspectCount}`
    );
    this.cityBannerText.setText(`${stop.city} — ${stop.note}`);
    this.silverText.setText(`${this.treasurySilver} 萬兩`);

    const ratio = Phaser.Math.Clamp(
      this.treasurySilver / INITIAL_TREASURY,
      0.06,
      1
    );
    this.silverBarFill.width = 188 * ratio;
    this.silverBarFill.setFillStyle(ratio <= 0.35 ? 0xe0533c : 0xf2c138, 1);
  }

  private spawnCanalItem(): void {
    if (this.ended) return;
    const laneIdx = Phaser.Math.Between(0, 2);
    const roll = Math.random();
    const kind: 'rock' | 'inspect' | 'luxury' =
      roll < 0.36 ? 'inspect' : roll < 0.58 ? 'luxury' : 'rock';
    const cont = this.add
      .container(STAGE_W + 44, LANE_Y[laneIdx])
      .setDepth(16);

    if (kind === 'inspect') {
      const flag = this.add
        .image(0, 0, 'palace_tiles', TileIndex.FLEET_BANNER)
        .setScale(1.45);
      const lbl = this.add
        .text(0, -23, '治河民情', {
          fontSize: '11.5px',
          color: '#e8fcf4',
          backgroundColor: '#1e5c45',
          padding: { x: 4, y: 1.5 },
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
      cont.add([flag, lbl]);
    } else if (kind === 'luxury') {
      const incense = this.add
        .image(0, 0, 'palace_tiles', TileIndex.BRONZE_INCENSE)
        .setScale(1.4);
      const lbl = this.add
        .text(0, -23, '奢華宴樂', {
          fontSize: '11.5px',
          color: '#fff0c2',
          backgroundColor: '#6b235c',
          padding: { x: 4, y: 1.5 },
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
      cont.add([incense, lbl]);
    } else {
      const rock = this.add
        .image(0, 2, 'palace_tiles', TileIndex.TAIHU_ROCK)
        .setScale(1.3);
      const lbl = this.add
        .text(0, -23, '暗礁', {
          fontSize: '11.5px',
          color: '#ffe0dc',
          backgroundColor: '#6e1c14',
          padding: { x: 4, y: 1.5 },
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
      cont.add([rock, lbl]);
    }

    this.obstacles.push({
      sprite: cont,
      laneIdx,
      kind,
      handled: false
    });
  }

  public update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = delta / 1000;
    const scrollSpeed = 152;

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
        } else if (obs.kind === 'luxury') {
          obs.sprite.setVisible(false);
          this.treasurySilver = Math.max(60, this.treasurySilver - 45);
          this.refreshTopHud();
          const warn = this.add
            .text(this.boat.x, this.boat.y - 28, '接駕奢華 -45萬兩！', {
              fontSize: '13.5px',
              color: '#ffb0e6',
              fontStyle: 'bold',
              stroke: '#38102e',
              strokeThickness: 3
            })
            .setOrigin(0.5)
            .setDepth(35);
          this.tweens.add({
            targets: warn,
            y: warn.y - 20,
            alpha: 0,
            duration: 750,
            onComplete: () => warn.destroy()
          });
        } else {
          obs.sprite.setVisible(false);
          this.inspectCount++;
          this.treasurySilver = Math.min(INITIAL_TREASURY, this.treasurySilver + 20);
          this.refreshTopHud();
          const praise = this.add
            .text(this.boat.x, this.boat.y - 28, '治理河道・節省公帑 +20萬兩', {
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
            duration: 750,
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
    const medal: MedalRank =
      this.hullHp >= 3 && this.inspectCount >= 3
        ? 'gold'
        : this.hullHp >= 2
          ? 'silver'
          : 'bronze';

    if (won) {
      gameState.markMinigameCompleted('tour_game', 'qianlong', medal);
      ui.updateMinigameStatus(
        `<span style="color:#98ffd0;font-weight:800;">✓ 獲得【${MEDAL_LABELS[medal]}】！看見南巡耗減國庫，同時能瞭解民情、治理河道。</span>`
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
        468,
        204,
        won ? 0x1e4a38 : 0x5c1914,
        0.97
      )
      .setStrokeStyle(3, 0xf2c749);

    const summary = won
      ? `六次乘船下江南完成！【${MEDAL_LABELS[medal]}】\n途經揚州、南京、蘇州、杭州（長江三角洲）。\n國庫餘銀 ${this.treasurySilver} 萬兩：可見南巡花費龐大耗損國力，\n惟視察治河民情（共 ${this.inspectCount} 次）亦有助地方安定！`
      : '御船多次觸礁需要修整。\n請避開暗礁，重新完成六次下江南航程！';

    const txt = this.add
      .text(STAGE_W / 2, STAGE_H / 2 - 20, summary, {
        fontSize: '14px',
        color: '#fff8e7',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 5,
        stroke: '#1b0d08',
        strokeThickness: 2.5
      })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(STAGE_W / 2, STAGE_H / 2 + 72, 226, 38, 0xf0c451, 1)
      .setStrokeStyle(2, 0x523809)
      .setInteractive({ useHandCursor: true });

    const btnLabel = this.add
      .text(
        STAGE_W / 2,
        STAGE_H / 2 + 72,
        won ? '完成挑戰，返回碼頭 ▶' : '重新啟航 ↻',
        {
          fontSize: '15px',
          color: '#241304',
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
