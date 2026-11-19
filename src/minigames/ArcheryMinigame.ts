import Phaser from 'phaser';
import { CHAR_IDLE_FRAME, TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';

const STAGE_W = 528;
const STAGE_H = 396;
const GOAL_SCORE = 6;
const TOTAL_ARROWS = 15;

interface RebelTarget {
  container: Phaser.GameObjects.Container;
  vx: number;
  active: boolean;
}

interface FlyingArrow {
  line: Phaser.GameObjects.Container;
  vx: number;
  vy: number;
  active: boolean;
}

export class ArcheryMinigame extends Phaser.Scene {
  private targets: RebelTarget[] = [];
  private arrows: FlyingArrow[] = [];
  private score = 0;
  private arrowsLeft = TOTAL_ARROWS;
  private ended = false;
  private hudText!: Phaser.GameObjects.Text;
  private bowContainer!: Phaser.GameObjects.Container;
  private aimAngle = -Math.PI / 2;
  private lastShotAt = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('ArcheryMinigame');
  }

  public create(): void {
    this.targets = [];
    this.arrows = [];
    this.score = 0;
    this.arrowsLeft = TOTAL_ARROWS;
    this.ended = false;
    this.aimAngle = -Math.PI / 2;

    this.cameras.main.setBackgroundColor('#c4a974');
    this.input.setTopOnly(false);
    this.fitViewport(this.scale.width, this.scale.height);

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.fitViewport(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
    });

    // 西北邊疆沙原與草地全幅背景
    for (let y = -4; y < 22; y++) {
      for (let x = -6; x < 28; x++) {
        const tile =
          y < 3
            ? (x + y) % 2 === 0
              ? TileIndex.GRASS_A
              : TileIndex.GRASS_B
            : (x + y) % 2 === 0
              ? TileIndex.SAND_A
              : TileIndex.SAND_B;
        this.add.image(x * TILE_SIZE + 12, y * TILE_SIZE + 12, 'palace_tiles', tile);
      }
    }

    // 雙格清軍大帳點綴
    this.add.image(36, 76, 'palace_tiles', TileIndex.ARMY_TENT_LEFT).setScale(1.4);
    this.add.image(70, 76, 'palace_tiles', TileIndex.ARMY_TENT_RIGHT).setScale(1.4);
    this.add.image(458, 76, 'palace_tiles', TileIndex.ARMY_TENT_LEFT).setScale(1.4);
    this.add.image(492, 76, 'palace_tiles', TileIndex.ARMY_TENT_RIGHT).setScale(1.4);

    // 頂部計分牌匾
    this.add
      .rectangle(STAGE_W / 2, 26, STAGE_W - 20, 38, 0x5e1510, 0.96)
      .setStrokeStyle(2.5, 0xf0c246);

    this.hudText = this.add
      .text(STAGE_W / 2, 26, '', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '15px',
        color: '#ffe89e',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.updateHud();

    // 三條移動標靶橫道
    const lanes = [
      { y: 102, speed: 98 },
      { y: 168, speed: -124 },
      { y: 232, speed: 88 }
    ];
    lanes.forEach((ln, i) => {
      this.spawnTargetAt(110 + i * 140, ln.y, ln.speed);
      this.spawnTargetAt(340 - i * 90, ln.y, ln.speed);
    });

    // 底部清兵射手與雕弓瞄準器
    this.add
      .sprite(STAGE_W / 2, 364, 'char_qing_soldier', CHAR_IDLE_FRAME.up)
      .setScale(1.7);

    this.bowContainer = this.add.container(STAGE_W / 2, 338).setDepth(25);
    const bowArc = this.add.graphics();
    bowArc.lineStyle(3, 0x6b3e1d, 1);
    bowArc.beginPath();
    bowArc.arc(0, 0, 24, -Math.PI * 0.85, -Math.PI * 0.15, false);
    bowArc.strokePath();
    bowArc.lineStyle(1.5, 0xf5efe2, 0.9);
    bowArc.lineBetween(-20, -10, 20, -10);

    const guideDot = this.add.rectangle(0, -30, 4, 15, 0xffe48a, 1);
    this.bowContainer.add([bowArc, guideDot]);

    // 觸控與滑鼠世界座標瞄準發射
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.ended) return;
      if (p.isDown) this.aimAtPoint(p.worldX, p.worldY);
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.ended) return;
      this.aimAtPoint(p.worldX, p.worldY);
      this.fireArrow();
    });

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.keyboard
        .addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        .on('down', () => {
          if (!this.ended) this.fireArrow();
        });
    }

    const ui = this.registry.get('ui') as HudUI;
    ui.setNavigationHandlers({
      onGoTitle: () => this.scene.start('TitleScene'),
      onGoClassSelect:
        gameState.mode === 'class'
          ? () => this.scene.start('ClassSelectScene')
          : undefined
    });
    ui.renderMinigamePanel({
      title: '射箭平亂挑戰（乾隆朝）',
      instruction:
        '直接點按主畫面上的移動標靶即可瞄準發射弓箭（電腦亦可用左右鍵瞄準、空白鍵發射），擊倒 6 個標靶即過關！',
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

  private spawnTargetAt(x: number, y: number, speed: number): void {
    const c = this.add.container(x, y).setDepth(15);
    const shield = this.add
      .image(0, 0, 'palace_tiles', TileIndex.ARCHERY_TARGET)
      .setScale(1.65);
    const label = this.add
      .text(0, -24, '叛軍標靶', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '11px',
        color: '#fff8e7',
        backgroundColor: '#7a1c14',
        padding: { x: 4, y: 1 }
      })
      .setOrigin(0.5);
    c.add([shield, label]);

    this.targets.push({
      container: c,
      vx: speed,
      active: true
    });
  }

  private aimAtPoint(px: number, py: number): void {
    const raw = Math.atan2(py - this.bowContainer.y, px - this.bowContainer.x);
    this.aimAngle = Phaser.Math.Clamp(raw, -Math.PI + 0.25, -0.25);
    this.bowContainer.setRotation(this.aimAngle + Math.PI / 2);
  }

  private fireArrow(): void {
    const now = this.time.now;
    if (now - this.lastShotAt < 230 || this.arrowsLeft <= 0 || this.ended) {
      return;
    }
    this.lastShotAt = now;
    this.arrowsLeft--;
    this.updateHud();

    const arrowCont = this.add
      .container(this.bowContainer.x, this.bowContainer.y)
      .setDepth(22);
    const shaft = this.add.rectangle(0, 0, 4, 24, 0xf5efe2, 1);
    const tip = this.add.rectangle(0, -13, 6, 6, 0xe8ba4b, 1);
    const feather = this.add.rectangle(0, 11, 6, 5, 0xd93829, 1);
    arrowCont.add([shaft, tip, feather]);
    arrowCont.setRotation(this.aimAngle + Math.PI / 2);

    const speed = 380;
    this.arrows.push({
      line: arrowCont,
      vx: Math.cos(this.aimAngle) * speed,
      vy: Math.sin(this.aimAngle) * speed,
      active: true
    });
  }

  private updateHud(): void {
    this.hudText.setText(
      `擊倒標靶：${this.score} / ${GOAL_SCORE}　｜　剩餘羽箭：${this.arrowsLeft}`
    );
  }

  public update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = delta / 1000;

    if (this.cursors?.left.isDown) {
      this.aimAngle = Phaser.Math.Clamp(
        this.aimAngle - 1.8 * dt,
        -Math.PI + 0.25,
        -0.25
      );
      this.bowContainer.setRotation(this.aimAngle + Math.PI / 2);
    } else if (this.cursors?.right.isDown) {
      this.aimAngle = Phaser.Math.Clamp(
        this.aimAngle + 1.8 * dt,
        -Math.PI + 0.25,
        -0.25
      );
      this.bowContainer.setRotation(this.aimAngle + Math.PI / 2);
    }

    for (const t of this.targets) {
      if (!t.active) continue;
      t.container.x += t.vx * dt;
      if (t.container.x < 48) {
        t.container.x = 48;
        t.vx = Math.abs(t.vx);
      } else if (t.container.x > STAGE_W - 48) {
        t.container.x = STAGE_W - 48;
        t.vx = -Math.abs(t.vx);
      }
    }

    for (const arr of this.arrows) {
      if (!arr.active) continue;
      arr.line.x += arr.vx * dt;
      arr.line.y += arr.vy * dt;

      for (const t of this.targets) {
        if (!t.active) continue;
        const d = Phaser.Math.Distance.Between(
          arr.line.x,
          arr.line.y,
          t.container.x,
          t.container.y
        );
        if (d < 26) {
          arr.active = false;
          arr.line.destroy();
          this.onTargetHit(t);
          break;
        }
      }

      if (
        arr.active &&
        (arr.line.x < -30 || arr.line.x > STAGE_W + 30 || arr.line.y < 36)
      ) {
        arr.active = false;
        arr.line.destroy();
      }
    }

    const anyFlying = this.arrows.some((a) => a.active);
    if (this.arrowsLeft <= 0 && !anyFlying && this.score < GOAL_SCORE) {
      this.endMinigame(false);
    }
  }

  private onTargetHit(target: RebelTarget): void {
    target.active = false;
    this.score++;
    this.updateHud();

    const hitText = this.add
      .text(target.container.x, target.container.y, '命中！', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '15px',
        color: '#ffe48a',
        fontStyle: 'bold',
        stroke: '#3b120c',
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(35);

    this.tweens.add({
      targets: hitText,
      y: hitText.y - 24,
      alpha: 0,
      duration: 550,
      onComplete: () => hitText.destroy()
    });

    target.container.setVisible(false);

    if (this.score >= GOAL_SCORE) {
      this.endMinigame(true);
      return;
    }

    this.time.delayedCall(1100, () => {
      if (this.ended) return;
      target.active = true;
      target.container.setVisible(true);
    });
  }

  private endMinigame(won: boolean): void {
    this.ended = true;
    const ui = this.registry.get('ui') as HudUI;

    if (won) {
      gameState.markMinigameCompleted('archery_game', 'qianlong');
      ui.updateMinigameStatus(
        '<span style="color:#98ffd0;font-weight:800;">✓ 已完成「射箭平亂挑戰」！平定準噶爾叛亂，奠定清朝的版圖。</span>'
      );
    } else {
      ui.updateMinigameStatus(
        '<span style="color:#ffb4a8;font-weight:800;">羽箭已用盡，尚未擊倒 6 個標靶，請再試一次！</span>'
      );
    }

    const modal = this.add.container(0, 0).setDepth(60);
    const box = this.add
      .rectangle(
        STAGE_W / 2,
        STAGE_H / 2,
        436,
        180,
        won ? 0x1e4a38 : 0x5c1914,
        0.97
      )
      .setStrokeStyle(3, 0xf2c749);

    const msg = won
      ? '大捷！成功平定準噶爾叛亂，\n奠定清朝的版圖！\n（惟十次派兵軍費巨大，亦消耗不少國力）'
      : '羽箭已用盡，尚未擊倒足夠目標。\n請重新瞄準再試一次！';

    const txt = this.add
      .text(STAGE_W / 2, STAGE_H / 2 - 24, msg, {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '15px',
        color: '#fff8e7',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 6
      })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(STAGE_W / 2, STAGE_H / 2 + 54, 224, 40, 0xf0c451, 1)
      .setStrokeStyle(2, 0x523809)
      .setInteractive({ useHandCursor: true });

    const btnLabel = this.add
      .text(
        STAGE_W / 2,
        STAGE_H / 2 + 54,
        won ? '完成挑戰，返回戶外 ▶' : '重新挑戰 ↻',
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
