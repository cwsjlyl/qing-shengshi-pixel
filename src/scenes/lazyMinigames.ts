import Phaser from 'phaser';

const loadingScenes = new Set<string>();

/**
 * 動態懶加載（Dynamic import）小遊戲場景：
 * 首屏開啟時無需下載與解析四個小遊戲程式碼，待玩家走近挑戰桌觸發時才即時載入並註冊場景。
 */
export async function launchMinigameScene(
  hostScene: Phaser.Scene,
  sceneKey: string
): Promise<void> {
  if (loadingScenes.has(sceneKey)) return;

  if (hostScene.scene.get(sceneKey)) {
    hostScene.scene.start(sceneKey);
    return;
  }

  loadingScenes.add(sceneKey);
  try {
    let SceneCtor: Phaser.Types.Scenes.SceneType | null = null;
    switch (sceneKey) {
      case 'TalentMinigame': {
        const mod = await import('../minigames/TalentMinigame');
        SceneCtor = mod.TalentMinigame;
        break;
      }
      case 'WhackMinigame': {
        const mod = await import('../minigames/WhackMinigame');
        SceneCtor = mod.WhackMinigame;
        break;
      }
      case 'ArcheryMinigame': {
        const mod = await import('../minigames/ArcheryMinigame');
        SceneCtor = mod.ArcheryMinigame;
        break;
      }
      case 'SouthernTourMinigame': {
        const mod = await import('../minigames/SouthernTourMinigame');
        SceneCtor = mod.SouthernTourMinigame;
        break;
      }
    }

    if (SceneCtor && !hostScene.scene.get(sceneKey)) {
      hostScene.scene.add(sceneKey, SceneCtor, false);
    }
    if (hostScene.sys.isActive()) {
      hostScene.scene.start(sceneKey);
    }
  } finally {
    loadingScenes.delete(sceneKey);
  }
}
