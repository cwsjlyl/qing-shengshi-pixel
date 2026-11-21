import {
  FINAL_TEACHER_PASSWORD,
  MODE_CLASS_LABEL,
  MODE_REMONSTRATE_LABEL,
  MODE_SEQUENTIAL_LABEL,
  OPENING_BLURB,
  OPENING_TASK,
  PROMPTS,
  QuizItem,
  STAGES,
  STAGE_NAMES,
  STAGE_ORDER,
  StageId
} from '../data/content';
import {
  CER_PRECEDENTS,
  CER_PROBLEMS,
  GLOSSARY_TERMS,
  JIGSAW_SUMMARY_CARDS,
  annotateGlossaryHtml,
  composeCerDraft,
  getQuizEvidenceHint,
  isSpeechSupported,
  speakTextCantonese,
  stopSpeaking
} from '../data/learningEnhancements';
import {
  REMONSTRANCE_SUGGESTIONS,
  buildQianlongGeminiPrompt
} from '../data/qianlongAsk';
import { MEDAL_LABELS, gameState } from '../state/gameState';
import {
  getPortraitForSpeaker,
  renderHistorianCertificateDataUrl
} from './portraitAndCert';

export interface DirectionInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface NavigationHandlers {
  onGoTitle?: () => void;
  onGoClassSelect?: () => void;
  onResetSave?: () => void;
}

