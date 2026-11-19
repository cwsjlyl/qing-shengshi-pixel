import Phaser from 'phaser';
import { CHAR_IDLE_FRAME, TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';
import { clearStaleTitleOrOpeningHud, stopOtherScenes } from '../scenes/exclusiveScene';

const STAGE_W = 528;
const STAGE_H = 396;
const TARGET_HITS = 8;
const MAX_MISTAKES = 3;
const ROUND_SECONDS = 28;

type PopRole = 'corrupt' | 'upright' | 'citizen';

interface WindowCell {
  x: number;
  y: number;
  occupant: PopRole | null;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  tagBg: Phaser.GameObjects.Rectangle;
  tagText: Phaser.GameObjects.Text;
  hideEvent?: Phaser.Time.TimerEvent;
}

export class WhackMinigame extends Phaser.Scene {
  private cells: WindowCell[] = [];
  private hits = 0;
  private mistakes = 0;
  private timeLeft = ROUND_SECONDS;
  private isEnded = false;
  private hudText!: Phaser.GameObjects.Text;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private clockTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('WhackMinigame');
  }

  public create(): void {
    this.cells = [];
    this.hits = 0;
    this.mistakes = 0;
    this.timeLeft = ROUND_SECONDS;
    this.isEnded = false;

    stopOtherScenes(this);
    clearStaleTitleOrOpeningHud(this);

        this.cameras.main.setBackgroundColor('#261611');
    this.input.setTopOnly(false);
    this.fitViewport(this.scale.width, this.scale.height);

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.fitViewport(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
    });

    // 宮牆琉璃瓦全幅底圖
    for (let y = -4; y < 22; y++) {
      for (let x = -6; x < 28; x++) {
        const tile =
          y < 2
            ? TileIndex.ROOF_GOLD_SLOPE
            : y === 2
              ? TileIndex.RED_WALL_FRIEZE
              : TileIndex.RED_WALL_MID;
        this.add
          .image(x * TILE_SIZE + 12, y * TILE_SIZE + 12, 'palace_tiles', tile)
          .setAlpha(0.5);
      }
    }

    // 頂部計分牌匾
    this.add
      .rectangle(STAGE_W / 2, 28, STAGE_W - 20, 42, 0x5e1510, 0.96)
      .setStrokeStyle(2.5, 0xf0c246);

    this.hudText = this.add
      .text(STAGE_W / 2, 28, '', {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '15px',
        color: '#ffe89e',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.refreshTopBar();

    // 2x3 雕花檻窗格
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const cx = 108 + c * 156;
        const cy = 138 + r * 144;

        this.add
          .rectangle(cx, cy, 132, 118, 0x21120d, 0.96)
          .setStrokeStyle(3, 0xd99e2b);
        this.add
          .rectangle(cx, cy + 48, 138, 16, 0x8c251c, 1)
          .setStrokeStyle(2, 0xf2c749);

        const popContainer = this.add.container(cx, cy + 8).setVisible(false);
        const spr = this.add
          .sprite(0, 6, 'char_corrupt_a', CHAR_IDLE_FRAME.down)
          .setScale(1.75);
        const tagBg = this.add
          .rectangle(0, -40, 116, 22, 0x8c1d18, 1)
          .setStrokeStyle(1.5, 0xffe48a);
        const tagText = this.add
          .text(0, -40, '貪官', {
            fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold'
          })
          .setOrigin(0.5);

        popContainer.add([spr, tagBg, tagText]);

        const hitZone = this.add
          .rectangle(cx, cy, 148, 132, 0xffffff, 0.001)
          .setDepth(30)
          .setInteractive({ useHandCursor: true, pixelPerfect: false });

        const cell: WindowCell = {
          x: cx,
          y: cy,
          occupant: null,
          container: popContainer,
          sprite: spr,
          tagBg,
          tagText
        };

        hitZone.on('pointerdown', () => this.onWhackCell(cell));
        this.cells.push(cell);
      }
    }

    this.spawnTimer = this.time.addEvent({
      delay: 680,
      loop: true,
      callback: () => this.spawnRandomWindow()
    });

    this.clockTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.isEnded) return;
        this.timeLeft--;
        this.refreshTopBar();
        if (this.timeLeft <= 0) {
          this.finishGame(false, '時間到了！尚未追查足夠貪官，請再試一次！');
        }
      }
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
      title: '打擊貪官挑戰（雍正朝）',
      instruction:
        '請只點按紅色標籤「貪官」（目標 8 次），切勿誤傷綠色「清官」或藍色「百姓」！',
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

  private refreshTopBar(): void {
    this.hudText.setText(
      `已懲貪官：${this.hits} / ${TARGET_HITS}　｜　誤傷：${this.mistakes} / ${MAX_MISTAKES}　｜　時間：${this.timeLeft}秒`
    );
  }

  private spawnRandomWindow(): void {
    if (this.isEnded) return;
    const freeCells = this.cells.filter((c) => c.occupant === null);
    if (freeCells.length === 0) return;

    const cell = Phaser.Utils.Array.GetRandom(freeCells);
    const roll = Math.random();
    let role: PopRole = 'corrupt';
    if (roll > 0.62 && roll <= 0.82) {
      role = 'upright';
    } else if (roll > 0.82) {
      role = 'citizen';
    }

    cell.occupant = role;
    if (role === 'corrupt') {
      const tex = Math.random() < 0.5 ? 'char_corrupt_a' : 'char_corrupt_b';
      cell.sprite.setTexture(tex, CHAR_IDLE_FRAME.down);
      cell.tagBg.setFillStyle(0xa8201a, 1);
      cell.tagText.setText('【貪官】虧空公款');
    } else if (role === 'upright') {
      cell.sprite.setTexture('char_han_person', CHAR_IDLE_FRAME.down);
      cell.tagBg.setFillStyle(0x236b52, 1);
      cell.tagText.setText('【清官】廉潔奉公');
    } else {
      cell.sprite.setTexture('char_farmer', CHAR_IDLE_FRAME.down);
      cell.tagBg.setFillStyle(0x2d5985, 1);
      cell.tagText.setText('【百姓】無辜平民');
    }

    cell.container.setVisible(true);
    cell.container.setScale(0.75);
    this.tweens.add({
      targets: cell.container,
      scale: 1,
      duration: 110,
      ease: 'Back.easeOut'
    });

    cell.hideEvent?.remove(false);
    cell.hideEvent = this.time.delayedCall(1250, () => {
      cell.occupant = null;
      cell.container.setVisible(false);
    });
  }

  private onWhackCell(cell: WindowCell): void {
    if (this.isEnded || !cell.occupant) return;

    const hitRole = cell.occupant;
    cell.occupant = null;
    cell.hideEvent?.remove(false);
    cell.container.setVisible(false);

    const ui = this.registry.get('ui') as HudUI;

    if (hitRole === 'corrupt') {
      this.hits++;
      this.showFloatingMark(cell.x, cell.y - 10, '嚴懲貪官 +1', '#98ffd0');
      this.refreshTopBar();

      if (this.hits >= TARGET_HITS) {
        this.finishGame(
          true,
          '挑戰成功！\n雍正「嚴懲貪官、嚴查虧空」\n追回銀兩充實國庫，朝廷吏治清明！'
        );
      }
    } else {
      this.mistakes++;
      this.cameras.main.shake(180, 0.009);
      this.showFloatingMark(cell.x, cell.y - 10, '誤傷好人！', '#ff9e99');
      this.refreshTopBar();
      ui.updateMinigameStatus(
        `<span style="color:#ffb4a8;font-weight:800;">小心！不可打擊清官或百姓（誤傷 ${this.mistakes}/${MAX_MISTAKES}）。</span>`
      );

      if (this.mistakes >= MAX_MISTAKES) {
        this.finishGame(
          false,
          '誤傷清官或百姓太多次了！\n請看清標籤，只可嚴懲貪官！'
        );
      }
    }
  }

  private showFloatingMark(
    x: number,
    y: number,
    msg: string,
    color: string
  ): void {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '14px',
        color,
        fontStyle: 'bold',
        stroke: '#1f120d',
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.tweens.add({
      targets: t,
      y: y - 26,
      alpha: 0,
      duration: 650,
      onComplete: () => t.destroy()
    });
  }

  private finishGame(won: boolean, message: string): void {
    this.isEnded = true;
    this.spawnTimer?.remove(false);
    this.clockTimer?.remove(false);

    const ui = this.registry.get('ui') as HudUI;
    if (won) {
      gameState.markMinigameCompleted('whack_game', 'yongzheng');
      ui.updateMinigameStatus(
        '<span style="color:#98ffd0;font-weight:800;">✓ 已完成「打擊貪官挑戰」！呼應雍正嚴懲貪官、嚴查虧空。</span>'
      );
    } else {
      ui.updateMinigameStatus(
        '<span style="color:#ffb4a8;font-weight:800;">挑戰未完成，請點按重試再挑戰一次！</span>'
      );
    }

    const modal = this.add.container(0, 0).setDepth(60);
    const box = this.add
      .rectangle(
        STAGE_W / 2,
        STAGE_H / 2,
        428,
        178,
        won ? 0x1e4a38 : 0x5c1914,
        0.97
      )
      .setStrokeStyle(3, 0xf2c749);

    const txt = this.add
      .text(STAGE_W / 2, STAGE_H / 2 - 24, message, {
        fontFamily: '"PingFang HK", "Microsoft JhengHei", sans-serif',
        fontSize: '16px',
        color: '#fff8e7',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 6
      })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(STAGE_W / 2, STAGE_H / 2 + 54, 220, 40, 0xf0c451, 1)
      .setStrokeStyle(2, 0x523809)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add
      .text(
        STAGE_W / 2,
        STAGE_H / 2 + 54,
        won ? '完成挑戰，返回大殿 ▶' : '再試一次 ↻',
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

    modal.add([box, txt, btn, btnText]);
  }
}
