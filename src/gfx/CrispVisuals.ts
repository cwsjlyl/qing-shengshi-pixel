import Phaser from 'phaser';

/** 角色精靈圖原生高清邏輯縮放比例（128x168 對應世界 32x42 邏輯尺寸） */
export const CHAR_HD_SCALE = 4;

const HD_CHAR_CACHE_NAME = 'qing-hd-chars-v3';
const LEGACY_CACHE_NAMES = ['qing-hd-chars-v1', 'qing-hd-chars-v2'];

const CRISP_FONT_STACK =
  '"PingFang HK", "Heiti TC", "Apple LiGothic", "Noto Sans TC", "Microsoft JhengHei", sans-serif';

const CHARACTER_TEXTURE_KEYS = [
  'char_student',
  'char_kangxi_emperor',
  'char_yongzheng_emperor',
  'char_qianlong_emperor',
  'char_manchu_person',
  'char_han_person',
  'char_corrupt_a',
  'char_corrupt_b',
  'char_qing_soldier',
  'char_heshen',
  'char_farmer'
] as const;

let crispTextPatched = false;

export function getCanvasDpr(): number {
  const raw = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(2, Math.max(1, raw));
}

export function toCssSize(
  gameWidth: number,
  gameHeight: number
): { width: number; height: number; dpr: number } {
  const dpr = getCanvasDpr();
  return {
    width: gameWidth / dpr,
    height: gameHeight / dpr,
    dpr
  };
}

export function installCrispChineseTextPatch(): void {
  if (crispTextPatched) return;
  crispTextPatched = true;

  const origUpdateText = Phaser.GameObjects.Text.prototype.updateText;
  Phaser.GameObjects.Text.prototype.updateText = function patchedUpdateText(
    this: Phaser.GameObjects.Text
  ) {
    const result = origUpdateText.call(this);
    if (this.texture) {
      this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    return result;
  };

  const origFactoryText = Phaser.GameObjects.GameObjectFactory.prototype.text;
  Phaser.GameObjects.GameObjectFactory.prototype.text = function patchedAddText(
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const nextStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      ...(style || {})
    };
    nextStyle.fontFamily = CRISP_FONT_STACK;
    if (!nextStyle.resolution || nextStyle.resolution < 4) {
      nextStyle.resolution = 4;
    }
    if (nextStyle.padding === undefined) {
      nextStyle.padding = { x: 2, y: 2 };
    }
    const txtObj = origFactoryText.call(this, x, y, text, nextStyle);
    if (txtObj.texture) {
      txtObj.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    return txtObj;
  };
}

function packPixel(r: number, g: number, b: number, a: number): number {
  return (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;
}

function similarPixel(p1: number, p2: number): boolean {
  const a1 = (p1 >>> 24) & 0xff;
  const a2 = (p2 >>> 24) & 0xff;
  if (a1 === 0 && a2 === 0) return true;
  if (a1 === 0 || a2 === 0) return false;
  const dr = Math.abs(((p1 >>> 16) & 0xff) - ((p2 >>> 16) & 0xff));
  const dg = Math.abs(((p1 >>> 8) & 0xff) - ((p2 >>> 8) & 0xff));
  const db = Math.abs((p1 & 0xff) - (p2 & 0xff));
  return dr + dg + db <= 30;
}

function blendOpaque(p1: number, p2: number): number {
  if (((p1 >>> 24) & 0xff) === 0 || ((p2 >>> 24) & 0xff) === 0) return 0;
  const r = (((p1 >>> 16) & 0xff) + ((p2 >>> 16) & 0xff)) >> 1;
  const g = (((p1 >>> 8) & 0xff) + ((p2 >>> 8) & 0xff)) >> 1;
  const b = ((p1 & 0xff) + (p2 & 0xff)) >> 1;
  return packPixel(r, g, b, 255);
}

function epxScale2x(src: Uint32Array, w: number, h: number): Uint32Array {
  const dstW = w * 2;
  const dstH = h * 2;
  const dst = new Uint32Array(dstW * dstH);

  const at = (x: number, y: number): number => {
    if (x < 0 || x >= w || y < 0 || y >= h) return 0;
    return src[y * w + x];
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const P = at(x, y);
      const A = at(x, y - 1);
      const B = at(x + 1, y);
      const C = at(x, y + 1);
      const D = at(x - 1, y);

      const dEqA = similarPixel(D, A);
      const aEqB = similarPixel(A, B);
      const bEqC = similarPixel(B, C);
      const cEqD = similarPixel(C, D);
      const aEqC = similarPixel(A, C);
      const dEqB = similarPixel(D, B);

      const p1 = dEqA && !cEqD && !aEqB && !aEqC && !dEqB ? blendOpaque(D, A) : P;
      const p2 = aEqB && !dEqA && !bEqC && !aEqC && !dEqB ? blendOpaque(A, B) : P;
      const p3 = cEqD && !bEqC && !dEqA && !aEqC && !dEqB ? blendOpaque(C, D) : P;
      const p4 = bEqC && !aEqB && !cEqD && !aEqC && !dEqB ? blendOpaque(B, C) : P;

      const dx = x * 2;
      const dy = y * 2;
      dst[dy * dstW + dx] = p1;
      dst[dy * dstW + dx + 1] = p2;
      dst[(dy + 1) * dstW + dx] = p3;
      dst[(dy + 1) * dstW + dx + 1] = p4;
    }
  }
  return dst;
}

function registerHdCharSheetAndAnims(
  scene: Phaser.Scene,
  key: string,
  source: HTMLImageElement | HTMLCanvasElement,
  fw4: number,
  fh4: number
): void {
  scene.textures.remove(key);
  const hdSheet = scene.textures.addSpriteSheet(key, source as HTMLImageElement, {
    frameWidth: fw4,
    frameHeight: fh4
  });
  if (!hdSheet) return;
  hdSheet.setFilter(Phaser.Textures.FilterMode.NEAREST);

  (['down', 'left', 'right', 'up'] as const).forEach((dName, rowIdx) => {
    const animKey = `${key}_${dName}`;
    if (scene.anims.exists(animKey)) {
      scene.anims.remove(animKey);
    }
    scene.anims.create({
      key: animKey,
      frames: [
        { key, frame: rowIdx * 4 + 0 },
        { key, frame: rowIdx * 4 + 1 },
        { key, frame: rowIdx * 4 + 2 },
        { key, frame: rowIdx * 4 + 3 }
      ],
      frameRate: 8,
      repeat: -1
    });
  });
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function buildSingleCharacterHdCanvas(
  srcImg: HTMLImageElement | HTMLCanvasElement,
  fw: number,
  fh: number
): HTMLCanvasElement | null {
  const cols = 4;
  const rows = 4;
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = fw * cols;
  srcCanvas.height = fh * rows;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) return null;
  srcCtx.imageSmoothingEnabled = false;
  srcCtx.drawImage(srcImg, 0, 0);

  const fw4 = fw * CHAR_HD_SCALE;
  const fh4 = fh * CHAR_HD_SCALE;
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = fw4 * cols;
  dstCanvas.height = fh4 * rows;
  const dstCtx = dstCanvas.getContext('2d');
  if (!dstCtx) return null;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const frameImg = srcCtx.getImageData(c * fw, r * fh, fw, fh);
      const packed1x = new Uint32Array(fw * fh);
      const raw = frameImg.data;
      for (let i = 0; i < packed1x.length; i++) {
        const bi = i * 4;
        packed1x[i] = packPixel(raw[bi], raw[bi + 1], raw[bi + 2], raw[bi + 3]);
      }

      const up2x = epxScale2x(packed1x, fw, fh);
      const up4x = epxScale2x(up2x, fw * 2, fh * 2);

      const outImgData = dstCtx.createImageData(fw4, fh4);
      const outBytes = outImgData.data;
      for (let i = 0; i < up4x.length; i++) {
        const p = up4x[i];
        const bi = i * 4;
        outBytes[bi] = (p >>> 16) & 0xff;
        outBytes[bi + 1] = (p >>> 8) & 0xff;
        outBytes[bi + 2] = p & 0xff;
        outBytes[bi + 3] = (p >>> 24) & 0xff;
      }
      dstCtx.putImageData(outImgData, c * fw4, r * fh4);
    }
  }
  return dstCanvas;
}

