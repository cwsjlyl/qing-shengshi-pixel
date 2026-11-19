import Phaser from 'phaser';
import { TILE_SIZE, TileIndex } from '../gfx/PixelArtGenerator';
/**
 * 已下載原創 PNG 於 Phaser Loader 的內部鍵值（路徑維持 public/assets/... 不變）
 */
export const RAW_PNG_KEYS = {
  PALACE: 'raw_png_palace',
  JIANGNAN: 'raw_png_jiangnan',
  CAMP_PIER: 'raw_png_camp_pier',
  CHARACTERS: 'raw_png_characters',
  SCHOOLBOY: 'raw_png_schoolboy'
} as const;
/**
 * 立體建築、下半部獨立分簇樹冠、自然邊緣過渡、軍營與船隻物件圖集鍵值
 */
export const HD_PROPS_ATLAS_KEY = 'hd_art_props';
export type PropStampFrame =
  | 'palace_grand_roof'
  | 'palace_side_roof'
  | 'palace_wing_left'
  | 'palace_wing_right'
  | 'palace_wall_span'
  | 'palace_pillar_a'
  | 'palace_pillar_b'
  | 'stone_lantern_a'
  | 'stone_lantern_b'
  | 'marble_stairs_tall'
  | 'tree_cluster_a'
  | 'tree_cluster_b'
  | 'tree_cluster_c'
  | 'tree_cluster_d'
  | 'jiangnan_rocks_a'
  | 'jiangnan_rocks_b'
  | 'shore_rocks_a'
  | 'shore_rocks_b'
  | 'jiangnan_white_house'
  | 'jiangnan_house_a'
  | 'jiangnan_house_b'
  | 'camp_tent_large'
  | 'camp_tent_open'
  | 'camp_tent_medium'
  | 'camp_palisade'
  | 'camp_fence_h'
  | 'camp_fence_short'
  | 'camp_cannon'
  | 'camp_rack'
  | 'camp_crate'
  | 'camp_crates'
  | 'pier_boat_h'
  | 'pier_boat_v'
  | 'palace_eave_cap_l'
  | 'palace_eave_cap_r'
  | 'palace_door_jamb_l'
  | 'palace_door_jamb_r'
  | 'palace_corner_pilaster'
  | 'palace_dougong_span'
  | 'moon_gate_arch'
  | 'marble_edge_w'
  | 'marble_edge_e'
  | 'marble_edge_n'
  | 'marble_edge_s'
  | 'wall_foot_moss_a'
  | 'wall_foot_moss_b'
  | 'grass_fringe_n'
  | 'grass_fringe_s'
  | 'grass_fringe_w'
  | 'grass_fringe_e'
  | 'farmland_bund_h'
  | 'farmland_bund_v'
  | 'pond_reeds_a'
  | 'pond_reeds_b'
  | 'jiangnan_shrub_a'
  | 'jiangnan_shrub_b'
  | 'rustic_bamboo_fence'
  | 'cottage_stepping_stones';
/**
 * 在既有 TileIndex (0..63) 之後擴充的同家族變體圖塊索引 (64..89)，
 * 全部寫入同一個 'palace_tiles' 圖集，確保 TitleScene、ExploreScene 與四個小遊戲 100% 相容。
 */
