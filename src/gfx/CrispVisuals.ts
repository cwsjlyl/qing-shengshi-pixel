import Phaser from 'phaser';

/** 角色精靈圖高解析放大倍率（雙重 EPX 邊緣重建：1x -> 4x） */
export const CHAR_HD_SCALE = 4;

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

/**
 * 取得畫布硬體像素倍率（iPad / Retina 螢幕啟用 2x 實體解析度，上限鎖定 2 兼顧 35 機流暢度）
 */
export function getCanvasDpr(): number {
  const raw = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(2, Math.max(1, raw));
}

/**
 * 將 Phaser 畫布實體像素尺寸換算回 CSS 邏輯視窗尺寸，供版面與選單對齊計算使用
 */
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

/**
 * 徹底解決 pixelArt:true 下繁體中文字筆畫鋸齒與黏連問題：
 * 1. 所有 Phaser Text 以 4x 高解析度繪製向量字型
 * 2. 強制 Text 獨立貼圖維持 LINEAR 平滑取樣（包含動態 setText 更新後）
 * 3. 自動補齊上下內距，防止繁體字高筆畫（如「慶、懲、疆、廳」）被裁切
 */
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

/**
 * 清理人物邊緣半透明殘影並微幅提升五官／服飾細節銳利度
 */
function cleanAndSharpenFrame1x(src: Uint32Array, w: number, h: number): Uint32Array {
  const cleaned = new Uint32Array(w * h);
  for (let i = 0; i < src.length; i++) {
    const p = src[i];
    const a = (p >>> 24) & 0xff;
    if (a < 56) {
      cleaned[i] = 0;
    } else if (a >= 132) {
      cleaned[i] = ((255 << 24) | (p & 0x00ffffff)) >>> 0;
    } else {
      cleaned[i] = p;
    }
  }

  const out = new Uint32Array(cleaned);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const c = cleaned[idx];
      if (((c >>> 24) & 0xff) < 250) continue;

      const n = cleaned[(y - 1) * w + x];
      const s = cleaned[(y + 1) * w + x];
      const l = cleaned[y * w + (x - 1)];
      const r = cleaned[y * w + (x + 1)];
      if (
        ((n >>> 24) & 0xff) < 250 ||
        ((s >>> 24) & 0xff) < 250 ||
        ((l >>> 24) & 0xff) < 250 ||
        ((r >>> 24) & 0xff) < 250
      ) {
        continue;
      }

      const cr = (c >>> 16) & 0xff;
      const cg = (c >>> 8) & 0xff;
      const cb = c & 0xff;

      const avgR =
        (((n >>> 16) & 0xff) + ((s >>> 16) & 0xff) + ((l >>> 16) & 0xff) + ((r >>> 16) & 0xff)) *
        0.25;
      const avgG =
        (((n >>> 8) & 0xff) + ((s >>> 8) & 0xff) + ((l >>> 8) & 0xff) + ((r >>> 8) & 0xff)) *
        0.25;
      const avgB = ((n & 0xff) + (s & 0xff) + (l & 0xff) + (r & 0xff)) * 0.25;

      const nr = Math.max(0, Math.min(255, Math.round(cr + (cr - avgR) * 0.24)));
      const ng = Math.max(0, Math.min(255, Math.round(cg + (cg - avgG) * 0.24)));
      const nb = Math.max(0, Math.min(255, Math.round(cb + (cb - avgB) * 0.24)));
      out[idx] = packPixel(nr, ng, nb, 255);
    }
  }
  return out;
}

/**
 * 單次 EPX / Scale2x 邊緣導向無模糊放大（消除五官、官帽與衣袍斜線鋸齒）
 */
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

/**
 * 於 4x 高解析畫格為缺乏深色描邊的淺色衣袍／臉部補上細緻深墨外輪廓，讓人物在宮磚與漢白玉背景上立體醒目
 */
function applyAdaptiveSilhouetteOutline(buf: Uint32Array, w: number, h: number): Uint32Array {
  const out = new Uint32Array(buf);
  const outlineColor = packPixel(28, 16, 11, 232);

  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (((buf[idx] >>> 24) & 0xff) !== 0) continue;

      let touchesBrightEdge = false;
      for (const [ox, oy] of dirs) {
        const np = buf[(y + oy) * w + (x + ox)];
        const na = (np >>> 24) & 0xff;
        if (na >= 180) {
          const r = (np >>> 16) & 0xff;
          const g = (np >>> 8) & 0xff;
          const b = np & 0xff;
          if (r + g + b > 130) {
            touchesBrightEdge = true;
            break;
          }
        }
      }

      if (touchesBrightEdge) {
        out[idx] = outlineColor;
      }
    }
  }
  return out;
}

/**
 * 將全數 11 組角色精靈圖升級為 4x 高密度輪廓強化貼圖，並重建四向動畫索引
 */
export function enhanceAllCharacterTextures(scene: Phaser.Scene): void {
  for (const key of CHARACTER_TEXTURE_KEYS) {
    if (!scene.textures.exists(key)) continue;
    const tex = scene.textures.get(key);
    const frame0 = tex.get(0);
    if (!frame0) continue;

    const fw = frame0.width;
    const fh = frame0.height;
    if (fw <= 0 || fh <= 0 || fw >= 120) {
      // 已升級過則不重複處理
      continue;
    }

    const srcImg = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!srcImg) continue;

    const cols = 4;
    const rows = 4;
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = fw * cols;
    srcCanvas.height = fh * rows;
    const srcCtx = srcCanvas.getContext('2d');
    if (!srcCtx) continue;
    srcCtx.imageSmoothingEnabled = false;
    srcCtx.drawImage(srcImg, 0, 0);

    const fw4 = fw * CHAR_HD_SCALE;
    const fh4 = fh * CHAR_HD_SCALE;
    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = fw4 * cols;
    dstCanvas.height = fh4 * rows;
    const dstCtx = dstCanvas.getContext('2d');
    if (!dstCtx) continue;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const frameImg = srcCtx.getImageData(c * fw, r * fh, fw, fh);
        const packed1x = new Uint32Array(fw * fh);
        const raw = frameImg.data;
        for (let i = 0; i < packed1x.length; i++) {
          const bi = i * 4;
          packed1x[i] = packPixel(raw[bi], raw[bi + 1], raw[bi + 2], raw[bi + 3]);
        }

        const sharp1x = cleanAndSharpenFrame1x(packed1x, fw, fh);
        const up2x = epxScale2x(sharp1x, fw, fh);
        const up4x = epxScale2x(up2x, fw * 2, fh * 2);
        const outlined4x = applyAdaptiveSilhouetteOutline(up4x, fw4, fh4);

        const outImgData = dstCtx.createImageData(fw4, fh4);
        const outBytes = outImgData.data;
        for (let i = 0; i < outlined4x.length; i++) {
          const p = outlined4x[i];
          const bi = i * 4;
          outBytes[bi] = (p >>> 16) & 0xff;
          outBytes[bi + 1] = (p >>> 8) & 0xff;
          outBytes[bi + 2] = p & 0xff;
          outBytes[bi + 3] = (p >>> 24) & 0xff;
        }
        dstCtx.putImageData(outImgData, c * fw4, r * fh4);
      }
    }

    scene.textures.remove(key);
    const hdSheet = scene.textures.addSpriteSheet(key, dstCanvas as unknown as HTMLImageElement, {
      frameWidth: fw4,
      frameHeight: fh4
    });
    if (!hdSheet) continue;
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
}
