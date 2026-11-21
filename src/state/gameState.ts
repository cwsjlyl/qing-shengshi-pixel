import { STAGES, STAGE_ORDER, StageId } from '../data/content';

export type PlayMode = 'sequential' | 'class';
export type MedalRank = 'gold' | 'silver' | 'bronze';
export type ViewZoomPreset = 'panoramic' | 'wide' | 'standard' | 'close';

export const ZOOM_PRESET_ORDER: ReadonlyArray<ViewZoomPreset> = [
  'wide',
  'panoramic',
  'standard',
  'close'
];

export const ZOOM_PRESET_LABELS: Record<ViewZoomPreset, string> = {
  panoramic: '全景',
  wide: '廣角',
  standard: '適中',
  close: '近景'
};

export const MEDAL_LABELS: Record<MedalRank, string> = {
  gold: '御賜金印 ★★★',
  silver: '御賜銀印 ★★',
  bronze: '御賜銅印 ★'
};

const MEDAL_SCORE: Record<MedalRank, number> = {
  bronze: 1,
  silver: 2,
  gold: 3
};

export type QianlongEndingPhase =
  | 'none'
  | 'find_qianlong'
  | 'teacher_password'
  | 'ask_qianlong'
  | 'departing'
  | 'returned_modern';

export interface StageProgress {
  visitedNpcs: Set<string>;
  completedMinigames: Set<string>;
  quizPassed: boolean;
  passwordPassed: boolean;
  qianlongEndingPhase: QianlongEndingPhase;
  playerTileX?: number;
  playerTileY?: number;
}

export interface DynastyMetrics {
  treasury: number;
  morale: number;
  territory: number;
  trendNote: string;
}

interface SerializedStageProgress {
  visitedNpcs: string[];
  completedMinigames: string[];
  quizPassed: boolean;
  passwordPassed: boolean;
  qianlongEndingPhase: QianlongEndingPhase;
  playerTileX?: number;
  playerTileY?: number;
}

interface SerializedSaveData {
  version: 2;
  hasActiveSession: boolean;
  mode: PlayMode;
  currentStage: StageId;
  completedClassStages: StageId[];
  minigameMedals: Partial<Record<string, MedalRank>>;
  studentName: string;
  zoomPreset?: ViewZoomPreset;
  progressMap: Record<StageId, SerializedStageProgress>;
}

const STORAGE_KEY = 'qing_shengshi_save_v2';

class GameStateManager {
  public mode: PlayMode = 'sequential';
  public currentStage: StageId = 'kangxi';
  public completedClassStages: Set<StageId> = new Set();
  public minigameMedals: Partial<Record<string, MedalRank>> = {};
  public studentName = '';
  public zoomPreset: ViewZoomPreset = 'wide';
  private hasActiveSession = false;
  private progressMap: Record<StageId, StageProgress>;

  constructor() {
    this.progressMap = {
      kangxi: this.createFreshStageProgress(),
      yongzheng: this.createFreshStageProgress(),
      qianlong: this.createFreshStageProgress()
    };
    this.loadFromStorage();
  }

  private createFreshStageProgress(): StageProgress {
    return {
      visitedNpcs: new Set<string>(),
      completedMinigames: new Set<string>(),
      quizPassed: false,
      passwordPassed: false,
      qianlongEndingPhase: 'none'
    };
  }