export const ExtraTileIndex = {
  COURTYARD_BRICK_D: 64,
  COURTYARD_BRICK_E: 65,
  COURTYARD_BRICK_F: 66,
  MARBLE_PATH_C: 67,
  MARBLE_PATH_D: 68,
  HALL_GOLD_BRICK_C: 69,
  HALL_GOLD_BRICK_D: 70,
  GRASS_C: 71,
  GRASS_D: 72,
  GRASS_E: 73,
  DIRT_PATH_C: 74,
  DIRT_PATH_D: 75,
  SAND_C: 76,
  SAND_D: 77,
  DRY_FARMLAND_C: 78,
  DRY_FARMLAND_D: 79,
  STONE_PAVING_B: 80,
  STONE_PAVING_C: 81,
  WOOD_PIER_B: 82,
  WOOD_PIER_C: 83,
  WOOD_PIER_D: 84,
  WATER_4: 85,
  PALACE_WINDOW_B: 86,
  CARVED_MEDALLION_STONE: 87,
  INVISIBLE_ROOF_MARKER: 88,
  TREE_BASE_SHADOW: 89
} as const;
export const CHAR_FRAME_W = 32;
export const CHAR_FRAME_H = 42;
type CharacterRowKind = 0 | 1 | 2 | 3 | 4;
interface RobeRemapRule {
  targetR: number;
  targetG: number;
  targetB: number;
  strength: number;
}
interface CharacterSheetSpec {
  key: string;
  row: CharacterRowKind;
  sideFacesRight: boolean;
  useBeardedOfficial?: boolean;
  robeRemap?: RobeRemapRule;
}
const CHARACTER_SPECS: CharacterSheetSpec[] = [
  { key: 'char_student', row: 4, sideFacesRight: true },
  { key: 'char_kangxi_emperor', row: 0, sideFacesRight: false },
  {
    key: 'char_yongzheng_emperor',
    row: 0,
    sideFacesRight: false,
    robeRemap: { targetR: 186, targetG: 118, targetB: 22, strength: 0.34 }
  },
  {
    key: 'char_qianlong_emperor',
    row: 0,
    sideFacesRight: false,
    robeRemap: { targetR: 250, targetG: 208, targetB: 68, strength: 0.25 }
  },
  { key: 'char_manchu_person', row: 1, sideFacesRight: false, useBeardedOfficial: true },
  {
    key: 'char_han_person',
    row: 1,
    sideFacesRight: false,
    useBeardedOfficial: false,
    robeRemap: { targetR: 62, targetG: 132, targetB: 104, strength: 0.58 }
  },
  {
    key: 'char_corrupt_a',
    row: 1,
    sideFacesRight: false,
    useBeardedOfficial: true,
    robeRemap: { targetR: 108, targetG: 62, targetB: 128, strength: 0.52 }
  },
  {
    key: 'char_corrupt_b',
    row: 1,
    sideFacesRight: false,
    useBeardedOfficial: false,
    robeRemap: { targetR: 126, targetG: 84, targetB: 54, strength: 0.55 }
  },
  { key: 'char_qing_soldier', row: 2, sideFacesRight: true },
  {
    key: 'char_heshen',
    row: 1,
    sideFacesRight: false,
    useBeardedOfficial: false,
    robeRemap: { targetR: 164, targetG: 38, targetB: 56, strength: 0.62 }
  },
  { key: 'char_farmer', row: 3, sideFacesRight: false }
];
interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface VariantTransform {
  shiftX?: number;
  shiftY?: number;
  flipX?: boolean;
  flipY?: boolean;
  mulR?: number;
  mulG?: number;
  mulB?: number;
  addLum?: number;
}
export class OriginalArtLoader {
  public static preloadAssets(scene: Phaser.Scene): void {
    scene.load.image(RAW_PNG_KEYS.PALACE, 'assets/tilesets/tileset-palace.png');
    scene.load.image(RAW_PNG_KEYS.JIANGNAN, 'assets/tilesets/tileset-jiangnan.png');
    scene.load.image(RAW_PNG_KEYS.CAMP_PIER, 'assets/tilesets/tileset-camp-pier.png');
    scene.load.image(RAW_PNG_KEYS.CHARACTERS, 'assets/sprites/sprites-characters.png');
    scene.load.image(RAW_PNG_KEYS.SCHOOLBOY, 'assets/sprites/char-student-schoolboy.png');
    scene.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(
        `[OriginalArtLoader] 載入失敗：public/${file.url}，請確認 PNG 已放置於指定路徑。`
      );
    });
  }
  public static buildAllFromLoadedAssets(scene: Phaser.Scene): void {
    for (const rawKey of Object.values(RAW_PNG_KEYS)) {
      if (scene.textures.exists(rawKey)) {
        scene.textures.get(rawKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
    const palaceImg = this.getSourceImage(scene, RAW_PNG_KEYS.PALACE);
    const jiangnanImg = this.getSourceImage(scene, RAW_PNG_KEYS.JIANGNAN);
    const campImg = this.getSourceImage(scene, RAW_PNG_KEYS.CAMP_PIER);
    const charImg = this.getSourceImage(scene, RAW_PNG_KEYS.CHARACTERS);
    const cleanPalace = palaceImg ? this.healSheetGridlines(palaceImg, 8, 10) : null;
    const cleanJiangnan = jiangnanImg ? this.healSheetGridlines(jiangnanImg, 8, 12) : null;
    const cleanCamp = campImg ? this.healSheetGridlines(campImg, 8, 8) : null;
    this.buildPalaceTileset(scene, cleanPalace, cleanJiangnan, cleanCamp);
    this.buildPropsAtlas(scene, cleanPalace, cleanJiangnan, cleanCamp);
    this.buildAllCharacterSheets(scene, charImg);
    this.buildRoyalBoatTexture(scene, cleanPalace, cleanCamp);
    this.buildHudWorldMarkers(scene);
  }
  private static getSourceImage(
    scene: Phaser.Scene,
    key: string
  ): HTMLImageElement | HTMLCanvasElement | null {
    if (!scene.textures.exists(key)) return null;
    const src = scene.textures.get(key).getSourceImage();
    if (src instanceof HTMLImageElement || src instanceof HTMLCanvasElement) {
      return src;
    }
    return null;
  }
  private static makeCanvas(w: number, h: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
    return c;
  }
  private static fillBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  private static pixelNoise(x: number, y: number, seed = 0): number {
    let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
    n = ((n ^ (n >>> 13)) * 1274126177) | 0;
    return ((n ^ (n >>> 16)) >>> 0) % 1000;
  }
  private static healSheetGridlines(
    src: HTMLImageElement | HTMLCanvasElement,
    cols: number,
    rows: number
  ): HTMLCanvasElement {
    const w = src.width;
    const h = src.height;
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(src, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let c = 1; c < cols; c++) {
      const gxCenter = Math.round((c * w) / cols);
      for (let dx = -1; dx <= 1; dx++) {
        const x = gxCenter + dx;
        if (x < 3 || x >= w - 3) continue;
        const leftX = gxCenter - 3;
        const rightX = gxCenter + 3;
        for (let y = 0; y < h; y++) {
          const p = (y * w + x) * 4;
          const pL = (y * w + leftX) * 4;
          const pR = (y * w + rightX) * 4;
          const lum = d[p] * 0.299 + d[p + 1] * 0.587 + d[p + 2] * 0.114;
          const lumL = d[pL] * 0.299 + d[pL + 1] * 0.587 + d[pL + 2] * 0.114;
          const lumR = d[pR] * 0.299 + d[pR + 1] * 0.587 + d[pR + 2] * 0.114;
          const chroma =
            Math.max(d[p], d[p + 1], d[p + 2]) - Math.min(d[p], d[p + 1], d[p + 2]);
          if (chroma <= 26 && lum < Math.min(lumL, lumR) - 10) {
            d[p] = (d[pL] + d[pR]) >> 1;
            d[p + 1] = (d[pL + 1] + d[pR + 1]) >> 1;
            d[p + 2] = (d[pL + 2] + d[pR + 2]) >> 1;
          }
        }
      }
    }
    for (let r = 1; r < rows; r++) {
      const gyCenter = Math.round((r * h) / rows);
      for (let dy = -1; dy <= 1; dy++) {
        const y = gyCenter + dy;
        if (y < 3 || y >= h - 3) continue;
        const topY = gyCenter - 3;
        const botY = gyCenter + 3;
        for (let x = 0; x < w; x++) {
          const p = (y * w + x) * 4;
          const pT = (topY * w + x) * 4;
          const pB = (botY * w + x) * 4;
          const lum = d[p] * 0.299 + d[p + 1] * 0.587 + d[p + 2] * 0.114;
          const lumT = d[pT] * 0.299 + d[pT + 1] * 0.587 + d[pT + 2] * 0.114;
          const lumB = d[pB] * 0.299 + d[pB + 1] * 0.587 + d[pB + 2] * 0.114;
          const chroma =
            Math.max(d[p], d[p + 1], d[p + 2]) - Math.min(d[p], d[p + 1], d[p + 2]);
          if (chroma <= 26 && lum < Math.min(lumT, lumB) - 10) {
            d[p] = (d[pT] + d[pB]) >> 1;
            d[p + 1] = (d[pT + 1] + d[pB + 1]) >> 1;
            d[p + 2] = (d[pT + 2] + d[pB + 2]) >> 1;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return out;
  }
  private static isNeutralCheckerPixel(r: number, g: number, b: number, a: number): boolean {
    if (a < 20) return true;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = (r * 299 + g * 587 + b * 114) / 1000;
    return chroma <= 18 && lum >= 134;
  }
  private static isThinGridBridge(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    w: number,
    h: number
  ): boolean {
    const p = (y * w + x) * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    if (chroma > 20 || lum < 102 || lum > 140) return false;
    if (x >= 2 && x < w - 2) {
      const pL = (y * w + (x - 2)) * 4;
      const pR = (y * w + (x + 2)) * 4;
      if (
        this.isNeutralCheckerPixel(data[pL], data[pL + 1], data[pL + 2], data[pL + 3]) &&
        this.isNeutralCheckerPixel(data[pR], data[pR + 1], data[pR + 2], data[pR + 3])
      ) {
        return true;
      }
    }
    if (y >= 2 && y < h - 2) {
      const pT = ((y - 2) * w + x) * 4;
      const pB = ((y + 2) * w + x) * 4;
      if (
        this.isNeutralCheckerPixel(data[pT], data[pT + 1], data[pT + 2], data[pT + 3]) &&
        this.isNeutralCheckerPixel(data[pB], data[pB + 1], data[pB + 2], data[pB + 3])
      ) {
        return true;
      }
    }
    return false;
  }
  /**
   * 四向連通洪水填充去背：清除外部灰白棋盤與封閉棋盤孔洞，保留深色描邊與角色眼白
   */
  public static removeCheckerboardAndGrid(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const total = w * h;
    const visited = new Uint8Array(total);
    const cleared = new Uint8Array(total);
    const queue = new Int32Array(total);
    let qHead = 0;
    let qTail = 0;
    const canClearBg = (px: number, py: number): boolean => {
      const p = (py * w + px) * 4;
      if (this.isNeutralCheckerPixel(data[p], data[p + 1], data[p + 2], data[p + 3])) {
        return true;
      }
      return this.isThinGridBridge(data, px, py, w, h);
    };
    const trySeed = (px: number, py: number) => {
      const idx = py * w + px;
      if (!visited[idx] && canClearBg(px, py)) {
        visited[idx] = 1;
        cleared[idx] = 1;
        queue[qTail++] = idx;
      }
    };
    for (let x = 0; x < w; x++) {
      trySeed(x, 0);
      trySeed(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      trySeed(0, y);
      trySeed(w - 1, y);
    }
    const dirs4 = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    while (qHead < qTail) {
      const curr = queue[qHead++];
      const cx = curr % w;
      const cy = (curr - cx) / w;
      for (let d = 0; d < 4; d++) {
        const nx = cx + dirs4[d][0];
        const ny = cy + dirs4[d][1];
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nIdx = ny * w + nx;
        if (!visited[nIdx] && canClearBg(nx, ny)) {
          visited[nIdx] = 1;
          cleared[nIdx] = 1;
          queue[qTail++] = nIdx;
        }
      }
    }
    const compBuf = new Int32Array(total);
    for (let idx = 0; idx < total; idx++) {
      if (visited[idx]) continue;
      const p0 = idx * 4;
      if (!this.isNeutralCheckerPixel(data[p0], data[p0 + 1], data[p0 + 2], data[p0 + 3])) {
        continue;
      }
      let cHead = 0;
      let cTail = 0;
      visited[idx] = 1;
      compBuf[cTail++] = idx;
      let lightCount = 0;
      let midGreyCount = 0;
      while (cHead < cTail) {
        const cur = compBuf[cHead++];
        const cp = cur * 4;
        const lum = (data[cp] * 299 + data[cp + 1] * 587 + data[cp + 2] * 114) / 1000;
        if (lum >= 205) lightCount++;
        else if (lum >= 136 && lum <= 192) midGreyCount++;
        const cx = cur % w;
        const cy = (cur - cx) / w;
        for (let d = 0; d < 4; d++) {
          const nx = cx + dirs4[d][0];
          const ny = cy + dirs4[d][1];
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const nIdx = ny * w + nx;
          if (visited[nIdx]) continue;
          const np = nIdx * 4;
          if (this.isNeutralCheckerPixel(data[np], data[np + 1], data[np + 2], data[np + 3])) {
            visited[nIdx] = 1;
            compBuf[cTail++] = nIdx;
          }
        }
      }
      if (cTail >= 20 && lightCount >= 6 && midGreyCount >= 6) {
        for (let i = 0; i < cTail; i++) {
          cleared[compBuf[i]] = 1;
        }
      }
    }
    for (let idx = 0; idx < total; idx++) {
      if (cleared[idx]) {
        data[idx * 4 + 3] = 0;
      }
    }
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const p = idx * 4;
        if (data[p + 3] === 0) continue;
        const maxC = Math.max(data[p], data[p + 1], data[p + 2]);
        const minC = Math.min(data[p], data[p + 1], data[p + 2]);
        const lum = (data[p] + data[p + 1] + data[p + 2]) / 3;
        if (maxC - minC <= 16 && lum >= 145) {
          const emptyNeighbors =
            (data[(idx - 1) * 4 + 3] === 0 ? 1 : 0) +
            (data[(idx + 1) * 4 + 3] === 0 ? 1 : 0) +
            (data[(idx - w) * 4 + 3] === 0 ? 1 : 0) +
            (data[(idx + w) * 4 + 3] === 0 ? 1 : 0);
          if (emptyNeighbors >= 3) {
            data[p + 3] = 0;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  private static stripBorderWaterBackground(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const total = w * h;
    const visited = new Uint8Array(total);
    const q = new Int32Array(total);
    let head = 0;
    let tail = 0;
    const isWaterBg = (idx: number): boolean => {
      const p = idx * 4;
      if (d[p + 3] < 20) return true;
      return d[p + 2] > d[p] + 14 && d[p + 1] > d[p] + 6;
    };
    const seed = (x: number, y: number) => {
      const idx = y * w + x;
      if (!visited[idx] && isWaterBg(idx)) {
        visited[idx] = 1;
        d[idx * 4 + 3] = 0;
        q[tail++] = idx;
      }
    };
    for (let x = 0; x < w; x++) {
      seed(x, 0);
      seed(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      seed(0, y);
      seed(w - 1, y);
    }
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    while (head < tail) {
      const cur = q[head++];
      const cx = cur % w;
      const cy = (cur - cx) / w;
      for (let i = 0; i < 4; i++) {
        const nx = cx + dirs[i][0];
        const ny = cy + dirs[i][1];
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nIdx = ny * w + nx;
        if (!visited[nIdx] && isWaterBg(nIdx)) {
          visited[nIdx] = 1;
          d[nIdx * 4 + 3] = 0;
          q[tail++] = nIdx;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  /**
   * 去除獨立樹冠外圍草地底角與水角，確保樹下乾淨無方形泥塊或草框
   */
  private static isolateCleanTreeCanopy(canvas: HTMLCanvasElement): void {
    this.removeCheckerboardAndGrid(canvas);
    this.stripBorderWaterBackground(canvas);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const total = w * h;
    const visited = new Uint8Array(total);
    const q = new Int32Array(total);
    let head = 0;
    let tail = 0;
    const isFlatLawnBg = (idx: number): boolean => {
      const p = idx * 4;
      if (d[p + 3] === 0) return true;
      const r = d[p];
      const g = d[p + 1];
      const b = d[p + 2];
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      return lum >= 82 && lum <= 162 && g > r + 8 && g > b + 14 && r >= 68;
    };
    for (let x = 0; x < w; x++) {
      const idx = (h - 1) * w + x;
      if (isFlatLawnBg(idx)) {
        visited[idx] = 1;
        d[idx * 4 + 3] = 0;
        q[tail++] = idx;
      }
    }
    for (let y = Math.floor(h * 0.52); y < h; y++) {
      for (const x of [0, w - 1]) {
        const idx = y * w + x;
        if (!visited[idx] && isFlatLawnBg(idx)) {
          visited[idx] = 1;
          d[idx * 4 + 3] = 0;
          q[tail++] = idx;
        }
      }
    }
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    while (head < tail) {
      const cur = q[head++];
      const cx = cur % w;
      const cy = (cur - cx) / w;
      for (let i = 0; i < 4; i++) {
        const nx = cx + dirs[i][0];
        const ny = cy + dirs[i][1];
        if (nx < 0 || nx >= w || ny < Math.floor(h * 0.44) || ny >= h) continue;
        const nIdx = ny * w + nx;
        if (!visited[nIdx] && isFlatLawnBg(nIdx)) {
          visited[nIdx] = 1;
          d[nIdx * 4 + 3] = 0;
          q[tail++] = nIdx;
        }
      }
    }
    const trunkLeft = Math.floor(w * 0.28);
    const trunkRight = Math.ceil(w * 0.72);
    const baseTop = Math.floor(h * 0.76);
    for (let y = baseTop; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x >= trunkLeft && x <= trunkRight) continue;
        const p = (y * w + x) * 4;
        if (d[p + 3] !== 0 && d[p + 1] > d[p] + 6) {
          d[p + 3] = 0;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  private static extractGridSubCanvas(
    source: HTMLImageElement | HTMLCanvasElement,
    gridCols: number,
    gridRows: number,
    col: number,
    row: number,
    colSpan = 1,
    rowSpan = 1,
    insetPx = 4,
    transparentBg = false
  ): HTMLCanvasElement {
    const cellW = source.width / gridCols;
    const cellH = source.height / gridRows;
    const sx = Math.round(col * cellW + insetPx);
    const sy = Math.round(row * cellH + insetPx);
    const sw = Math.max(4, Math.round(colSpan * cellW - insetPx * 2));
    const sh = Math.max(4, Math.round(rowSpan * cellH - insetPx * 2));
    const out = this.makeCanvas(sw, sh);
    const ctx = out.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    if (transparentBg) this.removeCheckerboardAndGrid(out);
    return out;
  }
  private static extractNormalizedSubCanvas(
    source: HTMLImageElement | HTMLCanvasElement,
    nx: number,
    ny: number,
    nw: number,
    nh: number,
    transparentBg = true
  ): HTMLCanvasElement {
    const sx = Math.max(0, Math.round(nx * source.width));
    const sy = Math.max(0, Math.round(ny * source.height));
    const sw = Math.min(source.width - sx, Math.max(4, Math.round(nw * source.width)));
    const sh = Math.min(source.height - sy, Math.max(4, Math.round(nh * source.height)));
    const out = this.makeCanvas(sw, sh);
    const ctx = out.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    if (transparentBg) this.removeCheckerboardAndGrid(out);
    return out;
  }
  private static makeToroidalSeamless(
    src: HTMLCanvasElement,
    size: number,
    blendPx = 4
  ): HTMLCanvasElement {
    const base = this.makeCanvas(size, size);
    const bCtx = base.getContext('2d', { willReadFrequently: true })!;
    bCtx.imageSmoothingEnabled = false;
    bCtx.drawImage(src, 0, 0, src.width, src.height, 0, 0, size, size);
    const srcData = bCtx.getImageData(0, 0, size, size);
    const s = srcData.data;
    const outData = bCtx.createImageData(size, size);
    const d = outData.data;
    d.set(s);
    for (let y = 0; y < size; y++) {
      for (let k = 0; k < blendPx; k++) {
        const wEdge = 0.5 * ((blendPx - k) / blendPx);
        const iL = (y * size + k) * 4;
        const iR = (y * size + (size - 1 - k)) * 4;
        for (let c = 0; c < 3; c++) {
          const avg = (s[iL + c] + s[iR + c]) * 0.5;
          d[iL + c] = Math.round(s[iL + c] * (1 - wEdge) + avg * wEdge);
          d[iR + c] = Math.round(s[iR + c] * (1 - wEdge) + avg * wEdge);
        }
      }
    }
    const midCopy = new Uint8ClampedArray(d);
    for (let x = 0; x < size; x++) {
      for (let k = 0; k < blendPx; k++) {
        const wEdge = 0.5 * ((blendPx - k) / blendPx);
        const iT = (k * size + x) * 4;
        const iB = ((size - 1 - k) * size + x) * 4;
        for (let c = 0; c < 3; c++) {
          const avg = (midCopy[iT + c] + midCopy[iB + c]) * 0.5;
          d[iT + c] = Math.round(midCopy[iT + c] * (1 - wEdge) + avg * wEdge);
          d[iB + c] = Math.round(midCopy[iB + c] * (1 - wEdge) + avg * wEdge);
        }
      }
    }
    bCtx.putImageData(outData, 0, 0);
    return base;
  }
  private static purifyPureGrassPatch(src: HTMLCanvasElement, size: number): HTMLCanvasElement {
    const c = this.makeCanvas(size, size);
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, size, size);
    const imgData = ctx.getImageData(0, 0, size, size);
    const d = imgData.data;
    const greenSamples: [number, number, number][] = [];
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      if (g >= r + 14 && g >= b + 18 && g >= 88 && g <= 165) {
        greenSamples.push([r, g, b]);
      }
    }
    if (greenSamples.length > 0) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const p = (y * size + x) * 4;
          if (d[p + 1] < d[p] + 10 || d[p + 1] < d[p + 2] + 12 || d[p + 1] < 78) {
            const pick = greenSamples[(x * 7 + y * 13) % greenSamples.length];
            d[p] = pick[0];
            d[p + 1] = pick[1];
            d[p + 2] = pick[2];
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
    return this.makeToroidalSeamless(c, size, 4);
  }
  private static purifyPureEarthPatch(src: HTMLCanvasElement, size: number): HTMLCanvasElement {
    const c = this.makeCanvas(size, size);
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, size, size);
    const imgData = ctx.getImageData(0, 0, size, size);
    const d = imgData.data;
    const earthSamples: [number, number, number][] = [];
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      if (r >= g + 10 && g >= b + 10 && r >= 125 && r <= 195) {
        earthSamples.push([r, g, b]);
      }
    }
    if (earthSamples.length > 0) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const p = (y * size + x) * 4;
          if (d[p + 1] > d[p] - 6 || d[p] < 110) {
            const pick = earthSamples[(x * 11 + y * 17) % earthSamples.length];
            d[p] = pick[0];
            d[p + 1] = pick[1];
            d[p + 2] = pick[2];
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
    return this.makeToroidalSeamless(c, size, 4);
  }
  private static makeSeamlessFamilyVariant(
    baseTile: HTMLCanvasElement,
    size: number,
    opts: VariantTransform
  ): HTMLCanvasElement {
    const scaled = this.makeCanvas(size, size);
    const sCtx = scaled.getContext('2d', { willReadFrequently: true })!;
    sCtx.save();
    sCtx.imageSmoothingEnabled = false;
    sCtx.translate(opts.flipX ? size : 0, opts.flipY ? size : 0);
    sCtx.scale(opts.flipX ? -1 : 1, opts.flipY ? -1 : 1);
    sCtx.drawImage(baseTile, 0, 0, baseTile.width, baseTile.height, 0, 0, size, size);
    sCtx.restore();
    const out = this.makeCanvas(size, size);
    const oCtx = out.getContext('2d', { willReadFrequently: true })!;
    const sx = ((opts.shiftX ?? 0) % size + size) % size;
    const sy = ((opts.shiftY ?? 0) % size + size) % size;
    for (const dx of [sx - size, sx]) {
      for (const dy of [sy - size, sy]) {
        oCtx.drawImage(scaled, dx, dy);
      }
    }
    const mulR = opts.mulR ?? 1;
    const mulG = opts.mulG ?? 1;
    const mulB = opts.mulB ?? 1;
    const addLum = opts.addLum ?? 0;
    if (mulR !== 1 || mulG !== 1 || mulB !== 1 || addLum !== 0) {
      const imgData = oCtx.getImageData(0, 0, size, size);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        d[i] = Math.max(0, Math.min(255, Math.round(d[i] * mulR + addLum)));
        d[i + 1] = Math.max(0, Math.min(255, Math.round(d[i + 1] * mulG + addLum)));
        d[i + 2] = Math.max(0, Math.min(255, Math.round(d[i + 2] * mulB + addLum)));
      }
      oCtx.putImageData(imgData, 0, 0);
    }
    return out;
  }
  private static makeSolidFallbackTile(size: number, color: string): HTMLCanvasElement {
    const c = this.makeCanvas(size, size);
    const ctx = c.getContext('2d')!;
    this.fillBox(ctx, 0, 0, size, size, color);
    return c;
  }
  /**
   * 高對比立體清代朱紅殿柱（含漢白玉蓮瓣柱礎、圓柱受光高光、斗拱彩畫柱頭與深邃斜影）
   */
  private static buildImperialVermilionPillar(
    ornateGoldInlay: boolean,
    w = 30,
    h = 64
  ): HTMLCanvasElement {
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    const cx = Math.floor(w / 2);
    // 多層次柔和接地斜影（不呈方塊，加強殿內外對比度）
    this.fillBox(ctx, 2, h - 7, w - 2, 6, 'rgba(16, 10, 8, 0.22)');
    this.fillBox(ctx, 4, h - 6, w - 6, 5, 'rgba(16, 10, 8, 0.38)');
    this.fillBox(ctx, 7, h - 5, w - 11, 3, 'rgba(12, 6, 4, 0.50)');
    // 漢白玉雕花鼓形柱礎
    const baseTop = h - 13;
    this.fillBox(ctx, cx - 8, baseTop + 4, 16, 6, '#38322c');
    this.fillBox(ctx, cx - 7, baseTop + 1, 14, 8, '#38322c');
    this.fillBox(ctx, cx - 7, baseTop + 4, 14, 5, '#d2cab8');
    this.fillBox(ctx, cx - 6, baseTop + 2, 12, 4, '#ebe5d8');
    this.fillBox(ctx, cx - 5, baseTop + 1, 7, 3, '#faf7f0');
    this.fillBox(ctx, cx + 2, baseTop + 3, 4, 5, '#9c9383');
    for (let lx = cx - 5; lx <= cx + 4; lx += 3) {
      this.fillBox(ctx, lx, baseTop + 4, 1, 3, '#857d6e');
    }
    this.fillBox(ctx, cx - 6, baseTop, 12, 2, '#734f14');
    this.fillBox(ctx, cx - 5, baseTop, 8, 1, '#f0c048');
    // 朱紅圓柱柱身（6 階立體圓柱光影）
    const shaftTop = 15;
    const shaftH = baseTop - shaftTop;
    const sx = cx - 6;
    this.fillBox(ctx, sx, shaftTop, 1, shaftH, '#2b0806');
    this.fillBox(ctx, sx + 11, shaftTop, 1, shaftH, '#2b0806');
    this.fillBox(ctx, sx + 1, shaftTop, 2, shaftH, '#61130f');
    this.fillBox(ctx, sx + 9, shaftTop, 2, shaftH, '#59110d');
    this.fillBox(ctx, sx + 3, shaftTop, 6, shaftH, '#9c2018');
    this.fillBox(ctx, sx + 3, shaftTop, 4, shaftH, '#cc3325');
    this.fillBox(ctx, sx + 4, shaftTop + 2, 2, shaftH - 3, '#ed5b45');
    this.fillBox(ctx, sx + 4, shaftTop + 4, 1, shaftH - 7, '#ff8e75');
    this.fillBox(ctx, sx + 9, shaftTop + 2, 1, shaftH - 4, '#851d17');
    if (ornateGoldInlay) {
      const wave = [-2, -1, 1, 2, 2, 1, -1, -2];
      for (let py = shaftTop + 6; py < baseTop - 4; py += 2) {
        const gx = cx - 1 + wave[Math.floor((py - shaftTop) / 2) % wave.length];
        this.fillBox(ctx, gx, py, 2, 1, '#f5c74f');
        this.fillBox(ctx, gx + 1, py + 1, 1, 1, '#9c6c18');
      }
    }
    this.fillBox(ctx, sx + 1, shaftTop, 10, 4, 'rgba(22, 6, 4, 0.46)');
    this.fillBox(ctx, sx + 1, shaftTop + 3, 10, 1, '#d9a636');
    this.fillBox(ctx, sx + 3, shaftTop + 3, 4, 1, '#ffe282');
    // 清式和璽彩畫額枋與挑出斗拱柱頭（倒梯形階梯輪廓，打破矩形頂端）
    this.fillBox(ctx, cx - 8, 10, 16, 6, '#261b14');
    this.fillBox(ctx, cx - 7, 11, 14, 4, '#1f5c48');
    this.fillBox(ctx, cx - 5, 11, 9, 2, '#388f70');
    this.fillBox(ctx, cx - 7, 10, 14, 1, '#e8b842');
    this.fillBox(ctx, cx - 11, 5, 22, 6, '#261b14');
    this.fillBox(ctx, cx - 10, 6, 20, 4, '#1d446b');
    this.fillBox(ctx, cx - 8, 6, 14, 2, '#356ca1');
    for (const bx of [cx - 9, cx - 4, cx + 2, cx + 7]) {
      this.fillBox(ctx, bx, 7, 2, 3, '#ba3125');
      this.fillBox(ctx, bx, 6, 2, 1, '#f0c248');
    }
    this.fillBox(ctx, cx - 13, 2, 26, 4, '#382510');
    this.fillBox(ctx, cx - 12, 3, 24, 2, '#d49a2a');
    this.fillBox(ctx, cx - 11, 2, 22, 1, '#ffe078');
    this.fillBox(ctx, cx - 14, 1, 2, 2, '#f0bc42');
    this.fillBox(ctx, cx + 12, 1, 2, 2, '#f0bc42');
    return out;
  }
  /**
   * 精細立體漢白玉宮燈（防止淺灰石材在去背時被誤判為棋盤格掏空）
   */
  private static buildCrispStoneLantern(warmLit: boolean, w = 28, h = 36): HTMLCanvasElement {
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    const cx = Math.floor(w / 2);
    this.fillBox(ctx, 3, h - 5, w - 6, 4, 'rgba(18, 14, 10, 0.25)');
    this.fillBox(ctx, 6, h - 4, w - 12, 3, 'rgba(18, 14, 10, 0.40)');
    this.fillBox(ctx, cx - 7, h - 10, 14, 6, '#3b3732');
    this.fillBox(ctx, cx - 5, h - 13, 10, 4, '#3b3732');
    this.fillBox(ctx, cx - 6, h - 9, 12, 4, '#b8b1a2');
    this.fillBox(ctx, cx - 5, h - 9, 8, 2, '#e3ddd0');
    this.fillBox(ctx, cx - 4, h - 12, 8, 3, '#ccc5b6');
    this.fillBox(ctx, cx - 3, 16, 6, h - 28, '#3b3732');
    this.fillBox(ctx, cx - 2, 16, 4, h - 28, '#d2cbbe');
    this.fillBox(ctx, cx - 2, 17, 2, h - 30, '#ede8dc');
    this.fillBox(ctx, cx - 6, 14, 12, 3, '#3b3732');
    this.fillBox(ctx, cx - 5, 14, 10, 2, '#ded8ca');
    this.fillBox(ctx, cx - 5, 8, 10, 6, '#38322c');
    this.fillBox(ctx, cx - 4, 9, 8, 4, warmLit ? '#ffcf66' : '#f2dfb3');
    this.fillBox(ctx, cx - 2, 10, 4, 2, warmLit ? '#fff5c0' : '#fff9e6');
    this.fillBox(ctx, cx, 9, 1, 4, '#574e44');
    this.fillBox(ctx, cx - 8, 5, 16, 3, '#2e2b28');
    this.fillBox(ctx, cx - 9, 4, 2, 2, '#2e2b28');
    this.fillBox(ctx, cx + 7, 4, 2, 2, '#2e2b28');
    this.fillBox(ctx, cx - 5, 3, 10, 3, '#2e2b28');
    this.fillBox(ctx, cx - 7, 5, 14, 2, '#8d887e');
    this.fillBox(ctx, cx - 4, 3, 8, 2, '#bab4a8');
    this.fillBox(ctx, cx - 5, 4, 6, 1, '#e6e1d5');
    this.fillBox(ctx, cx - 1, 1, 2, 2, '#d9aa44');
    return out;
  }
  /**
   * 鎏金銅鼎香爐（修正原圖香爐在米白丹墀上只剩細腳的問題）
   */
  private static buildBronzeIncenseTile(size: number): HTMLCanvasElement {
    const out = this.makeCanvas(size, size);
    const ctx = out.getContext('2d')!;
    this.fillBox(ctx, 4, size - 5, size - 8, 4, 'rgba(18, 12, 8, 0.28)');
    this.fillBox(ctx, 6, size - 4, size - 12, 2, 'rgba(18, 12, 8, 0.42)');
    this.fillBox(ctx, 6, 16, 3, 6, '#291c12');
    this.fillBox(ctx, 15, 16, 3, 6, '#291c12');
    this.fillBox(ctx, 11, 17, 2, 5, '#291c12');
    this.fillBox(ctx, 7, 16, 1, 5, '#856232');
    this.fillBox(ctx, 16, 16, 1, 5, '#856232');
    this.fillBox(ctx, 5, 8, 14, 9, '#291c12');
    this.fillBox(ctx, 3, 6, 3, 5, '#291c12');
    this.fillBox(ctx, 18, 6, 3, 5, '#291c12');
    this.fillBox(ctx, 6, 9, 12, 7, '#6e4f27');
    this.fillBox(ctx, 7, 9, 8, 6, '#9e753a');
    this.fillBox(ctx, 8, 10, 4, 3, '#d4a455');
    this.fillBox(ctx, 4, 7, 1, 3, '#ba8a40');
    this.fillBox(ctx, 19, 7, 1, 3, '#ba8a40');
    this.fillBox(ctx, 8, 12, 8, 1, '#f2c868');
    this.fillBox(ctx, 7, 5, 10, 3, '#382616');
    this.fillBox(ctx, 9, 3, 6, 2, '#382616');
    this.fillBox(ctx, 8, 5, 8, 2, '#ba8a40');
    this.fillBox(ctx, 10, 3, 4, 2, '#f5cf70');
    this.fillBox(ctx, 11, 1, 2, 2, '#f5cf70');
    return out;
  }
  /**
   * 宮殿飛簷翼角與脊獸組件（打破殿簷與牆角矩形積木邊界）
   */
  private static buildPalaceEaveCap(isRight: boolean): HTMLCanvasElement {
    const base = this.makeCanvas(44, 42);
    const ctx = base.getContext('2d')!;
    this.fillBox(ctx, 10, 29, 32, 5, 'rgba(18, 10, 8, 0.34)');
    this.fillBox(ctx, 6, 26, 8, 4, 'rgba(18, 10, 8, 0.28)');
    this.fillBox(ctx, 11, 24, 31, 6, '#1f3b4d');
    this.fillBox(ctx, 12, 25, 29, 3, '#2d6e5e');
    this.fillBox(ctx, 14, 28, 27, 2, '#bd3124');
    for (let x = 4; x < 42; x++) {
      const lift = x < 18 ? Math.round(((18 - x) * (18 - x)) / 26) : 0;
      const topY = Math.max(2, 10 - Math.floor(lift * 0.7));
      const botY = 24 - lift;
      this.fillBox(ctx, x, topY - 1, 1, 1, '#472c08');
      this.fillBox(ctx, x, botY, 1, 2, '#472c08');
      const isRib = x % 3 === 0;
      this.fillBox(ctx, x, topY, 1, Math.max(2, botY - topY), isRib ? '#f5c645' : '#cf9625');
      if (isRib && botY - topY > 4) {
        this.fillBox(ctx, x, topY + 1, 1, Math.max(1, Math.floor((botY - topY) * 0.45)), '#ffe588');
      }
    }
    for (let i = 0; i < 4; i++) {
      const bx = 7 + i * 4;
      const by = 14 - Math.round(((18 - bx) * (18 - bx)) / 32);
      this.fillBox(ctx, bx, by - 3, 3, 3, '#59370a');
      this.fillBox(ctx, bx, by - 2, 2, 2, '#ffd966');
    }
    this.fillBox(ctx, 6, 21, 2, 4, '#4a3210');
    this.fillBox(ctx, 6, 22, 2, 2, '#f0be42');
    if (!isRight) return base;
    const flipped = this.makeCanvas(44, 42);
    const fCtx = flipped.getContext('2d')!;
    fCtx.translate(44, 0);
    fCtx.scale(-1, 1);
    fCtx.drawImage(base, 0, 0);
    return flipped;
  }
  /**
   * 殿簷下連續斗拱彩畫額枋（齒狀昂嘴與投影打破屋簷水平刀切線）
   */
  private static buildPalaceDougongSpan(w = 96, h = 18): HTMLCanvasElement {
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    this.fillBox(ctx, 0, 0, w, 3, 'rgba(18, 10, 8, 0.45)');
    this.fillBox(ctx, 0, 3, w, 7, '#1b475c');
    this.fillBox(ctx, 0, 5, w, 3, '#276b58');
    this.fillBox(ctx, 0, 3, w, 1, '#d9a838');
    this.fillBox(ctx, 0, 9, w, 1, '#d9a838');
    for (let x = 2; x < w - 4; x += 12) {
      this.fillBox(ctx, x, 2, 8, 10, '#2e1812');
      this.fillBox(ctx, x + 1, 3, 6, 7, '#a8291e');
      this.fillBox(ctx, x + 2, 4, 4, 2, '#f2c34b');
      this.fillBox(ctx, x + 2, 7, 4, 2, '#388e72');
      this.fillBox(ctx, x + 1, 12, 6, 3, 'rgba(20, 8, 6, 0.32)');
    }
    this.fillBox(ctx, 0, 10, w, 3, 'rgba(20, 8, 6, 0.22)');
    return out;
  }
  /**
   * 宮牆門洞抱框朱柱配漢白玉抱鼓石（柔化門洞開口垂直硬切邊）
   */
  private static buildPalaceDoorJamb(isRight: boolean): HTMLCanvasElement {
    const base = this.makeCanvas(26, 42);
    const ctx = base.getContext('2d')!;
    this.fillBox(ctx, 3, 36, 19, 5, 'rgba(16, 12, 10, 0.28)');
    this.fillBox(ctx, 2, 2, 20, 6, '#40260a');
    this.fillBox(ctx, 3, 3, 18, 4, '#deab35');
    this.fillBox(ctx, 4, 3, 14, 1, '#ffe280');
    this.fillBox(ctx, 4, 8, 16, 4, '#24594c');
    this.fillBox(ctx, 6, 12, 11, 25, '#360c09');
    this.fillBox(ctx, 7, 12, 9, 24, '#992018');
    this.fillBox(ctx, 8, 12, 5, 24, '#cc3528');
    this.fillBox(ctx, 9, 13, 2, 22, '#ed604a');
    this.fillBox(ctx, 11, 27, 11, 11, '#3b3630');
    this.fillBox(ctx, 13, 25, 8, 3, '#3b3630');
    this.fillBox(ctx, 12, 28, 9, 9, '#d6cfc0');
    this.fillBox(ctx, 13, 26, 6, 6, '#f2ede2');
    this.fillBox(ctx, 15, 29, 3, 3, '#8c8577');
    this.fillBox(ctx, 16, 30, 1, 1, '#faf7f0');
    if (!isRight) return base;
    const flipped = this.makeCanvas(26, 42);
    const fCtx = flipped.getContext('2d')!;
    fCtx.translate(26, 0);
    fCtx.scale(-1, 1);
    fCtx.drawImage(base, 0, 0);
    return flipped;
  }
  /**
   * 宮牆轉角抱角紅柱配漢白玉角石台基與青苔點綴
   */
  private static buildPalaceCornerPilaster(): HTMLCanvasElement {
    const out = this.makeCanvas(28, 40);
    const ctx = out.getContext('2d')!;
    this.fillBox(ctx, 3, 34, 22, 5, 'rgba(16, 12, 10, 0.28)');
    this.fillBox(ctx, 5, 4, 18, 6, '#261810');
    this.fillBox(ctx, 6, 5, 16, 4, '#255e50');
    this.fillBox(ctx, 6, 4, 16, 1, '#e6b640');
    this.fillBox(ctx, 7, 10, 14, 25, '#380d0a');
    this.fillBox(ctx, 8, 10, 12, 24, '#8f1d16');
    this.fillBox(ctx, 9, 10, 6, 24, '#c43124');
    this.fillBox(ctx, 10, 11, 2, 22, '#e85843');
    this.fillBox(ctx, 5, 30, 18, 7, '#3d3832');
    this.fillBox(ctx, 6, 31, 16, 5, '#d9d2c3');
    this.fillBox(ctx, 7, 31, 9, 2, '#f5f0e6');
    this.fillBox(ctx, 6, 35, 3, 2, '#5c7848');
    this.fillBox(ctx, 19, 35, 2, 2, '#5c7848');
    return out;
  }
  /**
   * 圓弧漢白玉月洞門連琉璃捲棚披簷組件（取代雍正南牆 4 格方正綠塊）
   */
  private static buildMoonGateArch(w = 108, h = 46): HTMLCanvasElement {
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    const cx = Math.floor(w / 2);
    const archCy = 27;
    const outerR = 17;
    const innerR = 13;
    this.fillBox(ctx, 8, h - 4, w - 16, 3, 'rgba(16, 12, 10, 0.26)');
    this.fillBox(ctx, 8, 13, w - 16, 30, '#3b120e');
    this.fillBox(ctx, 10, 14, w - 20, 27, '#99241c');
    this.fillBox(ctx, 12, 15, w - 24, 10, '#b32d24');
    this.fillBox(ctx, 9, 39, w - 18, 3, '#ded7c8');
    this.fillBox(ctx, 9, 42, w - 18, 1, '#999284');
    this.fillBox(ctx, 13, 41, 4, 2, '#5b7847');
    this.fillBox(ctx, w - 18, 41, 5, 2, '#5b7847');
    for (const wx of [16, w - 30]) {
      this.fillBox(ctx, wx, 20, 14, 12, '#3b352e');
      this.fillBox(ctx, wx + 1, 21, 12, 10, '#dcd5c6');
      this.fillBox(ctx, wx + 3, 23, 8, 6, '#2d4a39');
      this.fillBox(ctx, wx + 6, 23, 2, 6, '#d6cfc0');
      this.fillBox(ctx, wx + 3, 25, 8, 2, '#d6cfc0');
    }
    for (let y = 10; y <= 42; y++) {
      for (let x = cx - outerR - 1; x <= cx + outerR + 1; x++) {
        const dx = x - cx;
        const dy = y - archCy;
        const distSq = dx * dx + dy * dy;
        const inBotOpen = y >= archCy && Math.abs(dx) <= innerR - 2 && y <= 41;
        const inBotFrame = y >= archCy && Math.abs(dx) <= outerR - 1 && y <= 42;
        if (distSq <= innerR * innerR || inBotOpen) {
          this.fillBox(
            ctx,
            x,
            y,
            1,
            1,
            y >= 38 ? '#b8b2a4' : y >= 32 ? '#3b5e46' : '#233d30'
          );
        } else if (distSq <= outerR * outerR || inBotFrame) {
          const isOutline =
            distSq >= (outerR - 1.2) * (outerR - 1.2) ||
            (distSq <= (innerR + 1.2) * (innerR + 1.2) && y < archCy + 2);
          this.fillBox(ctx, x, y, 1, 1, isOutline ? '#5c554b' : dx < 0 ? '#f2ede2' : '#cfc8b8');
        }
      }
    }
    this.fillBox(ctx, cx - 7, 21, 2, 14, '#5c8f64');
    this.fillBox(ctx, cx - 5, 23, 3, 2, '#5c8f64');
    this.fillBox(ctx, cx + 5, 22, 2, 13, '#5c8f64');
    this.fillBox(ctx, cx + 3, 25, 3, 2, '#5c8f64');
    this.fillBox(ctx, cx - 12, 40, 24, 2, '#f5f0e6');
    this.fillBox(ctx, cx - 13, 42, 26, 2, '#8c8577');
    for (let x = 4; x < w - 4; x++) {
      const distCenter = Math.abs(x - cx);
      const centerRaise = distCenter < 24 ? Math.round((24 - distCenter) * 0.22) : 0;
      const tipLift =
        x < 14
          ? Math.round(((14 - x) * (14 - x)) / 18)
          : x > w - 15
            ? Math.round(((x - (w - 15)) * (x - (w - 15))) / 18)
            : 0;
      const topY = Math.max(1, 8 - centerRaise - Math.floor(tipLift * 0.6));
      const botY = 15 - Math.floor(centerRaise * 0.5) - tipLift;
      this.fillBox(ctx, x, topY - 1, 1, 1, '#472c08');
      this.fillBox(ctx, x, topY, 1, Math.max(2, botY - topY), x % 3 === 0 ? '#f2c244' : '#cc9424');
      this.fillBox(ctx, x, botY, 1, 2, '#265c4e');
      this.fillBox(ctx, x, botY + 2, 1, 2, 'rgba(18, 8, 6, 0.34)');
    }
    return out;
  }
  /**
   * 漢白玉御道與青磚交界自然過渡邊石（參差石緣＋碎石＋青苔＋柔和邊影）
   */
  private static buildMarbleEdgeOverlay(side: 'w' | 'e' | 'n' | 's'): HTMLCanvasElement {
    const isVert = side === 'w' || side === 'e';
    const w = isVert ? 20 : 48;
    const h = isVert ? 48 : 20;
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    if (isVert) {
      const dir = side === 'w' ? -1 : 1;
      const seamX = 10;
      for (let y = 0; y < h; y++) {
        const n = this.pixelNoise(y, side === 'w' ? 11 : 29, 7);
        const jut = 1 + (n % 3) + (y % 8 < 2 ? 1 : 0);
        for (let k = -1; k < jut; k++) {
          this.fillBox(
            ctx,
            seamX + dir * k,
            y,
            1,
            1,
            k === jut - 1 ? '#cfc7b6' : '#eae4d7'
          );
        }
        this.fillBox(ctx, seamX + dir * jut, y, 1, 1, 'rgba(28, 24, 20, 0.34)');
        this.fillBox(ctx, seamX + dir * (jut + 1), y, 1, 1, 'rgba(28, 24, 20, 0.16)');
        if (n % 12 === 0) {
          this.fillBox(ctx, seamX + dir * jut, y, 2, 2, 'rgba(84, 114, 64, 0.78)');
        } else if (n % 17 === 0) {
          this.fillBox(ctx, seamX + dir * (jut + 2), y, 2, 1, 'rgba(186, 180, 168, 0.85)');
        } else if (n % 23 === 0) {
          this.fillBox(ctx, seamX - dir, y, 2, 1, 'rgba(104, 130, 76, 0.62)');
        }
      }
    } else {
      const dir = side === 'n' ? -1 : 1;
      const seamY = 10;
      for (let x = 0; x < w; x++) {
        const n = this.pixelNoise(x, side === 'n' ? 41 : 59, 13);
        const jut = 1 + (n % 3) + (x % 9 < 2 ? 1 : 0);
        for (let k = -1; k < jut; k++) {
          this.fillBox(
            ctx,
            x,
            seamY + dir * k,
            1,
            1,
            k === jut - 1 ? '#cbc3b2' : '#eae4d7'
          );
        }
        this.fillBox(ctx, x, seamY + dir * jut, 1, 1, 'rgba(28, 24, 20, 0.34)');
        this.fillBox(ctx, x, seamY + dir * (jut + 1), 1, 1, 'rgba(28, 24, 20, 0.16)');
        if (n % 13 === 0) {
          this.fillBox(ctx, x, seamY + dir * jut, 2, 2, 'rgba(84, 114, 64, 0.78)');
        } else if (n % 19 === 0) {
          this.fillBox(ctx, x, seamY + dir * (jut + 2), 2, 1, 'rgba(186, 180, 168, 0.85)');
        }
      }
    }
    return out;
  }
  /**
   * 牆腳青苔、散落碎石與漸層柔影帶（中心 y = 9 精準對齊牆底與地面交界線）
   */
  private static buildWallFootMossStrip(variant: number): HTMLCanvasElement {
    const w = 48;
    const h = 18;
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    this.fillBox(ctx, 0, 9, w, 3, 'rgba(20, 14, 12, 0.28)');
    this.fillBox(ctx, 0, 12, w, 3, 'rgba(20, 14, 12, 0.14)');
    for (let x = 1; x < w - 2; x++) {
      const n = this.pixelNoise(x, variant * 31, 91);
      if (n % 5 === 0) {
        const mh = 2 + (n % 3);
        this.fillBox(
          ctx,
          x,
          10 - mh,
          2,
          mh,
          n % 2 === 0 ? 'rgba(74, 106, 56, 0.82)' : 'rgba(94, 126, 68, 0.75)'
        );
      }
      if (n % 13 === 0) {
        const py = 10 + (n % 4);
        this.fillBox(ctx, x, py, 2, 1, 'rgba(196, 190, 178, 0.85)');
        this.fillBox(ctx, x, py + 1, 2, 1, 'rgba(52, 48, 44, 0.38)');
      }
    }
    return out;
  }
  /**
   * 草地向泥路／沙地／石板自然蔓延的不規則草穗過渡帶
   */
  private static buildGrassFringeOverlay(
    dirIntoOther: 'n' | 's' | 'w' | 'e'
  ): HTMLCanvasElement {
    const isVert = dirIntoOther === 'w' || dirIntoOther === 'e';
    const w = isVert ? 20 : 48;
    const h = isVert ? 48 : 20;
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    const greens = ['#4b7534', '#5c8a40', '#6d9c4d', '#3e632a'];
    if (!isVert) {
      const step = dirIntoOther === 's' ? 1 : -1;
      const seamY = 10;
      for (let x = 0; x < w; x++) {
        const n = this.pixelNoise(x, dirIntoOther === 's' ? 101 : 211, 37);
        const wave = Math.round(Math.sin((x / w) * Math.PI * 4) * 1.6);
        const reach = Math.max(1, 2 + (n % 4) + wave);
        for (let k = -1; k < reach; k++) {
          const py = seamY + step * k;
          if (py >= 0 && py < h) {
            this.fillBox(ctx, x, py, 1, 1, k === reach - 1 ? greens[3] : greens[(n + k + 3) % 3]);
          }
        }
        const shadowY = seamY + step * reach;
        if (shadowY >= 0 && shadowY < h) {
          this.fillBox(ctx, x, shadowY, 1, 1, 'rgba(28, 22, 14, 0.24)');
        }
        if (n % 17 === 0) {
          const tuftY = seamY + step * (reach + 2);
          if (tuftY >= 1 && tuftY < h - 2) this.fillBox(ctx, x, tuftY, 2, 2, '#5c8a40');
        } else if (n % 29 === 0) {
          const flY = seamY - step * 2;
          if (flY >= 1 && flY < h - 1) this.fillBox(ctx, x, flY, 1, 1, '#fff3bf');
        }
      }
    } else {
      const step = dirIntoOther === 'e' ? 1 : -1;
      const seamX = 10;
      for (let y = 0; y < h; y++) {
        const n = this.pixelNoise(y, dirIntoOther === 'e' ? 307 : 409, 53);
        const wave = Math.round(Math.cos((y / h) * Math.PI * 4) * 1.6);
        const reach = Math.max(1, 2 + (n % 4) + wave);
        for (let k = -1; k < reach; k++) {
          const px = seamX + step * k;
          if (px >= 0 && px < w) {
            this.fillBox(ctx, px, y, 1, 1, k === reach - 1 ? greens[3] : greens[(n + k + 3) % 3]);
          }
        }
        const shadowX = seamX + step * reach;
        if (shadowX >= 0 && shadowX < w) {
          this.fillBox(ctx, shadowX, y, 1, 1, 'rgba(28, 22, 14, 0.22)');
        }
        if (n % 19 === 0) {
          const tuftX = seamX + step * (reach + 2);
          if (tuftX >= 1 && tuftX < w - 2) this.fillBox(ctx, tuftX, y, 2, 2, '#5c8a40');
        }
      }
    }
    return out;
  }
  /**
   * 蜿蜒泥草田埂（打破乾隆西南農田完美矩形邊框與機械直線感）
   */
  private static buildFarmlandBund(horizontal: boolean): HTMLCanvasElement {
    const w = horizontal ? 48 : 22;
    const h = horizontal ? 22 : 48;
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    if (horizontal) {
      for (let x = 0; x < w; x++) {
        const n = this.pixelNoise(x, 71, 19);
        const cy = 11 + Math.round(Math.sin((x / w) * Math.PI * 2) * 2) + ((n % 3) - 1);
        this.fillBox(ctx, x, cy + 3, 1, 2, 'rgba(32, 20, 10, 0.34)');
        this.fillBox(ctx, x, cy - 2, 1, 5, '#6e5233');
        this.fillBox(ctx, x, cy - 2, 1, 3, '#8f6d46');
        this.fillBox(ctx, x, cy - 2, 1, 1, '#ab875b');
        if (n % 4 <= 1) {
          this.fillBox(ctx, x, cy - 3, 1, 2, n % 2 === 0 ? '#5b853e' : '#739949');
        }
      }
    } else {
      for (let y = 0; y < h; y++) {
        const n = this.pixelNoise(y, 89, 23);
        const cx = 11 + Math.round(Math.cos((y / h) * Math.PI * 2) * 2) + ((n % 3) - 1);
        this.fillBox(ctx, cx + 3, y, 2, 1, 'rgba(32, 20, 10, 0.30)');
        this.fillBox(ctx, cx - 2, y, 5, 1, '#6e5233');
        this.fillBox(ctx, cx - 2, y, 3, 1, '#8f6d46');
        if (n % 4 <= 1) {
          this.fillBox(ctx, cx - 1, y, 2, 1, n % 2 === 0 ? '#5b853e' : '#739949');
        }
      }
    }
    return out;
  }
  /**
   * 江南屋角與庭園自然灌木花叢（供遮擋建築生硬屋角與牆根接縫）
   */
  private static buildJiangnanShrub(flowering: boolean): HTMLCanvasElement {
    const w = 38;
    const h = 30;
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    this.fillBox(ctx, 5, h - 5, w - 10, 4, 'rgba(14, 20, 10, 0.28)');
    const blobs = [
      { cx: 12, cy: 19, rx: 8, ry: 6 },
      { cx: 25, cy: 20, rx: 9, ry: 6 },
      { cx: 19, cy: 14, rx: 10, ry: 8 },
      { cx: 10, cy: 15, rx: 6, ry: 5 },
      { cx: 28, cy: 16, rx: 6, ry: 5 }
    ];
    for (let y = 4; y < h - 3; y++) {
      for (let x = 2; x < w - 2; x++) {
        let inside = false;
        let topDist = 99;
        for (const b of blobs) {
          const dx = (x - b.cx) / b.rx;
          const dy = (y - b.cy) / b.ry;
          const n = (this.pixelNoise(x, y, 61) % 30) / 100;
          if (dx * dx + dy * dy + n <= 1.05) {
            inside = true;
            topDist = Math.min(topDist, y - (b.cy - b.ry));
          }
        }
        if (!inside) continue;
        const n = this.pixelNoise(x, y, 97);
        const col =
          y >= h - 6 || n % 7 === 0
            ? '#294722'
            : topDist <= 3
              ? n % 2 === 0
                ? '#78ab4e'
                : '#63963e'
              : n % 3 === 0
                ? '#3b632d'
                : '#4e7d38';
        this.fillBox(ctx, x, y, 1, 1, col);
      }
    }
    if (flowering) {
      for (const [fx, fy, col] of [
        [11, 13, '#ffd6e0'],
        [18, 10, '#fff2b8'],
        [24, 14, '#ffa8c2'],
        [15, 18, '#fff2b8'],
        [27, 18, '#ffd6e0']
      ] as const) {
        this.fillBox(ctx, fx, fy, 2, 2, col);
        this.fillBox(ctx, fx + 1, fy + 1, 1, 1, '#e08b28');
      }
    }
    return out;
  }
  /**
   * 荷池／水岸菖蒲水草與鵝卵石叢（柔化水池直角邊緣）
   */
  private static buildPondReeds(variant: number): HTMLCanvasElement {
    const w = 34;
    const h = 28;
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    this.fillBox(ctx, 4, h - 5, w - 8, 4, 'rgba(18, 36, 44, 0.30)');
    for (const [rx, ry, rw] of [
      [7, 20, 7],
      [15, 21, 8],
      [23, 20, 6]
    ]) {
      this.fillBox(ctx, rx, ry, rw, 5, '#5a6366');
      this.fillBox(ctx, rx + 1, ry, rw - 2, 3, '#8b9496');
      this.fillBox(ctx, rx + 1, ry, Math.max(2, rw - 4), 1, '#b4bdbd');
    }
    const blades = variant === 0 ? [6, 9, 12, 16, 19, 23, 26] : [8, 11, 14, 18, 21, 25, 28];
    blades.forEach((bx, idx) => {
      const bh = 9 + ((idx * 5 + variant * 3) % 8);
      const lean = idx % 2 === 0 ? -1 : 1;
      for (let k = 0; k < bh; k++) {
        const px = bx + (k > bh * 0.5 ? lean : 0);
        this.fillBox(
          ctx,
          px,
          21 - k,
          1,
          1,
          k < 3 ? '#2c5430' : k > bh - 3 ? '#76ab52' : '#4a7d3b'
        );
      }
      if (idx % 3 === 1) {
        this.fillBox(ctx, bx + lean, 21 - bh + 1, 2, 4, '#6b4224');
      }
    });
    return out;
  }
  private static buildRusticBambooFence(): HTMLCanvasElement {
    const w = 44;
    const h = 24;
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    this.fillBox(ctx, 3, h - 4, w - 6, 3, 'rgba(18, 16, 10, 0.25)');
    this.fillBox(ctx, 3, 10, w - 6, 2, '#695332');
    this.fillBox(ctx, 3, 16, w - 6, 2, '#695332');
    this.fillBox(ctx, 3, 10, w - 6, 1, '#a88c56');
    this.fillBox(ctx, 3, 16, w - 6, 1, '#a88c56');
    for (let x = 4; x < w - 4; x += 5) {
      const topY = 5 + ((x * 7) % 3);
      this.fillBox(ctx, x, topY, 3, h - 3 - topY, '#47361e');
      this.fillBox(ctx, x + 1, topY + 1, 1, h - 5 - topY, '#bda164');
      this.fillBox(ctx, x, 10, 3, 2, '#3d2b16');
      this.fillBox(ctx, x, 16, 3, 2, '#3d2b16');
    }
    for (const gx of [5, 14, 24, 34]) {
      this.fillBox(ctx, gx, h - 6, 3, 3, '#538039');
      this.fillBox(ctx, gx + 1, h - 7, 1, 2, '#709e4a');
    }
    return out;
  }
  private static buildCottageSteppingStones(): HTMLCanvasElement {
    const w = 42;
    const h = 26;
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d')!;
    for (const st of [
      { x: 14, y: 3, sw: 13, sh: 5 },
      { x: 11, y: 10, sw: 12, sh: 5 },
      { x: 18, y: 17, sw: 11, sh: 5 },
      { x: 7, y: 18, sw: 6, sh: 4 }
    ]) {
      this.fillBox(ctx, st.x + 1, st.y + 1, st.sw, st.sh, 'rgba(20, 18, 14, 0.28)');
      this.fillBox(ctx, st.x, st.y, st.sw, st.sh, '#6f7578');
      this.fillBox(ctx, st.x + 1, st.y, st.sw - 2, st.sh - 1, '#a3aaad');
      this.fillBox(ctx, st.x + 2, st.y + 1, Math.max(2, st.sw - 5), 2, '#cfd4d6');
    }
    return out;
  }
  /**
   * 組裝自然不規則輪廓的江南粉牆黛瓦鄉村小屋：
   * 含高低不對稱馬頭牆、小青磚煙囪、微弧飛簷、側廂木披簷（掛玉米／柴垛／青釉水缸）、外伸青石踏步與牆根野草花叢
   */
  private static buildCleanJiangnanCottage(
    jiangnanImg: HTMLImageElement | HTMLCanvasElement | null,
    cottageStyle: 'village' | 'scholar' = 'village',
    w = 128,
    h = 74
  ): HTMLCanvasElement {
    const out = this.makeCanvas(w, h);
    const ctx = out.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    const mainX = 10;
    const mainW = 86;
    const leanX = mainX + mainW - 2;
    const leanW = 24;
    const baseBot = h - 7;
    // 1. 分層柔和接地陰影
    this.fillBox(ctx, mainX - 2, baseBot - 1, mainW + leanW + 4, 6, 'rgba(16, 14, 10, 0.22)');
    this.fillBox(ctx, mainX + 2, baseBot, mainW - 2, 4, 'rgba(16, 14, 10, 0.34)');
    this.fillBox(ctx, leanX + 1, baseBot - 1, leanW - 3, 3, 'rgba(16, 14, 10, 0.30)');
    // 2. 左坡青磚煙囪
    const chimX = mainX + 18;
    this.fillBox(ctx, chimX, 4, 9, 13, '#2d3338');
    this.fillBox(ctx, chimX + 1, 5, 7, 11, '#6c7378');
    this.fillBox(ctx, chimX + 1, 5, 3, 9, '#9aa1a6');
    this.fillBox(ctx, chimX - 1, 3, 11, 2, '#3b4247');
    this.fillBox(ctx, chimX, 3, 8, 1, '#b8bfba');
    // 3. 右側不對稱低矮木構披簷
    for (let x = leanX; x < leanX + leanW; x++) {
      const drop = Math.floor((x - leanX) * 0.28);
      const rTop = 25 + drop;
      const rBot = 37 + Math.floor(drop * 0.7);
      this.fillBox(ctx, x, rTop - 1, 1, 1, '#262d33');
      this.fillBox(ctx, x, rTop, 1, rBot - rTop, x % 3 === 0 ? '#525e69' : '#3a434c');
      this.fillBox(ctx, x, rBot, 1, 2, '#1f2429');
    }
    this.fillBox(ctx, leanX + 2, 37, leanW - 6, baseBot - 38, '#332419');
    this.fillBox(ctx, leanX + 3, 39, leanW - 8, baseBot - 40, '#5e4632');
    this.fillBox(ctx, leanX + leanW - 6, 36, 3, baseBot - 36, '#3d2a1d');
    this.fillBox(ctx, leanX + leanW - 5, 37, 1, baseBot - 38, '#75533a');
    if (cottageStyle === 'village') {
      for (const cxCorn of [leanX + 7, leanX + 12]) {
        this.fillBox(ctx, cxCorn, 37, 2, 2, '#6b5322');
        this.fillBox(ctx, cxCorn, 39, 3, 7, '#edb834');
        this.fillBox(ctx, cxCorn, 40, 1, 5, '#ffe278');
      }
      this.fillBox(ctx, leanX + 4, baseBot - 9, 10, 8, '#4a3321');
      for (let lx = leanX + 5; lx <= leanX + 11; lx += 3) {
        this.fillBox(ctx, lx, baseBot - 8, 2, 2, '#9c7850');
        this.fillBox(ctx, lx, baseBot - 5, 2, 2, '#9c7850');
      }
      this.fillBox(ctx, leanX + 13, baseBot - 11, 10, 11, '#263336');
      this.fillBox(ctx, leanX + 14, baseBot - 10, 8, 9, '#4f6e73');
      this.fillBox(ctx, leanX + 15, baseBot - 9, 3, 6, '#7aa0a6');
      this.fillBox(ctx, leanX + 13, baseBot - 11, 10, 2, '#33474a');
    } else {
      this.fillBox(ctx, leanX + 3, 39, leanW - 9, baseBot - 41, '#dfd9cc');
      this.fillBox(ctx, leanX + 6, 43, 8, 9, '#4a3525');
      this.fillBox(ctx, leanX + 12, baseBot - 12, 8, 6, '#638c52');
      this.fillBox(ctx, leanX + 13, baseBot - 7, 7, 7, '#5c7a82');
    }
    // 4. 主屋粉牆與毛石牆裙
    const wallSample = jiangnanImg
      ? this.extractNormalizedSubCanvas(jiangnanImg, 0.39, 0.555, 0.09, 0.048, false)
      : null;
    this.fillBox(ctx, mainX, 34, mainW, baseBot - 34, '#ede8de');
    if (wallSample) {
      ctx.globalAlpha = 0.4;
      ctx.drawImage(
        wallSample,
        0,
        0,
        wallSample.width,
        wallSample.height,
        mainX,
        34,
        mainW,
        baseBot - 34
      );
      ctx.globalAlpha = 1;
    }
    this.fillBox(ctx, mainX + 8, 48, 12, 8, 'rgba(165, 158, 144, 0.25)');
    this.fillBox(ctx, mainX + mainW - 22, 46, 14, 9, 'rgba(165, 158, 144, 0.22)');
    this.fillBox(ctx, mainX, 33, mainW, 2, '#453124');
    this.fillBox(ctx, mainX, 35, mainW, 4, 'rgba(18, 14, 12, 0.30)');
    this.fillBox(ctx, mainX, baseBot - 7, mainW, 7, '#757c80');
    for (let sx = mainX + 2; sx < mainX + mainW - 6; sx += 9) {
      const sh = 3 + ((sx * 5) % 3);
      this.fillBox(ctx, sx, baseBot - 6, 7, sh, (sx / 9) % 2 === 0 ? '#969ea1' : '#858d91');
      this.fillBox(ctx, sx + 7, baseBot - 6, 1, 6, '#585e61');
    }
    // 5. 微弧黛瓦屋頂與上翹飛簷角
    const roofLeft = mainX - 5;
    const roofRight = mainX + mainW + 4;
    const roofSample = jiangnanImg
      ? this.extractNormalizedSubCanvas(jiangnanImg, 0.635, 0.506, 0.11, 0.042, false)
      : null;
    if (roofSample) {
      for (let rx = roofLeft + 3; rx < roofRight - 3; rx += 24) {
        const segW = Math.min(24, roofRight - 3 - rx);
        ctx.drawImage(roofSample, 0, 0, roofSample.width, roofSample.height, rx, 12, segW, 21);
      }
    }
    const roofMid = (roofLeft + roofRight) / 2;
    for (let x = roofLeft; x <= roofRight; x++) {
      const lDist = x - roofLeft;
      const rDist = roofRight - x;
      const tipLift =
        lDist < 12
          ? Math.round(((12 - lDist) * (12 - lDist)) / 20)
          : rDist < 12
            ? Math.round(((12 - rDist) * (12 - rDist)) / 20)
            : 0;
      const sag = Math.round((1 - Math.pow((x - roofMid) / 48, 2)) * 1.5);
      const rTop = 10 + sag - Math.floor(tipLift * 0.65);
      const rBot = 32 - tipLift;
      const rib = x % 4;
      const tileCol =
        rib === 0 ? '#262d34' : rib === 1 ? '#47525c' : rib === 2 ? '#5b6773' : '#363f47';
      this.fillBox(ctx, x, rTop + 2, 1, Math.max(3, rBot - rTop - 2), tileCol);
      this.fillBox(ctx, x, rTop - 1, 1, 1, '#23282e');
      this.fillBox(ctx, x, rTop, 1, 2, x % 2 === 0 ? '#7f8c96' : '#64707a');
      this.fillBox(ctx, x, rBot, 1, 2 + (x % 3 === 0 ? 1 : 0), '#1b2024');
    }
    this.fillBox(ctx, Math.round(roofMid) - 4, 7, 8, 4, '#333b42');
    this.fillBox(ctx, Math.round(roofMid) - 2, 8, 4, 2, '#9aa6b0');
    // 6. 高低不對稱階梯馬頭牆
    const drawMatou = (gx: number, tallSide: boolean) => {
      const top1 = tallSide ? 5 : 8;
      const top2 = tallSide ? 15 : 17;
      this.fillBox(ctx, gx, top1, 5, baseBot - top1, '#f2eee6');
      this.fillBox(ctx, gx - 2, top1 - 1, 9, 2, '#303840');
      this.fillBox(ctx, gx - 1, top2, 8, 2, '#303840');
      this.fillBox(ctx, gx - 2, top1 - 2, 2, 1, '#303840');
      this.fillBox(ctx, gx, baseBot - 7, 5, 7, '#6f7578');
      this.fillBox(ctx, tallSide ? gx : gx + 4, top1, 1, baseBot - top1, '#3d3834');
    };
    drawMatou(mainX - 1, true);
    drawMatou(mainX + mainW - 4, false);
    // 7. 木門、外伸踏步、紅燈籠與木格花窗
    const doorX = mainX + 35;
    this.fillBox(ctx, doorX - 6, 34, 2, baseBot - 39, '#4d3729');
    this.fillBox(ctx, doorX + 20, 34, 2, baseBot - 39, '#4d3729');
    this.fillBox(ctx, doorX, 39, 16, baseBot - 39, '#382519');
    this.fillBox(ctx, doorX + 2, 41, 5, baseBot - 42, '#6e4d36');
    this.fillBox(ctx, doorX + 9, 41, 5, baseBot - 42, '#6e4d36');
    this.fillBox(ctx, doorX + 5, 50, 1, 2, '#cfa968');
    this.fillBox(ctx, doorX + 10, 50, 1, 2, '#cfa968');
    this.fillBox(ctx, doorX - 2, baseBot - 2, 20, 4, '#5c6266');
    this.fillBox(ctx, doorX - 1, baseBot - 2, 18, 2, '#babfc2');
    this.fillBox(ctx, doorX + 1, baseBot + 2, 14, 3, '#8b9296');
    this.fillBox(ctx, doorX + 2, baseBot + 2, 11, 1, '#d4d9db');
    this.fillBox(ctx, doorX - 4, 35, 1, 3, '#3d281a');
    this.fillBox(ctx, doorX - 6, 38, 5, 5, '#c92e22');
    this.fillBox(ctx, doorX - 5, 39, 3, 3, '#ffcf66');
    for (const wx of [mainX + 12, mainX + 61]) {
      this.fillBox(ctx, wx, 41, 14, 12, '#473325');
      this.fillBox(ctx, wx + 2, 43, 10, 8, '#dfd8c8');
      this.fillBox(ctx, wx + 6, 43, 2, 8, '#5c4332');
      this.fillBox(ctx, wx + 2, 46, 10, 2, '#5c4332');
      this.fillBox(ctx, wx - 1, 53, 16, 2, '#8f8b82');
    }
    // 8. 牆邊自然雜草花叢
    for (const [gx, gw] of [
      [mainX - 3, 15],
      [mainX + 24, 10],
      [mainX + 68, 16],
      [leanX + 15, 12]
    ]) {
      for (let x = gx; x < gx + gw; x++) {
        const n = this.pixelNoise(x, 313, 17);
        const gh = 2 + (n % 5);
        this.fillBox(ctx, x, baseBot + 1 - gh, 1, gh + 1, n % 2 === 0 ? '#4d7836' : '#659444');
      }
      this.fillBox(ctx, gx + Math.floor(gw / 2), baseBot - 3, 2, 2, '#fff0b8');
    }
    return out;
  }
  private static buildPalaceTileset(
    scene: Phaser.Scene,
    palaceImg: HTMLImageElement | HTMLCanvasElement | null,
    jiangnanImg: HTMLImageElement | HTMLCanvasElement | null,
    campImg: HTMLImageElement | HTMLCanvasElement | null
  ): void {
    const S = TILE_SIZE;
    const sheetCols = 8;
    const sheetRows = 12;
    if (scene.textures.exists('palace_tiles')) scene.textures.remove('palace_tiles');
    if (scene.textures.exists('palace_tiles_hd_raw')) scene.textures.remove('palace_tiles_hd_raw');
    const rawTex = scene.textures.createCanvas('palace_tiles_hd_raw', sheetCols * S, sheetRows * S);
    if (!rawTex) return;
    const ctx = rawTex.getContext();
    ctx.imageSmoothingEnabled = false;
    const putTileCanvas = (tileIdx: number, tileCanvas: HTMLCanvasElement) => {
      const dx = (tileIdx % sheetCols) * S;
      const dy = Math.floor(tileIdx / sheetCols) * S;
      ctx.clearRect(dx, dy, S, S);
      ctx.drawImage(tileCanvas, 0, 0, tileCanvas.width, tileCanvas.height, dx, dy, S, S);
    };
    const putGridTile = (
      tileIdx: number,
      src: HTMLImageElement | HTMLCanvasElement | null,
      gCols: number,
      gRows: number,
      c: number,
      r: number,
      cSpan = 1,
      rSpan = 1,
      inset = 4,
      transparent = false,
      fallbackColor = '#7d8488'
    ) => {
      if (!src) {
        putTileCanvas(tileIdx, this.makeSolidFallbackTile(S, fallbackColor));
        return;
      }
      putTileCanvas(
        tileIdx,
        this.extractGridSubCanvas(src, gCols, gRows, c, r, cSpan, rSpan, inset, transparent)
      );
    };
    // 1. 宮廷灰磚家族（100% 保持標題已核准的連續石磚不變）
    const baseBrick = palaceImg
      ? this.extractGridSubCanvas(palaceImg, 8, 10, 1, 5, 1, 1, 4.5, false)
      : this.makeSolidFallbackTile(S, '#8f969a');
    putTileCanvas(TileIndex.COURTYARD_BRICK_A, this.makeSeamlessFamilyVariant(baseBrick, S, {}));
    putTileCanvas(
      TileIndex.COURTYARD_BRICK_B,
      this.makeSeamlessFamilyVariant(baseBrick, S, { shiftX: 12, addLum: -3 })
    );
    putTileCanvas(
      TileIndex.COURTYARD_BRICK_C,
      this.makeSeamlessFamilyVariant(baseBrick, S, { flipX: true, addLum: 3 })
    );
    putTileCanvas(
      ExtraTileIndex.COURTYARD_BRICK_D,
      this.makeSeamlessFamilyVariant(baseBrick, S, { shiftX: 6, shiftY: 12, addLum: -2 })
    );
    putTileCanvas(
      ExtraTileIndex.COURTYARD_BRICK_E,
      this.makeSeamlessFamilyVariant(baseBrick, S, {
        flipX: true,
        shiftX: 12,
        mulR: 0.98,
        mulG: 1.0,
        mulB: 1.02
      })
    );
    putTileCanvas(
      ExtraTileIndex.COURTYARD_BRICK_F,
      this.makeSeamlessFamilyVariant(baseBrick, S, { shiftY: 12, addLum: 2 })
    );
    // 2. 連續漢白玉御道家族（100% 保持標題與御道本體連續無縫）
    const rawPaleStone = palaceImg
      ? this.extractGridSubCanvas(palaceImg, 8, 10, 0, 5, 1, 1, 10, false)
      : this.makeSolidFallbackTile(S, '#ebe6dc');
    const seamlessMarbleBase = this.makeToroidalSeamless(rawPaleStone, S, 5);
    const buildSmoothMarbleSlab = (vt: VariantTransform, jointOffset: number) => {
      const slab = this.makeSeamlessFamilyVariant(seamlessMarbleBase, S, {
        ...vt,
        mulR: 1.12,
        mulG: 1.11,
        mulB: 1.08,
        addLum: (vt.addLum ?? 0) + 12
      });
      const mCtx = slab.getContext('2d')!;
      this.fillBox(mCtx, 0, 11, S, 1, 'rgba(202, 194, 178, 0.24)');
      this.fillBox(mCtx, jointOffset % S, 0, 1, 11, 'rgba(202, 194, 178, 0.24)');
      this.fillBox(mCtx, (jointOffset + 12) % S, 12, 1, 12, 'rgba(202, 194, 178, 0.24)');
      this.fillBox(mCtx, 0, 12, S, 1, 'rgba(255, 255, 255, 0.22)');
      return slab;
    };
    putTileCanvas(TileIndex.MARBLE_PATH_A, buildSmoothMarbleSlab({}, 6));
    putTileCanvas(TileIndex.MARBLE_PATH_B, buildSmoothMarbleSlab({ shiftX: 8, addLum: -1 }, 14));
    putTileCanvas(ExtraTileIndex.MARBLE_PATH_C, buildSmoothMarbleSlab({ shiftY: 8, addLum: 1 }, 10));
    putTileCanvas(ExtraTileIndex.MARBLE_PATH_D, buildSmoothMarbleSlab({ shiftX: 12, shiftY: 12 }, 18));
    const buildHarmonizedMarbleRelief = (medallion: boolean) => {
      const base = buildSmoothMarbleSlab({}, 8);
      const rCtx = base.getContext('2d')!;
      if (palaceImg) {
        const rawCarve = this.extractGridSubCanvas(
          palaceImg,
          8,
          10,
          medallion ? 1 : 0,
          7,
          1,
          1,
          5,
          false
        );
        const tmp = this.makeCanvas(S - 4, S - 4);
        const tCtx = tmp.getContext('2d', { willReadFrequently: true })!;
        tCtx.drawImage(rawCarve, 0, 0, rawCarve.width, rawCarve.height, 0, 0, S - 4, S - 4);
        const imgD = tCtx.getImageData(0, 0, S - 4, S - 4);
        const d = imgD.data;
        for (let i = 0; i < d.length; i += 4) {
          const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
          const mapped = 214 + lum * 34;
          d[i] = Math.min(255, Math.round(mapped + 3));
          d[i + 1] = Math.min(255, Math.round(mapped));
          d[i + 2] = Math.min(255, Math.round(mapped - 8));
        }
        tCtx.putImageData(imgD, 0, 0);
        rCtx.drawImage(tmp, 2, 2);
      }
      rCtx.strokeStyle = 'rgba(196, 188, 170, 0.45)';
      rCtx.lineWidth = 1;
      rCtx.strokeRect(2.5, 2.5, S - 5, S - 5);
      return base;
    };
    putTileCanvas(TileIndex.MARBLE_DRAGON_CARVING, buildHarmonizedMarbleRelief(false));
    putTileCanvas(ExtraTileIndex.CARVED_MEDALLION_STONE, buildHarmonizedMarbleRelief(true));
    putGridTile(TileIndex.MARBLE_STAIR, palaceImg, 8, 10, 2, 8, 1, 1.85, 4, false);
    // 3. 殿內蘇州金磚家族
    const rawHallBrick = palaceImg
      ? this.extractGridSubCanvas(palaceImg, 8, 10, 3, 6, 1, 1, 4.5, false)
      : this.makeSolidFallbackTile(S, '#8a6d4b');
    const baseHallTile = this.makeToroidalSeamless(rawHallBrick, S, 3);
    putTileCanvas(TileIndex.HALL_GOLD_BRICK_A, this.makeSeamlessFamilyVariant(baseHallTile, S, {}));
    putTileCanvas(
      TileIndex.HALL_GOLD_BRICK_B,
      this.makeSeamlessFamilyVariant(baseHallTile, S, { flipX: true, addLum: -2 })
    );
    putTileCanvas(
      ExtraTileIndex.HALL_GOLD_BRICK_C,
      this.makeSeamlessFamilyVariant(baseHallTile, S, { flipY: true, addLum: 2 })
    );
    putTileCanvas(
      ExtraTileIndex.HALL_GOLD_BRICK_D,
      this.makeSeamlessFamilyVariant(baseHallTile, S, { flipX: true, flipY: true, addLum: -1 })
    );
    {
      const carpet = this.makeSeamlessFamilyVariant(baseHallTile, S, {});
      const cCtx = carpet.getContext('2d')!;
      this.fillBox(cCtx, 0, 0, S, S, 'rgba(154, 26, 20, 0.86)');
      this.fillBox(cCtx, 0, 0, 3, S, '#e6b43c');
      this.fillBox(cCtx, S - 3, 0, 3, S, '#e6b43c');
      this.fillBox(cCtx, 9, 9, 6, 6, 'rgba(255, 220, 110, 0.40)');
      putTileCanvas(TileIndex.RED_CARPET_CENTER, carpet);
    }
    // 4. 江南純淨連續草地家族
    const rawGrassA = jiangnanImg
      ? this.extractGridSubCanvas(jiangnanImg, 8, 12, 0, 2, 1, 1, 5, false)
      : this.makeSolidFallbackTile(S, '#5b8240');
    const rawGrassB = jiangnanImg
      ? this.extractGridSubCanvas(jiangnanImg, 8, 12, 0, 3, 1, 1, 5, false)
      : rawGrassA;
    const cleanGrassA = this.purifyPureGrassPatch(rawGrassA, S);
    const cleanGrassB = this.purifyPureGrassPatch(rawGrassB, S);
    putTileCanvas(TileIndex.GRASS_A, this.makeSeamlessFamilyVariant(cleanGrassA, S, {}));
    putTileCanvas(TileIndex.GRASS_B, this.makeSeamlessFamilyVariant(cleanGrassB, S, { shiftX: 8 }));
    putTileCanvas(
      ExtraTileIndex.GRASS_C,
      this.makeSeamlessFamilyVariant(cleanGrassA, S, { shiftX: 12, shiftY: 8, addLum: -1 })
    );
    putTileCanvas(
      ExtraTileIndex.GRASS_D,
      this.makeSeamlessFamilyVariant(cleanGrassB, S, { flipX: true, shiftY: 12, addLum: 1 })
    );
    putTileCanvas(
      ExtraTileIndex.GRASS_E,
      this.makeSeamlessFamilyVariant(cleanGrassA, S, { flipX: true, shiftX: 6, shiftY: 14 })
    );
    {
      const flowerGrass = this.makeSeamlessFamilyVariant(cleanGrassB, S, { shiftX: 4 });
      const fgCtx = flowerGrass.getContext('2d')!;
      this.fillBox(fgCtx, 6, 7, 2, 2, '#fff5c8');
      this.fillBox(fgCtx, 7, 8, 1, 1, '#e89a2c');
      this.fillBox(fgCtx, 16, 15, 2, 2, '#ffd6e2');
      putTileCanvas(TileIndex.GRASS_FLOWER, flowerGrass);
    }
    // 5. 連續黃土路、沙地與微弧自然田壟旱田
    const rawEarth = jiangnanImg
      ? this.extractNormalizedSubCanvas(jiangnanImg, 0.388, 0.094, 0.098, 0.064, false)
      : this.makeSolidFallbackTile(S, '#aa8c60');
    const seamlessDirt = this.purifyPureEarthPatch(rawEarth, S);
    putTileCanvas(TileIndex.DIRT_PATH_A, this.makeSeamlessFamilyVariant(seamlessDirt, S, {}));
    putTileCanvas(
      TileIndex.DIRT_PATH_B,
      this.makeSeamlessFamilyVariant(seamlessDirt, S, { shiftX: 8, shiftY: 6, addLum: -1 })
    );
    putTileCanvas(
      ExtraTileIndex.DIRT_PATH_C,
      this.makeSeamlessFamilyVariant(seamlessDirt, S, { flipX: true, shiftY: 12, addLum: 1 })
    );
    putTileCanvas(
      ExtraTileIndex.DIRT_PATH_D,
      this.makeSeamlessFamilyVariant(seamlessDirt, S, { flipY: true, shiftX: 14 })
    );
    const makeSand = (vt: VariantTransform) =>
      this.makeSeamlessFamilyVariant(seamlessDirt, S, {
        ...vt,
        mulR: 1.14,
        mulG: 1.11,
        mulB: 1.03,
        addLum: (vt.addLum ?? 0) + 9
      });
    putTileCanvas(TileIndex.SAND_A, makeSand({}));
    putTileCanvas(TileIndex.SAND_B, makeSand({ shiftX: 10, shiftY: 6, addLum: -1 }));
    putTileCanvas(ExtraTileIndex.SAND_C, makeSand({ flipX: true, shiftY: 12, addLum: 1 }));
    putTileCanvas(ExtraTileIndex.SAND_D, makeSand({ flipY: true, shiftX: 14 }));
    const makeDryFarmland = (shift: number, flipX: boolean) => {
      const farm = this.makeSeamlessFamilyVariant(seamlessDirt, S, {
        flipX,
        shiftX: shift,
        mulR: 0.93,
        mulG: 0.88,
        mulB: 0.8
      });
      const fCtx = farm.getContext('2d')!;
      for (let x = 0; x < S; x++) {
        const y1 = 4 + Math.round(Math.sin((x / S) * Math.PI * 2) * 1.1);
        const y2 = 15 + Math.round(Math.sin(((x + 6) / S) * Math.PI * 2) * 1.1);
        this.fillBox(fCtx, x, y1 - 1, 1, 2, 'rgba(212, 178, 130, 0.32)');
        this.fillBox(fCtx, x, y2 - 1, 1, 2, 'rgba(212, 178, 130, 0.32)');
        this.fillBox(fCtx, x, y1 + 1, 1, 2, 'rgba(66, 40, 18, 0.44)');
        this.fillBox(fCtx, x, y2 + 1, 1, 2, 'rgba(66, 40, 18, 0.44)');
      }
      this.fillBox(fCtx, (5 + shift) % 18, 8, 2, 2, 'rgba(72, 44, 20, 0.38)');
      this.fillBox(fCtx, (14 + shift) % 19, 19, 2, 2, 'rgba(72, 44, 20, 0.38)');
      this.fillBox(fCtx, (7 + shift) % 20, 3, 2, 2, '#7b8c42');
      this.fillBox(fCtx, (15 + shift) % 20, 14, 2, 2, '#918a46');
      return farm;
    };
    putTileCanvas(TileIndex.DRY_FARMLAND_A, makeDryFarmland(0, false));
    putTileCanvas(TileIndex.DRY_FARMLAND_B, makeDryFarmland(7, true));
    putTileCanvas(ExtraTileIndex.DRY_FARMLAND_C, makeDryFarmland(13, false));
    putTileCanvas(ExtraTileIndex.DRY_FARMLAND_D, makeDryFarmland(17, true));
    // 6. 水紋、自然參差石駁岸、石拱橋面、沿岸青石路與木棧道
    const rawWater = jiangnanImg
      ? this.extractGridSubCanvas(jiangnanImg, 8, 12, 6, 0, 1, 1, 5, false)
      : this.makeSolidFallbackTile(S, '#3b7c96');
    const baseWater = this.makeToroidalSeamless(rawWater, S, 4);
    putTileCanvas(TileIndex.WATER_1, this.makeSeamlessFamilyVariant(baseWater, S, {}));
    putTileCanvas(
      TileIndex.WATER_2,
      this.makeSeamlessFamilyVariant(baseWater, S, { shiftX: 8, shiftY: 4, addLum: 1 })
    );
    putTileCanvas(
      TileIndex.WATER_3,
      this.makeSeamlessFamilyVariant(baseWater, S, { shiftX: 16, shiftY: 8, addLum: -1 })
    );
    putTileCanvas(
      ExtraTileIndex.WATER_4,
      this.makeSeamlessFamilyVariant(baseWater, S, { flipX: true, shiftX: 6 })
    );
    {
      const bank = this.makeSeamlessFamilyVariant(baseWater, S, {});
      const bCtx = bank.getContext('2d')!;
      for (let x = 0; x < S; x++) {
        const n = this.pixelNoise(x, 19, 83);
        const stoneH = 6 + (x % 8 === 0 ? -1 : n % 3);
        this.fillBox(bCtx, x, 0, 1, stoneH, '#5c6668');
        this.fillBox(bCtx, x, 0, 1, Math.max(2, stoneH - 2), x % 6 < 3 ? '#9ca4a2' : '#899190');
        if (n % 5 === 0) this.fillBox(bCtx, x, 0, 1, 2, '#588040');
        this.fillBox(bCtx, x, stoneH, 1, 2, 'rgba(18, 44, 58, 0.42)');
      }
      putTileCanvas(TileIndex.WATER_BANK_TOP, bank);
    }
    {
      const leafTile = this.makeSeamlessFamilyVariant(baseWater, S, {});
      const lCtx = leafTile.getContext('2d')!;
      this.fillBox(lCtx, 5, 9, 15, 10, 'rgba(16, 42, 52, 0.34)');
      this.fillBox(lCtx, 5, 7, 14, 10, '#255e36');
      this.fillBox(lCtx, 4, 6, 14, 9, '#3b8c50');
      this.fillBox(lCtx, 6, 5, 10, 11, '#3b8c50');
      this.fillBox(lCtx, 10, 9, 3, 2, '#6ec480');
      putTileCanvas(TileIndex.LOTUS_LEAF, leafTile);
      const flowerTile = this.makeCanvas(S, S);
      const flCtx = flowerTile.getContext('2d')!;
      flCtx.drawImage(leafTile, 0, 0);
      this.fillBox(flCtx, 7, 4, 10, 7, '#e8688c');
      this.fillBox(flCtx, 8, 3, 8, 6, '#ffa8c2');
      this.fillBox(flCtx, 10, 2, 4, 4, '#ffe3ec');
      this.fillBox(flCtx, 11, 5, 2, 2, '#f5c842');
      putTileCanvas(TileIndex.LOTUS_FLOWER, flowerTile);
    }
    const rawBridgeCenter = jiangnanImg
      ? this.extractNormalizedSubCanvas(jiangnanImg, 0.538, 0.258, 0.052, 0.068, false)
      : baseBrick;
    const cleanBridgeDeck = this.makeToroidalSeamless(rawBridgeCenter, S, 3);
    {
      const bCtx = cleanBridgeDeck.getContext('2d')!;
      this.fillBox(bCtx, 0, 7, S, 1, 'rgba(120, 116, 108, 0.28)');
      this.fillBox(bCtx, 0, 15, S, 1, 'rgba(120, 116, 108, 0.28)');
      this.fillBox(bCtx, 0, 23, S, 1, 'rgba(120, 116, 108, 0.28)');
    }
    putTileCanvas(TileIndex.STONE_BRIDGE_DECK, cleanBridgeDeck);
    const makeCoastStone = (vt: VariantTransform) =>
      this.makeSeamlessFamilyVariant(baseBrick, S, {
        ...vt,
        mulR: 1.03,
        mulG: 1.04,
        mulB: 1.05,
        addLum: (vt.addLum ?? 0) + 6
      });
    putTileCanvas(TileIndex.STONE_PAVING, makeCoastStone({}));
    putTileCanvas(ExtraTileIndex.STONE_PAVING_B, makeCoastStone({ shiftX: 12, addLum: -2 }));
    putTileCanvas(ExtraTileIndex.STONE_PAVING_C, makeCoastStone({ flipX: true, addLum: 2 }));
    const rawPierWood = campImg
      ? this.extractNormalizedSubCanvas(campImg, 0.262, 0.568, 0.106, 0.082, false)
      : this.makeSolidFallbackTile(S, '#8a623e');
    const basePierWood = this.makeToroidalSeamless(rawPierWood, S, 2);
    putTileCanvas(TileIndex.WOOD_PIER, this.makeSeamlessFamilyVariant(basePierWood, S, {}));
    putTileCanvas(
      ExtraTileIndex.WOOD_PIER_B,
      this.makeSeamlessFamilyVariant(basePierWood, S, { flipX: true, addLum: -2 })
    );
    putTileCanvas(
      ExtraTileIndex.WOOD_PIER_C,
      this.makeSeamlessFamilyVariant(basePierWood, S, { flipY: true, addLum: 2 })
    );
    putTileCanvas(
      ExtraTileIndex.WOOD_PIER_D,
      this.makeSeamlessFamilyVariant(basePierWood, S, { shiftX: 8, addLum: -1 })
    );
    // 7. 宮牆、須彌座、琉璃飛簷與圓拱月門
    putGridTile(TileIndex.MARBLE_BALUSTRADE_H, palaceImg, 8, 10, 0, 9, 1, 1, 2, true);
    putGridTile(TileIndex.MARBLE_BALUSTRADE_V, palaceImg, 8, 10, 6, 7, 1, 1, 2, true);
    {
      const terrace = buildSmoothMarbleSlab({}, 12);
      const tCtx = terrace.getContext('2d')!;
      this.fillBox(tCtx, 0, 0, S, 4, '#ffffff');
      this.fillBox(tCtx, 0, 4, S, 5, '#d8d0c0');
      this.fillBox(tCtx, 0, 9, S, 6, '#b8b09e');
      for (let x = 2; x < S - 2; x += 6) this.fillBox(tCtx, x, 10, 4, 4, '#ece6d8');
      this.fillBox(tCtx, 0, 15, S, 6, '#dfd8c8');
      this.fillBox(tCtx, 0, 21, S, 3, '#8f8779');
      putTileCanvas(TileIndex.TERRACE_BASE, terrace);
    }
    putGridTile(TileIndex.RED_WALL_FRIEZE, palaceImg, 8, 10, 2, 0.04, 1, 0.5, 2, true);
    putGridTile(TileIndex.RED_WALL_MID, palaceImg, 8, 10, 3, 0.36, 1, 0.48, 2, false);
    if (palaceImg) {
      const redWallBase = this.extractNormalizedSubCanvas(
        palaceImg,
        0.135,
        0.382,
        0.105,
        0.068,
        false
      );
      const wCanvas = this.makeCanvas(S, S);
      const wCtx = wCanvas.getContext('2d')!;
      wCtx.drawImage(redWallBase, 0, 0, redWallBase.width, redWallBase.height, 0, 0, S, S - 4);
      this.fillBox(wCtx, 0, S - 5, S, 1, '#731a14');
      this.fillBox(wCtx, 0, S - 4, S, 2, '#ede7da');
      this.fillBox(wCtx, 0, S - 2, S, 1, '#cfc8b8');
      this.fillBox(wCtx, 0, S - 1, S, 1, '#8c8577');
      this.fillBox(wCtx, 7, S - 4, 1, 3, '#a8a090');
      this.fillBox(wCtx, 19, S - 4, 1, 3, '#a8a090');
      putTileCanvas(TileIndex.RED_WALL_BASE, wCanvas);
    } else {
      putTileCanvas(TileIndex.RED_WALL_BASE, this.makeSolidFallbackTile(S, '#96261e'));
    }
    putGridTile(TileIndex.PALACE_WINDOW, palaceImg, 8, 10, 4, 7, 1, 1, 3, false);
    putGridTile(ExtraTileIndex.PALACE_WINDOW_B, palaceImg, 8, 10, 5, 7, 1, 1, 3, false);
    putGridTile(TileIndex.GATE_DOOR_LEFT, palaceImg, 8, 10, 6, 6, 1, 1, 3, false);
    putGridTile(TileIndex.GATE_DOOR_RIGHT, palaceImg, 8, 10, 7, 6, 1, 1, 3, false);
    {
      const moon = this.makeCanvas(S, S);
      const mCtx = moon.getContext('2d')!;
      if (palaceImg) {
        const wSub = this.extractNormalizedSubCanvas(palaceImg, 0.135, 0.382, 0.105, 0.068, false);
        mCtx.drawImage(wSub, 0, 0, S, S);
      } else {
        this.fillBox(mCtx, 0, 0, S, S, '#96261e');
      }
      for (let y = 3; y < S; y++) {
        for (let x = 3; x < S - 3; x++) {
          const dx = x - 11.5;
          const dy = y - 12;
          const d2 = dx * dx + dy * dy;
          if (d2 <= 36 || (y >= 12 && Math.abs(dx) <= 5.5)) {
            this.fillBox(mCtx, x, y, 1, 1, y > 19 ? '#b8b2a4' : '#2a4736');
          } else if (d2 <= 64 || (y >= 12 && Math.abs(dx) <= 7.5)) {
            this.fillBox(mCtx, x, y, 1, 1, dx < 0 ? '#ede7da' : '#c9c2b2');
          }
        }
      }
      putTileCanvas(TileIndex.MOON_GATE, moon);
    }
    if (palaceImg) {
      putTileCanvas(
        TileIndex.ROOF_GOLD_RIDGE,
        this.extractNormalizedSubCanvas(palaceImg, 0.25, 0.108, 0.115, 0.052, true)
      );
      putTileCanvas(
        TileIndex.ROOF_GOLD_SLOPE,
        this.extractNormalizedSubCanvas(palaceImg, 0.25, 0.158, 0.115, 0.062, false)
      );
      putTileCanvas(
        TileIndex.ROOF_EAVE_GOLD,
        this.extractNormalizedSubCanvas(palaceImg, 0.25, 0.214, 0.115, 0.066, false)
      );
    }
    if (jiangnanImg) {
      putTileCanvas(
        TileIndex.DARK_ROOF_SLOPE,
        this.extractNormalizedSubCanvas(jiangnanImg, 0.635, 0.506, 0.11, 0.042, false)
      );
      putTileCanvas(
        TileIndex.DARK_ROOF_EAVE,
        this.extractNormalizedSubCanvas(jiangnanImg, 0.635, 0.518, 0.11, 0.04, false)
      );
      putTileCanvas(
        TileIndex.WHITE_WALL_WINDOW,
        this.extractNormalizedSubCanvas(jiangnanImg, 0.632, 0.554, 0.112, 0.052, false)
      );
    } else {
      putTileCanvas(TileIndex.DARK_ROOF_SLOPE, this.makeSolidFallbackTile(S, '#3c454d'));
      putTileCanvas(TileIndex.DARK_ROOF_EAVE, this.makeSolidFallbackTile(S, '#49535c'));
      putTileCanvas(TileIndex.WHITE_WALL_WINDOW, this.makeSolidFallbackTile(S, '#f0ede6'));
    }
    // 8. 高對比朱紅單格柱、無方框邊界松樹、柔和橢圓樹蔭與銅香爐
    {
      const miniPillar = this.makeCanvas(S, S);
      const tallPillar = this.buildImperialVermilionPillar(false, S, 48);
      miniPillar.getContext('2d')!.drawImage(tallPillar, 0, 16, S, 32, 0, 0, S, S);
      putTileCanvas(TileIndex.RED_PILLAR, miniPillar);
    }
    if (jiangnanImg) {
      const fullMiniTree = this.extractNormalizedSubCanvas(
        jiangnanImg,
        0.754,
        0.668,
        0.24,
        0.168,
        true
      );
      this.isolateCleanTreeCanopy(fullMiniTree);
      const miniPine = this.makeCanvas(S, S);
      const mpCtx = miniPine.getContext('2d')!;
      this.fillBox(mpCtx, 6, S - 4, S - 12, 3, 'rgba(14, 18, 12, 0.24)');
      mpCtx.drawImage(fullMiniTree, 0, 0, fullMiniTree.width, fullMiniTree.height, 2, 1, S - 4, S - 2);
      putTileCanvas(TileIndex.PINE_TRUNK, miniPine);
      putTileCanvas(TileIndex.WILLOW_TRUNK, miniPine);
      const miniCrown = this.makeCanvas(S, S);
      miniCrown
        .getContext('2d')!
        .drawImage(
          fullMiniTree,
          0,
          0,
          fullMiniTree.width,
          Math.floor(fullMiniTree.height * 0.72),
          2,
          2,
          S - 4,
          S - 4
        );
      putTileCanvas(TileIndex.PINE_CANOPY, miniCrown);
      putTileCanvas(TileIndex.WILLOW_CANOPY, miniCrown);
    }
    {
      const treeShadow = this.makeCanvas(S, S);
      const tsCtx = treeShadow.getContext('2d')!;
      for (let y = 10; y <= 20; y++) {
        for (let x = 3; x <= 20; x++) {
          const dx = (x - 11.5) / 8.5;
          const dy = (y - 15) / 4.8;
          const d2 = dx * dx + dy * dy;
          if (d2 <= 0.55) this.fillBox(tsCtx, x, y, 1, 1, 'rgba(14, 20, 12, 0.25)');
          else if (d2 <= 1.0) this.fillBox(tsCtx, x, y, 1, 1, 'rgba(14, 20, 12, 0.13)');
        }
      }
      putTileCanvas(ExtraTileIndex.TREE_BASE_SHADOW, treeShadow);
      putTileCanvas(ExtraTileIndex.INVISIBLE_ROOF_MARKER, this.makeCanvas(S, S));
    }
    putTileCanvas(TileIndex.BRONZE_INCENSE, this.buildBronzeIncenseTile(S));
    putTileCanvas(TileIndex.LANTERN_POST, this.buildCrispStoneLantern(true, S, S));
    putGridTile(TileIndex.TREASURY_CHEST, campImg, 8, 8, 4, 4, 1, 1, 2, true);
    putGridTile(TileIndex.MINIGAME_TABLE, campImg, 8, 8, 7, 2, 1, 1, 2, true);
    putGridTile(TileIndex.EMPEROR_THRONE_DESK, palaceImg, 8, 10, 3, 7, 1, 1, 3, false);
    putGridTile(TileIndex.EMPEROR_SCREEN, palaceImg, 8, 10, 6, 6, 1, 1, 3, false);
    {
      const target = this.makeCanvas(S, S);
      const tCtx = target.getContext('2d')!;
      if (campImg) {
        const rack = this.extractGridSubCanvas(campImg, 8, 8, 5, 3, 1, 1, 2, true);
        tCtx.drawImage(rack, 0, 0, S, S);
      }
      this.fillBox(tCtx, 4, 3, 16, 15, '#4a2e16');
      this.fillBox(tCtx, 5, 4, 14, 13, '#f5efe2');
      this.fillBox(tCtx, 7, 6, 10, 9, '#c92a1f');
      this.fillBox(tCtx, 9, 8, 6, 5, '#f5efe2');
      this.fillBox(tCtx, 11, 9, 2, 3, '#f0be38');
      putTileCanvas(TileIndex.ARCHERY_TARGET, target);
    }
    putGridTile(TileIndex.ARMY_TENT_LEFT, campImg, 8, 8, 0, 0, 1, 2, 1.5, true);
    putGridTile(TileIndex.ARMY_TENT_RIGHT, campImg, 8, 8, 1, 0, 1, 2, 1.5, true);
    putGridTile(TileIndex.WEAPON_RACK, campImg, 8, 8, 5, 3, 1, 1, 2, true);
    {
      const banner = this.makeCanvas(S, S);
      const bCtx = banner.getContext('2d')!;
      if (palaceImg) {
        const base = this.extractGridSubCanvas(palaceImg, 8, 10, 5, 9, 1, 1, 1.5, true);
        bCtx.drawImage(base, 0, 4, 12, 20);
      }
      this.fillBox(bCtx, 5, 1, 2, 21, '#6e1d14');
      this.fillBox(bCtx, 7, 3, 14, 10, '#c9291e');
      this.fillBox(bCtx, 8, 4, 11, 8, '#f2be38');
      this.fillBox(bCtx, 10, 6, 6, 4, '#9c1f16');
      putTileCanvas(TileIndex.FLEET_BANNER, banner);
    }
    {
      const archL = this.makeCanvas(S, S);
      const archR = this.makeCanvas(S, S);
      const pCol = this.buildImperialVermilionPillar(true, S, 48);
      archL.getContext('2d')!.drawImage(pCol, 0, 0, S, 48, 0, 0, S, S);
      archR.getContext('2d')!.drawImage(pCol, 0, 0, S, 48, 0, 0, S, S);
      putTileCanvas(TileIndex.TOUR_ARCHWAY_L, archL);
      putTileCanvas(TileIndex.TOUR_ARCHWAY_R, archR);
    }
    if (jiangnanImg) {
      const rock = this.extractGridSubCanvas(jiangnanImg, 8, 12, 3, 11, 1, 1, 2.5, true);
      this.stripBorderWaterBackground(rock);
      putTileCanvas(TileIndex.TAIHU_ROCK, rock);
    }
    rawTex.refresh();
    const spriteSheetTex = scene.textures.addSpriteSheet(
      'palace_tiles',
      rawTex.getSourceImage() as HTMLImageElement,
      { frameWidth: S, frameHeight: S }
    );
    spriteSheetTex?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  /**
   * 建構立體建築、高對比朱紅殿柱、圓拱月門、自然鄉村小屋與軟邊過渡圖集 ('hd_art_props')
   */
  private static buildPropsAtlas(
    scene: Phaser.Scene,
    palaceImg: HTMLImageElement | HTMLCanvasElement | null,
    jiangnanImg: HTMLImageElement | HTMLCanvasElement | null,
    campImg: HTMLImageElement | HTMLCanvasElement | null
  ): void {
    if (scene.textures.exists(HD_PROPS_ATLAS_KEY)) {
      scene.textures.remove(HD_PROPS_ATLAS_KEY);
    }
    interface PackedPiece {
      names: PropStampFrame[];
      canvas: HTMLCanvasElement;
    }
    const pieces: PackedPiece[] = [];
    const pushPiece = (
      names: PropStampFrame[],
      img: HTMLImageElement | HTMLCanvasElement | null,
      nx: number,
      ny: number,
      nw: number,
      nh: number,
      targetW: number,
      targetH: number,
      mode: 'opaque' | 'checker' | 'tree' | 'water_prop' = 'checker'
    ) => {
      const dest = this.makeCanvas(targetW, targetH);
      const dCtx = dest.getContext('2d', { willReadFrequently: true })!;
      dCtx.imageSmoothingEnabled = false;
      if (img) {
        const sub = this.extractNormalizedSubCanvas(img, nx, ny, nw, nh, mode !== 'opaque');
        if (mode === 'tree') this.isolateCleanTreeCanopy(sub);
        else if (mode === 'water_prop') this.stripBorderWaterBackground(sub);
        dCtx.drawImage(sub, 0, 0, sub.width, sub.height, 0, 0, targetW, targetH);
      }
      pieces.push({ names, canvas: dest });
    };
    // 1) 宮廷主屋頂、翼樓、高對比立體朱紅廊柱、石燈與軟化輪廓組件
    pushPiece(['palace_grand_roof'], palaceImg, 0.008, 0.106, 0.736, 0.188, 216, 72, 'checker');
    pushPiece(['palace_side_roof'], palaceImg, 0.754, 0.106, 0.24, 0.188, 72, 72, 'checker');
    pushPiece(['palace_wing_left'], palaceImg, 0.008, 0.306, 0.484, 0.164, 144, 62, 'checker');
    pushPiece(['palace_wing_right'], palaceImg, 0.506, 0.306, 0.486, 0.164, 144, 62, 'checker');
    pushPiece(['palace_wall_span'], palaceImg, 0.13, 0.008, 0.862, 0.088, 240, 36, 'checker');
    pieces.push({ names: ['palace_pillar_a'], canvas: this.buildImperialVermilionPillar(false, 30, 64) });
    pieces.push({ names: ['palace_pillar_b'], canvas: this.buildImperialVermilionPillar(true, 30, 64) });
    pieces.push({ names: ['stone_lantern_a'], canvas: this.buildCrispStoneLantern(true, 28, 36) });
    pieces.push({ names: ['stone_lantern_b'], canvas: this.buildCrispStoneLantern(false, 28, 36) });
    pushPiece(['marble_stairs_tall'], palaceImg, 0.258, 0.804, 0.114, 0.19, 48, 48, 'opaque');
    pieces.push({ names: ['palace_eave_cap_l'], canvas: this.buildPalaceEaveCap(false) });
    pieces.push({ names: ['palace_eave_cap_r'], canvas: this.buildPalaceEaveCap(true) });
    pieces.push({ names: ['palace_dougong_span'], canvas: this.buildPalaceDougongSpan(96, 18) });
    pieces.push({ names: ['palace_door_jamb_l'], canvas: this.buildPalaceDoorJamb(false) });
    pieces.push({ names: ['palace_door_jamb_r'], canvas: this.buildPalaceDoorJamb(true) });
    pieces.push({ names: ['palace_corner_pilaster'], canvas: this.buildPalaceCornerPilaster() });
    pieces.push({ names: ['moon_gate_arch'], canvas: this.buildMoonGateArch(108, 46) });
    // 2) 乾淨去背分簇樹冠、太湖石與自然江南鄉村小屋
    if (jiangnanImg) {
      const rawTree1 = this.extractNormalizedSubCanvas(jiangnanImg, 0.508, 0.668, 0.236, 0.168, true);
      this.isolateCleanTreeCanopy(rawTree1);
      const rawTree2 = this.extractNormalizedSubCanvas(jiangnanImg, 0.754, 0.668, 0.24, 0.168, true);
      this.isolateCleanTreeCanopy(rawTree2);
      const buildTreeFrame = (
        srcTree: HTMLCanvasElement,
        w: number,
        h: number,
        flip: boolean,
        mulR: number,
        mulG: number,
        mulB: number
      ) => {
        const c = this.makeCanvas(w, h);
        const tCtx = c.getContext('2d', { willReadFrequently: true })!;
        tCtx.save();
        tCtx.imageSmoothingEnabled = false;
        if (flip) {
          tCtx.translate(w, 0);
          tCtx.scale(-1, 1);
        }
        tCtx.drawImage(srcTree, 0, 0, srcTree.width, srcTree.height, 2, 2, w - 4, h - 4);
        tCtx.restore();
        const imgD = tCtx.getImageData(0, 0, w, h);
        const d = imgD.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 20) continue;
          d[i] = Math.min(255, Math.round(d[i] * mulR));
          d[i + 1] = Math.min(255, Math.round(d[i + 1] * mulG));
          d[i + 2] = Math.min(255, Math.round(d[i + 2] * mulB));
        }
        tCtx.putImageData(imgD, 0, 0);
        return c;
      };
      pieces.push({ names: ['tree_cluster_a'], canvas: buildTreeFrame(rawTree2, 68, 76, false, 1.03, 0.99, 0.93) });
      pieces.push({ names: ['tree_cluster_b'], canvas: buildTreeFrame(rawTree2, 68, 76, true, 0.95, 1.02, 0.98) });
      pieces.push({ names: ['tree_cluster_c'], canvas: buildTreeFrame(rawTree1, 66, 74, false, 0.94, 0.99, 0.95) });
      pieces.push({ names: ['tree_cluster_d'], canvas: buildTreeFrame(rawTree1, 66, 74, true, 1.02, 1.0, 0.94) });
    }
    pushPiece(['jiangnan_rocks_a', 'shore_rocks_a'], jiangnanImg, 0.38, 0.908, 0.116, 0.086, 36, 28, 'water_prop');
    pushPiece(['jiangnan_rocks_b', 'shore_rocks_b'], jiangnanImg, 0.756, 0.844, 0.236, 0.082, 56, 28, 'water_prop');
    pieces.push({
      names: ['jiangnan_white_house', 'jiangnan_house_a'],
      canvas: this.buildCleanJiangnanCottage(jiangnanImg, 'village', 128, 74)
    });
    pieces.push({
      names: ['jiangnan_house_b'],
      canvas: this.buildCleanJiangnanCottage(jiangnanImg, 'scholar', 128, 74)
    });
    // 3) 路沿過渡、牆腳青苔、草穗邊、田埂、水草、灌木、竹籬與踏步石
    pieces.push({ names: ['marble_edge_w'], canvas: this.buildMarbleEdgeOverlay('w') });
    pieces.push({ names: ['marble_edge_e'], canvas: this.buildMarbleEdgeOverlay('e') });
    pieces.push({ names: ['marble_edge_n'], canvas: this.buildMarbleEdgeOverlay('n') });
    pieces.push({ names: ['marble_edge_s'], canvas: this.buildMarbleEdgeOverlay('s') });
    pieces.push({ names: ['wall_foot_moss_a'], canvas: this.buildWallFootMossStrip(1) });
    pieces.push({ names: ['wall_foot_moss_b'], canvas: this.buildWallFootMossStrip(2) });
    pieces.push({ names: ['grass_fringe_n'], canvas: this.buildGrassFringeOverlay('n') });
    pieces.push({ names: ['grass_fringe_s'], canvas: this.buildGrassFringeOverlay('s') });
    pieces.push({ names: ['grass_fringe_w'], canvas: this.buildGrassFringeOverlay('w') });
    pieces.push({ names: ['grass_fringe_e'], canvas: this.buildGrassFringeOverlay('e') });
    pieces.push({ names: ['farmland_bund_h'], canvas: this.buildFarmlandBund(true) });
    pieces.push({ names: ['farmland_bund_v'], canvas: this.buildFarmlandBund(false) });
    pieces.push({ names: ['pond_reeds_a'], canvas: this.buildPondReeds(0) });
    pieces.push({ names: ['pond_reeds_b'], canvas: this.buildPondReeds(1) });
    pieces.push({ names: ['jiangnan_shrub_a'], canvas: this.buildJiangnanShrub(true) });
    pieces.push({ names: ['jiangnan_shrub_b'], canvas: this.buildJiangnanShrub(false) });
    pieces.push({ names: ['rustic_bamboo_fence'], canvas: this.buildRusticBambooFence() });
    pieces.push({ names: ['cottage_stepping_stones'], canvas: this.buildCottageSteppingStones() });
    // 4) 軍營與船隻物件
    pushPiece(['camp_tent_large'], campImg, 0.006, 0.006, 0.238, 0.238, 72, 72, 'checker');
    pushPiece(['camp_tent_open', 'camp_tent_medium'], campImg, 0.504, 0.128, 0.242, 0.24, 72, 72, 'checker');
    pushPiece(['camp_palisade', 'camp_fence_h'], campImg, 0.13, 0.38, 0.365, 0.114, 96, 34, 'checker');
    pushPiece(['camp_fence_short'], campImg, 0.006, 0.504, 0.238, 0.114, 56, 32, 'checker');
    pushPiece(['camp_cannon'], campImg, 0.754, 0.38, 0.118, 0.114, 38, 34, 'checker');
    pushPiece(['camp_rack'], campImg, 0.628, 0.38, 0.118, 0.114, 34, 34, 'checker');
    pushPiece(['camp_crate', 'camp_crates'], campImg, 0.504, 0.504, 0.118, 0.114, 30, 30, 'checker');
    pushPiece(['pier_boat_h'], campImg, 0.506, 0.86, 0.24, 0.128, 76, 36, 'water_prop');
    pushPiece(['pier_boat_v'], campImg, 0.256, 0.756, 0.114, 0.234, 36, 72, 'water_prop');
    // 5) 動態排版寫入單一 'hd_art_props' 圖集
    const atlasW = 512;
    let curX = 2;
    let curY = 2;
    let rowMaxH = 0;
    const placements: {
      names: PropStampFrame[];
      x: number;
      y: number;
      canvas: HTMLCanvasElement;
    }[] = [];
    for (const p of pieces) {
      if (curX + p.canvas.width + 2 > atlasW) {
        curX = 2;
        curY += rowMaxH + 4;
        rowMaxH = 0;
      }
      placements.push({ names: p.names, x: curX, y: curY, canvas: p.canvas });
      curX += p.canvas.width + 4;
      rowMaxH = Math.max(rowMaxH, p.canvas.height);
    }
    const atlasH = Math.max(64, curY + rowMaxH + 4);
    const atlasTex = scene.textures.createCanvas(HD_PROPS_ATLAS_KEY, atlasW, atlasH);
    if (!atlasTex) return;
    const aCtx = atlasTex.getContext();
    aCtx.imageSmoothingEnabled = false;
    for (const item of placements) {
      aCtx.drawImage(item.canvas, item.x, item.y);
      for (const frameName of item.names) {
        atlasTex.add(frameName, 0, item.x, item.y, item.canvas.width, item.canvas.height);
      }
    }
    atlasTex.refresh();
    atlasTex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  private static buildAllCharacterSheets(
    scene: Phaser.Scene,
    charImg: HTMLImageElement | HTMLCanvasElement | null
  ): void {
    if (!charImg) return;
    const rowLabelCutoffRatio: Record<CharacterRowKind, number> = {
      0: 0.104,
      1: 0.104,
      2: 0.102,
      3: 0.098,
      4: 0.112
    };
    const rowFramesCache = new Map<CharacterRowKind, HTMLCanvasElement[]>();
    for (const r of [0, 1, 2, 3, 4] as CharacterRowKind[]) {
      rowFramesCache.set(r, this.sliceCharacterRowFrames(charImg, r, rowLabelCutoffRatio[r]));
    }
    for (const spec of CHARACTER_SPECS) {
      if (spec.key === 'char_student' && this.registerReadySchoolboySheet(scene)) {
        continue;
      }
      const extracted = rowFramesCache.get(spec.row);
      if (extracted && extracted.length > 0) {
        this.registerCharacterSpritesheetAndAnims(scene, spec, extracted);
      }
    }
  }
  private static sliceCharacterRowFrames(
    charImg: HTMLImageElement | HTMLCanvasElement,
    rowIdx: CharacterRowKind,
    cutoffRatio: number
  ): HTMLCanvasElement[] {
    const rowH = charImg.height / 5;
    const startX = Math.round(charImg.width * cutoffRatio);
    const stripW = charImg.width - startX;
    const startY = Math.max(0, Math.round(rowIdx * rowH + 2));
    const stripH = Math.min(charImg.height - startY, Math.round(rowH - 4));
    const strip = this.makeCanvas(stripW, stripH);
    const sCtx = strip.getContext('2d', { willReadFrequently: true })!;
    sCtx.drawImage(charImg, startX, startY, stripW, stripH, 0, 0, stripW, stripH);
    this.removeCheckerboardAndGrid(strip);
    const sData = sCtx.getImageData(0, 0, stripW, stripH).data;
    const colOpaque = new Int32Array(stripW);
    for (let x = 0; x < stripW; x++) {
      let cnt = 0;
      for (let y = 0; y < stripH; y++) {
        if (sData[(y * stripW + x) * 4 + 3] > 32) cnt++;
      }
      colOpaque[x] = cnt;
    }
    const rawSegments: { x0: number; x1: number }[] = [];
    let inSeg = false;
    let segStart = 0;
    for (let x = 0; x < stripW; x++) {
      if (colOpaque[x] >= 2) {
        if (!inSeg) {
          inSeg = true;
          segStart = x;
        }
      } else if (inSeg) {
        inSeg = false;
        rawSegments.push({ x0: segStart, x1: x - 1 });
      }
    }
    if (inSeg) rawSegments.push({ x0: segStart, x1: stripW - 1 });
    const merged: { x0: number; x1: number }[] = [];
    for (const seg of rawSegments) {
      if (merged.length > 0 && seg.x0 - merged[merged.length - 1].x1 <= 4) {
        merged[merged.length - 1].x1 = seg.x1;
      } else {
        merged.push({ ...seg });
      }
    }
    const validIslands = merged.filter((seg) => seg.x1 - seg.x0 >= 24);
    const boxes: CropBox[] = [];
    if (validIslands.length === 11) {
      for (const isl of validIslands) {
        boxes.push(this.measureTightAlphaBounds(sData, stripW, stripH, isl.x0, isl.x1));
      }
    } else {
      const slotW = stripW / 11;
      for (let i = 0; i < 11; i++) {
        const x0 = Math.max(0, Math.round(i * slotW + 2));
        const x1 = Math.min(stripW - 1, Math.round((i + 1) * slotW - 2));
        boxes.push(this.measureTightAlphaBounds(sData, stripW, stripH, x0, x1));
      }
    }
    return boxes.map((b) => {
      const f = this.makeCanvas(b.w, b.h);
      f.getContext('2d', { willReadFrequently: true })!.drawImage(
        strip,
        b.x,
        b.y,
        b.w,
        b.h,
        0,
        0,
        b.w,
        b.h
      );
      this.removeCheckerboardAndGrid(f);
      return f;
    });
  }
  private static measureTightAlphaBounds(
    data: Uint8ClampedArray,
    w: number,
    h: number,
    x0: number,
    x1: number
  ): CropBox {
    let minX = x1;
    let maxX = x0;
    let minY = h - 1;
    let maxY = 0;
    let found = false;
    for (let y = 0; y < h; y++) {
      for (let x = x0; x <= x1; x++) {
        if (data[(y * w + x) * 4 + 3] > 32) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }
    if (!found) return { x: x0, y: 0, w: Math.max(1, x1 - x0 + 1), h };
    return {
      x: minX,
      y: minY,
      w: Math.max(1, maxX - minX + 1),
      h: Math.max(1, maxY - minY + 1)
    };
  }
  private static applySelectiveRobeRemap(
    src: HTMLCanvasElement,
    rule?: RobeRemapRule
  ): HTMLCanvasElement {
    if (!rule) return src;
    const out = this.makeCanvas(src.width, src.height);
    const ctx = out.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(src, 0, 0);
    const imgData = ctx.getImageData(0, 0, out.width, out.height);
    const d = imgData.data;
    const bodyStartY = Math.floor(out.height * 0.42);
    const bodyEndY = Math.floor(out.height * 0.89);
    for (let y = bodyStartY; y <= bodyEndY; y++) {
      for (let x = 0; x < out.width; x++) {
        const p = (y * out.width + x) * 4;
        if (d[p + 3] < 40) continue;
        const r = d[p];
        const g = d[p + 1];
        const b = d[p + 2];
        const lum = (r * 299 + g * 587 + b * 114) / 1000;
        if (lum < 42 || lum > 238) continue;
        const isBlueOfficial = b > r + 16 && b > g + 6;
        const isYellowImperial =
          r > 155 && g > 110 && b < 95 && Math.max(r, g, b) - Math.min(r, g, b) > 55;
        if (isBlueOfficial || isYellowImperial) {
          const shade = lum / 155;
          d[p] = Math.round(r * (1 - rule.strength) + Math.min(255, rule.targetR * shade) * rule.strength);
          d[p + 1] = Math.round(g * (1 - rule.strength) + Math.min(255, rule.targetG * shade) * rule.strength);
          d[p + 2] = Math.round(b * (1 - rule.strength) + Math.min(255, rule.targetB * shade) * rule.strength);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return out;
  }
  private static registerReadySchoolboySheet(scene: Phaser.Scene): boolean {
    if (!scene.textures.exists(RAW_PNG_KEYS.SCHOOLBOY)) return false;
    const srcTex = scene.textures.get(RAW_PNG_KEYS.SCHOOLBOY);
    srcTex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const img = srcTex.getSourceImage();
    if (!(img instanceof HTMLImageElement) && !(img instanceof HTMLCanvasElement)) {
      return false;
    }
    const key = 'char_student';
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const charSpriteTex = scene.textures.addSpriteSheet(key, img as HTMLImageElement, {
      frameWidth: CHAR_FRAME_W,
      frameHeight: CHAR_FRAME_H
    });
    if (!charSpriteTex) return false;
    charSpriteTex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    (['down', 'left', 'right', 'up'] as const).forEach((dName, rowIdx) => {
      const animKey = `${key}_${dName}`;
      if (scene.anims.exists(animKey)) scene.anims.remove(animKey);
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
    return true;
  }
  private static registerCharacterSpritesheetAndAnims(

    scene: Phaser.Scene,
    spec: CharacterSheetSpec,
    frames11: HTMLCanvasElement[]
  ): void {
    const fw = CHAR_FRAME_W;
    const fh = CHAR_FRAME_H;
    const cols = 4;
    const rows = 4;
    if (scene.textures.exists(spec.key)) scene.textures.remove(spec.key);
    const rawKey = `${spec.key}_hd_raw`;
    if (scene.textures.exists(rawKey)) scene.textures.remove(rawKey);
    const pick = (idx: number) =>
      this.applySelectiveRobeRemap(
        frames11[Math.min(frames11.length - 1, Math.max(0, idx))],
        spec.robeRemap
      );
    let downFrames: { img: HTMLCanvasElement; flipX: boolean; dy: number }[];
    if (spec.row === 1) {
      const fStand = spec.useBeardedOfficial ? pick(0) : pick(1);
      const fStepA = spec.useBeardedOfficial ? pick(3) : pick(4);
      const fStepB = spec.useBeardedOfficial ? pick(6) : pick(7);
      downFrames = [
        { img: fStepA, flipX: false, dy: -1 },
        { img: fStand, flipX: false, dy: 0 },
        { img: fStepB, flipX: true, dy: -1 },
        { img: fStand, flipX: false, dy: 0 }
      ];
    } else if (spec.row === 2) {
      downFrames = [
        { img: pick(3), flipX: false, dy: -1 },
        { img: pick(0), flipX: false, dy: 0 },
        { img: pick(4), flipX: false, dy: -1 },
        { img: pick(5), flipX: false, dy: 0 }
      ];
    } else if (spec.row === 3) {
      downFrames = [
        { img: pick(4), flipX: false, dy: -1 },
        { img: pick(0), flipX: false, dy: 0 },
        { img: pick(7), flipX: true, dy: -1 },
        { img: pick(5), flipX: false, dy: 0 }
      ];
    } else if (spec.row === 4) {
      downFrames = [
        { img: pick(1), flipX: false, dy: -1 },
        { img: pick(0), flipX: false, dy: 0 },
        { img: pick(5), flipX: false, dy: -1 },
        { img: pick(4), flipX: false, dy: 0 }
      ];
    } else {
      downFrames = [
        { img: pick(1), flipX: false, dy: -1 },
        { img: pick(0), flipX: false, dy: 0 },
        { img: pick(4), flipX: true, dy: -1 },
        { img: pick(3), flipX: false, dy: 0 }
      ];
    }
    const nativeSide = [
      { img: pick(8), dy: -1 },
      { img: pick(2), dy: 0 },
      { img: pick(9), dy: -1 },
      { img: pick(2), dy: 0 }
    ];
    const leftFrames = nativeSide.map((s) => ({ img: s.img, flipX: spec.sideFacesRight, dy: s.dy }));
    const rightFrames = nativeSide.map((s) => ({ img: s.img, flipX: !spec.sideFacesRight, dy: s.dy }));
    const backBase = pick(10);
    const backStep = spec.row === 0 ? pick(9) : backBase;
    const upFrames = [
      { img: backStep, flipX: false, dy: -1 },
      { img: backBase, flipX: false, dy: 0 },
      { img: backBase, flipX: true, dy: -1 },
      { img: backBase, flipX: false, dy: 0 }
    ];
    const allRows = [downFrames, leftFrames, rightFrames, upFrames];
    const baseScale = (fh - 5) / Math.max(16, downFrames[1].img.height);
    const sheetTex = scene.textures.createCanvas(rawKey, fw * cols, fh * rows);
    if (!sheetTex) return;
    const ctx = sheetTex.getContext();
    ctx.imageSmoothingEnabled = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = c * fw;
        const cellY = r * fh;
        const entry = allRows[r][c];
        this.fillBox(ctx, cellX + 8, cellY + fh - 4, fw - 16, 3, 'rgba(12, 8, 6, 0.32)');
        this.fillBox(ctx, cellX + 6, cellY + fh - 3, fw - 12, 2, 'rgba(12, 8, 6, 0.20)');
        let dw = Math.max(10, Math.round(entry.img.width * baseScale));
        let dh = Math.max(16, Math.round(entry.img.height * baseScale));
        if (dw > fw - 2) {
          dh = Math.max(14, Math.round((dh * (fw - 2)) / dw));
          dw = fw - 2;
        }
        const drawX = cellX + Math.floor((fw - dw) / 2);
        const drawY = cellY + (fh - 2) - dh + entry.dy;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (entry.flipX) {
          ctx.translate(drawX + dw, drawY);
          ctx.scale(-1, 1);
          ctx.drawImage(entry.img, 0, 0, entry.img.width, entry.img.height, 0, 0, dw, dh);
        } else {
          ctx.drawImage(entry.img, 0, 0, entry.img.width, entry.img.height, drawX, drawY, dw, dh);
        }
        ctx.restore();
      }
    }
    sheetTex.refresh();
    const charSpriteTex = scene.textures.addSpriteSheet(
      spec.key,
      sheetTex.getSourceImage() as HTMLImageElement,
      { frameWidth: fw, frameHeight: fh }
    );
    charSpriteTex?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    (['down', 'left', 'right', 'up'] as const).forEach((dName, rowIdx) => {
      const animKey = `${spec.key}_${dName}`;
      if (scene.anims.exists(animKey)) scene.anims.remove(animKey);
      scene.anims.create({
        key: animKey,
        frames: [
          { key: spec.key, frame: rowIdx * 4 + 0 },
          { key: spec.key, frame: rowIdx * 4 + 1 },
          { key: spec.key, frame: rowIdx * 4 + 2 },
          { key: spec.key, frame: rowIdx * 4 + 3 }
        ],
        frameRate: 8,
        repeat: -1
      });
    });
  }
  private static buildRoyalBoatTexture(
    scene: Phaser.Scene,
    palaceImg: HTMLImageElement | HTMLCanvasElement | null,
    campImg: HTMLImageElement | HTMLCanvasElement | null
  ): void {
    if (scene.textures.exists('royal_boat')) scene.textures.remove('royal_boat');
    const raw = scene.textures.createCanvas('royal_boat', 120, 72);
    if (!raw) return;
    const ctx = raw.getContext();
    ctx.imageSmoothingEnabled = false;
    this.fillBox(ctx, 10, 63, 98, 3, 'rgba(225, 248, 255, 0.42)');
    this.fillBox(ctx, 20, 67, 78, 2, 'rgba(120, 210, 232, 0.48)');
    if (campImg) {
      const hull = this.extractNormalizedSubCanvas(campImg, 0.506, 0.86, 0.24, 0.128, true);
      this.stripBorderWaterBackground(hull);
      ctx.drawImage(hull, 0, 0, hull.width, hull.height, 6, 36, 108, 30);
    } else {
      this.fillBox(ctx, 10, 42, 98, 20, '#5c3318');
    }
    if (palaceImg) {
      const cabinWin = this.extractGridSubCanvas(palaceImg, 8, 10, 4, 7, 2, 1, 3, false);
      ctx.drawImage(cabinWin, 0, 0, cabinWin.width, cabinWin.height, 28, 23, 62, 20);
      const roof = this.extractNormalizedSubCanvas(palaceImg, 0.008, 0.106, 0.736, 0.188, true);
      ctx.drawImage(roof, 0, 0, roof.width, roof.height, 18, 6, 82, 24);
    }
    this.fillBox(ctx, 108, 31, 8, 13, '#e8b632');
    this.fillBox(ctx, 111, 28, 6, 6, '#ffe27a');
    this.fillBox(ctx, 114, 30, 2, 2, '#bd261d');
    raw.refresh();
    raw.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  private static buildHudWorldMarkers(scene: Phaser.Scene): void {
    if (scene.textures.exists('guide_arrow')) scene.textures.remove('guide_arrow');
    const arrowTex = scene.textures.createCanvas('guide_arrow', 24, 24);
    if (arrowTex) {
      const ctx = arrowTex.getContext();
      ctx.imageSmoothingEnabled = false;
      this.fillBox(ctx, 8, 2, 8, 11, '#3d2005');
      this.fillBox(ctx, 3, 11, 18, 5, '#3d2005');
      this.fillBox(ctx, 6, 16, 12, 3, '#3d2005');
      this.fillBox(ctx, 9, 19, 6, 3, '#3d2005');
      this.fillBox(ctx, 11, 22, 2, 2, '#3d2005');
      this.fillBox(ctx, 9, 3, 6, 10, '#ffd54f');
      this.fillBox(ctx, 5, 12, 14, 4, '#ffd54f');
      this.fillBox(ctx, 8, 16, 8, 3, '#ffd54f');
      this.fillBox(ctx, 10, 19, 4, 2, '#ffd54f');
      this.fillBox(ctx, 10, 4, 2, 9, '#fff6bf');
      arrowTex.refresh();
      arrowTex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    if (scene.textures.exists('npc_badge')) scene.textures.remove('npc_badge');
    const markTex = scene.textures.createCanvas('npc_badge', 16, 16);
    if (markTex) {
      const ctx = markTex.getContext();
      ctx.imageSmoothingEnabled = false;
      this.fillBox(ctx, 2, 1, 12, 13, '#4f120d');
      this.fillBox(ctx, 3, 2, 10, 11, '#f2c138');
      this.fillBox(ctx, 4, 3, 8, 9, '#fff9e6');
      this.fillBox(ctx, 7, 4, 2, 5, '#ad2017');
      this.fillBox(ctx, 7, 10, 2, 2, '#ad2017');
      markTex.refresh();
      markTex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }
}
