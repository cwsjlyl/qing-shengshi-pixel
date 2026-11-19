import { STAGES, StageId } from '../data/content';

export type PlayMode = 'sequential' | 'class';
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

class GameStateManager {
  public mode: PlayMode = 'sequential';
  public currentStage: StageId = 'kangxi';
  public completedClassStages: Set<StageId> = new Set();
  private progressMap: Record<StageId, StageProgress>;

  constructor() {
    this.progressMap = {
      kangxi: this.createFreshStageProgress(),
      yongzheng: this.createFreshStageProgress(),
      qianlong: this.createFreshStageProgress()
    };
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

  public startSequentialMode(): void {
    this.mode = 'sequential';
    this.currentStage = 'kangxi';
    this.progressMap = {
      kangxi: this.createFreshStageProgress(),
      yongzheng: this.createFreshStageProgress(),
      qianlong: this.createFreshStageProgress()
    };
  }

  public enterClassSelectMode(): void {
    this.mode = 'class';
  }

  public selectClassStage(stage: StageId): void {
    this.mode = 'class';
    this.currentStage = stage;
    this.progressMap[stage] = this.createFreshStageProgress();
  }

  public advanceToStage(stage: StageId): void {
    this.currentStage = stage;
    this.progressMap[stage] = this.createFreshStageProgress();
  }

  public getStageProgress(stage: StageId = this.currentStage): StageProgress {
    return this.progressMap[stage];
  }

  public savePlayerPosition(tileX: number, tileY: number): void {
    const p = this.getStageProgress();
    p.playerTileX = tileX;
    p.playerTileY = tileY;
  }

  public markNpcVisited(npcId: string, stage: StageId = this.currentStage): boolean {
    const p = this.progressMap[stage];
    const wasAllReady = this.isAllStageRequirementsReady(stage);
    p.visitedNpcs.add(npcId);
    const nowAllReady = this.isAllStageRequirementsReady(stage);
    return !wasAllReady && nowAllReady;
  }

  public markMinigameCompleted(
    minigameId: string,
    stage: StageId = this.currentStage
  ): boolean {
    const p = this.progressMap[stage];
    const wasAllReady = this.isAllStageRequirementsReady(stage);
    p.completedMinigames.add(minigameId);
    const nowAllReady = this.isAllStageRequirementsReady(stage);
    return !wasAllReady && nowAllReady;
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
