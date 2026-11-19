import {
  FINAL_TEACHER_PASSWORD,
  MODE_CLASS_LABEL,
  MODE_SEQUENTIAL_LABEL,
  OPENING_BLURB,
  OPENING_TASK,
  PROMPTS,
  QuizItem,
  STAGES,
  STAGE_NAMES,
  STAGE_ORDER,
  StageId,
  TITLE
} from '../data/content';
import { askQianlong } from '../data/qianlongAsk';
import { gameState } from '../state/gameState';

export interface DirectionInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface NavigationHandlers {
  onGoTitle?: () => void;
  onGoClassSelect?: () => void;
}

export class HudUI {
  private root: HTMLElement;
  private mainLayer: HTMLElement;
  private topRightLayer: HTMLElement;
  private settingsLayer: HTMLElement;
  private minimapHost: HTMLElement;
  private minimapCanvas: HTMLCanvasElement | null = null;

  public dirState: DirectionInputState = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  public joyVector = { x: 0, y: 0 };

  private isPanelModalOpen = false;
  private isSettingsOpen = false;
  private navHandlers: NavigationHandlers = {};
  private onInteractCallback: (() => void) | null = null;
  private activeKeyCleanup: (() => void) | null = null;

  constructor(containerId = 'hud-overlay') {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`找不到 HUD 容器 #${containerId}`);
    }
    this.root = el;
    this.root.innerHTML = `
      <div id="hud-main-layer"></div>
      <div id="hud-minimap-host" aria-hidden="true"></div>
      <div id="hud-top-right">
        <button id="btn-hud-settings" class="settings-fab" type="button" aria-label="設定">
          <span>⚙</span><span>設定</span>
        </button>
      </div>
      <div id="hud-settings-layer"></div>
    `;

    this.mainLayer = this.root.querySelector('#hud-main-layer')!;
    this.minimapHost = this.root.querySelector('#hud-minimap-host')!;
    this.topRightLayer = this.root.querySelector('#hud-top-right')!;
    this.settingsLayer = this.root.querySelector('#hud-settings-layer')!;

    this.topRightLayer
      .querySelector('#btn-hud-settings')
      ?.addEventListener('click', () => {
        if (this.isSettingsOpen) {
          this.closeSettingsModal();
        } else {
          this.openSettingsModal();
        }
      });
  }

  public get isModalOpen(): boolean {
    return this.isPanelModalOpen || this.isSettingsOpen;
  }

  public set isModalOpen(val: boolean) {
    this.isPanelModalOpen = val;
    if (val) {
      this.resetInputState();
    }
  }

  public setNavigationHandlers(handlers: NavigationHandlers): void {
    this.navHandlers = handlers;
  }

  public resetInputState(): void {
    this.dirState.up = false;
    this.dirState.down = false;
    this.dirState.left = false;
    this.dirState.right = false;
    this.joyVector.x = 0;
    this.joyVector.y = 0;
  }

  private clearActiveKeyListener(): void {
    if (this.activeKeyCleanup) {
      this.activeKeyCleanup();
      this.activeKeyCleanup = null;
    }
  }

  // 右上角「設定」簡單選單（返回標題、課堂分關返回選關、操作說明）
  private openSettingsModal(): void {
    this.isSettingsOpen = true;
    this.resetInputState();

    const canGoClass =
      gameState.mode === 'class' && Boolean(this.navHandlers.onGoClassSelect);
    const canGoTitle = Boolean(this.navHandlers.onGoTitle);

    this.settingsLayer.innerHTML = `
      <div class="overlay-backdrop" id="settings-backdrop">
        <div class="card-modal" style="max-width:440px;">
          <div class="panel-header">
            <span>遊戲設定與說明</span>
            <span class="badge-sub">單一主畫面</span>
          </div>
          <div class="panel-box" style="display:flex;flex-direction:column;gap:8px;">
            <div style="font-weight:800;font-size:14px;color:#681711;">操作說明</div>
            <div style="font-size:13.5px;line-height:1.55;font-weight:600;">
              ${PROMPTS.CONTROLS_GUIDE}
            </div>
          </div>
          <div class="btn-stack">
            <button id="btn-set-resume" class="pixel-btn gold" type="button">繼續遊戲</button>
            ${
              canGoClass
                ? `<button id="btn-set-class" class="pixel-btn jade" type="button">返回${MODE_CLASS_LABEL}</button>`
                : ''
            }
            ${
              canGoTitle
                ? `<button id="btn-set-title" class="pixel-btn secondary" type="button">返回標題畫面</button>`
                : ''
            }
          </div>
        </div>
      </div>
    `;

    this.settingsLayer
      .querySelector('#btn-set-resume')
      ?.addEventListener('click', () => this.closeSettingsModal());

    this.settingsLayer
      .querySelector('#btn-set-class')
      ?.addEventListener('click', () => {
        this.closeSettingsModal();
        this.clearActiveKeyListener();
        this.navHandlers.onGoClassSelect?.();
      });

    this.settingsLayer
      .querySelector('#btn-set-title')
      ?.addEventListener('click', () => {
        this.closeSettingsModal();
        this.clearActiveKeyListener();
        this.navHandlers.onGoTitle?.();
      });
  }

  public closeSettingsModal(): void {
    this.isSettingsOpen = false;
    this.settingsLayer.innerHTML = '';
  }

  public clearMainOverlay(): void {
    this.clearActiveKeyListener();
    this.isPanelModalOpen = false;
    this.resetInputState();
    this.mainLayer.innerHTML = '';
    this.hideMinimap();
  }

  /** Hide exploration minimap (title / opening / class-select / minigames / ending). */
  public hideMinimap(): void {
    this.minimapHost.innerHTML = '';
    this.minimapCanvas = null;
    this.root.classList.remove('explore-with-minimap');
  }

  /**
   * Draw / refresh the semi-transparent top-left exploration minimap.
   * Buildings = solid tiles; investigate = npc/clue/minigame; exit = exit kind only.
   */
  public updateExploreMinimap(opts: {
    cols: number;
    rows: number;
    solid: boolean[][];
    triggers: Array<{
      id: string;
      kind: string;
      tileX: number;
      tileY: number;
    }>;
    playerTileX: number;
    playerTileY: number;
    viewTiles?: { x1: number; y1: number; x2: number; y2: number };
  }): void {
    if (!this.minimapCanvas) {
      this.minimapHost.innerHTML = `<div class="explore-minimap"><canvas width="272" height="208"></canvas></div>`;
      this.minimapCanvas = this.minimapHost.querySelector('canvas');
      this.root.classList.add('explore-with-minimap');
    }
    const canvas = this.minimapCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { cols, rows, solid, triggers, playerTileX, playerTileY, viewTiles } =
      opts;
    const cw = canvas.width;
    const ch = canvas.height;
    const pad = 6;
    const mapW = cw - pad * 2;
    const mapH = ch - pad * 2;
    const cellW = mapW / cols;
    const cellH = mapH / rows;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = 'rgba(22, 14, 10, 0.42)';
    ctx.fillRect(0, 0, cw, ch);

    // Ground wash
    ctx.fillStyle = 'rgba(70, 52, 38, 0.55)';
    ctx.fillRect(pad, pad, mapW, mapH);

    // Building masses from solid grid
    ctx.fillStyle = 'rgba(156, 40, 32, 0.78)';
    for (let y = 0; y < rows; y++) {
      const row = solid[y];
      if (!row) continue;
      for (let x = 0; x < cols; x++) {
        if (!row[x]) continue;
        ctx.fillRect(
          pad + x * cellW,
          pad + y * cellH,
          Math.max(1, cellW),
          Math.max(1, cellH)
        );
      }
    }

    const drawMarker = (
      tx: number,
      ty: number,
      color: string,
      radius: number
    ) => {
      const cx = pad + (tx + 0.5) * cellW;
      const cy = pad + (ty + 0.5) * cellH;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 248, 220, 0.85)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    for (const t of triggers) {
      if (t.kind === 'exit') {
        // Exit (yongzheng_exit / qianlong_exit) — not south_moongate_note
        drawMarker(t.tileX, t.tileY, 'rgba(255, 214, 74, 0.95)', 4.2);
      } else if (
        t.kind === 'npc' ||
        t.kind === 'clue' ||
        t.kind === 'minigame'
      ) {
        drawMarker(t.tileX, t.tileY, 'rgba(110, 230, 168, 0.95)', 3.4);
      }
    }

    if (viewTiles) {
      const vx = pad + viewTiles.x1 * cellW;
      const vy = pad + viewTiles.y1 * cellH;
      const vw = Math.max(cellW, (viewTiles.x2 - viewTiles.x1) * cellW);
      const vh = Math.max(cellH, (viewTiles.y2 - viewTiles.y1) * cellH);
      ctx.strokeStyle = 'rgba(255, 248, 220, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vx, vy, vw, vh);
    }

    // Player
    drawMarker(playerTileX, playerTileY, 'rgba(90, 180, 255, 1)', 4.6);
  }

  // 1. 標題畫面疊加啟動卡
  public renderTitleScreen(
    onSequential: () => void,
    onClassSelect: () => void
  ): void {
    this.clearActiveKeyListener();
    this.closeSettingsModal();
    this.isPanelModalOpen = false;
    this.resetInputState();

    this.hideMinimap();
    this.mainLayer.innerHTML = `
      <img class="title-school-logo" src="./assets/ui/school-logo-cst.png" alt="CST school logo" />
      <div class="title-dock">
        <div class="btn-stack">
          <button id="btn-seq" class="pixel-btn gold" type="button">${MODE_SEQUENTIAL_LABEL}</button>
          <button id="btn-class" class="pixel-btn" type="button">${MODE_CLASS_LABEL}</button>
        </div>
        <div style="font-size:12px;color:#dfd4c3;text-align:center;line-height:1.4;">
          點選上方模式進入清朝盛世探索；亦可點按殿前皇帝公仔直接進入該朝（右上角「設定」可查閱操作說明）
        </div>
      </div>
    `;

    this.mainLayer
      .querySelector('#btn-seq')
      ?.addEventListener('click', () => onSequential());
    this.mainLayer
      .querySelector('#btn-class')
      ?.addEventListener('click', () => onClassSelect());
  }

  // 2. 開場畫面疊加任務面板
  public renderOpeningScreen(stageName: string, onConfirm: () => void): void {
    this.clearActiveKeyListener();
    this.hideMinimap();
    this.closeSettingsModal();
    this.isPanelModalOpen = true;
    this.resetInputState();

    this.mainLayer.innerHTML = `
      <div class="overlay-bottom-wrap">
        <div class="dialogue-modal">
          <div class="panel-header">
            <span>穿越清朝盛世</span>
            <span class="badge-sub">${stageName}</span>
          </div>
          <div class="dialogue-body" style="min-height:auto;">
            <div>${OPENING_BLURB}</div>
            <div class="hint-banner" style="margin-top:8px;">探究任務：${OPENING_TASK}</div>
          </div>
          <button id="btn-start-stage" class="pixel-btn gold" type="button">進入關卡探索 ▶</button>
        </div>
      </div>
    `;

    this.mainLayer
      .querySelector('#btn-start-stage')
      ?.addEventListener('click', () => {
        this.isPanelModalOpen = false;
        onConfirm();
      });
  }

  // 3. 課堂分關疊加選關卡
  public renderClassSelectScreen(
    onPickStage: (stage: StageId) => void,
    onBackTitle: () => void
  ): void {
    this.clearActiveKeyListener();
    this.hideMinimap();
    this.closeSettingsModal();
    this.isPanelModalOpen = false;
    this.resetInputState();

    const buttonsHtml = STAGE_ORDER.map((id) => {
      const done = gameState.completedClassStages.has(id);
      return `
        <button class="pixel-btn ${done ? 'jade' : 'gold'}" data-stage="${id}" type="button">
          ${STAGE_NAMES[id]} ${done ? '✓ 已完成' : ''}
        </button>
      `;
    }).join('');

    this.mainLayer.innerHTML = `
      <div class="class-select-dock">
        <div class="btn-row">${buttonsHtml}</div>
        <button id="btn-back-title" class="pixel-btn secondary" type="button" style="padding:8px;">返回標題畫面</button>
      </div>
    `;

    this.mainLayer
      .querySelectorAll<HTMLButtonElement>('[data-stage]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const st = btn.dataset.stage as StageId;
          onPickStage(st);
        });
      });

    this.mainLayer
      .querySelector('#btn-back-title')
      ?.addEventListener('click', () => onBackTitle());
  }

  // 4. 單一主畫面探索 HUD（左上狀態＋左下圓形搖桿＋右下調查／傾談鍵）
  public renderExploreHUD(opts: {
    zoneName: string;
    hintText: string;
    nearbyLabel: string | null;
    onInteract: () => void;
  }): void {
    this.clearActiveKeyListener();
    this.isPanelModalOpen = false;
    this.onInteractCallback = opts.onInteract;
    this.resetInputState();

    const stageCfg = STAGES[gameState.currentStage];
    const prog = gameState.getStageProgress();

    const npcChips = Object.values(stageCfg.npcs)
      .map((n) => {
        const done = prog.visitedNpcs.has(n.id);
        return `<span class="check-chip ${done ? 'done' : ''}">${done ? '✓' : '○'} ${n.name}</span>`;
      })
      .join('');

    const mgChips = stageCfg.minigames
      .map((m) => {
        const done = prog.completedMinigames.has(m.id);
        return `<span class="check-chip ${done ? 'done' : ''}">${done ? '★' : '☆'} ${m.stationName}</span>`;
      })
      .join('');

    const readyCls = opts.nearbyLabel ? 'hud-interact-btn ready' : 'hud-interact-btn';
    const mainLabel =
      opts.nearbyLabel === '登上御船' ? '登上御船' : '調查／傾談';
    const subLabel = opts.nearbyLabel ? opts.nearbyLabel : '靠近目標互動';

    this.mainLayer.innerHTML = `
      <div class="hud-status-card">
        <div class="hud-status-top">
          <span class="hud-stage-pill">${stageCfg.shortTitle}</span>
          <span id="hud-zone-label" class="hud-zone-text">${opts.zoneName}</span>
        </div>
        <div id="hud-hint" class="hud-hint-line">${opts.hintText}</div>
        <div id="hud-checklist" class="checklist-wrap">${npcChips}${mgChips}</div>
      </div>

      <div class="joystick-zone" id="joystick-zone">
        <div class="joystick-base" id="joystick-base">
          <span class="joystick-tick up">▲</span>
          <span class="joystick-tick down">▼</span>
          <span class="joystick-tick left">◀</span>
          <span class="joystick-tick right">▶</span>
          <div class="joystick-knob" id="joystick-knob"></div>
        </div>
      </div>

      <div class="interact-zone">
        <button id="btn-interact" class="${readyCls}" type="button">
          <span id="interact-main-text" class="interact-main-label">${mainLabel}</span>
          <span id="interact-sub-text" class="interact-sub-label">${subLabel}</span>
        </button>
      </div>
    `;

    this.bindVirtualJoystick();

    const interactBtn = this.mainLayer.querySelector<HTMLButtonElement>('#btn-interact');
    interactBtn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.isModalOpen) {
        this.onInteractCallback?.();
      }
    });
  }

  public updateExploreDynamicStatus(
    zoneName: string,
    nearbyLabel: string | null,
    hintText?: string
  ): void {
    if (this.isPanelModalOpen) return;

    const zoneEl = this.mainLayer.querySelector('#hud-zone-label');
    if (zoneEl && zoneEl.textContent !== zoneName) {
      zoneEl.textContent = zoneName;
    }

    if (hintText !== undefined) {
      const hintEl = this.mainLayer.querySelector('#hud-hint');
      if (hintEl && hintEl.textContent !== hintText) {
        hintEl.textContent = hintText;
      }
    }

    const btn = this.mainLayer.querySelector<HTMLButtonElement>('#btn-interact');
    const mainTxt = this.mainLayer.querySelector('#interact-main-text');
    const subTxt = this.mainLayer.querySelector('#interact-sub-text');

    if (btn && mainTxt && subTxt) {
      if (nearbyLabel) {
        btn.className = 'hud-interact-btn ready';
        mainTxt.textContent =
          nearbyLabel === '登上御船' ? '登上御船' : '調查／傾談';
        subTxt.textContent = nearbyLabel;
      } else {
        btn.className = 'hud-interact-btn';
        mainTxt.textContent = '調查／傾談';
        subTxt.textContent = '靠近目標互動';
      }
    }
  }

  private bindVirtualJoystick(): void {
    const zone = this.mainLayer.querySelector<HTMLElement>('#joystick-zone');
    const base = this.mainLayer.querySelector<HTMLElement>('#joystick-base');
    const knob = this.mainLayer.querySelector<HTMLElement>('#joystick-knob');
    if (!zone || !base || !knob) return;

    let activePointerId: number | null = null;
    const maxRadius = 36;

    const updateStick = (clientX: number, clientY: number) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const kx = dist > 0 ? Math.cos(angle) * clampedDist : 0;
      const ky = dist > 0 ? Math.sin(angle) * clampedDist : 0;

      knob.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;

      const normMag = clampedDist / maxRadius;
      if (normMag < 0.16) {
        this.joyVector.x = 0;
        this.joyVector.y = 0;
        this.dirState.left = false;
        this.dirState.right = false;
        this.dirState.up = false;
        this.dirState.down = false;
      } else {
        this.joyVector.x = Math.cos(angle) * normMag;
        this.joyVector.y = Math.sin(angle) * normMag;
        this.dirState.left = this.joyVector.x < -0.3;
        this.dirState.right = this.joyVector.x > 0.3;
        this.dirState.up = this.joyVector.y < -0.3;
        this.dirState.down = this.joyVector.y > 0.3;
      }
    };

    const releaseStick = () => {
      activePointerId = null;
      base.classList.remove('active');
      knob.style.transform = 'translate(0px, 0px)';
      this.resetInputState();
    };

    zone.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.isModalOpen || activePointerId !== null) return;
      e.preventDefault();
      e.stopPropagation();
      activePointerId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      base.classList.add('active');
      updateStick(e.clientX, e.clientY);
    });

    zone.addEventListener('pointermove', (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();
      updateStick(e.clientX, e.clientY);
    });

    zone.addEventListener('pointerup', (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();
      releaseStick();
    });

    zone.addEventListener('pointercancel', (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) return;
      releaseStick();
    });
  }

  // 5. 疊加對話面板（置於主畫面下方卡牌，開啟時暫停移動並隱藏搖桿）
  public showDialogue(
    speaker: string,
    lines: string[],
    onFinish: () => void
  ): void {
    this.clearActiveKeyListener();
    this.isPanelModalOpen = true;
    this.resetInputState();
    let idx = 0;

    const advance = () => {
      if (this.isSettingsOpen) return;
      if (idx < lines.length - 1) {
        idx++;
        renderStep();
      } else {
        this.clearActiveKeyListener();
        this.isPanelModalOpen = false;
        onFinish();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    this.activeKeyCleanup = () => window.removeEventListener('keydown', onKey);

    const renderStep = () => {
      const isLast = idx >= lines.length - 1;
      this.mainLayer.innerHTML = `
        <div class="overlay-bottom-wrap">
          <div class="dialogue-modal">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="dialogue-speaker">${speaker}</span>
              <span style="font-size:12.5px;color:#6e563a;font-weight:800;">${idx + 1} / ${lines.length}</span>
            </div>
            <div class="dialogue-body">${lines[idx]}</div>
            <button id="btn-dlg-next" class="pixel-btn gold" type="button">
              ${isLast ? '確定' : '下一句 ▶'}
            </button>
          </div>
        </div>
      `;

      this.mainLayer
        .querySelector<HTMLButtonElement>('#btn-dlg-next')
        ?.addEventListener('click', () => advance());
    };

    renderStep();
  }

  // 6. 疊加三題選擇題卡牌
  public showStageQuiz(
    quizzes: QuizItem[],
    onAllPassed: () => void,
    onCancel: () => void
  ): void {
    this.clearActiveKeyListener();
    this.isPanelModalOpen = true;
    this.resetInputState();
    let qIndex = 0;

    const shuffledOptionsFor = (item: QuizItem): string[] => {
      const arr = [item.correct, item.wrongs[0], item.wrongs[1]];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    let currentOptions = shuffledOptionsFor(quizzes[0]);
    let feedbackHtml = '';

    const renderQuiz = () => {
      const item = quizzes[qIndex];
      const optsHtml = currentOptions
        .map(
          (opt, i) => `
          <button class="pixel-btn quiz-option" data-opt-idx="${i}" type="button">
            ${i + 1}. ${opt}
          </button>
        `
        )
        .join('');

      this.mainLayer.innerHTML = `
        <div class="overlay-backdrop">
          <div class="card-modal">
            <div class="panel-header">
              <span>出關問題挑戰（第 ${qIndex + 1} / ${quizzes.length} 題）</span>
            </div>
            <div class="quiz-question">${item.question}</div>
            ${feedbackHtml}
            <div class="btn-stack">${optsHtml}</div>
            <button id="btn-quiz-cancel" class="pixel-btn secondary" type="button" style="font-size:13px;padding:7px;">
              暫時離開返回探索
            </button>
          </div>
        </div>
      `;

      this.mainLayer
        .querySelectorAll<HTMLButtonElement>('[data-opt-idx]')
        .forEach((btn) => {
          btn.addEventListener('click', () => {
            const picked = currentOptions[Number(btn.dataset.optIdx)];
            if (picked === item.correct) {
              if (qIndex < quizzes.length - 1) {
                qIndex++;
                currentOptions = shuffledOptionsFor(quizzes[qIndex]);
                feedbackHtml = `<div class="feedback-msg ok">答對了！請回答下一題。</div>`;
                renderQuiz();
              } else {
                this.isPanelModalOpen = false;
                onAllPassed();
              }
            } else {
              feedbackHtml = `<div class="feedback-msg error">答案未正確，請回想剛才收集的證據再試一次！</div>`;
              renderQuiz();
            }
          });
        });

      this.mainLayer
        .querySelector('#btn-quiz-cancel')
        ?.addEventListener('click', () => {
          this.isPanelModalOpen = false;
          onCancel();
        });
    };

    renderQuiz();
  }

  // 7. 疊加數字密碼鍵盤卡牌（絕不預先顯示密碼數字）
  public showPasswordPad(opts: {
    title: string;
    hint: string;
    expectedPassword: string;
    allowCancel: boolean;
    onSuccess: () => void;
    onCancel?: () => void;
  }): void {
    this.clearActiveKeyListener();
    this.isPanelModalOpen = true;
    this.resetInputState();
    let typed = '';
    let errorMsg = '';

    const submitTyped = () => {
      if (typed === opts.expectedPassword) {
        this.clearActiveKeyListener();
        this.isPanelModalOpen = false;
        opts.onSuccess();
      } else {
        typed = '';
        errorMsg = '密碼不正確，請再試一次。';
        renderPad();
      }
    };

    const renderPad = () => {
      const displayStr = typed.length > 0 ? typed : '＿＿＿';
      const digits = [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '清除',
        '0',
        '確定'
      ];

      const keysHtml = digits
        .map((k) => {
          let cls = 'pixel-btn secondary numpad-btn';
          if (k === '確定') cls = 'pixel-btn gold numpad-btn';
          if (k === '清除') cls = 'pixel-btn numpad-btn';
          return `<button class="${cls}" data-key="${k}" type="button">${k}</button>`;
        })
        .join('');

      this.mainLayer.innerHTML = `
        <div class="overlay-backdrop">
          <div class="card-modal" style="max-width:420px;">
            <div class="panel-header">
              <span>${opts.title}</span>
            </div>
            <div class="hint-banner">${opts.hint}</div>
            ${errorMsg ? `<div class="feedback-msg error">${errorMsg}</div>` : ''}
            <div class="password-display">${displayStr}</div>
            <div class="numpad-grid">${keysHtml}</div>
            ${
              opts.allowCancel
                ? `<button id="btn-pw-cancel" class="pixel-btn secondary" type="button" style="font-size:13px;padding:7px;">返回探索</button>`
                : ''
            }
          </div>
        </div>
      `;

      this.mainLayer
        .querySelectorAll<HTMLButtonElement>('[data-key]')
        .forEach((btn) => {
          btn.addEventListener('click', () => {
            const k = btn.dataset.key!;
            if (k === '清除') {
              typed = '';
              errorMsg = '';
              renderPad();
            } else if (k === '確定') {
              submitTyped();
            } else if (typed.length < 3) {
              typed += k;
              errorMsg = '';
              renderPad();
            }
          });
        });

      this.mainLayer
        .querySelector('#btn-pw-cancel')
        ?.addEventListener('click', () => {
          this.clearActiveKeyListener();
          this.isPanelModalOpen = false;
          opts.onCancel?.();
        });
    };

    const keyListener = (e: KeyboardEvent) => {
      if (this.isSettingsOpen) return;
      if (e.key >= '0' && e.key <= '9') {
        if (typed.length < 3) {
          typed += e.key;
          errorMsg = '';
          renderPad();
        }
      } else if (e.key === 'Backspace') {
        typed = typed.slice(0, -1);
        renderPad();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitTyped();
      }
    };

    window.addEventListener('keydown', keyListener);
    this.activeKeyCleanup = () => window.removeEventListener('keydown', keyListener);
    renderPad();
  }

  // 8. 老師最後密碼與離線問乾隆卡牌
  public showTeacherPasswordPad(onSuccess: () => void): void {
    this.showPasswordPad({
      title: '老師的最後密碼',
      hint: PROMPTS.TEACHER_PASSWORD_HINT,
      expectedPassword: FINAL_TEACHER_PASSWORD,
      allowCancel: false,
      onSuccess
    });
  }

  public showQianlongAskPanel(onCompleteDeparture: () => void): void {
    this.clearActiveKeyListener();
    this.isPanelModalOpen = true;
    this.resetInputState();

    const samplePrompts = [
      '清朝為甚麼由盛轉弱？',
      '康熙怎樣任用人才？',
      '雍正怎樣整頓貪官？',
      '六次遊江南有甚麼影響？'
    ];

    const chipsHtml = samplePrompts
      .map(
        (p) =>
          `<button type="button" class="topic-chip-btn" data-sample="${p}">${p}</button>`
      )
      .join('');

    this.mainLayer.innerHTML = `
      <div class="overlay-backdrop">
        <div class="card-modal">
          <div class="panel-header">
            <span>向乾隆皇帝提出最後一問</span>
          </div>
          <div class="hint-banner">${PROMPTS.QIANLONG_FINAL_ASK_LINE}</div>
          <div class="panel-box" style="display:flex;flex-direction:column;gap:8px;">
            <input id="qianlong-q-input" class="ask-input" type="text" maxlength="60" placeholder="請輸入你想問乾隆的問題（或點選下方題目參考）" />
            <div class="topic-chips">${chipsHtml}</div>
            <button id="btn-submit-q" class="pixel-btn gold" type="button">向乾隆發問</button>
          </div>
          <div id="qianlong-reply-area"></div>
        </div>
      </div>
    `;

    const inputEl =
      this.mainLayer.querySelector<HTMLInputElement>('#qianlong-q-input')!;
    const replyArea = this.mainLayer.querySelector<HTMLElement>(
      '#qianlong-reply-area'
    )!;

    this.mainLayer
      .querySelectorAll<HTMLButtonElement>('[data-sample]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          inputEl.value = btn.dataset.sample || '';
          inputEl.focus();
        });
      });

    const handleAsk = () => {
      const q = inputEl.value;
      const answer = askQianlong(q);
      const isRedirect =
        answer.startsWith('且慢。') || answer.startsWith('此問不宜。');

      replyArea.innerHTML = `
        <div class="panel-box" style="display:flex;flex-direction:column;gap:8px;background:#fff9eb;">
          <div><span class="dialogue-speaker">乾隆皇帝</span></div>
          <div style="font-size:16px;font-weight:800;color:#241914;">「${answer}」</div>
          ${
            isRedirect
              ? `<div style="font-size:12.5px;color:#8c2119;font-weight:700;">請修改問題，向乾隆請教康雍乾或清朝盛衰相關史事。</div>`
              : `<button id="btn-depart-modern" class="pixel-btn jade" type="button">乘御船返回現代 ▶</button>`
          }
        </div>
      `;

      replyArea
        .querySelector('#btn-depart-modern')
        ?.addEventListener('click', () => {
          this.isPanelModalOpen = false;
          onCompleteDeparture();
        });
    };

    this.mainLayer
      .querySelector('#btn-submit-q')
      ?.addEventListener('click', () => handleAsk());
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAsk();
      }
    });
  }

  // 9. 小遊戲單一畫面底部輕量提示列
  public renderMinigamePanel(opts: {
    title: string;
    instruction: string;
    statusHtml?: string;
    onRetry: () => void;
    onLeave: () => void;
  }): void {
    this.clearActiveKeyListener();
    this.hideMinimap();
    this.isPanelModalOpen = true;
    this.resetInputState();

    this.mainLayer.innerHTML = `
      <div class="minigame-bar">
        <div class="minigame-bar-info">
          <div style="color:#ffe48a;font-weight:800;margin-bottom:2px;">${opts.title}</div>
          <div id="mg-status-slot">${opts.instruction}</div>
        </div>
        <div class="minigame-bar-actions">
          <button id="btn-mg-retry" class="pixel-btn gold" type="button">重試</button>
          <button id="btn-mg-leave" class="pixel-btn secondary" type="button">返回地圖</button>
        </div>
      </div>
    `;

    this.mainLayer
      .querySelector('#btn-mg-retry')
      ?.addEventListener('click', () => opts.onRetry());
    this.mainLayer
      .querySelector('#btn-mg-leave')
      ?.addEventListener('click', () => opts.onLeave());
  }

  public updateMinigameStatus(html: string): void {
    const slot = this.mainLayer.querySelector('#mg-status-slot');
    if (slot) slot.innerHTML = html;
  }

  // 10. 返回現代結局與反思疊加卡牌
  public renderEndingScreen(
    onBackTitle: () => void,
    onBackClassSelect: () => void
  ): void {
    this.clearActiveKeyListener();
    this.hideMinimap();
    this.isPanelModalOpen = true;
    this.resetInputState();

    this.mainLayer.innerHTML = `
      <div class="overlay-bottom-wrap">
        <div class="dialogue-modal">
          <div class="panel-header">
            <span>返回現代・課堂總結與反思</span>
          </div>
          <div style="font-size:14.5px;line-height:1.55;font-weight:700;">${PROMPTS.ENDING_RETURNED}</div>
          <div class="hint-banner" style="font-size:15px;">反思問題：${PROMPTS.ENDING_REFLECTION}</div>
          <div class="feedback-msg ok" style="font-size:14px;">${PROMPTS.ENDING_SUMMARY}</div>
          <div class="btn-row">
            ${
              gameState.mode === 'class'
                ? `<button id="btn-end-class" class="pixel-btn gold" type="button">返回${MODE_CLASS_LABEL}</button>`
                : ''
            }
            <button id="btn-end-title" class="pixel-btn" type="button">返回標題畫面</button>
          </div>
        </div>
      </div>
    `;

    this.mainLayer
      .querySelector('#btn-end-class')
      ?.addEventListener('click', () => onBackClassSelect());
    this.mainLayer
      .querySelector('#btn-end-title')
      ?.addEventListener('click', () => onBackTitle());
  }
}
