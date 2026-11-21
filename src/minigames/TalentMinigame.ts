import Phaser from 'phaser';
import { CHAR_HD_SCALE, toCssSize } from '../gfx/CrispVisuals';
import { CHAR_IDLE_FRAME, TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
import { gameState } from '../state/gameState';
import { HudUI } from '../ui/HudUI';
import { clearStaleTitleOrOpeningHud, stopOtherScenes } from '../scenes/exclusiveScene';

const STAGE_W = 528;
const STAGE_H = 408;

interface CandidateDef {
  id: string;
  name: string;
  ethnicity: '滿族' | '漢族';
  specialty: string;
  targetPostId: string;
  spriteKey: string;
}

interface PostSlotDef {
  id: string;
  title: string;
  desc: string;
  x: number;
  y: number;
  isRejectZone?: boolean;
}

const CANDIDATES: CandidateDef[] = [
  {
    id: 'mingzhu',
    name: '明珠',
    ethnicity: '滿族',
    specialty: '熟悉朝廷政務',
    targetPostId: 'cabinet',
    spriteKey: 'char_manchu_person'
  },
  {
    id: 'zhang',
    name: '張廷玉',
    ethnicity: '漢族',
    specialty: '精通典籍文書',
    targetPostId: 'academy',
    spriteKey: 'char_han_person'
  },
  {
    id: 'tuhai',
    name: '圖海',
    ethnicity: '滿族',
    specialty: '善於統率騎兵',
    targetPostId: 'frontier',
    spriteKey: 'char_qing_soldier'
  },
  {
    id: 'shilang',
    name: '施琅',
    ethnicity: '漢族',
    specialty: '精通水師海戰',
    targetPostId: 'navy',
    spriteKey: 'char_han_person'
  }
];

const POST_SLOTS: PostSlotDef[] = [
  { id: 'cabinet', title: '內閣政務官', desc: '處理朝政', x: 100, y: 122 },
  { id: 'academy', title: '翰林編修官', desc: '修撰典籍', x: 264, y: 122 },
  { id: 'frontier', title: '邊防統帥', desc: '統兵鎮守', x: 428, y: 122 },
  { id: 'navy', title: '水師提督', desc: '統領海戰', x: 176, y: 210 },
  {
    id: 'reject',
    title: '棄用不用區',
    desc: '不予任用',
    x: 352,
    y: 210,
    isRejectZone: true
  }
];

export class TalentMinigame extends Phaser.Scene {
  private selectedCandidateId: string | null = null;
  private assignments: Map<string, string> = new Map();
  private cardContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private cardBasePos: Map<string, { x: number; y: number }> = new Map();
  private finished = false;
  private draggingId: string | null = null;
  private dragOffX = 0;
  private dragOffY = 0;

  constructor() {
    super('TalentMinigame');
  }

  public create(): void {
    this.finished = false;
    this.selectedCandidateId = null;
    this.assignments.clear();
    this.cardContainers.clear();
    this.cardBasePos.clear();

    stopOtherScenes(this);
    clearStaleTitleOrOpeningHud(this);

    this.cameras.main.setBackgroundColor('#261812');
    this.input.setTopOnly(false);
    this.fitViewport(this.scale.width, this.scale.height);

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.fitViewport(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
    });

    for (let y = -4; y < 22; y++) {
      for (let x = -6; x < 28; x++) {
        const tile =
          y < 2
            ? TileIndex.RED_WALL_FRIEZE
            : (x + y) % 2 === 0
              ? TileIndex.HALL_GOLD_BRICK_A
              : TileIndex.HALL_GOLD_BRICK_B;
        this.add
          .image(x * TILE_SIZE + 12, y * TILE_SIZE + 12, 'palace_tiles', tile)
          .setAlpha(0.56);
      }
    }

    this.add
      .rectangle(STAGE_W / 2, 28, STAGE_W - 24, 40, 0x7a1b13, 0.96)
      .setStrokeStyle(2.5, 0xf0c246);
    this.add
      .text(STAGE_W / 2, 28, '康熙：用人唯才・滿漢一家（點選或拖放人才到職位）', {
        fontSize: '15px',
        color: '#ffe89e',
        fontStyle: 'bold',
        stroke: '#2b0b06',
        strokeThickness: 2.5
      })
      .setOrigin(0.5);

    for (const slot of POST_SLOTS) {
      const fill = slot.isRejectZone ? 0x4a2420 : 0x3b2a1c;
      const stroke = slot.isRejectZone ? 0xd96b5c : 0xe8ba4b;
      const box = this.add
        .rectangle(slot.x, slot.y, 156, 86, fill, 0.95)
        .setStrokeStyle(2, stroke)
        .setInteractive({ useHandCursor: true, pixelPerfect: false });

      this.add
        .text(slot.x, slot.y - 20, slot.title, {
          fontSize: '13.5px',
          color: slot.isRejectZone ? '#ffb8ad' : '#ffe898',
          fontStyle: 'bold',
          stroke: '#1c100a',
          strokeThickness: 2
        })
        .setOrigin(0.5);

      this.add
        .text(slot.x, slot.y - 1, slot.desc, {
          fontSize: '12px',
          color: '#f2ead9',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      box.on('pointerdown', () => {
        if (this.finished || !this.selectedCandidateId) return;
        this.assignCandidateToSlot(this.selectedCandidateId, slot.id);
      });
    }

    this.add
      .rectangle(STAGE_W / 2, 314, STAGE_W - 16, 114, 0x1e130e, 0.94)
      .setStrokeStyle(2, 0x8c6239);

    CANDIDATES.forEach((cand, idx) => {
      const cx = 66 + idx * 104;
      const cy = 314;
      this.cardBasePos.set(cand.id, { x: cx, y: cy });
      this.createCandidateCard(cand, cx, cy);
    });

    const pointerWorld = (p: Phaser.Input.Pointer) =>
      this.cameras.main.getWorldPoint(p.x, p.y);
    const hitCardId = (wx: number, wy: number): string | null => {
      let best: string | null = null;
      let bestDist = 58;
      this.cardContainers.forEach((cont, id) => {
        if (!cont.visible) return;
        const d = Phaser.Math.Distance.Between(wx, wy, cont.x, cont.y);
        if (
          Math.abs(wx - cont.x) <= 52 &&
          Math.abs(wy - cont.y) <= 50 &&
          d < bestDist
        ) {
          bestDist = d;
          best = id;
        }
      });
      return best;
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.finished) return;
      const w = pointerWorld(p);
      const id = hitCardId(w.x, w.y);
      if (!id) return;
      const cont = this.cardContainers.get(id);
      if (!cont) return;
      this.draggingId = id;
      this.dragOffX = cont.x - w.x;
      this.dragOffY = cont.y - w.y;
      this.selectCandidate(id);
      cont.setDepth(40);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.finished || !this.draggingId) return;
      const cont = this.cardContainers.get(this.draggingId);
      if (!cont) return;
      const w = pointerWorld(p);
      cont.setPosition(w.x + this.dragOffX, w.y + this.dragOffY);
    });
    const endCardDrag = () => {
      if (!this.draggingId) return;
      const id = this.draggingId;
      this.draggingId = null;
      const cont = this.cardContainers.get(id);
      if (!cont || this.finished) return;
      cont.setDepth(25);
      let matchedSlot: PostSlotDef | null = null;
      let minDist = 68;
      for (const slot of POST_SLOTS) {
        const d = Phaser.Math.Distance.Between(cont.x, cont.y, slot.x, slot.y);
        if (d < minDist) {
          minDist = d;
          matchedSlot = slot;
        }
      }
      if (matchedSlot) {
        this.assignCandidateToSlot(id, matchedSlot.id);
      } else {
        this.returnCardToTray(id);
      }
    };
    this.input.on('pointerup', endCardDrag);
    this.input.on('pointerupoutside', endCardDrag);

    const submitBtn = this.add
      .rectangle(478, 314, 86, 100, 0xd19924, 1)
      .setStrokeStyle(2, 0xfff0b3)
      .setInteractive({ useHandCursor: true, pixelPerfect: false });

    this.add
      .text(478, 314, '呈交\n任用\n名單', {
        fontSize: '15px',
        color: '#241304',
        fontStyle: 'bold',
        align: 'center'
      })
      .setOrigin(0.5);

    submitBtn.on('pointerdown', () => {
      if (!this.finished) {
        this.evaluateRoster();
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
      title: '用人唯才挑戰（康熙朝）',
      instruction:
        '請點選或拖放四位滿族及漢族人才到合適的朝廷職位，然後點按「呈交任用名單」。',
      onRetry: () => this.scene.restart(),
      onLeave: () => this.scene.start('ExploreScene')
    });
  }

  private fitViewport(gameW: number, gameH: number): void {
    const { width: w, height: h, dpr } = toCssSize(gameW, gameH);
    const cam = this.cameras.main;
    const usableH = Math.max(260, h - 84);
    const rawZoom = Math.min(w / STAGE_W, usableH / STAGE_H);
    const cssZoom = rawZoom >= 1 ? Math.max(1, Math.floor(rawZoom)) : rawZoom;
    cam.setZoom(cssZoom * dpr);
    cam.centerOn(STAGE_W / 2, STAGE_H / 2 + 18);
  }

  private createCandidateCard(cand: CandidateDef, x: number, y: number): void {
    const container = this.add.container(x, y).setDepth(20);
    const tagColor = cand.ethnicity === '滿族' ? 0x284d7a : 0x256e54;

    const bg = this.add
      .rectangle(0, 0, 98, 94, 0xfdf8ec, 1)
      .setStrokeStyle(2, 0x7d582d);

    const ethBadge = this.add.rectangle(0, -34, 88, 19, tagColor, 1);
    const ethText = this.add
      .text(0, -34, `${cand.ethnicity}・${cand.name}`, {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const spr = this.add
      .sprite(0, -2, cand.spriteKey, CHAR_IDLE_FRAME.down)
      .setScale(1.12 / CHAR_HD_SCALE);

    const specText = this.add
      .text(0, 32, cand.specialty, {
        fontSize: '11.5px',
        color: '#21140c',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const pad = this.add.rectangle(0, 0, 110, 108, 0xffffff, 0.001);
    container.add([bg, ethBadge, ethText, spr, specText, pad]);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-55, -54, 110, 108),
      Phaser.Geom.Rectangle.Contains
    );
    if (container.input) {
      container.input.cursor = 'pointer';
    }

    this.cardContainers.set(cand.id, container);
  }

  private selectCandidate(candId: string): void {
    this.selectedCandidateId = candId || null;
    this.cardContainers.forEach((cont, id) => {
      const rect = cont.list[0] as Phaser.GameObjects.Rectangle;
      rect.setStrokeStyle(
        id === candId ? 3 : 2,
        id === candId ? 0xd93829 : 0x7d582d
      );
    });
  }

  private returnCardToTray(candId: string): void {
    this.assignments.delete(candId);
    const base = this.cardBasePos.get(candId);
    const cont = this.cardContainers.get(candId);
    if (base && cont) {
      cont.setScale(1);
      cont.setPosition(base.x, base.y);
    }
    this.selectCandidate('');
  }

  private assignCandidateToSlot(candId: string, slotId: string): void {
    const slot = POST_SLOTS.find((s) => s.id === slotId);
    if (!slot) return;

    if (!slot.isRejectZone) {
      for (const [otherCand, assignedSlot] of this.assignments.entries()) {
        if (assignedSlot === slotId && otherCand !== candId) {
          this.returnCardToTray(otherCand);
        }
      }
    }

    this.assignments.set(candId, slotId);
    const cont = this.cardContainers.get(candId);
    if (cont) {
      cont.setScale(0.74);
      const offset = slot.isRejectZone
        ? (CANDIDATES.findIndex((c) => c.id === candId) - 1.5) * 14
        : 0;
      cont.setPosition(slot.x + offset, slot.y + 14);
    }

    this.selectCandidate('');
  }

  private evaluateRoster(): void {
    const ui = this.registry.get('ui') as HudUI;

    let appointedManchu = 0;
    let appointedHan = 0;
    let anyRejectedOrUnassigned = false;

    for (const cand of CANDIDATES) {
      const slotId = this.assignments.get(cand.id);
      if (!slotId || slotId === 'reject') {
        anyRejectedOrUnassigned = true;
      } else if (cand.ethnicity === '滿族') {
        appointedManchu++;
      } else {
        appointedHan++;
      }
    }

    if (
      anyRejectedOrUnassigned ||
      appointedManchu === 0 ||
      appointedHan === 0
    ) {
      ui.updateMinigameStatus(
        '<span style="color:#ffb4a8;font-weight:800;">只要是人才，不論滿族還是漢族都會任用！請把四位滿漢人才全部任用到合適職位。</span>'
      );
      this.cameras.main.shake(180, 0.008);
      return;
    }

    const wrongSpecialty = CANDIDATES.find(
      (c) => this.assignments.get(c.id) !== c.targetPostId
    );
    if (wrongSpecialty) {
      ui.updateMinigameStatus(
        `<span style="color:#ffb4a8;font-weight:800;">「${wrongSpecialty.name}」專長是「${wrongSpecialty.specialty}」，請調整到最合適職位再呈交！</span>`
      );
      this.cameras.main.shake(150, 0.006);
      return;
    }

    this.finished = true;
    gameState.markMinigameCompleted('talent_game', 'kangxi');

    const winOverlay = this.add.container(0, 0).setDepth(60);
    const panel = this.add
      .rectangle(STAGE_W / 2, STAGE_H / 2, 436, 176, 0x1e4a38, 0.97)
      .setStrokeStyle(3, 0xf2c749);

    const txt = this.add
      .text(
        STAGE_W / 2,
        STAGE_H / 2 - 26,
        '挑戰成功！\n「只要是人才，不論滿族還是漢族都會任用」\n漢族士人反抗意識消除，朝廷人才鼎盛！',
        {
          fontSize: '16px',
          color: '#fff8e7',
          fontStyle: 'bold',
          align: 'center',
          lineSpacing: 6,
          stroke: '#0f2b20',
          strokeThickness: 2.5
        }
      )
      .setOrigin(0.5);

    const backBtn = this.add
      .rectangle(STAGE_W / 2, STAGE_H / 2 + 54, 216, 40, 0xf0c451, 1)
      .setStrokeStyle(2, 0x523809)
      .setInteractive({ useHandCursor: true });

    const backLabel = this.add
      .text(STAGE_W / 2, STAGE_H / 2 + 54, '完成挑戰，返回庭院 ▶', {
        fontSize: '15px',
        color: '#241304',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    backBtn.on('pointerdown', () => this.scene.start('ExploreScene'));
    winOverlay.add([panel, txt, backBtn, backLabel]);

    ui.updateMinigameStatus(
      '<span style="color:#98ffd0;font-weight:800;">✓ 已完成「用人唯才挑戰」！只要是人才，不論滿族還是漢族都會任用。</span>'
    );
  }
}
