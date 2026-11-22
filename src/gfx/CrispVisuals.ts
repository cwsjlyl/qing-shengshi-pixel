import Phaser from 'phaser';

/** 角色精靈圖原生高清邏輯縮放比例（128x168 對應世界 32x42 邏輯尺寸） */
export const CHAR_HD_SCALE = 4;

const HD_CHAR_CACHE_NAME = 'qing-hd-chars-v5';
const LEGACY_CACHE_NAMES = [
  'qing-hd-chars-v1',
  'qing-hd-chars-v2',
  'qing-hd-chars-v3',
  'qing-hd-chars-v4'
];

const CRISP_FONT_STACK =
  '"PingFang HK", "Heiti TC", "Apple LiGothic", "Noto Sans TC", "Microsoft JhengHei", sans-serif';

const CHARACTER_TEXTURE_KEYS = [
  'char_student',
  'char_kangxi_emperor',
  'char_manchu_person',
  'char_han_person',
  'char_yongzheng_emperor',
  'char_corrupt_a',
  'char_corrupt_b',
  'char_qianlong_emperor',
  'char_qing_soldier',
  'char_heshen',
  'char_farmer'
] as const;

const RAW_SCHOOLBOY_TEX_KEY = 'raw_png_schoolboy';

function packPixel(r: number, g: number, b: number, a: number): number {
  return (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;
}

function colorsSimilar(c1: number, c2: number): boolean {
  if (c1 === c2) return true;
  const a1 = (c1 >>> 24) & 0xff;
  const a2 = (c2 >>> 24) & 0xff;
  if (a1 < 24 && a2 < 24) return true;
  if ((a1 < 24) !== (a2 < 24)) return false;

  const r1 = (c1 >>> 16) & 0xff;
  const g1 = (c1 >>> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >>> 16) & 0xff;
  const g2 = (c2 >>> 8) & 0xff;
  const b2 = c2 & 0xff;

  const dr = Math.abs(r1 - r2);
  const dg = Math.abs(g1 - g2);
  const db = Math.abs(b1 - b2);
  return dr <= 18 && dg <= 18 && db <= 18 && dr + dg + db <= 40;
}

function blend75_25(main: number, accent: number): number {
  const aMain = (main >>> 24) & 0xff;
  const aAcc = (accent >>> 24) & 0xff;
  if (aMain < 24) return main;
  if (aAcc < 24) return main;
  const r = (((main >>> 16) & 0xff) * 3 + ((accent >>> 16) & 0xff)) >> 2;
  const g = (((main >>> 8) & 0xff) * 3 + ((accent >>> 8) & 0xff)) >> 2;
  const b = ((main & 0xff) * 3 + (accent & 0xff)) >> 2;
  const a = Math.max(aMain, aAcc);
  return packPixel(r, g, b, a);
}

/**
 * 2x EPX / Scale2x 改良無模糊像素平滑放大演算法：
 * 消除角色斜角階梯鋸齒，同時保持色彩清脆不發糊。
 */
function epxScale2x(src: Uint32Array, w: number, h: number): Uint32Array {
  const dw = w * 2;
  const dh = h * 2;
  const dst = new Uint32Array(dw * dh);

  const at = (x: number, y: number): number => {
    const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
    const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
    return src[cy * w + cx];
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const P = at(x, y);
      const A = at(x, y - 1);
      const B = at(x + 1, y);
      const C = at(x - 1, y);
      const D = at(x, y + 1);

      const E = at(x - 1, y - 1);
      const F = at(x + 1, y - 1);
      const G = at(x - 1, y + 1);
      const H = at(x + 1, y + 1);

      let p1 = P;
      let p2 = P;
      let p3 = P;
      let p4 = P;

      const cAB = colorsSimilar(A, B);
      const cAC = colorsSimilar(A, C);
      const cBD = colorsSimilar(B, D);
      const cCD = colorsSimilar(C, D);
      const cAD = colorsSimilar(A, D);
      const cBC = colorsSimilar(B, C);

      if (cAC && !cCD && !cAB) {
        p1 = colorsSimilar(A, E) ? P : blend75_25(A, P);
      }
      if (cAB && !cAC && !cBD) {
        p2 = colorsSimilar(B, F) ? P : blend75_25(B, P);
      }
      if (cCD && !cBD && !cAC) {
        p3 = colorsSimilar(C, G) ? P : blend75_25(C, P);
      }
      if (cBD && !cAB && !cCD) {
        p4 = colorsSimilar(D, H) ? P : blend75_25(D, P);
      }

      if (cAD && cBC && !colorsSimilar(A, B)) {
        p1 = P;
        p2 = P;
        p3 = P;
        p4 = P;
      }

      const ox = x * 2;
      const oy = y * 2;
      dst[oy * dw + ox] = p1;
      dst[oy * dw + ox + 1] = p2;
      dst[(oy + 1) * dw + ox] = p3;
      dst[(oy + 1) * dw + ox + 1] = p4;
    }
  }

  return dst;
}

