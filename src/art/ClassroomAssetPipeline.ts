import Phaser from 'phaser';
import { PixelArtGenerator } from '../gfx/PixelArtGenerator';
import { resolveAssetUrl } from './assetUrl';
import { OriginalArtLoader } from './OriginalArtLoader';

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export class ClassroomAssetPipeline {
  /**
   * 課堂多機同時載入優化：
   * 1. 若環境支援且建置已產出無損 WebP，優先載入體積更小的 .webp 圖集
   * 2. 若校園 Wi-Fi 瞬斷或格式受阻，自動降級回原始 .png 重試一次
   */
  public static preloadAssets(scene: Phaser.Scene): void {
    OriginalArtLoader.preloadAssets(scene);

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
   * 將貼圖生成拆分為非阻塞幀間階段，避免 iPad Safari 在 100% 時主執行緒卡頓凍結
   */
  public static async buildAllTexturesStaged(
    scene: Phaser.Scene,
    onProgress?: (ratio: number, status: string) => void
  ): Promise<void> {
    onProgress?.(0.84, '正在建立基礎像素貼圖……');
    await nextAnimationFrame();
    PixelArtGenerator.generateAll(scene);

    onProgress?.(0.92, '正在拼合宮苑地磚與康雍乾人物動畫……');
    await nextAnimationFrame();
    OriginalArtLoader.buildAllFromLoadedAssets(scene);

    onProgress?.(1.0, '課堂資源準備完成！');
    await nextAnimationFrame();
  }
}
