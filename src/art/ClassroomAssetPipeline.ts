import Phaser from 'phaser';
import {
  enhanceAllCharacterTexturesCached,
  restoreIntactSchoolboySheet
} from '../gfx/CrispVisuals';
import { PixelArtGenerator } from '../gfx/PixelArtGenerator';
import { extractAllCharacterPortraits } from '../ui/portraitAndCert';
import { resolveAssetUrl } from './assetUrl';
import { OriginalArtLoader } from './OriginalArtLoader';
import {
  SCHOOL_EXTERIOR_DATA_URI,
  SCHOOL_EXTERIOR_KEY,
  ensureSchoolExteriorTexture
} from './schoolExteriorUri';

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export class ClassroomAssetPipeline {
  public static preloadAssets(scene: Phaser.Scene): void {
    OriginalArtLoader.preloadAssets(scene);
    scene.load.image(SCHOOL_EXTERIOR_KEY, SCHOOL_EXTERIOR_DATA_URI);

    const fallbackPngByKey = new Map<string, string>();
    const retriedKeys = new Set<string>();

    for (const file of scene.load.list.entries) {
      if (typeof file.url === 'string' && file.url.endsWith('.png')) {
        fallbackPngByKey.set(file.key, file.url);
        file.url = resolveAssetUrl(file.url);
      }
    }

    scene.load.on('loaderror', (file: Phaser.Loader.File) => {
      const pngFallback = fallbackPngByKey.get(file.key);
      if (pngFallback && !retriedKeys.has(file.key)) {
        retriedKeys.add(file.key);
        console.warn(
          `[ClassroomAssetPipeline] 載入重試 (${file.key})：自動切換保底路徑 ${pngFallback}`
        );
        scene.load.image(file.key, pngFallback);
      }
    });
  }

  /**
   * 非阻塞分幀貼圖建構 ＋ 完整還原主角校服身體 ＋ CacheStorage 角色高清貼圖快取 ＋ 頭像擷取
   */
  public static async buildAllTexturesStaged(
    scene: Phaser.Scene,
    onProgress?: (ratio: number, status: string) => void
  ): Promise<void> {
    onProgress?.(0.84, '正在建立基礎像素貼圖……');
    await nextAnimationFrame();
    ensureSchoolExteriorTexture(scene);
    PixelArtGenerator.generateAll(scene);

    onProgress?.(0.91, '正在拼合宮苑地磚與原創建築……');
    await nextAnimationFrame();
    OriginalArtLoader.buildAllFromLoadedAssets(scene);
    restoreIntactSchoolboySheet(scene);

    onProgress?.(0.97, '正在載入康雍乾人物高清輪廓與頭像……');
    await nextAnimationFrame();
    await enhanceAllCharacterTexturesCached(scene);
    extractAllCharacterPortraits(scene);

    onProgress?.(1.0, '課堂資源準備完成！');
    await nextAnimationFrame();
  }
}