function applyAdaptiveSilhouetteOutline(buf: Uint32Array, w: number, h: number): Uint32Array {
  const out = new Uint32Array(buf);
  const outlineColor = packPixel(26, 16, 12, 236);
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
          if (r + g + b > 140) {
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

function registerHdCharSheetAndAnims(
  scene: Phaser.Scene,
  key: string,
  source: HTMLImageElement | HTMLCanvasElement,
  fw4: number,
  fh4: number
): void {
  const dirs = ['down', 'left', 'right', 'up'] as const;
  dirs.forEach((d) => {
    const animKey = `${key}_${d}`;
    if (scene.anims.exists(animKey)) {
      scene.anims.remove(animKey);
    }
  });

  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const hdTex = scene.textures.addSpriteSheet(key, source as HTMLImageElement, {
    frameWidth: fw4,
    frameHeight: fh4
  });
  hdTex?.setFilter(Phaser.Textures.FilterMode.NEAREST);

  dirs.forEach((dName, rowIdx) => {
    scene.anims.create({
      key: `${key}_${dName}`,
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

/**
 * 還原完整無損的主角小學生精靈圖（保留白色校服上衣、校章、衣袖與白襪像素）：
 * `char-student-schoolboy.png` 本身已具備原生 RGBA 透明背景，
 * 若套用棋盤格漫水去背會把白色校服誤判為白格挖空，因此直接由原圖重建 16 格完整貼圖。
 */
export function restoreIntactSchoolboySheet(scene: Phaser.Scene): void {
  if (!scene.textures.exists(RAW_SCHOOLBOY_TEX_KEY)) return;
  const rawTex = scene.textures.get(RAW_SCHOOLBOY_TEX_KEY);
  const img = rawTex.getSourceImage();
  if (!(img instanceof HTMLImageElement) && !(img instanceof HTMLCanvasElement)) {
    return;
  }
  if (img.width < 64 || img.height < 80) return;

  const cellW = Math.max(16, Math.floor(img.width / 4));
  const cellH = Math.max(20, Math.floor(img.height / 4));
  const sheetW = cellW * 4;
  const sheetH = cellH * 4;

  const workCanvas = document.createElement('canvas');
  workCanvas.width = sheetW;
  workCanvas.height = sheetH;
  const wCtx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!wCtx) return;
  wCtx.imageSmoothingEnabled = false;
  wCtx.clearRect(0, 0, sheetW, sheetH);
  wCtx.drawImage(img, 0, 0, sheetW, sheetH, 0, 0, sheetW, sheetH);

  const imgData = wCtx.getImageData(0, 0, sheetW, sheetH);
  const d = imgData.data;

  // 檢查原圖四角是否已為原生透明（alpha < 32）
  const cornerAlphas = [
    d[3],
    d[(sheetW - 1) * 4 + 3],
    d[(sheetH - 1) * sheetW * 4 + 3],
    d[((sheetH - 1) * sheetW + (sheetW - 1)) * 4 + 3]
  ];
  const hasNativeAlpha = cornerAlphas.some((a) => a < 32);

  if (hasNativeAlpha) {
    // 原圖已去背：僅清除極低不透明度殘點，100% 保留白色校服身體與白襪！
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 24) {
        d[i + 3] = 0;
      }
    }
    wCtx.putImageData(imgData, 0, 0);
  }

  const key = 'char_student';
  const rawBaseKey = 'char_student_intact_base';
  const dirs = ['down', 'left', 'right', 'up'] as const;
  dirs.forEach((dir) => {
    const animKey = `${key}_${dir}`;
    if (scene.anims.exists(animKey)) scene.anims.remove(animKey);
  });
  if (scene.textures.exists(key)) scene.textures.remove(key);
  if (scene.textures.exists(rawBaseKey)) scene.textures.remove(rawBaseKey);

  const baseTex = scene.textures.createCanvas(rawBaseKey, sheetW, sheetH);
  if (!baseTex) return;
  const bCtx = baseTex.getContext();
  bCtx.imageSmoothingEnabled = false;
  bCtx.clearRect(0, 0, sheetW, sheetH);
  bCtx.drawImage(workCanvas, 0, 0);
  baseTex.refresh();

  const spriteTex = scene.textures.addSpriteSheet(
    key,
    baseTex.getSourceImage() as HTMLImageElement,
    {
      frameWidth: cellW,
      frameHeight: cellH
    }
  );
  spriteTex?.setFilter(Phaser.Textures.FilterMode.NEAREST);

  dirs.forEach((dName, rowIdx) => {
    scene.anims.create({
      key: `${key}_${dName}`,
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

function buildSingleCharacterHdCanvas(
  srcImg: HTMLImageElement | HTMLCanvasElement,
  fw: number,
  fh: number
): HTMLCanvasElement | null {
  const cols = 4;
  const rows = 4;
  const srcW = cols * fw;
  const srcH = rows * fh;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return null;
  srcCtx.imageSmoothingEnabled = false;
  srcCtx.drawImage(srcImg, 0, 0);

  const fw4 = fw * CHAR_HD_SCALE;
  const fh4 = fh * CHAR_HD_SCALE;
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = cols * fw4;
  dstCanvas.height = rows * fh4;
  const dstCtx = dstCanvas.getContext('2d');
  if (!dstCtx) return null;
  dstCtx.imageSmoothingEnabled = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const frameImg = srcCtx.getImageData(c * fw, r * fh, fw, fh);
      const packed1x = new Uint32Array(fw * fh);
      const raw = frameImg.data;
      for (let i = 0; i < packed1x.length; i++) {
        const bi = i * 4;
        const a = raw[bi + 3];
        if (a < 80) {
          packed1x[i] = 0;
        } else {
          packed1x[i] = packPixel(raw[bi], raw[bi + 1], raw[bi + 2], 255);
        }
      }

      const up2x = epxScale2x(packed1x, fw, fh);
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

  return dstCanvas;
}

/**
 * 支援 CacheStorage 持久化快取的 4x EPX 高清角色貼圖建構：
 * 升級至 v5 自動清除舊版挖空快取，確保主角全身校服清晰顯示。
 */
export async function enhanceAllCharacterTexturesCached(
  scene: Phaser.Scene
): Promise<void> {
  let cache: Cache | null = null;
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      for (const oldName of LEGACY_CACHE_NAMES) {
        await window.caches.delete(oldName).catch(() => false);
      }
      cache = await window.caches.open(HD_CHAR_CACHE_NAME);
    } catch {
      cache = null;
    }
  }

  for (const key of CHARACTER_TEXTURE_KEYS) {
    if (!scene.textures.exists(key)) continue;
    const tex = scene.textures.get(key);
    const frame0 = tex.get(0);
    if (!frame0) continue;

    const fw = frame0.width;
    const fh = frame0.height;
    if (fw <= 0 || fh <= 0 || fw >= 120) continue;

    const fw4 = fw * CHAR_HD_SCALE;
    const fh4 = fh * CHAR_HD_SCALE;
    const cacheUrl = `/__qing_hd_cache_v5__/${key}_${fw4}x${fh4}.png`;

    if (cache) {
      try {
        const hit = await cache.match(cacheUrl);
        if (hit) {
          const blob = await hit.blob();
          const objUrl = URL.createObjectURL(blob);
          const loadedImg = await new Promise<HTMLImageElement | null>((resolve) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => resolve(null);
            im.src = objUrl;
          });
          URL.revokeObjectURL(objUrl);
          if (loadedImg && loadedImg.width === fw4 * 4) {
            registerHdCharSheetAndAnims(scene, key, loadedImg, fw4, fh4);
            continue;
          }
        }
      } catch {
        // Fallback to live EPX build
      }
    }

    const srcImg = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!srcImg) continue;
    const dstCanvas = buildSingleCharacterHdCanvas(srcImg, fw, fh);
    if (!dstCanvas) continue;

    registerHdCharSheetAndAnims(scene, key, dstCanvas, fw4, fh4);

    if (cache) {
      dstCanvas.toBlob((blob) => {
        if (blob && cache) {
          cache
            .put(
              cacheUrl,
              new Response(blob, { headers: { 'Content-Type': 'image/png' } })
            )
            .catch(() => {});
        }
      }, 'image/png');
    }
  }
}

export function upgradeSceneTextsToHd(scene: Phaser.Scene): void {
  const dpr = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 2)));

  for (const obj of scene.children.list) {
    if (obj instanceof Phaser.GameObjects.Text) {
      obj.setFontFamily(CRISP_FONT_STACK);
      obj.setResolution(dpr * 2);
      obj.setPadding(6, 4, 6, 4);
    } else if (obj instanceof Phaser.GameObjects.Container) {
      for (const sub of obj.list) {
        if (sub instanceof Phaser.GameObjects.Text) {
          sub.setFontFamily(CRISP_FONT_STACK);
          sub.setResolution(dpr * 2);
          sub.setPadding(6, 4, 6, 4);
        }
      }
    }
  }
}

export function attachCrispCameraZoom(cam: Phaser.Cameras.Scene2D.Camera): void {
  const origSetZoom = cam.setZoom.bind(cam);
  cam.setZoom = ((x?: number, y?: number) => {
    if (typeof x === 'number' && y === undefined) {
      const snapped = x >= 1 ? Math.max(1, Math.round(x * 4) / 4) : x;
      return origSetZoom(snapped);
    }
    return origSetZoom(x, y);
  }) as typeof cam.setZoom;
}