  private loadFromStorage(): void {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SerializedSaveData>;
      if (parsed.version !== 2) return;

      if (parsed.mode === 'sequential' || parsed.mode === 'class') {
        this.mode = parsed.mode;
      }
      if (
        parsed.currentStage === 'kangxi' ||
        parsed.currentStage === 'yongzheng' ||
        parsed.currentStage === 'qianlong'
      ) {
        this.currentStage = parsed.currentStage;
      }
      if (Array.isArray(parsed.completedClassStages)) {
        this.completedClassStages = new Set(parsed.completedClassStages);
      }
      if (parsed.minigameMedals && typeof parsed.minigameMedals === 'object') {
        this.minigameMedals = { ...parsed.minigameMedals };
      }
      if (typeof parsed.studentName === 'string') {
        this.studentName = parsed.studentName;
      }
      if (
        parsed.zoomPreset === 'panoramic' ||
        parsed.zoomPreset === 'wide' ||
        parsed.zoomPreset === 'standard' ||
        parsed.zoomPreset === 'close'
      ) {
        this.zoomPreset = parsed.zoomPreset;
      }
      this.hasActiveSession = Boolean(parsed.hasActiveSession);

      if (parsed.progressMap) {
        for (const st of STAGE_ORDER) {
          const sp = parsed.progressMap[st];
          if (!sp) continue;
          this.progressMap[st] = {
            visitedNpcs: new Set(Array.isArray(sp.visitedNpcs) ? sp.visitedNpcs : []),
            completedMinigames: new Set(
              Array.isArray(sp.completedMinigames) ? sp.completedMinigames : []
            ),
            quizPassed: Boolean(sp.quizPassed),
            passwordPassed: Boolean(sp.passwordPassed),
            qianlongEndingPhase: sp.qianlongEndingPhase || 'none',
            playerTileX: sp.playerTileX,
            playerTileY: sp.playerTileY
          };
        }
      }
    } catch {
      // Ignore private browsing or iframe storage blocks
    }
  }

  public persist(): void {
    try {
      const serializeStage = (p: StageProgress): SerializedStageProgress => ({
        visitedNpcs: Array.from(p.visitedNpcs),
        completedMinigames: Array.from(p.completedMinigames),
        quizPassed: p.quizPassed,
        passwordPassed: p.passwordPassed,
        qianlongEndingPhase: p.qianlongEndingPhase,
        playerTileX: p.playerTileX,
        playerTileY: p.playerTileY
      });

      const payload: SerializedSaveData = {
        version: 2,
        hasActiveSession: this.hasActiveSession,
        mode: this.mode,
        currentStage: this.currentStage,
        completedClassStages: Array.from(this.completedClassStages),
        minigameMedals: this.minigameMedals,
        studentName: this.studentName,
        zoomPreset: this.zoomPreset,
        progressMap: {
          kangxi: serializeStage(this.progressMap.kangxi),
          yongzheng: serializeStage(this.progressMap.yongzheng),
          qianlong: serializeStage(this.progressMap.qianlong)
        }
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota / iframe restrictions
    }
  }

  public cycleZoomPreset(): ViewZoomPreset {
    const idx = ZOOM_PRESET_ORDER.indexOf(this.zoomPreset);
    const next = ZOOM_PRESET_ORDER[(idx + 1) % ZOOM_PRESET_ORDER.length];
    this.zoomPreset = next;
    this.persist();
    return next;
  }

  public hasSavedProgress(): boolean {
    if (this.hasActiveSession) return true;
    return this.completedClassStages.size > 0;
  }

  public clearAllSavedProgress(): void {
    this.hasActiveSession = false;
    this.mode = 'sequential';
    this.currentStage = 'kangxi';
    this.completedClassStages.clear();
    this.minigameMedals = {};
    this.progressMap = {
      kangxi: this.createFreshStageProgress(),
      yongzheng: this.createFreshStageProgress(),
      qianlong: this.createFreshStageProgress()
    };
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  public startSequentialMode(): void {
    this.mode = 'sequential';
    this.currentStage = 'kangxi';
    this.hasActiveSession = true;
    this.progressMap = {
      kangxi: this.createFreshStageProgress(),
      yongzheng: this.createFreshStageProgress(),
      qianlong: this.createFreshStageProgress()
    };
    this.persist();
  }

  public enterClassSelectMode(): void {
    this.mode = 'class';
    this.persist();
  }

  public selectClassStage(stage: StageId): void {
    this.mode = 'class';
    this.currentStage = stage;
    this.hasActiveSession = true;
    this.progressMap[stage] = this.createFreshStageProgress();
    this.persist();
  }

  public advanceToStage(stage: StageId): void {
    this.currentStage = stage;
    this.hasActiveSession = true;
    this.progressMap[stage] = this.createFreshStageProgress();
    this.persist();
  }

  public setStudentName(name: string): void {
    this.studentName = name.trim().slice(0, 24);
    this.persist();
  }

  public markClassStageCompleted(stage: StageId): void {
    this.completedClassStages.add(stage);
    this.persist();
  }

  public isAllClassStagesCompleted(): boolean {
    return STAGE_ORDER.every((id) => this.completedClassStages.has(id));
  }

  public getTotalVisitedEvidenceCount(): number {
    return (
      this.progressMap.kangxi.visitedNpcs.size +
      this.progressMap.yongzheng.visitedNpcs.size +
      this.progressMap.qianlong.visitedNpcs.size
    );
  }

  /**
   * 僅限「由康熙順序探索」模式且依序完成康熙、雍正、乾隆三個皇帝關卡後，才進入向乾隆進諫環節
   */
  public shouldEnterQianlongRemonstrance(): boolean {
    return (
      this.mode === 'sequential' &&
      this.progressMap.kangxi.passwordPassed &&
      this.progressMap.yongzheng.passwordPassed &&
      this.progressMap.qianlong.passwordPassed
    );
  }

  public getStageProgress(stage: StageId = this.currentStage): StageProgress {
    return this.progressMap[stage];
  }

  public savePlayerPosition(tileX: number, tileY: number): void {
    const p = this.getStageProgress();
    p.playerTileX = tileX;
    p.playerTileY = tileY;
    this.persist();
  }

  public setQuizPassed(stage: StageId = this.currentStage): void {
    this.progressMap[stage].quizPassed = true;
    this.persist();
  }

  public setPasswordPassed(stage: StageId = this.currentStage): void {
    this.progressMap[stage].passwordPassed = true;
    this.persist();
  }

  public setQianlongEndingPhase(phase: QianlongEndingPhase): void {
    this.progressMap.qianlong.qianlongEndingPhase = phase;
    if (phase === 'returned_modern') {
      this.hasActiveSession = false;
    }
    this.persist();
  }

  public markNpcVisited(npcId: string, stage: StageId = this.currentStage): {
    isFirstVisit: boolean;
    newlyReady: boolean;
  } {
    const p = this.progressMap[stage];
    const isFirstVisit = !p.visitedNpcs.has(npcId);
    const wasAllReady = this.isAllStageRequirementsReady(stage);
    p.visitedNpcs.add(npcId);
    const nowAllReady = this.isAllStageRequirementsReady(stage);
    this.hasActiveSession = true;
    this.persist();
    return {
      isFirstVisit,
      newlyReady: !wasAllReady && nowAllReady
    };
  }

  public markMinigameCompleted(
    minigameId: string,
    stage: StageId = this.currentStage,
    medal: MedalRank = 'silver'
  ): boolean {
    const p = this.progressMap[stage];
    const wasAllReady = this.isAllStageRequirementsReady(stage);
    p.completedMinigames.add(minigameId);

    const prevMedal = this.minigameMedals[minigameId];
    if (!prevMedal || MEDAL_SCORE[medal] > MEDAL_SCORE[prevMedal]) {
      this.minigameMedals[minigameId] = medal;
    }

    const nowAllReady = this.isAllStageRequirementsReady(stage);
    this.hasActiveSession = true;
    this.persist();
    return !wasAllReady && nowAllReady;
  }

  /**
   * 根據當前朝代與已收集證據計算「大清國運儀表（國庫・民心・版圖）」，直觀呈現由盛轉衰
   */
  public getDynastyMetrics(stage: StageId = this.currentStage): DynastyMetrics {
    const p = this.progressMap[stage];

    if (stage === 'kangxi') {
      let morale = 60;
      let treasury = 66;
      let territory = 72;
      if (p.visitedNpcs.has('kangxi_emperor')) morale += 7;
      if (p.visitedNpcs.has('manchu_person')) morale += 7;
      if (p.visitedNpcs.has('han_person')) morale += 10;
      if (p.completedMinigames.has('talent_game')) {
        morale += 6;
        treasury += 8;
        territory += 8;
      }
      return {
        treasury,
        morale,
        territory,
        trendNote: morale >= 84 ? '滿漢一家・政局安定 ↑' : '招納賢才・消除反抗'
      };
    }

    if (stage === 'yongzheng') {
      let treasury = 70;
      let morale = 82;
      const territory = 82;
      if (p.visitedNpcs.has('yongzheng_emperor')) treasury += 6;
      if (p.visitedNpcs.has('corrupt_a')) treasury += 5;
      if (p.visitedNpcs.has('corrupt_b')) treasury += 5;
      if (p.visitedNpcs.has('treasury_clue')) {
        treasury += 6;
        morale += 5;
      }
      if (p.completedMinigames.has('whack_game')) {
        treasury += 6;
        morale += 5;
      }
      return {
        treasury: Math.min(98, treasury),
        morale: Math.min(95, morale),
        territory,
        trendNote: treasury >= 92 ? '國庫充盈・吏治清明 ↑' : '嚴懲貪官・追回虧空'
      };
    }

    let treasury = 94;
    let morale = 90;
    let territory = 86;

    if (p.visitedNpcs.has('qing_soldier')) territory += 7;
    if (p.completedMinigames.has('archery_game')) {
      territory = 100;
      treasury -= 14;
    }
    if (p.visitedNpcs.has('qianlong_emperor')) {
      territory = Math.max(territory, 96);
      treasury -= 14;
    }
    if (p.visitedNpcs.has('southern_fleet') || p.completedMinigames.has('tour_game')) {
      treasury -= 16;
      morale += 2;
    }
    if (p.visitedNpcs.has('heshen')) {
      treasury -= 16;
      morale -= 18;
    }
    if (p.visitedNpcs.has('farmer')) {
      morale -= 22;
    }

    treasury = Math.max(32, Math.min(98, treasury));
    morale = Math.max(44, Math.min(96, morale));
    territory = Math.min(100, territory);

    const isDeclining = treasury <= 55 || morale <= 62;
    return {
      treasury,
      morale,
      territory,
      trendNote: isDeclining ? '版圖極盛・國力轉弱 ↓' : '十全武功・盛世高峰'
    };
  }

  public areRequiredNpcsVisited(stage: StageId = this.currentStage): boolean {
    const cfg = STAGES[stage];
    const p = this.progressMap[stage];
    return Object.values(cfg.npcs)
      .filter((n) => n.requiredForStage)
      .every((n) => p.visitedNpcs.has(n.id));
  }

  public areRequiredMinigamesDone(stage: StageId = this.currentStage): boolean {
    const cfg = STAGES[stage];
    const p = this.progressMap[stage];
    return cfg.minigames.every((m) => p.completedMinigames.has(m.id));
  }

  public isAllStageRequirementsReady(stage: StageId = this.currentStage): boolean {
    return (
      this.areRequiredNpcsVisited(stage) && this.areRequiredMinigamesDone(stage)
    );
  }
}

export const gameState = new GameStateManager();