export async function enhanceAllCharacterTexturesCached(
  scene: Phaser.Scene
): Promise<void> {
  let cache: Cache | null = null;
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      for (const oldName of LEGACY_CACHE_NAMES) {
        void window.caches.delete(oldName).catch(() => {});
      }
      cache = await window.caches.open(HD_CHAR_CACHE_NAME);
    } catch {
      cache = null;
    }
  }

  for (const key of CHARACTER_TEXTURE_KEYS) {
    if (!scene.textures.exists(key)) continue;
    const tex = scene.textures.get(key);
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const frame0 = tex.get(0);
    if (!frame0) continue;

    const fw = frame0.width;
    const fh = frame0.height;
    // 若 OriginalArtLoader 已直接建立 128x168 原生高清像素貼圖，保持原生銳利像素不再平滑重繪
    if (fw <= 0 || fh <= 0 || fw >= 120) continue;

    const fw4 = fw * CHAR_HD_SCALE;
    const fh4 = fh * CHAR_HD_SCALE;
    const cacheUrl = `./__baked_hd_char__/${key}_${fw4}x${fh4}.png`;

    if (cache) {
      try {
        const hit = await cache.match(cacheUrl);
        if (hit) {
          const blob = await hit.blob();
          const cachedImg = await loadImageFromBlob(blob);
          registerHdCharSheetAndAnims(scene, key, cachedImg, fw4, fh4);
          continue;
        }
      } catch {
        // Fall back to fresh computation
      }
    }

    const srcImg = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!srcImg) continue;
    const dstCanvas = buildSingleCharacterHdCanvas(srcImg, fw, fh);
    if (!dstCanvas) continue;

    registerHdCharSheetAndAnims(scene, key, dstCanvas, fw4, fh4);

    if (cache) {
      const targetCache = cache;
      dstCanvas.toBlob((blob) => {
        if (!blob) return;
        targetCache
          .put(
            cacheUrl,
            new Response(blob, { headers: { 'Content-Type': 'image/png' } })
          )
          .catch(() => {});
      }, 'image/png');
    }
  }
}

export function enhanceAllCharacterTextures(scene: Phaser.Scene): void {
  void enhanceAllCharacterTexturesCached(scene);
}