export class HudUI {
  private root: HTMLElement;
  private mainLayer: HTMLElement;
  private topRightLayer: HTMLElement;
  private settingsLayer: HTMLElement;
  private minimapHost: HTMLElement;
  private minimapCanvas: HTMLCanvasElement | null = null;
  private minimapStaticCanvas: HTMLCanvasElement | null = null;
  private minimapCacheKey = '';
  private isMinimapExpanded = false;
  private isStatusChecklistExpanded = false;

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
        <button id="btn-hud-notebook" class="settings-fab notebook-fab" type="button" aria-label="奏摺證據簿">
          <span>📜</span><span>證據簿</span>
        </button>
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
      .querySelector('#btn-hud-notebook')
      ?.addEventListener('click', () => {
        if (this.isSettingsOpen) {
          this.closeSettingsModal();
        } else {
          this.openNotebookModal();
        }
      });

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
    stopSpeaking();
    if (this.activeKeyCleanup) {
      this.activeKeyCleanup();
      this.activeKeyCleanup = null;
    }
  }

  /** 右上角「📜 奏摺證據簿」：隨時翻閱三朝已收集史料原話與御賜印章 */
  public openNotebookModal(): void {
    this.isSettingsOpen = true;
    this.resetInputState();

    const sectionsHtml = STAGE_ORDER.map((stId) => {
      const cfg = STAGES[stId];
      const prog = gameState.getStageProgress(stId);
      const npcs = Object.values(cfg.npcs);
      const visitedList = npcs.filter((n) => prog.visitedNpcs.has(n.id));

      const itemsHtml =
        visitedList.length > 0
          ? visitedList
              .map(
                (n) => `
              <div class="notebook-entry">
                <div class="notebook-speaker">✓ ${n.name}</div>
                <div class="notebook-quote">「${n.lines.join(' ')}」</div>
              </div>
            `
              )
              .join('')
          : `<div style="font-size:13px;color:#6e563a;font-weight:700;">尚未收集本朝人物證據（共 ${npcs.length} 位待訪）</div>`;

      const mgTags = cfg.minigames
        .map((m) => {
          const done = prog.completedMinigames.has(m.id);
          const medal = gameState.minigameMedals[m.id];
          return `<span class="check-chip ${done ? 'done' : ''}" style="color:${done ? '#f2fff9' : '#4a3623'};background:${done ? 'rgba(34,114,86,0.9)' : '#efe5cf'};border-color:#9e7544;">${m.stationName}：${medal ? MEDAL_LABELS[medal] : done ? '已完成' : '未完成'}</span>`;
        })
        .join(' ');

      return `
        <div class="panel-box" style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:800;font-size:15px;color:#781912;">${cfg.stageName}</span>
            <span style="font-size:12px;font-weight:800;color:#543f30;">已收證據 ${visitedList.length} / ${npcs.length}</span>
          </div>
          ${itemsHtml}
          <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:2px;">${mgTags}</div>
        </div>
      `;
    }).join('');

    this.settingsLayer.innerHTML = `
      <div class="overlay-backdrop" id="notebook-backdrop">
        <div class="card-modal" style="max-width:560px;">
          <div class="panel-header">
            <span>📜 大清三朝奏摺證據簿</span>
            <span class="badge-sub">史料筆記</span>
          </div>
          <div class="hint-banner">
            出關答題與向乾隆進諫前，可隨時翻閱已收集的人物原話與歷史證據！
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${sectionsHtml}
          </div>
          <button id="btn-close-notebook" class="pixel-btn gold" type="button">合上證據簿，繼續探索</button>
        </div>
      </div>
    `;

    this.settingsLayer
      .querySelector('#btn-close-notebook')
      ?.addEventListener('click', () => this.closeSettingsModal());
  }

  private openSettingsModal(): void {
    this.isSettingsOpen = true;
    this.resetInputState();

    const canGoClass =
      gameState.mode === 'class' && Boolean(this.navHandlers.onGoClassSelect);
    const canGoTitle = Boolean(this.navHandlers.onGoTitle);
    const hasSave = gameState.hasSavedProgress();

    this.settingsLayer.innerHTML = `
      <div class="overlay-backdrop" id="settings-backdrop">
        <div class="card-modal" style="max-width:450px;">
          <div class="panel-header">
            <span>遊戲設定與說明</span>
            <span class="badge-sub">單一主畫面</span>
          </div>
          <div class="panel-box" style="display:flex;flex-direction:column;gap:8px;">
            <div style="font-weight:800;font-size:14px;color:#681711;">雙軌操作說明</div>
            <div style="font-size:13.5px;line-height:1.55;font-weight:600;">
              ${PROMPTS.CONTROLS_GUIDE}<br/>
              ✨ 亦支援「直接點按地面或人物」自動走過去互動！進度會自動存檔於本機。
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
            ${
              hasSave
                ? `<button id="btn-set-clearsave" class="pixel-btn" type="button" style="font-size:13.5px;padding:8px;">🗑 清除本機進度存檔</button>`
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

    this.settingsLayer
      .querySelector('#btn-set-clearsave')
      ?.addEventListener('click', () => {
        gameState.clearAllSavedProgress();
        this.closeSettingsModal();
        this.clearActiveKeyListener();
        if (this.navHandlers.onResetSave) {
          this.navHandlers.onResetSave();
        } else {
          this.navHandlers.onGoTitle?.();
        }
      });
  }

  public closeSettingsModal(): void {
    stopSpeaking();
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

  public hideMinimap(): void {
    this.minimapHost.innerHTML = '';
    this.minimapCanvas = null;
    this.root.classList.remove('explore-with-minimap');
    this.root.classList.remove('explore-minimap-expanded');
  }

  /**
   * 離屏底圖快取（Offscreen Static Layer Caching）＋ 可點按放大／縮小切換的小地圖
   */
  public updateExploreMinimap(opts: {
    stageKey?: string;
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
      this.minimapHost.innerHTML = `
        <div class="explore-minimap ${this.isMinimapExpanded ? 'expanded' : ''}" id="explore-minimap-box">
          <canvas width="272" height="208"></canvas>
          <button type="button" class="minimap-zoom-btn" id="btn-minimap-toggle" title="切換小地圖大小">
            ${this.isMinimapExpanded ? '縮小 ▴' : '放大 ▾'}
          </button>
        </div>
      `;
      this.minimapCanvas = this.minimapHost.querySelector('canvas');
      this.root.classList.add('explore-with-minimap');
      this.root.classList.toggle('explore-minimap-expanded', this.isMinimapExpanded);

      this.minimapHost
        .querySelector('#btn-minimap-toggle')
        ?.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.isMinimapExpanded = !this.isMinimapExpanded;
          const box = this.minimapHost.querySelector('#explore-minimap-box');
          const btn = this.minimapHost.querySelector('#btn-minimap-toggle');
          box?.classList.toggle('expanded', this.isMinimapExpanded);
          this.root.classList.toggle(
            'explore-minimap-expanded',
            this.isMinimapExpanded
          );
          if (btn) {
            btn.textContent = this.isMinimapExpanded ? '縮小 ▴' : '放大 ▾';
          }
        });
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

    const cacheKey = `${opts.stageKey || gameState.currentStage}:${cols}x${rows}`;
    if (!this.minimapStaticCanvas || this.minimapCacheKey !== cacheKey) {
      this.minimapCacheKey = cacheKey;
      const off = document.createElement('canvas');
      off.width = cw;
      off.height = ch;
      const octx = off.getContext('2d');
      if (octx) {
        octx.fillStyle = 'rgba(22, 14, 10, 0.48)';
        octx.fillRect(0, 0, cw, ch);
        octx.fillStyle = 'rgba(70, 52, 38, 0.58)';
        octx.fillRect(pad, pad, mapW, mapH);
        octx.fillStyle = 'rgba(156, 40, 32, 0.8)';
        for (let y = 0; y < rows; y++) {
          const row = solid[y];
          if (!row) continue;
          for (let x = 0; x < cols; x++) {
            if (!row[x]) continue;
            octx.fillRect(
              pad + x * cellW,
              pad + y * cellH,
              Math.max(1, cellW),
              Math.max(1, cellH)
            );
          }
        }
      }
      this.minimapStaticCanvas = off;
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(this.minimapStaticCanvas, 0, 0);

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

    drawMarker(playerTileX, playerTileY, 'rgba(90, 180, 255, 1)', 4.6);
  }

  // 1. 標題畫面疊加啟動卡（含本地存檔續玩、順序探索、課堂分關、向乾隆進諫）
  public renderTitleScreen(
    onSequential: () => void,
    onClassSelect: () => void,
    onDirectRemonstrate: () => void,
    onResumeSaved?: () => void
  ): void {
    this.clearActiveKeyListener();
    this.closeSettingsModal();
    this.isPanelModalOpen = false;
    this.resetInputState();
    this.hideMinimap();

    const canResume = Boolean(onResumeSaved) && gameState.hasSavedProgress();
    const resumeLabel =
      gameState.mode === 'class'
        ? `📂 繼續課堂分關（已過 ${gameState.completedClassStages.size}/3 朝）`
        : `📂 繼續上次進度：${STAGE_NAMES[gameState.currentStage]}`;

    this.mainLayer.innerHTML = `
      <img class="title-school-logo" src="./assets/ui/school-logo-cst.png" alt="CST school logo" />
      <div class="title-dock">
        ${
          canResume
            ? `<button id="btn-resume-save" class="pixel-btn resume-save-btn" type="button">${resumeLabel}</button>`
            : ''
        }
        <div class="btn-stack">
          <button id="btn-seq" class="pixel-btn gold" type="button">${MODE_SEQUENTIAL_LABEL}</button>
          <button id="btn-class" class="pixel-btn" type="button">${MODE_CLASS_LABEL}</button>
          <button id="btn-remonstrate" class="pixel-btn jade" type="button">${MODE_REMONSTRATE_LABEL}</button>
        </div>
        <div class="title-dock-note">
          點選模式探索或直接「${MODE_REMONSTRATE_LABEL}」；亦可點按殿前皇帝公仔進入分關（進度自動存檔）
        </div>
      </div>
    `;

    this.mainLayer
      .querySelector('#btn-resume-save')
      ?.addEventListener('click', () => onResumeSaved?.());
    this.mainLayer
      .querySelector('#btn-seq')
      ?.addEventListener('click', () => onSequential());
    this.mainLayer
      .querySelector('#btn-class')
      ?.addEventListener('click', () => onClassSelect());
    this.mainLayer
      .querySelector('#btn-remonstrate')
      ?.addEventListener('click', () => onDirectRemonstrate());
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

  // 3. 課堂分關疊加選關卡（全通關解鎖「大清特命盛世史官證書」）
  public renderClassSelectScreen(
    onPickStage: (stage: StageId) => void,
    onBackTitle: () => void
  ): void {
    this.clearActiveKeyListener();
    this.hideMinimap();
    this.closeSettingsModal();
    this.isPanelModalOpen = false;
    this.resetInputState();

    const allDone = gameState.isAllClassStagesCompleted();

    const buttonsHtml = STAGE_ORDER.map((id) => {
      const done = gameState.completedClassStages.has(id);
      return `
        <button class="pixel-btn ${done ? 'jade' : 'gold'}" data-stage="${id}" type="button">
          ${STAGE_NAMES[id]} ${done ? '✓' : ''}
        </button>
      `;
    }).join('');

    this.mainLayer.innerHTML = `
      <div class="class-select-dock">
        <div class="btn-row">${buttonsHtml}</div>
        <div class="btn-row">
          ${
            allDone
              ? `<button id="btn-open-cert" class="pixel-btn gold" type="button" style="padding:8px 12px;">🏅 領取《大清盛世史官證書》</button>`
              : ''
          }
          <button id="btn-back-title" class="pixel-btn secondary" type="button" style="padding:8px;">返回標題畫面</button>
        </div>
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
      .querySelector('#btn-open-cert')
      ?.addEventListener('click', () => {
        this.showCertificateModal('課堂分關三朝全考察', () =>
          this.renderClassSelectScreen(onPickStage, onBackTitle)
        );
      });

    this.mainLayer
      .querySelector('#btn-back-title')
      ?.addEventListener('click', () => onBackTitle());
  }

  // 4. 單一主畫面探索 HUD（印章收納進度列 ＋ 跨三朝大清國運儀表）
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
    const metrics = gameState.getDynastyMetrics();

    const npcs = Object.values(stageCfg.npcs);
    const doneNpcCount = npcs.filter((n) => prog.visitedNpcs.has(n.id)).length;
    const doneMgCount = stageCfg.minigames.filter((m) =>
      prog.completedMinigames.has(m.id)
    ).length;

    const npcChips = npcs
      .map((n) => {
        const done = prog.visitedNpcs.has(n.id);
        return `<span class="check-chip ${done ? 'done' : ''}">${done ? '✓' : '○'} ${n.name}</span>`;
      })
      .join('');

    const mgChips = stageCfg.minigames
      .map((m) => {
        const done = prog.completedMinigames.has(m.id);
        const medal = gameState.minigameMedals[m.id];
        return `<span class="check-chip ${done ? 'done' : ''}">${done ? '★' : '☆'} ${m.stationName}${medal ? `(${medal === 'gold' ? '金' : medal === 'silver' ? '銀' : '銅'})` : ''}</span>`;
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
          <button type="button" id="btn-toggle-detail" class="hud-detail-toggle">
            ${this.isStatusChecklistExpanded ? '收起 ▴' : '清單 ▾'}
          </button>
        </div>

        <div class="stamp-summary-row">
          <span class="stamp-pill ${doneNpcCount === npcs.length ? 'complete' : ''}">
            📜 證據 ${doneNpcCount}/${npcs.length}
          </span>
          <span class="stamp-pill ${doneMgCount === stageCfg.minigames.length ? 'complete' : ''}">
            ⚔️ 挑戰 ${doneMgCount}/${stageCfg.minigames.length}
          </span>
          <span class="dynasty-trend-tag">${metrics.trendNote}</span>
        </div>

        <div class="dynasty-meters-row" title="大清國運儀表：隨歷史事件動態升降">
          <div class="meter-item">
            <span>💰國庫</span>
            <div class="meter-track"><div class="meter-fill ${metrics.treasury <= 55 ? 'warn' : 'gold'}" style="width:${metrics.treasury}%"></div></div>
          </div>
          <div class="meter-item">
            <span>❤️民心</span>
            <div class="meter-track"><div class="meter-fill ${metrics.morale <= 60 ? 'warn' : 'jade'}" style="width:${metrics.morale}%"></div></div>
          </div>
          <div class="meter-item">
            <span>🗺️版圖</span>
            <div class="meter-track"><div class="meter-fill blue" style="width:${metrics.territory}%"></div></div>
          </div>
        </div>

        <div id="hud-hint" class="hud-hint-line">${opts.hintText}</div>
        <div id="hud-checklist" class="checklist-wrap" style="display:${this.isStatusChecklistExpanded ? 'flex' : 'none'};">
          ${npcChips}${mgChips}
        </div>
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

    this.mainLayer
      .querySelector('#btn-toggle-detail')
      ?.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isStatusChecklistExpanded = !this.isStatusChecklistExpanded;
        const wrap = this.mainLayer.querySelector<HTMLElement>('#hud-checklist');
        const btn = this.mainLayer.querySelector<HTMLElement>('#btn-toggle-detail');
        if (wrap) {
          wrap.style.display = this.isStatusChecklistExpanded ? 'flex' : 'none';
        }
        if (btn) {
          btn.textContent = this.isStatusChecklistExpanded ? '收起 ▴' : '清單 ▾';
        }
      });

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

  // 5. 疊加對話面板（含角色 4x 高清半身頭像、離線粵語朗讀、點按歷史難詞白話註解）
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
      stopSpeaking();
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

    const portraitUrl = getPortraitForSpeaker(speaker);
    const canSpeak = isSpeechSupported();

    const renderStep = () => {
      const isLast = idx >= lines.length - 1;
      const annotatedBodyHtml = annotateGlossaryHtml(lines[idx]);

      this.mainLayer.innerHTML = `
        <div class="overlay-bottom-wrap">
          <div class="dialogue-modal">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="dialogue-speaker">${speaker}</span>
              <div style="display:flex;align-items:center;gap:8px;">
                ${
                  canSpeak
                    ? `<button id="btn-dlg-tts" class="tts-pill-btn" type="button">🔊 粵語朗讀</button>`
                    : ''
                }
                <span style="font-size:12.5px;color:#6e563a;font-weight:800;">${idx + 1} / ${lines.length}</span>
              </div>
            </div>

            <div class="dialogue-content-row">
              ${
                portraitUrl
                  ? `<div class="dialogue-portrait-frame"><img src="${portraitUrl}" alt="${speaker}" /></div>`
                  : ''
              }
              <div class="dialogue-body" style="flex:1 1 auto;">
                <div>${annotatedBodyHtml}</div>
                <div id="glossary-tooltip-slot"></div>
              </div>
            </div>

            <button id="btn-dlg-next" class="pixel-btn gold" type="button">
              ${isLast ? '確定' : '下一句 ▶'}
            </button>
          </div>
        </div>
      `;

      this.mainLayer
        .querySelector('#btn-dlg-tts')
        ?.addEventListener('click', (e) => {
          e.stopPropagation();
          speakTextCantonese(`${speaker}說：${lines[idx]}`);
        });

      const tooltipSlot = this.mainLayer.querySelector<HTMLElement>(
        '#glossary-tooltip-slot'
      );
      this.mainLayer
        .querySelectorAll<HTMLButtonElement>('[data-glossary-idx]')
        .forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const gIdx = Number(btn.dataset.glossaryIdx);
            const entry = GLOSSARY_TERMS[gIdx];
            if (entry && tooltipSlot) {
              tooltipSlot.innerHTML = `<div class="glossary-popover">📖 <b>${entry.term}</b>：${entry.meaning}</div>`;
            }
          });
        });

      this.mainLayer
        .querySelector<HTMLButtonElement>('#btn-dlg-next')
        ?.addEventListener('click', () => advance());
    };

    renderStep();
  }

  // 6. 疊加三題選擇題卡牌（含題目朗讀與答錯史料回溯提示）
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
    const canSpeak = isSpeechSupported();

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
              ${
                canSpeak
                  ? `<button id="btn-quiz-tts" class="tts-pill-btn light" type="button">🔊 朗讀</button>`
                  : ''
              }
            </div>
            <div class="quiz-question">${item.question}</div>
            ${feedbackHtml}
            <div class="btn-stack">${optsHtml}</div>
            <div class="btn-row">
              <button id="btn-quiz-notebook" class="pixel-btn jade" type="button" style="font-size:13px;padding:7px;">
                📜 翻閱證據簿
              </button>
              <button id="btn-quiz-cancel" class="pixel-btn secondary" type="button" style="font-size:13px;padding:7px;">
                暫時離開
              </button>
            </div>
          </div>
        </div>
      `;

      this.mainLayer
        .querySelector('#btn-quiz-tts')
        ?.addEventListener('click', () => {
          const allTxt = `${item.question}。選項一：${currentOptions[0]}；選項二：${currentOptions[1]}；選項三：${currentOptions[2]}`;
          speakTextCantonese(allTxt);
        });

      this.mainLayer
        .querySelector('#btn-quiz-notebook')
        ?.addEventListener('click', () => this.openNotebookModal());

      this.mainLayer
        .querySelectorAll<HTMLButtonElement>('[data-opt-idx]')
        .forEach((btn) => {
          btn.addEventListener('click', () => {
            stopSpeaking();
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
              const hint = getQuizEvidenceHint(
                gameState.currentStage,
                item.question
              );
              feedbackHtml = `
                <div class="feedback-msg error">答案未正確，別灰心！請看下方史料回溯提示：</div>
                <div class="hint-banner" style="font-size:13px;">${hint}</div>
              `;
              renderQuiz();
            }
          });
        });

      this.mainLayer
        .querySelector('#btn-quiz-cancel')
        ?.addEventListener('click', () => {
          stopSpeaking();
          this.isPanelModalOpen = false;
          onCancel();
        });
    };

    renderQuiz();
  }

  /** 課堂分關完成後彈出「拼圖式合作學習（Jigsaw）組員互教重點卡」 */
  public showJigsawSummaryCard(stageId: StageId, onContinue: () => void): void {
    this.clearActiveKeyListener();
    this.hideMinimap();
    this.isPanelModalOpen = true;
    this.resetInputState();

    const card = JIGSAW_SUMMARY_CARDS[stageId];
    const policiesHtml = card.corePolicies
      .map((p) => `<li style="margin-bottom:4px;">${p}</li>`)
      .join('');

    this.mainLayer.innerHTML = `
      <div class="overlay-backdrop">
        <div class="card-modal" style="max-width:560px;">
          <div class="panel-header">
            <span>📋 ${card.dynastyTitle}</span>
            <span class="badge-sub">合作學習</span>
          </div>
          <div class="panel-box" style="display:flex;flex-direction:column;gap:8px;">
            <div>
              <div style="font-weight:800;color:#781912;font-size:14.5px;margin-bottom:4px;">📌 朝廷重要治國政策：</div>
              <ul style="margin:0;padding-left:20px;font-size:14px;font-weight:700;line-height:1.5;">${policiesHtml}</ul>
            </div>
            <div style="font-size:14px;line-height:1.5;font-weight:700;color:#17593d;background:#e6f7ef;padding:8px 10px;border-radius:6px;">
              <b>✓ 盛世成效：</b>${card.positiveEffects}
            </div>
            <div style="font-size:13.5px;line-height:1.5;font-weight:700;color:#7a2e0e;background:#fff3e0;padding:8px 10px;border-radius:6px;">
              <b>⚠️ 歷史隱憂／限制：</b>${card.risksOrLimits}
            </div>
          </div>
          <div class="hint-banner" style="font-size:14px;">
            ${card.teachingScript}
          </div>
          <div class="btn-row">
            ${
              isSpeechSupported()
                ? `<button id="btn-jigsaw-tts" class="pixel-btn jade" type="button">🔊 朗讀匯報口訣</button>`
                : ''
            }
            <button id="btn-jigsaw-done" class="pixel-btn gold" type="button">返回課堂分關選單 ▶</button>
          </div>
        </div>
      </div>
    `;

    this.mainLayer
      .querySelector('#btn-jigsaw-tts')
      ?.addEventListener('click', () => speakTextCantonese(card.teachingScript));

    this.mainLayer
      .querySelector('#btn-jigsaw-done')
      ?.addEventListener('click', () => {
        stopSpeaking();
        this.isPanelModalOpen = false;
        onContinue();
      });
  }

  /** 特命大清盛世史官電子證書產生與儲存面板 */
  public showCertificateModal(modeTitle: string, onClose: () => void): void {
    this.clearActiveKeyListener();
    this.hideMinimap();
    this.isPanelModalOpen = true;
    this.resetInputState();

    const renderCertView = () => {
      const dataUrl = renderHistorianCertificateDataUrl({
        studentName: gameState.studentName,
        modeTitle,
        medals: gameState.minigameMedals,
        totalVisitedCount: gameState.getTotalVisitedEvidenceCount()
      });

      this.mainLayer.innerHTML = `
        <div class="overlay-backdrop">
          <div class="card-modal" style="max-width:600px;">
            <div class="panel-header">
              <span>🏅 特命大清盛世史官褒獎狀</span>
              <span class="badge-sub">可下載／長按儲存</span>
            </div>
            <div class="panel-box" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <label for="cert-name-input" style="font-weight:800;font-size:14px;">班別及姓名：</label>
              <input
                id="cert-name-input"
                class="ask-input"
                style="flex:1 1 180px;padding:7px 10px;"
                type="text"
                maxlength="20"
                placeholder="例如：6A 陳小明"
                value="${gameState.studentName.replace(/"/g, '&quot;')}"
              />
              <button id="btn-cert-refresh" class="pixel-btn gold" type="button" style="padding:8px 12px;font-size:14px;">
                更新證書姓名
              </button>
            </div>
            <div style="text-align:center;background:#26150f;padding:8px;border-radius:8px;">
              <img id="cert-preview-img" src="${dataUrl}" alt="大清盛世史官證書" style="width:100%;height:auto;border-radius:4px;pointer-events:auto;" />
              <div style="color:#ffe48a;font-size:12px;font-weight:700;margin-top:5px;">
                📱 iPad 可直接長按上方證書圖片點選「儲存到相片」，或點按下方下載按鈕
              </div>
            </div>
            <div class="btn-row">
              <a id="btn-cert-download" class="pixel-btn jade" href="${dataUrl}" download="康雍乾盛世_史官證書.png" style="text-decoration:none;">
                📥 下載證書圖片（PNG）
              </a>
              <button id="btn-cert-close" class="pixel-btn secondary" type="button">返回</button>
            </div>
          </div>
        </div>
      `;

      const nameInput = this.mainLayer.querySelector<HTMLInputElement>(
        '#cert-name-input'
      )!;
      this.mainLayer
        .querySelector('#btn-cert-refresh')
        ?.addEventListener('click', () => {
          gameState.setStudentName(nameInput.value);
          renderCertView();
        });

      this.mainLayer
        .querySelector('#btn-cert-close')
        ?.addEventListener('click', () => {
          this.isPanelModalOpen = false;
          onClose();
        });
    };

    renderCertView();
  }

  // 7. 疊加數字密碼鍵盤卡牌
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

  public showTeacherPasswordPad(onSuccess: () => void): void {
    this.showPasswordPad({
      title: '老師的最後密碼',
      hint: PROMPTS.TEACHER_PASSWORD_HINT,
      expectedPassword: FINAL_TEACHER_PASSWORD,
      allowCancel: false,
      onSuccess
    });
  }

  private async copyTextToClipboard(
    text: string,
    fallbackTextarea?: HTMLTextAreaElement | null
  ): Promise<boolean> {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to execCommand fallback
      }
    }

    try {
      const target = fallbackTextarea || document.createElement('textarea');
      const isTemp = !fallbackTextarea;
      if (isTemp) {
        target.value = text;
        target.setAttribute('readonly', 'true');
        target.style.position = 'fixed';
        target.style.left = '-9999px';
        document.body.appendChild(target);
      }
      target.focus();
      target.select();
      target.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      if (isTemp) {
        document.body.removeChild(target);
      }
      return ok;
    } catch {
      return false;
    }
  }

  /**
   * 8. 升級版「有根有據（CER）向乾隆皇帝進諫」面板：
   * 支援勾選晚年隱憂＋前朝治國根據自動組合奏摺草稿，並輸出含乾隆回應、四大後果推演與四格漫畫生圖的 Gemini Prompt
   */
  public showQianlongRemonstrancePanel(opts: {
    entrySource: 'sequential' | 'title';
    onFinish: () => void;
  }): void {
    this.clearActiveKeyListener();
    this.hideMinimap();
    this.closeSettingsModal();
    this.isPanelModalOpen = true;
    this.resetInputState();

    const selectedProblems = new Set<string>();
    const selectedPrecedents = new Set<string>();

    const problemBtnsHtml = CER_PROBLEMS.map(
      (p) =>
        `<button type="button" class="cer-pill-btn" data-cer-prob="${p.id}">○ ${p.label}</button>`
    ).join('');

    const precedentBtnsHtml = CER_PRECEDENTS.map(
      (p) =>
        `<button type="button" class="cer-pill-btn" data-cer-prec="${p.id}">○ ${p.label}</button>`
    ).join('');

    const chipsHtml = REMONSTRANCE_SUGGESTIONS.map(
      (item, idx) =>
        `<button type="button" class="topic-chip-btn" data-chip-idx="${idx}">💡 ${item.label}</button>`
    ).join('');

    const finishBtnLabel =
      opts.entrySource === 'sequential' ? '乘御船返回現代 ▶' : '返回主畫面';

    this.mainLayer.innerHTML = `
      <div class="overlay-backdrop">
        <div class="card-modal" style="max-width:600px;">
          <div class="panel-header">
            <span>向乾隆皇帝進諫（有根有據奏摺）</span>
            <span class="badge-sub">Gemini 指令＋四格漫畫</span>
          </div>
          <div class="hint-banner" style="font-size:13.5px;">
            可先用下方「奏摺組合器」勾選歷史根據，再撰寫諫言輸出專屬 Prompt，一鍵複製貼到 Gemini 生成乾隆回應與「四格漫畫圖像」！
          </div>

          <div class="panel-box" style="display:flex;flex-direction:column;gap:7px;">
            <div style="font-size:13px;font-weight:800;color:#781912;">
              步驟一（可選）：點選你想解決的乾隆晚年問題
            </div>
            <div class="topic-chips">${problemBtnsHtml}</div>

            <div style="font-size:13px;font-weight:800;color:#245943;margin-top:2px;">
              步驟二（可選）：點選借鑑的前朝治國經驗
            </div>
            <div class="topic-chips">${precedentBtnsHtml}</div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;gap:6px;flex-wrap:wrap;">
              <label for="qianlong-advice-input" style="font-size:13.5px;font-weight:800;color:#591812;">
                步驟三：你的進諫奏摺內容（可自由修改）：
              </label>
              <button id="btn-cer-compose" type="button" class="tts-pill-btn" style="font-size:12px;">
                ✍️ 依勾選合成奏摺草稿
              </button>
            </div>

            <textarea
              id="qianlong-advice-input"
              class="ask-input remonstrance-textarea"
              rows="3"
              maxlength="320"
              placeholder="例如：皇上，請勿再寵信貪官和珅，應嚴懲貪污、減少南巡與軍費開支，並開墾農田照顧百姓……"
            ></textarea>
            <div class="topic-chips">${chipsHtml}</div>
            <button id="btn-gen-prompt" class="pixel-btn gold" type="button">
              生成 Gemini 進諫 Prompt（含四格漫畫）
            </button>
          </div>
          <div id="qianlong-prompt-area"></div>
          <button id="btn-remonstrate-finish" class="pixel-btn secondary" type="button">
            ${finishBtnLabel}
          </button>
        </div>
      </div>
    `;

    const inputEl = this.mainLayer.querySelector<HTMLTextAreaElement>(
      '#qianlong-advice-input'
    )!;
    const promptArea = this.mainLayer.querySelector<HTMLElement>(
      '#qianlong-prompt-area'
    )!;
    const finishBtn = this.mainLayer.querySelector<HTMLButtonElement>(
      '#btn-remonstrate-finish'
    )!;

    let latestPrompt = '';

    const renderGeneratedPrompt = () => {
      const probLabels = CER_PROBLEMS.filter((p) =>
        selectedProblems.has(p.id)
      ).map((p) => p.label);
      const precLabels = CER_PRECEDENTS.filter((p) =>
        selectedPrecedents.has(p.id)
      ).map((p) => p.label);

      const result = buildQianlongGeminiPrompt(inputEl.value, {
        problemLabels: probLabels,
        precedentLabels: precLabels
      });

      if (!result.ok) {
        latestPrompt = '';
        promptArea.innerHTML = `<div class="feedback-msg error">${result.error}</div>`;
        return;
      }

      latestPrompt = result.prompt;
      promptArea.innerHTML = `
        <div class="panel-box" style="display:flex;flex-direction:column;gap:8px;background:#fffaf0;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:14px;font-weight:800;color:#245943;">✓ 已生成專屬 Gemini Prompt（含四格漫畫指令）：</span>
            <span style="font-size:12px;font-weight:700;color:#6b5239;">複製後請直接貼到 Gemini 發送</span>
          </div>
          <textarea
            id="gemini-prompt-output"
            class="ask-input prompt-output-box"
            rows="6"
            readonly
          ></textarea>
          <button id="btn-copy-prompt" class="pixel-btn jade" type="button">
            📋 複製 Prompt（直接貼到 Gemini 生成回應與四格漫畫）
          </button>
          <div id="copy-status-banner" style="display:none;"></div>
        </div>
      `;

      const outputTextarea = promptArea.querySelector<HTMLTextAreaElement>(
        '#gemini-prompt-output'
      )!;
      outputTextarea.value = latestPrompt;

      const copyBtn = promptArea.querySelector<HTMLButtonElement>(
        '#btn-copy-prompt'
      )!;
      const statusBanner = promptArea.querySelector<HTMLElement>(
        '#copy-status-banner'
      )!;

      copyBtn.addEventListener('click', () => {
        void this.copyTextToClipboard(latestPrompt, outputTextarea).then((copied) => {
          statusBanner.style.display = 'block';
          if (copied) {
            copyBtn.textContent = '✓ 已複製 Prompt！可再次點按複製';
            statusBanner.className = 'feedback-msg ok';
            statusBanner.textContent =
              '已成功複製到剪貼簿！現在請開啟你的 Gemini 貼上（Paste）並發送，即可查看乾隆皇帝的御批回應、清朝國運後果與「四格漫畫圖像」！';
            if (opts.entrySource === 'sequential') {
              finishBtn.className = 'pixel-btn gold';
            }
          } else {
            statusBanner.className = 'feedback-msg error';
            statusBanner.textContent =
              '瀏覽器限制自動複製，已為你全選上方文字，請長按文字框點選「拷貝／複製」後貼到 Gemini。';
            outputTextarea.focus();
            outputTextarea.select();
          }
        });
      });
    };

    this.mainLayer
      .querySelectorAll<HTMLButtonElement>('[data-cer-prob]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.cerProb!;
          const opt = CER_PROBLEMS.find((p) => p.id === id);
          if (!opt) return;
          if (selectedProblems.has(id)) {
            selectedProblems.delete(id);
            btn.classList.remove('active');
            btn.textContent = `○ ${opt.label}`;
          } else {
            selectedProblems.add(id);
            btn.classList.add('active');
            btn.textContent = `✓ ${opt.label}`;
          }
        });
      });

    this.mainLayer
      .querySelectorAll<HTMLButtonElement>('[data-cer-prec]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.cerPrec!;
          const opt = CER_PRECEDENTS.find((p) => p.id === id);
          if (!opt) return;
          if (selectedPrecedents.has(id)) {
            selectedPrecedents.delete(id);
            btn.classList.remove('active');
            btn.textContent = `○ ${opt.label}`;
          } else {
            selectedPrecedents.add(id);
            btn.classList.add('active');
            btn.textContent = `✓ ${opt.label}`;
          }
        });
      });

    this.mainLayer
      .querySelector('#btn-cer-compose')
      ?.addEventListener('click', () => {
        const draft = composeCerDraft(
          Array.from(selectedProblems),
          Array.from(selectedPrecedents)
        );
        if (draft) {
          inputEl.value = draft;
          renderGeneratedPrompt();
        } else {
          promptArea.innerHTML = `<div class="feedback-msg error">請先在步驟一或步驟二點選至少一項歷史問題或治國根據！</div>`;
        }
      });

    this.mainLayer
      .querySelectorAll<HTMLButtonElement>('[data-chip-idx]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.chipIdx);
          const suggestion = REMONSTRANCE_SUGGESTIONS[idx];
          if (suggestion) {
            inputEl.value = suggestion.text;
            renderGeneratedPrompt();
          }
        });
      });

    this.mainLayer
      .querySelector('#btn-gen-prompt')
      ?.addEventListener('click', () => renderGeneratedPrompt());

    finishBtn.addEventListener('click', () => {
      this.isPanelModalOpen = false;
      opts.onFinish();
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

  // 10. 返回現代結局與反思疊加卡牌（附領取史官證書按鈕）
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
          <div style="font-size:15px;line-height:1.58;font-weight:700;">${PROMPTS.ENDING_RETURNED}</div>
          <div class="hint-banner" style="font-size:14.5px;">${PROMPTS.ENDING_REFLECTION}</div>
          <div class="feedback-msg ok" style="font-size:14px;">${PROMPTS.ENDING_SUMMARY}</div>
          <div class="btn-row">
            <button id="btn-end-cert" class="pixel-btn gold" type="button">🏅 領取《大清盛世史官證書》</button>
            ${
              gameState.mode === 'class'
                ? `<button id="btn-end-class" class="pixel-btn jade" type="button">返回${MODE_CLASS_LABEL}</button>`
                : ''
            }
            <button id="btn-end-title" class="pixel-btn" type="button">返回標題畫面</button>
          </div>
        </div>
      </div>
    `;

    this.mainLayer
      .querySelector('#btn-end-cert')
      ?.addEventListener('click', () => {
        this.showCertificateModal('康雍乾三朝順序探索', () =>
          this.renderEndingScreen(onBackTitle, onBackClassSelect)
        );
      });
    this.mainLayer
      .querySelector('#btn-end-class')
      ?.addEventListener('click', () => onBackClassSelect());
    this.mainLayer
      .querySelector('#btn-end-title')
      ?.addEventListener('click', () => onBackTitle());
  }
}
