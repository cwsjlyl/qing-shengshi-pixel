import { ExtraTileIndex } from '../art/OriginalArtLoader';
import { StageId } from '../data/content';
import { TileIndex } from '../gfx/PixelArtGenerator';
export interface MapTrigger {
  id: string;
  kind: 'npc' | 'clue' | 'minigame' | 'exit' | 'decor_note';
  label: string;
  tileX: number;
  tileY: number;
  spriteKey?: string;
  facing?: 'down' | 'left' | 'right' | 'up';
  minigameId?: string;
  sceneKey?: string;
  decorMessage?: string;
}
export interface ZoneRect {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface MapPropPlacement {
  frame: string;
  tileX: number;
  tileY: number;
  offsetX?: number;
  offsetY?: number;
  layer: 'ground_decor' | 'building' | 'canopy';
  flipX?: boolean;
  scale?: number;
  alpha?: number;
}
export interface StageMapData {
  cols: number;
  rows: number;
  spawnX: number;
  spawnY: number;
  ground: number[][];
  shadow: boolean[][];
  deco: number[][];
  solid: boolean[][];
  roof: number[][];
  props: MapPropPlacement[];
  triggers: MapTrigger[];
  zones: ZoneRect[];
  boatPosition?: { tileX: number; tileY: number };
}
// =========================================================================
// 各類地面嚴格維持同家族無縫連續圖塊，絕不跨家族混拼，確保已修好的地面不變
// =========================================================================
const BRICK_VARIANTS = [
  TileIndex.COURTYARD_BRICK_A,
  TileIndex.COURTYARD_BRICK_B,
  TileIndex.COURTYARD_BRICK_C,
  ExtraTileIndex.COURTYARD_BRICK_D,
  ExtraTileIndex.COURTYARD_BRICK_E,
  ExtraTileIndex.COURTYARD_BRICK_F
];
const MARBLE_VARIANTS = [
  TileIndex.MARBLE_PATH_A,
  TileIndex.MARBLE_PATH_B,
  ExtraTileIndex.MARBLE_PATH_C,
  ExtraTileIndex.MARBLE_PATH_D
];
const MARBLE_SET = new Set<number>([
  ...MARBLE_VARIANTS,
  TileIndex.MARBLE_STAIR,
  TileIndex.MARBLE_DRAGON_CARVING,
  ExtraTileIndex.CARVED_MEDALLION_STONE
]);
const MARBLE_SLAB_ONLY_SET = new Set<number>(MARBLE_VARIANTS);
const GRASS_VARIANTS = [
  TileIndex.GRASS_A,
  TileIndex.GRASS_B,
  ExtraTileIndex.GRASS_C,
  ExtraTileIndex.GRASS_D,
  ExtraTileIndex.GRASS_E,
  TileIndex.GRASS_A,
  TileIndex.GRASS_B,
  ExtraTileIndex.GRASS_C,
  ExtraTileIndex.GRASS_D,
  ExtraTileIndex.GRASS_E,
  TileIndex.GRASS_A,
  TileIndex.GRASS_FLOWER
];
const GRASS_SET = new Set<number>([
  TileIndex.GRASS_A,
  TileIndex.GRASS_B,
  ExtraTileIndex.GRASS_C,
  ExtraTileIndex.GRASS_D,
  ExtraTileIndex.GRASS_E,
  TileIndex.GRASS_FLOWER
]);
const HALL_FLOOR_VARIANTS = [
  TileIndex.HALL_GOLD_BRICK_A,
  TileIndex.HALL_GOLD_BRICK_B,
  ExtraTileIndex.HALL_GOLD_BRICK_C,
  ExtraTileIndex.HALL_GOLD_BRICK_D
];
const DIRT_PATH_VARIANTS = [
  TileIndex.DIRT_PATH_A,
  TileIndex.DIRT_PATH_B,
  ExtraTileIndex.DIRT_PATH_C,
  ExtraTileIndex.DIRT_PATH_D
];
const SAND_VARIANTS = [
  TileIndex.SAND_A,
  TileIndex.SAND_B,
  ExtraTileIndex.SAND_C,
  ExtraTileIndex.SAND_D
];
const FARMLAND_VARIANTS = [
  TileIndex.DRY_FARMLAND_A,
  TileIndex.DRY_FARMLAND_B,
  ExtraTileIndex.DRY_FARMLAND_C,
  ExtraTileIndex.DRY_FARMLAND_D
];
const FARMLAND_SET = new Set<number>(FARMLAND_VARIANTS);
const STONE_PAVING_VARIANTS = [
  TileIndex.STONE_PAVING,
  ExtraTileIndex.STONE_PAVING_B,
  ExtraTileIndex.STONE_PAVING_C
];
const HARD_PAVING_OR_EARTH_SET = new Set<number>([
  ...BRICK_VARIANTS,
  ...DIRT_PATH_VARIANTS,
  ...SAND_VARIANTS,
  ...STONE_PAVING_VARIANTS
]);
const BRICK_OR_EARTH_FOR_MARBLE_EDGE = new Set<number>([
  ...BRICK_VARIANTS,
  ...DIRT_PATH_VARIANTS
]);
const WOOD_PIER_VARIANTS = [
  TileIndex.WOOD_PIER,
  ExtraTileIndex.WOOD_PIER_B,
  ExtraTileIndex.WOOD_PIER_C,
  ExtraTileIndex.WOOD_PIER_D
];
const PALACE_WINDOW_VARIANTS = [
  TileIndex.PALACE_WINDOW,
  ExtraTileIndex.PALACE_WINDOW_B
];
const WALL_FOOT_CASTERS = new Set<number>([
  TileIndex.RED_WALL_BASE,
  TileIndex.RED_WALL_MID,
  TileIndex.PALACE_WINDOW,
  ExtraTileIndex.PALACE_WINDOW_B,
  TileIndex.TERRACE_BASE
]);
const TREE_CANOPY_FRAMES = [
  'tree_cluster_a',
  'tree_cluster_b',
  'tree_cluster_c',
  'tree_cluster_d'
] as const;
function createGrid<T>(cols: number, rows: number, fill: T): T[][] {
  return Array.from({ length: rows }, () => Array<T>(cols).fill(fill));
}
function tileHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return (h ^ (h >>> 16)) >>> 0;
}
function fillRect<T>(
  grid: T[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  val: T
): void {
  const maxR = grid.length - 1;
  const maxC = grid[0].length - 1;
  for (let y = Math.max(0, y1); y <= Math.min(maxR, y2); y++) {
    for (let x = Math.max(0, x1); x <= Math.min(maxC, x2); x++) {
      grid[y][x] = val;
    }
  }
}
function fillVariedGround(
  ground: number[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  variants: number[]
): void {
  const maxR = ground.length - 1;
  const maxC = ground[0].length - 1;
  for (let y = Math.max(0, y1); y <= Math.min(maxR, y2); y++) {
    for (let x = Math.max(0, x1); x <= Math.min(maxC, x2); x++) {
      ground[y][x] = variants[tileHash(x, y) % variants.length];
    }
  }
}
function placePerimeterWall(
  deco: number[][],
  solid: boolean[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  for (let x = x1; x <= x2; x++) {
    const winTile =
      PALACE_WINDOW_VARIANTS[tileHash(x, y1) % PALACE_WINDOW_VARIANTS.length];
    deco[y1][x] = x % 4 === 2 ? winTile : TileIndex.RED_WALL_FRIEZE;
    deco[y2][x] = TileIndex.RED_WALL_BASE;
    solid[y1][x] = true;
    solid[y2][x] = true;
  }
  for (let y = y1; y <= y2; y++) {
    deco[y][x1] = TileIndex.RED_WALL_MID;
    deco[y][x2] = TileIndex.RED_WALL_MID;
    solid[y][x1] = true;
    solid[y][x2] = true;
  }
}
/**
 * 立體宮殿主立面：配搭斗拱彩畫額枋、飛簷翹角、轉角抱柱與高對比朱紅廊柱，消除矩形積木感
 */
function buildPalaceFacade(
  deco: number[][],
  solid: boolean[][],
  roof: number[][],
  props: MapPropPlacement[],
  x1: number,
  yTop: number,
  x2: number,
  doorCenterLeftX?: number
): void {
  for (let x = x1; x <= x2; x++) {
    deco[yTop][x] = TileIndex.ROOF_GOLD_RIDGE;
    deco[yTop + 1][x] = TileIndex.ROOF_GOLD_SLOPE;
    deco[yTop + 2][x] = TileIndex.RED_WALL_FRIEZE;
    const isWindow = (x - x1) % 3 === 1;
    const winTile =
      PALACE_WINDOW_VARIANTS[tileHash(x, yTop) % PALACE_WINDOW_VARIANTS.length];
    deco[yTop + 3][x] = isWindow ? winTile : TileIndex.RED_WALL_BASE;
    roof[yTop + 2][x] = TileIndex.ROOF_EAVE_GOLD;
    for (let dy = 0; dy <= 3; dy++) {
      solid[yTop + dy][x] = true;
    }
  }
  if (doorCenterLeftX !== undefined) {
    deco[yTop + 3][doorCenterLeftX] = TileIndex.GATE_DOOR_LEFT;
    deco[yTop + 3][doorCenterLeftX + 1] = TileIndex.GATE_DOOR_RIGHT;
  }
  const midX = (x1 + x2) / 2;
  const spanCols = x2 - x1 + 1;
  props.push({
    frame: 'palace_grand_roof',
    tileX: midX,
    tileY: yTop + 1,
    offsetY: -4,
    layer: 'canopy'
  });
  // 簷下斗拱彩畫額枋與兩端上翹飛簷角、轉角抱柱
  for (let dx = x1 + 1.5; dx <= x2 - 1.5; dx += 4) {
    props.push({
      frame: 'palace_dougong_span',
      tileX: dx,
      tileY: yTop + 2.35,
      layer: 'building'
    });
  }
  props.push(
    {
      frame: 'palace_eave_cap_l',
      tileX: x1 - 0.15,
      tileY: yTop + 1.65,
      layer: 'canopy'
    },
    {
      frame: 'palace_eave_cap_r',
      tileX: x2 + 0.15,
      tileY: yTop + 1.65,
      layer: 'canopy'
    },
    {
      frame: 'palace_corner_pilaster',
      tileX: x1,
      tileY: yTop + 2.9,
      layer: 'building'
    },
    {
      frame: 'palace_corner_pilaster',
      tileX: x2,
      tileY: yTop + 2.9,
      flipX: true,
      layer: 'building'
    }
  );
  if (spanCols >= 12) {
    props.push(
      {
        frame: 'palace_side_roof',
        tileX: x1 + 1.5,
        tileY: yTop + 1.2,
        layer: 'canopy'
      },
      {
        frame: 'palace_side_roof',
        tileX: x2 - 1.5,
        tileY: yTop + 1.2,
        flipX: true,
        layer: 'canopy'
      }
    );
  }
  props.push(
    {
      frame: 'palace_pillar_a',
      tileX: x1 + 1.2,
      tileY: yTop + 2.85,
      layer: 'building'
    },
    {
      frame: 'palace_pillar_a',
      tileX: x2 - 1.2,
      tileY: yTop + 2.85,
      flipX: true,
      layer: 'building'
    }
  );
  if (doorCenterLeftX !== undefined) {
    props.push(
      {
        frame: 'palace_pillar_b',
        tileX: doorCenterLeftX - 0.85,
        tileY: yTop + 2.85,
        layer: 'building'
      },
      {
        frame: 'palace_pillar_b',
        tileX: doorCenterLeftX + 1.85,
        tileY: yTop + 2.85,
        flipX: true,
        layer: 'building'
      }
    );
  }
}
function carveOpening(
  deco: number[][],
  solid: boolean[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  fillRect(deco, x1, y1, x2, y2, TileIndex.EMPTY);
  fillRect(solid, x1, y1, x2, y2, false);
}
/**
 * 在紅牆門洞兩側貼上朱紅抱框門柱、漢白玉抱鼓石與飛簷挑角，消除紅牆開口垂直刀切感
 */
function frameWallGatewayH(
  props: MapPropPlacement[],
  openX1: number,
  openX2: number,
  wallY: number,
  withEaveCaps = true
): void {
  props.push(
    {
      frame: 'palace_door_jamb_l',
      tileX: openX1 - 0.35,
      tileY: wallY - 0.1,
      layer: 'building'
    },
    {
      frame: 'palace_door_jamb_r',
      tileX: openX2 + 0.35,
      tileY: wallY - 0.1,
      layer: 'building'
    }
  );
  if (withEaveCaps) {
    props.push(
      {
        frame: 'palace_eave_cap_r',
        tileX: openX1 - 0.65,
        tileY: wallY - 0.85,
        layer: 'canopy'
      },
      {
        frame: 'palace_eave_cap_l',
        tileX: openX2 + 0.65,
        tileY: wallY - 0.85,
        layer: 'canopy'
      }
    );
  }
}
/**
 * 放置大樹：根部只鋪柔和橢圓樹蔭格（TREE_BASE_SHADOW），絕不更動 ground[][]，確保樹下無方形泥塊
 */
function placePineTree(
  deco: number[][],
  solid: boolean[][],
  roof: number[][],
  _shadow: boolean[][],
  props: MapPropPlacement[],
  tx: number,
  ty: number
): void {
  deco[ty][tx] = ExtraTileIndex.TREE_BASE_SHADOW;
  solid[ty][tx] = true;
  if (ty - 1 >= 0) {
    roof[ty - 1][tx] = ExtraTileIndex.INVISIBLE_ROOF_MARKER;
  }
  const treeFrame =
    TREE_CANOPY_FRAMES[tileHash(tx, ty) % TREE_CANOPY_FRAMES.length];
  props.push({
    frame: treeFrame,
    tileX: tx,
    tileY: ty - 0.55,
    layer: 'canopy',
    flipX: tileHash(ty, tx) % 2 === 1
  });
}
function placeWillowTree(
  deco: number[][],
  solid: boolean[][],
  roof: number[][],
  _shadow: boolean[][],
  props: MapPropPlacement[],
  tx: number,
  ty: number
): void {
  deco[ty][tx] = ExtraTileIndex.TREE_BASE_SHADOW;
  solid[ty][tx] = true;
  if (ty - 1 >= 0) {
    roof[ty - 1][tx] = ExtraTileIndex.INVISIBLE_ROOF_MARKER;
  }
  const treeFrame =
    TREE_CANOPY_FRAMES[(tileHash(tx, ty) + 2) % TREE_CANOPY_FRAMES.length];
  props.push({
    frame: treeFrame,
    tileX: tx,
    tileY: ty - 0.55,
    layer: 'canopy',
    flipX: tileHash(tx + 3, ty) % 2 === 0
  });
}
function placeStoneLantern(
  deco: number[][],
  solid: boolean[][],
  props: MapPropPlacement[],
  tx: number,
  ty: number
): void {
  deco[ty][tx] = ExtraTileIndex.TREE_BASE_SHADOW;
  solid[ty][tx] = true;
  props.push({
    frame: tileHash(tx, ty) % 2 === 0 ? 'stone_lantern_a' : 'stone_lantern_b',
    tileX: tx,
    tileY: ty - 0.15,
    layer: 'building'
  });
}
/**
 * 不改動任何底層 ground[][] 圖塊，自動在米白御道邊緣、宮牆牆腳、草地泥路交界與旱田外緣疊加自然過渡層
 */
function softenGroundTransitions(
  ground: number[][],
  deco: number[][],
  solid: boolean[][],
  props: MapPropPlacement[]
): void {
  const rows = ground.length;
  const cols = ground[0].length;
  // 1. 縱向交界（每 2 格一段 48px 軟邊條，精準對齊 x + 0.5 接縫）
  for (let x = 1; x < cols - 1; x++) {
    for (let y = 1; y < rows - 2; y += 2) {
      const a0 = ground[y][x];
      const b0 = ground[y][x + 1];
      const a1 = ground[y + 1][x];
      const b1 = ground[y + 1][x + 1];
      // 漢白玉御道 <-> 青灰磚／黃土路：碎石、青苔與石緣微影
      if (
        !solid[y][x] &&
        !solid[y][x + 1] &&
        MARBLE_SLAB_ONLY_SET.has(b0) &&
        MARBLE_SLAB_ONLY_SET.has(b1) &&
        BRICK_OR_EARTH_FOR_MARBLE_EDGE.has(a0) &&
        BRICK_OR_EARTH_FOR_MARBLE_EDGE.has(a1)
      ) {
        props.push({
          frame: 'marble_edge_w',
          tileX: x + 0.5,
          tileY: y + 0.5,
          layer: 'ground_decor'
        });
      } else if (
        !solid[y][x] &&
        !solid[y][x + 1] &&
        MARBLE_SLAB_ONLY_SET.has(a0) &&
        MARBLE_SLAB_ONLY_SET.has(a1) &&
        BRICK_OR_EARTH_FOR_MARBLE_EDGE.has(b0) &&
        BRICK_OR_EARTH_FOR_MARBLE_EDGE.has(b1)
      ) {
        props.push({
          frame: 'marble_edge_e',
          tileX: x + 0.5,
          tileY: y + 0.5,
          layer: 'ground_decor'
        });
      }
      // 草地 <-> 泥路／沙地／石板／青磚：自然蔓延草穗邊
      if (
        !solid[y][x] &&
        !solid[y][x + 1] &&
        GRASS_SET.has(a0) &&
        GRASS_SET.has(a1) &&
        (HARD_PAVING_OR_EARTH_SET.has(b0) || MARBLE_SLAB_ONLY_SET.has(b0)) &&
        (HARD_PAVING_OR_EARTH_SET.has(b1) || MARBLE_SLAB_ONLY_SET.has(b1))
      ) {
        props.push({
          frame: 'grass_fringe_e',
          tileX: x + 0.5,
          tileY: y + 0.5,
          layer: 'ground_decor'
        });
      } else if (
        !solid[y][x] &&
        !solid[y][x + 1] &&
        GRASS_SET.has(b0) &&
        GRASS_SET.has(b1) &&
        (HARD_PAVING_OR_EARTH_SET.has(a0) || MARBLE_SLAB_ONLY_SET.has(a0)) &&
        (HARD_PAVING_OR_EARTH_SET.has(a1) || MARBLE_SLAB_ONLY_SET.has(a1))
      ) {
        props.push({
          frame: 'grass_fringe_w',
          tileX: x + 0.5,
          tileY: y + 0.5,
          layer: 'ground_decor'
        });
      }
      // 旱田縱向蜿蜒泥草田埂
      if (
        (FARMLAND_SET.has(a0) && FARMLAND_SET.has(a1) && !FARMLAND_SET.has(b0)) ||
        (FARMLAND_SET.has(b0) && FARMLAND_SET.has(b1) && !FARMLAND_SET.has(a0))
      ) {
        props.push({
          frame: 'farmland_bund_v',
          tileX: x + 0.5,
          tileY: y + 0.5,
          layer: 'ground_decor'
        });
      }
    }
  }
  // 2. 橫向交界與紅牆／台基牆腳青苔碎石帶（每 2 格一段 48px，精準對齊 y + 0.5 接縫）
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 2; x += 2) {
      const t0 = ground[y][x];
      const t1 = ground[y][x + 1];
      const b0 = ground[y + 1][x];
      const b1 = ground[y + 1][x + 1];
      // 宮牆／須彌座牆腳與南側可行走地面交界 -> 青苔、碎石與漸層陰影
      if (
        WALL_FOOT_CASTERS.has(deco[y][x]) &&
        WALL_FOOT_CASTERS.has(deco[y][x + 1]) &&
        !solid[y + 1][x] &&
        !solid[y + 1][x + 1] &&
        b0 !== TileIndex.MARBLE_STAIR &&
        b1 !== TileIndex.MARBLE_STAIR
      ) {
        props.push({
          frame: tileHash(x, y) % 2 === 0 ? 'wall_foot_moss_a' : 'wall_foot_moss_b',
          tileX: x + 0.5,
          tileY: y + 0.5,
          layer: 'ground_decor'
        });
        continue;
      }
      if (!solid[y][x] && !solid[y + 1][x]) {
        if (
          MARBLE_SLAB_ONLY_SET.has(b0) &&
          MARBLE_SLAB_ONLY_SET.has(b1) &&
          BRICK_OR_EARTH_FOR_MARBLE_EDGE.has(t0) &&
          BRICK_OR_EARTH_FOR_MARBLE_EDGE.has(t1)
        ) {
          props.push({
            frame: 'marble_edge_n',
            tileX: x + 0.5,
            tileY: y + 0.5,
            layer: 'ground_decor'
          });
        } else if (
          MARBLE_SLAB_ONLY_SET.has(t0) &&
          MARBLE_SLAB_ONLY_SET.has(t1) &&
          BRICK_OR_EARTH_FOR_MARBLE_EDGE.has(b0) &&
          BRICK_OR_EARTH_FOR_MARBLE_EDGE.has(b1)
        ) {
          props.push({
            frame: 'marble_edge_s',
            tileX: x + 0.5,
            tileY: y + 0.5,
            layer: 'ground_decor'
          });
        }
        if (
          GRASS_SET.has(t0) &&
          GRASS_SET.has(t1) &&
          (HARD_PAVING_OR_EARTH_SET.has(b0) || MARBLE_SLAB_ONLY_SET.has(b0)) &&
          (HARD_PAVING_OR_EARTH_SET.has(b1) || MARBLE_SLAB_ONLY_SET.has(b1))
        ) {
          props.push({
            frame: 'grass_fringe_s',
            tileX: x + 0.5,
            tileY: y + 0.5,
            layer: 'ground_decor'
          });
        } else if (
          GRASS_SET.has(b0) &&
          GRASS_SET.has(b1) &&
          (HARD_PAVING_OR_EARTH_SET.has(t0) || MARBLE_SLAB_ONLY_SET.has(t0)) &&
          (HARD_PAVING_OR_EARTH_SET.has(t1) || MARBLE_SLAB_ONLY_SET.has(t1))
        ) {
          props.push({
            frame: 'grass_fringe_n',
            tileX: x + 0.5,
            tileY: y + 0.5,
            layer: 'ground_decor'
          });
        }
      }
      // 旱田橫向蜿蜒泥草田埂
      if (
        (FARMLAND_SET.has(t0) && FARMLAND_SET.has(t1) && !FARMLAND_SET.has(b0)) ||
        (FARMLAND_SET.has(b0) && FARMLAND_SET.has(b1) && !FARMLAND_SET.has(t0))
      ) {
        props.push({
          frame: 'farmland_bund_h',
          tileX: x + 0.5,
          tileY: y + 0.5,
          layer: 'ground_decor'
        });
      }
    }
  }
}
/**
 * 僅在牆體正南側投射柔和屋簷陰影，避開漢白玉台階與門洞側邊御道
 */
function computeWallShadows(
  ground: number[][],
  deco: number[][],
  solid: boolean[][],
  shadow: boolean[][]
): void {
  const rows = deco.length;
  const cols = deco[0].length;
  const casters = new Set<number>([
    TileIndex.RED_WALL_BASE,
    TileIndex.RED_WALL_MID,
    TileIndex.RED_WALL_FRIEZE,
    TileIndex.PALACE_WINDOW,
    ExtraTileIndex.PALACE_WINDOW_B,
    TileIndex.WHITE_WALL_WINDOW,
    TileIndex.TERRACE_BASE,
    TileIndex.GATE_DOOR_LEFT,
    TileIndex.GATE_DOOR_RIGHT
  ]);
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols; x++) {
      if (casters.has(deco[y][x]) && !solid[y + 1][x]) {
        if (ground[y + 1][x] !== TileIndex.MARBLE_STAIR) {
          shadow[y + 1][x] = true;
        }
      }
      if (
        x + 1 < cols &&
        casters.has(deco[y][x]) &&
        !solid[y][x + 1] &&
        !MARBLE_SET.has(ground[y][x + 1])
      ) {
        shadow[y][x + 1] = true;
      }
    }
  }
}
export function buildStageMap(stage: StageId): StageMapData {
  switch (stage) {
    case 'kangxi':
      return buildKangxiMap();
    case 'yongzheng':
      return buildYongzhengMap();
    case 'qianlong':
      return buildQianlongMap();
  }
}
function buildKangxiMap(): StageMapData {
  const cols = 48;
  const rows = 36;
  const ground = createGrid<number>(cols, rows, TileIndex.COURTYARD_BRICK_A);
  const shadow = createGrid(cols, rows, false);
  const deco = createGrid<number>(cols, rows, TileIndex.EMPTY);
  const solid = createGrid(cols, rows, false);
  const roof = createGrid<number>(cols, rows, TileIndex.EMPTY);
  const props: MapPropPlacement[] = [];
  // 1. 全院鋪設同家族連續青灰磚，左右外庭配純淨綠草花圃
  fillVariedGround(ground, 0, 0, cols - 1, rows - 1, BRICK_VARIANTS);
  fillVariedGround(ground, 2, 27, 9, 33, GRASS_VARIANTS);
  fillVariedGround(ground, 38, 27, 45, 33, GRASS_VARIANTS);
  // 2. 紫禁紅牆外框與南面宮門出口（加立體門柱抱鼓石與飛簷挑角）
  placePerimeterWall(deco, solid, 0, 0, cols - 1, rows - 1);
  deco[rows - 1][22] = TileIndex.GATE_DOOR_LEFT;
  deco[rows - 1][23] = TileIndex.GATE_DOOR_RIGHT;
  deco[rows - 1][24] = TileIndex.GATE_DOOR_LEFT;
  deco[rows - 1][25] = TileIndex.GATE_DOOR_RIGHT;
  frameWallGatewayH(props, 22, 25, rows - 1, true);
  // 3. 南段外庭全幅連續米白漢白玉御道（本體保持純淨連續，邊緣交由 softenGroundTransitions 柔化）
  fillVariedGround(ground, 21, 25, 26, 34, MARBLE_VARIANTS);
  // 4. 外庭與內苑分隔紅牆（門洞加朱紅抱框門柱、抱鼓石、斗拱額枋與牆角花灌木）
  for (let x = 1; x <= 46; x++) {
    const winTile =
      PALACE_WINDOW_VARIANTS[tileHash(x, 25) % PALACE_WINDOW_VARIANTS.length];
    deco[25][x] = x % 4 === 0 ? winTile : TileIndex.RED_WALL_BASE;
    solid[25][x] = true;
    roof[24][x] = TileIndex.ROOF_EAVE_GOLD;
  }
  carveOpening(deco, solid, 6, 25, 9, 25);
  carveOpening(deco, solid, 21, 25, 26, 25);
  carveOpening(deco, solid, 37, 25, 40, 25);
  fillRect(roof, 6, 24, 9, 24, TileIndex.EMPTY);
  fillRect(roof, 21, 24, 26, 24, TileIndex.EMPTY);
  fillRect(roof, 37, 24, 40, 24, TileIndex.EMPTY);
  frameWallGatewayH(props, 6, 9, 25, true);
  frameWallGatewayH(props, 21, 26, 25, true);
  frameWallGatewayH(props, 37, 40, 25, true);
  props.push(
    { frame: 'palace_wing_left', tileX: 15, tileY: 24.4, layer: 'canopy' },
    { frame: 'palace_wing_right', tileX: 31.5, tileY: 24.4, layer: 'canopy' },
    { frame: 'palace_dougong_span', tileX: 15, tileY: 24.9, layer: 'building' },
    { frame: 'palace_dougong_span', tileX: 31.5, tileY: 24.9, layer: 'building' },
    { frame: 'jiangnan_shrub_a', tileX: 11.2, tileY: 25.45, layer: 'building' },
    { frame: 'jiangnan_shrub_b', tileX: 35.2, tileY: 25.45, layer: 'building' }
  );
  // 5. 蓮池御苑純淨草地與荷池（池角與岸邊加菖蒲水草與奇石，柔化水岸直角）
  fillVariedGround(ground, 1, 14, 32, 24, GRASS_VARIANTS);
  fillRect(ground, 4, 15, 30, 23, TileIndex.WATER_1);
  fillRect(ground, 4, 15, 30, 15, TileIndex.WATER_BANK_TOP);
  fillRect(solid, 4, 15, 30, 23, true);
  for (const [lx, ly] of [
    [6, 17],
    [8, 21],
    [18, 16],
    [19, 22],
    [28, 17],
    [29, 21]
  ]) {
    ground[ly][lx] = TileIndex.LOTUS_FLOWER;
    if (lx + 1 < 30) {
      ground[ly][lx + 1] = TileIndex.LOTUS_LEAF;
    }
  }
  props.push(
    { frame: 'jiangnan_rocks_a', tileX: 5.2, tileY: 15.2, layer: 'ground_decor' },
    { frame: 'jiangnan_rocks_b', tileX: 28.8, tileY: 15.2, layer: 'ground_decor' },
    { frame: 'pond_reeds_a', tileX: 4.5, tileY: 22.8, layer: 'building' },
    { frame: 'pond_reeds_b', tileX: 20.3, tileY: 15.4, layer: 'building' },
    { frame: 'pond_reeds_a', tileX: 27.1, tileY: 22.8, layer: 'building' },
    { frame: 'pond_reeds_b', tileX: 29.8, tileY: 18.6, layer: 'building' }
  );
  // 6. 中央漢白玉石拱橋
  fillRect(ground, 22, 14, 25, 24, TileIndex.STONE_BRIDGE_DECK);
  fillRect(solid, 22, 14, 25, 24, false);
  for (let y = 15; y <= 23; y++) {
    deco[y][21] = TileIndex.MARBLE_BALUSTRADE_V;
    solid[y][21] = true;
    deco[y][26] = TileIndex.MARBLE_BALUSTRADE_V;
    solid[y][26] = true;
  }
  // 7. 湖心水榭亭島與西向石橋（加立體朱紅廊柱與飛簷翹角，保留用人唯才挑戰桌）
  fillVariedGround(ground, 9, 17, 15, 21, MARBLE_VARIANTS);
  fillRect(solid, 9, 17, 15, 21, false);
  fillRect(ground, 16, 18, 21, 20, TileIndex.STONE_BRIDGE_DECK);
  fillRect(solid, 16, 18, 21, 20, false);
  carveOpening(deco, solid, 21, 18, 21, 20);
  deco[17][9] = ExtraTileIndex.TREE_BASE_SHADOW;
  deco[17][15] = ExtraTileIndex.TREE_BASE_SHADOW;
  solid[17][9] = true;
  solid[17][15] = true;
  fillRect(roof, 9, 16, 15, 17, TileIndex.ROOF_EAVE_GOLD);
  props.push(
    { frame: 'palace_side_roof', tileX: 12, tileY: 16.3, layer: 'canopy' },
    { frame: 'palace_eave_cap_l', tileX: 9.0, tileY: 16.5, layer: 'canopy' },
    { frame: 'palace_eave_cap_r', tileX: 15.0, tileY: 16.5, layer: 'canopy' },
    { frame: 'palace_pillar_a', tileX: 9, tileY: 16.85, layer: 'building' },
    { frame: 'palace_pillar_a', tileX: 15, tileY: 16.85, flipX: true, layer: 'building' }
  );
  deco[18][12] = TileIndex.MINIGAME_TABLE;
  solid[18][12] = true;
  // 8. 北面太和殿前連續漢白玉高台與重簷金頂主殿
  fillVariedGround(ground, 16, 6, 31, 10, MARBLE_VARIANTS);
  fillVariedGround(ground, 22, 11, 25, 13, MARBLE_VARIANTS);
  for (let x = 16; x <= 31; x++) {
    if (x >= 22 && x <= 25) {
      ground[10][x] = TileIndex.MARBLE_STAIR;
      solid[10][x] = false;
    } else {
      deco[10][x] = TileIndex.TERRACE_BASE;
      solid[10][x] = true;
    }
  }
  props.push(
    { frame: 'palace_corner_pilaster', tileX: 16, tileY: 9.85, layer: 'building' },
    { frame: 'palace_corner_pilaster', tileX: 31, tileY: 9.85, flipX: true, layer: 'building' }
  );
  buildPalaceFacade(deco, solid, roof, props, 16, 2, 31, 23);
  deco[7][19] = TileIndex.BRONZE_INCENSE;
  deco[7][28] = TileIndex.BRONZE_INCENSE;
  solid[7][19] = true;
  solid[7][28] = true;
  // 9. 東側滿漢書院與江南書齋（以雅致書齋變體 jiangnan_house_b 搭配灌木與踏步石柔化輪廓）
  for (let y = 1; y <= 24; y++) {
    const winTile =
      PALACE_WINDOW_VARIANTS[tileHash(33, y) % PALACE_WINDOW_VARIANTS.length];
    deco[y][33] = y % 4 === 0 ? winTile : TileIndex.RED_WALL_MID;
    solid[y][33] = true;
  }
  carveOpening(deco, solid, 33, 8, 33, 11);
  carveOpening(deco, solid, 33, 20, 33, 23);
  props.push(
    { frame: 'palace_corner_pilaster', tileX: 33, tileY: 24.8, layer: 'building' },
    { frame: 'palace_door_jamb_l', tileX: 33, tileY: 7.7, layer: 'building' },
    { frame: 'palace_door_jamb_l', tileX: 33, tileY: 19.7, layer: 'building' }
  );
  fillVariedGround(ground, 35, 4, 45, 23, MARBLE_VARIANTS);
  fillVariedGround(ground, 37, 7, 43, 18, GRASS_VARIANTS);
  fillVariedGround(ground, 37, 13, 43, 14, MARBLE_VARIANTS);
  fillRect(solid, 36, 2, 39, 3, true);
  fillRect(solid, 41, 2, 44, 3, true);
  fillRect(roof, 36, 2, 39, 2, ExtraTileIndex.INVISIBLE_ROOF_MARKER);
  fillRect(roof, 41, 2, 44, 2, ExtraTileIndex.INVISIBLE_ROOF_MARKER);
  props.push(
    { frame: 'jiangnan_house_b', tileX: 37.6, tileY: 2.35, layer: 'building' },
    { frame: 'jiangnan_house_b', tileX: 42.6, tileY: 2.35, layer: 'building' },
    { frame: 'cottage_stepping_stones', tileX: 37.5, tileY: 3.85, layer: 'ground_decor' },
    { frame: 'cottage_stepping_stones', tileX: 42.5, tileY: 3.85, layer: 'ground_decor' },
    { frame: 'jiangnan_shrub_a', tileX: 35.4, tileY: 3.45, layer: 'building' },
    { frame: 'jiangnan_shrub_b', tileX: 40.2, tileY: 3.45, layer: 'building' },
    { frame: 'jiangnan_shrub_a', tileX: 44.8, tileY: 3.45, layer: 'building' }
  );
  fillRect(roof, 45, 5, 46, 22, TileIndex.ROOF_EAVE_GOLD);
  deco[9][42] = TileIndex.TAIHU_ROCK;
  deco[17][38] = TileIndex.TAIHU_ROCK;
  solid[9][42] = true;
  solid[17][38] = true;
  // 10. 乾淨去背大樹與精雕石燈
  for (const [px, py] of [
    [5, 6],
    [11, 6],
    [6, 30],
    [41, 30],
    [38, 8]
  ]) {
    placePineTree(deco, solid, roof, shadow, props, px, py);
  }
  placeWillowTree(deco, solid, roof, shadow, props, 5, 14);
  placeWillowTree(deco, solid, roof, shadow, props, 29, 14);
  for (const [lx, ly] of [
    [20, 12],
    [27, 12],
    [20, 28],
    [27, 28]
  ]) {
    placeStoneLantern(deco, solid, props, lx, ly);
  }
  softenGroundTransitions(ground, deco, solid, props);
  computeWallShadows(ground, deco, solid, shadow);
  return {
    cols,
    rows,
    spawnX: 23,
    spawnY: 31,
    ground,
    shadow,
    deco,
    solid,
    roof,
    props,
    zones: [
      { name: '外庭大門', x1: 1, y1: 25, x2: 46, y2: 35 },
      { name: '蓮池御苑', x1: 1, y1: 14, x2: 32, y2: 24 },
      { name: '宮殿前院', x1: 1, y1: 1, x2: 32, y2: 13 },
      { name: '東側回廊', x1: 33, y1: 1, x2: 46, y2: 24 }
    ],
    triggers: [
      {
        id: 'kangxi_emperor',
        kind: 'npc',
        label: '康熙皇帝',
        tileX: 23,
        tileY: 8,
        spriteKey: 'char_kangxi_emperor',
        facing: 'down'
      },
      {
        id: 'manchu_person',
        kind: 'npc',
        label: '滿族人',
        tileX: 40,
        tileY: 10,
        spriteKey: 'char_manchu_person',
        facing: 'down'
      },
      {
        id: 'han_person',
        kind: 'npc',
        label: '漢族人',
        tileX: 40,
        tileY: 20,
        spriteKey: 'char_han_person',
        facing: 'up'
      },
      {
        id: 'talent_station',
        kind: 'minigame',
        label: '用人唯才挑戰',
        tileX: 12,
        tileY: 18,
        minigameId: 'talent_game',
        sceneKey: 'TalentMinigame'
      },
      {
        id: 'kangxi_exit',
        kind: 'exit',
        label: '庭院大門（出口）',
        tileX: 23,
        tileY: 34
      }
    ]
  };
}
function buildYongzhengMap(): StageMapData {
  const cols = 48;
  const rows = 36;
  const ground = createGrid<number>(cols, rows, TileIndex.COURTYARD_BRICK_A);
  const shadow = createGrid(cols, rows, false);
  const deco = createGrid<number>(cols, rows, TileIndex.EMPTY);
  const solid = createGrid(cols, rows, false);
  const roof = createGrid<number>(cols, rows, TileIndex.EMPTY);
  const props: MapPropPlacement[] = [];
  // 1. 全院同家族連續青灰磚與北苑綠植區
  fillVariedGround(ground, 0, 0, cols - 1, rows - 1, BRICK_VARIANTS);
  fillVariedGround(ground, 2, 2, 11, 5, GRASS_VARIANTS);
  fillVariedGround(ground, 36, 2, 45, 5, GRASS_VARIANTS);
  placePerimeterWall(deco, solid, 0, 0, cols - 1, rows - 1);
  // 2. 北面城門（真正出口）加飛簷挑角與抱鼓門柱
  deco[0][22] = TileIndex.GATE_DOOR_LEFT;
  deco[0][23] = TileIndex.GATE_DOOR_RIGHT;
  deco[0][24] = TileIndex.GATE_DOOR_LEFT;
  deco[0][25] = TileIndex.GATE_DOOR_RIGHT;
  props.push(
    { frame: 'palace_side_roof', tileX: 23.5, tileY: 0.6, layer: 'canopy' },
    { frame: 'palace_eave_cap_l', tileX: 21.1, tileY: 0.9, layer: 'canopy' },
    { frame: 'palace_eave_cap_r', tileX: 25.9, tileY: 0.9, layer: 'canopy' }
  );
  fillRect(deco, 16, 1, 21, 2, TileIndex.RED_WALL_BASE);
  fillRect(solid, 16, 1, 21, 2, true);
  fillRect(deco, 26, 1, 31, 2, TileIndex.RED_WALL_BASE);
  fillRect(solid, 26, 1, 31, 2, true);
  frameWallGatewayH(props, 22, 25, 2, false);
  fillVariedGround(ground, 22, 1, 25, 12, MARBLE_VARIANTS);
  placeStoneLantern(deco, solid, props, 20, 4);
  placeStoneLantern(deco, solid, props, 27, 4);
  // 3. 南面圓拱月洞門（以圓弧漢白玉月洞門＋捲棚琉璃披簷＋兩側花木取代原本 4 格方正綠塊）
  for (let x = 22; x <= 25; x++) {
    deco[rows - 1][x] = TileIndex.MOON_GATE;
    solid[rows - 1][x] = true;
  }
  props.push(
    { frame: 'moon_gate_arch', tileX: 23.5, tileY: 34.6, layer: 'building' },
    { frame: 'jiangnan_shrub_a', tileX: 20.6, tileY: 34.4, layer: 'building' },
    { frame: 'jiangnan_shrub_b', tileX: 26.4, tileY: 34.4, layer: 'building' }
  );
  fillVariedGround(ground, 18, 25, 29, 34, MARBLE_VARIANTS);
  deco[27][19] = TileIndex.BRONZE_INCENSE;
  deco[27][28] = TileIndex.BRONZE_INCENSE;
  solid[27][19] = true;
  solid[27][28] = true;
  placeStoneLantern(deco, solid, props, 17, 29);
  placeStoneLantern(deco, solid, props, 30, 29);
  // 4. 勤政大殿：加強殿內外高對比立體朱紅廊柱、挑出斗拱、飛簷翹角與轉角抱柱
  placePerimeterWall(deco, solid, 14, 12, 33, 24);
  for (let x = 14; x <= 33; x++) {
    const isWin = x === 16 || x === 19 || x === 28 || x === 31;
    const winTile =
      PALACE_WINDOW_VARIANTS[tileHash(x, 24) % PALACE_WINDOW_VARIANTS.length];
    deco[24][x] = isWin ? winTile : TileIndex.RED_WALL_BASE;
    roof[11][x] = TileIndex.ROOF_EAVE_GOLD;
    roof[23][x] = TileIndex.ROOF_EAVE_GOLD;
  }
  fillVariedGround(ground, 15, 13, 32, 23, HALL_FLOOR_VARIANTS);
  fillRect(ground, 22, 13, 25, 24, TileIndex.RED_CARPET_CENTER);
  carveOpening(deco, solid, 22, 24, 25, 24);
  fillRect(ground, 22, 24, 25, 24, TileIndex.MARBLE_STAIR);
  fillRect(roof, 22, 23, 25, 23, TileIndex.EMPTY);
  carveOpening(deco, solid, 22, 12, 25, 12);
  fillRect(roof, 22, 11, 25, 11, TileIndex.EMPTY);
  carveOpening(deco, solid, 14, 17, 14, 20);
  carveOpening(deco, solid, 33, 17, 33, 20);
  // 大殿屋頂、翼樓、斗拱額枋與飛簷翹角
  props.push(
    { frame: 'palace_grand_roof', tileX: 23.5, tileY: 11.8, layer: 'canopy' },
    { frame: 'palace_eave_cap_l', tileX: 13.85, tileY: 11.6, layer: 'canopy' },
    { frame: 'palace_eave_cap_r', tileX: 33.15, tileY: 11.6, layer: 'canopy' },
    { frame: 'palace_wing_left', tileX: 17.5, tileY: 23.7, layer: 'canopy' },
    { frame: 'palace_wing_right', tileX: 29.5, tileY: 23.7, layer: 'canopy' },
    { frame: 'palace_eave_cap_l', tileX: 13.85, tileY: 23.25, layer: 'canopy' },
    { frame: 'palace_eave_cap_r', tileX: 21.35, tileY: 23.25, layer: 'canopy' },
    { frame: 'palace_eave_cap_l', tileX: 25.65, tileY: 23.25, layer: 'canopy' },
    { frame: 'palace_eave_cap_r', tileX: 33.15, tileY: 23.25, layer: 'canopy' },
    { frame: 'palace_dougong_span', tileX: 16.2, tileY: 23.95, layer: 'building' },
    { frame: 'palace_dougong_span', tileX: 19.6, tileY: 23.95, layer: 'building' },
    { frame: 'palace_dougong_span', tileX: 27.4, tileY: 23.95, layer: 'building' },
    { frame: 'palace_dougong_span', tileX: 30.8, tileY: 23.95, layer: 'building' },
    // 前立面外廊立體朱紅柱與轉角抱柱（位於原本即不可通行的 y=24 牆線上，完全不擋丹墀與台階）
    { frame: 'palace_corner_pilaster', tileX: 14, tileY: 23.9, layer: 'building' },
    { frame: 'palace_corner_pilaster', tileX: 33, tileY: 23.9, flipX: true, layer: 'building' },
    { frame: 'palace_pillar_a', tileX: 15.2, tileY: 23.85, layer: 'building' },
    { frame: 'palace_pillar_b', tileX: 21.25, tileY: 23.85, layer: 'building' },
    { frame: 'palace_pillar_b', tileX: 25.75, tileY: 23.85, flipX: true, layer: 'building' },
    { frame: 'palace_pillar_a', tileX: 31.8, tileY: 23.85, flipX: true, layer: 'building' },
    // 北門洞抱框門柱
    { frame: 'palace_door_jamb_l', tileX: 21.65, tileY: 11.9, layer: 'building' },
    { frame: 'palace_door_jamb_r', tileX: 25.35, tileY: 11.9, layer: 'building' }
  );
  // 殿內四根高對比盤金／朱紅大殿柱
  for (const [px, py] of [
    [18, 15],
    [18, 21],
    [29, 15],
    [29, 21]
  ]) {
    deco[py][px] = ExtraTileIndex.TREE_BASE_SHADOW;
    solid[py][px] = true;
    props.push({
      frame: py === 21 ? 'palace_pillar_b' : 'palace_pillar_a',
      tileX: px,
      tileY: py - 0.25,
      flipX: px >= 24,
      layer: 'building'
    });
  }
  deco[13][22] = TileIndex.EMPEROR_SCREEN;
  deco[13][25] = TileIndex.EMPEROR_SCREEN;
  solid[13][22] = true;
  solid[13][25] = true;
  deco[14][23] = TileIndex.EMPEROR_THRONE_DESK;
  deco[14][24] = TileIndex.EMPEROR_THRONE_DESK;
  solid[14][23] = true;
  solid[14][24] = true;
  // 5. 西翼長廊與戶部國庫（加轉角抱柱、飛簷翹角與牆隅花木）
  placePerimeterWall(deco, solid, 3, 7, 14, 29);
  fillVariedGround(ground, 4, 8, 13, 28, HALL_FLOOR_VARIANTS);
  carveOpening(deco, solid, 14, 17, 14, 20);
  carveOpening(deco, solid, 14, 9, 14, 11);
  fillVariedGround(ground, 14, 9, 22, 11, MARBLE_VARIANTS);
  fillRect(roof, 4, 8, 13, 8, TileIndex.ROOF_EAVE_GOLD);
  props.push(
    { frame: 'palace_wing_left', tileX: 8.5, tileY: 7.4, layer: 'canopy' },
    { frame: 'palace_eave_cap_l', tileX: 3.0, tileY: 7.5, layer: 'canopy' },
    { frame: 'palace_dougong_span', tileX: 8.5, tileY: 7.95, layer: 'building' },
    { frame: 'palace_corner_pilaster', tileX: 3, tileY: 28.9, layer: 'building' },
    { frame: 'palace_corner_pilaster', tileX: 14, tileY: 28.9, flipX: true, layer: 'building' },
    { frame: 'jiangnan_shrub_b', tileX: 15.6, tileY: 29.4, layer: 'building' }
  );
  fillRect(deco, 4, 15, 10, 15, TileIndex.RED_WALL_BASE);
  fillRect(solid, 4, 15, 10, 15, true);
  fillRect(deco, 8, 21, 13, 21, TileIndex.RED_WALL_BASE);
  fillRect(solid, 8, 21, 13, 21, true);
  for (const [cx, cy] of [
    [5, 24],
    [6, 24],
    [5, 25],
    [6, 25],
    [5, 26]
  ]) {
    deco[cy][cx] = TileIndex.TREASURY_CHEST;
    solid[cy][cx] = true;
  }
  props.push({ frame: 'camp_crate', tileX: 5.5, tileY: 23.2, layer: 'building' });
  // 6. 東翼長廊與打擊貪官挑戰桌（加轉角抱柱、飛簷翹角與牆隅花木）
  placePerimeterWall(deco, solid, 33, 7, 44, 29);
  fillVariedGround(ground, 34, 8, 43, 28, HALL_FLOOR_VARIANTS);
  carveOpening(deco, solid, 33, 17, 33, 20);
  carveOpening(deco, solid, 33, 9, 33, 11);
  fillVariedGround(ground, 25, 9, 33, 11, MARBLE_VARIANTS);
  fillRect(roof, 34, 8, 43, 8, TileIndex.ROOF_EAVE_GOLD);
  props.push(
    { frame: 'palace_wing_right', tileX: 38.5, tileY: 7.4, layer: 'canopy' },
    { frame: 'palace_eave_cap_r', tileX: 44.0, tileY: 7.5, layer: 'canopy' },
    { frame: 'palace_dougong_span', tileX: 38.5, tileY: 7.95, layer: 'building' },
    { frame: 'palace_corner_pilaster', tileX: 33, tileY: 28.9, layer: 'building' },
    { frame: 'palace_corner_pilaster', tileX: 44, tileY: 28.9, flipX: true, layer: 'building' },
    { frame: 'jiangnan_shrub_a', tileX: 31.4, tileY: 29.4, layer: 'building' }
  );
  fillRect(deco, 37, 15, 43, 15, TileIndex.RED_WALL_BASE);
  fillRect(solid, 37, 15, 43, 15, true);
  fillRect(deco, 34, 21, 39, 21, TileIndex.RED_WALL_BASE);
  fillRect(solid, 34, 21, 39, 21, true);
  deco[11][39] = TileIndex.MINIGAME_TABLE;
  solid[11][39] = true;
  placePineTree(deco, solid, roof, shadow, props, 7, 4);
  placePineTree(deco, solid, roof, shadow, props, 40, 4);
  placePineTree(deco, solid, roof, shadow, props, 9, 32);
  placePineTree(deco, solid, roof, shadow, props, 38, 32);
  softenGroundTransitions(ground, deco, solid, props);
  computeWallShadows(ground, deco, solid, shadow);
  return {
    cols,
    rows,
    spawnX: 23,
    spawnY: 30,
    ground,
    shadow,
    deco,
    solid,
    roof,
    props,
    zones: [
      { name: '殿前丹墀', x1: 14, y1: 25, x2: 33, y2: 35 },
      { name: '勤政大殿', x1: 14, y1: 12, x2: 33, y2: 24 },
      { name: '西翼長廊與國庫', x1: 3, y1: 7, x2: 14, y2: 29 },
      { name: '東翼長廊', x1: 33, y1: 7, x2: 44, y2: 29 },
      { name: '北城門大道', x1: 15, y1: 0, x2: 32, y2: 11 }
    ],
    triggers: [
      {
        id: 'yongzheng_emperor',
        kind: 'npc',
        label: '雍正皇帝',
        tileX: 23,
        tileY: 16,
        spriteKey: 'char_yongzheng_emperor',
        facing: 'down'
      },
      {
        id: 'treasury_clue',
        kind: 'clue',
        label: '國庫線索',
        tileX: 7,
        tileY: 25
      },
      {
        id: 'corrupt_a',
        kind: 'npc',
        label: '貪官甲',
        tileX: 9,
        tileY: 25,
        spriteKey: 'char_corrupt_a',
        facing: 'left'
      },
      {
        id: 'corrupt_b',
        kind: 'npc',
        label: '貪官乙',
        tileX: 39,
        tileY: 25,
        spriteKey: 'char_corrupt_b',
        facing: 'up'
      },
      {
        id: 'whack_station',
        kind: 'minigame',
        label: '打擊貪官挑戰',
        tileX: 39,
        tileY: 11,
        minigameId: 'whack_game',
        sceneKey: 'WhackMinigame'
      },
      {
        id: 'south_moongate_note',
        kind: 'decor_note',
        label: '南面月門',
        tileX: 23,
        tileY: 34,
        decorMessage: '這是庭院裝飾月門，並非出口。請往北面城門離開。'
      },
      {
        id: 'yongzheng_exit',
        kind: 'exit',
        label: '北城門（出口）',
        tileX: 23,
        tileY: 1
      }
    ]
  };
}
function buildQianlongMap(): StageMapData {
  const cols = 54;
  const rows = 38;
  const ground = createGrid<number>(cols, rows, TileIndex.GRASS_A);
  const shadow = createGrid(cols, rows, false);
  const deco = createGrid<number>(cols, rows, TileIndex.EMPTY);
  const solid = createGrid(cols, rows, false);
  const roof = createGrid<number>(cols, rows, TileIndex.EMPTY);
  const props: MapPropPlacement[] = [];
  // 1. 全境鋪設純淨無縫江南綠草地（無泥塊碎斑）
  fillVariedGround(ground, 0, 0, cols - 1, rows - 1, GRASS_VARIANTS);
  for (let x = 0; x < cols; x++) {
    if (x < 43) {
      deco[0][x] = TileIndex.PINE_TRUNK;
    }
    solid[0][x] = true;
    solid[rows - 1][x] = true;
  }
  for (let y = 0; y < rows; y++) {
    deco[y][0] = TileIndex.PINE_TRUNK;
    solid[y][0] = true;
    solid[y][cols - 1] = true;
  }
  // 2. 東側與南側碧海河灣（配岸石與菖蒲水草柔化河岸邊界）
  fillRect(ground, 43, 1, 53, 37, TileIndex.WATER_1);
  fillRect(solid, 43, 1, 53, 37, true);
  fillRect(ground, 22, 33, 53, 37, TileIndex.WATER_1);
  fillRect(ground, 22, 33, 42, 33, TileIndex.WATER_BANK_TOP);
  fillRect(solid, 22, 33, 53, 37, true);
  props.push(
    { frame: 'jiangnan_rocks_a', tileX: 24.5, tileY: 33.2, layer: 'ground_decor' },
    { frame: 'jiangnan_rocks_b', tileX: 34.5, tileY: 33.2, layer: 'ground_decor' },
    { frame: 'jiangnan_rocks_a', tileX: 43.2, tileY: 11.5, layer: 'ground_decor' },
    { frame: 'jiangnan_rocks_b', tileX: 43.2, tileY: 27.5, layer: 'ground_decor' },
    { frame: 'pond_reeds_a', tileX: 22.8, tileY: 33.3, layer: 'building' },
    { frame: 'pond_reeds_b', tileX: 30.2, tileY: 33.3, layer: 'building' },
    { frame: 'pond_reeds_a', tileX: 43.2, tileY: 7.5, layer: 'building' },
    { frame: 'pond_reeds_b', tileX: 43.2, tileY: 31.2, layer: 'building' }
  );
  // 3. 江南沿岸青石板路與自然不規則鄉村小屋（配側廂披簷、門前踏步石、竹籬笆、屋角灌木與旁側綠樹遮擋硬角）
  fillVariedGround(ground, 39, 4, 42, 32, STONE_PAVING_VARIANTS);
  fillRect(solid, 39, 4, 42, 32, false);
  fillVariedGround(ground, 22, 30, 42, 32, STONE_PAVING_VARIANTS);
  fillRect(solid, 22, 30, 42, 32, false);
  fillRect(solid, 35, 19, 38, 20, true);
  fillRect(roof, 35, 19, 38, 19, ExtraTileIndex.INVISIBLE_ROOF_MARKER);
  props.push(
    {
      frame: 'jiangnan_white_house',
      tileX: 36.75,
      tileY: 19.3,
      layer: 'building'
    },
    {
      frame: 'cottage_stepping_stones',
      tileX: 36.4,
      tileY: 20.9,
      layer: 'ground_decor'
    },
    {
      frame: 'rustic_bamboo_fence',
      tileX: 33.8,
      tileY: 20.35,
      layer: 'building'
    },
    {
      frame: 'jiangnan_shrub_a',
      tileX: 34.7,
      tileY: 20.3,
      layer: 'building'
    },
    {
      frame: 'jiangnan_shrub_b',
      tileX: 38.75,
      tileY: 20.35,
      layer: 'building'
    },
    {
      frame: 'jiangnan_shrub_a',
      tileX: 38.6,
      tileY: 18.55,
      layer: 'building'
    }
  );
  // 屋後左上角種植江南綠柳，樹冠自然微遮屋脊左角，徹底打破整齊方盒輪廓
  placeWillowTree(deco, solid, roof, shadow, props, 34, 19);
  // 4. 東岸護欄、連續木棧橋碼頭與南巡護航木船
  for (let y = 6; y <= 30; y += 3) {
    if (y < 19 || y > 23) {
      deco[y][42] = TileIndex.MARBLE_BALUSTRADE_V;
      solid[y][42] = true;
    }
  }
  fillVariedGround(ground, 42, 20, 48, 22, WOOD_PIER_VARIANTS);
  fillRect(solid, 42, 20, 48, 22, false);
  deco[19][44] = TileIndex.FLEET_BANNER;
  solid[19][44] = true;
  placeStoneLantern(deco, solid, props, 46, 19);
  props.push(
    { frame: 'pier_boat_h', tileX: 46.2, tileY: 16.4, layer: 'building' },
    { frame: 'pier_boat_h', tileX: 45.8, tileY: 25.4, flipX: true, layer: 'building' },
    { frame: 'pier_boat_v', tileX: 44.2, tileY: 28.8, layer: 'building' },
    // Extra escort fleet (do not cover pier walkway 42–48,20–22 or boarding boat)
    { frame: 'pier_boat_h', tileX: 48.6, tileY: 14.6, scale: 0.92, layer: 'building' },
    { frame: 'pier_boat_h', tileX: 49.2, tileY: 27.2, flipX: true, scale: 0.9, layer: 'building' },
    { frame: 'pier_boat_v', tileX: 47.4, tileY: 30.6, scale: 0.95, layer: 'building' },
    { frame: 'pier_boat_h', tileX: 50.8, tileY: 15.8, flipX: true, scale: 0.85, layer: 'building' },
    { frame: 'pier_boat_v', tileX: 51.4, tileY: 28.4, scale: 0.88, layer: 'building' },
    { frame: 'pier_boat_h', tileX: 48.2, tileY: 31.4, scale: 0.86, layer: 'building' }
  );
  // 六下江南挑戰牌坊加立體飛簷頂蓋，消除平頂方柱感
  deco[28][36] = TileIndex.TOUR_ARCHWAY_L;
  deco[28][37] = TileIndex.TOUR_ARCHWAY_R;
  deco[28][38] = TileIndex.MINIGAME_TABLE;
  solid[28][36] = true;
  solid[28][37] = true;
  solid[28][38] = true;
  props.push(
    { frame: 'palace_pillar_b', tileX: 36, tileY: 27.85, layer: 'building' },
    { frame: 'palace_pillar_b', tileX: 37, tileY: 27.85, flipX: true, layer: 'building' },
    { frame: 'palace_side_roof', tileX: 36.5, tileY: 26.9, layer: 'canopy' }
  );
  // 5. 西北區：準噶爾平亂校場軍營（純淨無縫黃沙地，外角略作自然內縮避免生硬大方塊）
  fillVariedGround(ground, 2, 2, 19, 15, SAND_VARIANTS);
  fillVariedGround(ground, 19, 14, 19, 15, GRASS_VARIANTS);
  for (const [tx, ty] of [
    [4, 4],
    [9, 4],
    [4, 10]
  ]) {
    deco[ty][tx] = TileIndex.ARMY_TENT_LEFT;
    deco[ty][tx + 1] = TileIndex.ARMY_TENT_RIGHT;
    solid[ty][tx] = true;
    solid[ty][tx + 1] = true;
  }
  props.push(
    { frame: 'camp_tent_large', tileX: 4.5, tileY: 3.8, layer: 'building' },
    { frame: 'camp_tent_open', tileX: 9.5, tileY: 3.9, layer: 'building' },
    { frame: 'camp_tent_large', tileX: 4.5, tileY: 9.8, layer: 'building' },
    { frame: 'camp_cannon', tileX: 13, tileY: 12, layer: 'building' },
    { frame: 'camp_palisade', tileX: 4.5, tileY: 14.8, layer: 'building' },
    { frame: 'camp_palisade', tileX: 15.5, tileY: 14.8, layer: 'building' },
    { frame: 'camp_crate', tileX: 7, tileY: 4.2, layer: 'building' }
  );
  solid[12][13] = true;
  deco[10][8] = TileIndex.WEAPON_RACK;
  deco[10][12] = TileIndex.FLEET_BANNER;
  solid[10][8] = true;
  solid[10][12] = true;
  deco[5][14] = TileIndex.ARCHERY_TARGET;
  deco[5][16] = TileIndex.ARCHERY_TARGET;
  deco[5][18] = TileIndex.ARCHERY_TARGET;
  solid[5][14] = true;
  solid[5][16] = true;
  solid[5][18] = true;
  deco[6][15] = TileIndex.MINIGAME_TABLE;
  solid[6][15] = true;
  // 6. 中北區：乾隆御駕行宮高台
  fillVariedGround(ground, 22, 6, 30, 13, MARBLE_VARIANTS);
  buildPalaceFacade(deco, solid, roof, props, 22, 2, 30, 25);
  deco[7][23] = TileIndex.BRONZE_INCENSE;
  deco[7][29] = TileIndex.BRONZE_INCENSE;
  solid[7][23] = true;
  solid[7][29] = true;
  // 7. 東北內院：和珅府邸（加轉角抱柱、飛簷翹角、門洞抱鼓石與院外灌木，消除紅磚方框感）
  placePerimeterWall(deco, solid, 32, 5, 38, 13);
  fillVariedGround(ground, 33, 6, 37, 12, HALL_FLOOR_VARIANTS);
  carveOpening(deco, solid, 34, 13, 36, 13);
  frameWallGatewayH(props, 34, 36, 13, true);
  props.push(
    { frame: 'palace_side_roof', tileX: 35, tileY: 4.8, layer: 'canopy' },
    { frame: 'palace_eave_cap_l', tileX: 31.9, tileY: 5.1, layer: 'canopy' },
    { frame: 'palace_eave_cap_r', tileX: 38.1, tileY: 5.1, layer: 'canopy' },
    { frame: 'palace_corner_pilaster', tileX: 32, tileY: 12.9, layer: 'building' },
    { frame: 'palace_corner_pilaster', tileX: 38, tileY: 12.9, flipX: true, layer: 'building' },
    { frame: 'jiangnan_shrub_a', tileX: 32.4, tileY: 13.55, layer: 'building' },
    { frame: 'jiangnan_shrub_b', tileX: 37.6, tileY: 13.55, layer: 'building' }
  );
  deco[7][34] = TileIndex.TREASURY_CHEST;
  deco[7][36] = TileIndex.TREASURY_CHEST;
  deco[8][33] = TileIndex.TAIHU_ROCK;
  solid[7][34] = true;
  solid[7][36] = true;
  solid[8][33] = true;
  // 8. 西南區旱田與純淨無縫黃土幹道（削去旱田外圍死板直角並配竹籬與灌木，田埂由 softenGroundTransitions 自動鋪設）
  fillVariedGround(ground, 3, 20, 21, 34, FARMLAND_VARIANTS);
  // 讓農田四角略呈自然不規則階梯，不再是完美長方形切塊
  fillVariedGround(ground, 3, 20, 4, 20, GRASS_VARIANTS);
  fillVariedGround(ground, 20, 20, 21, 21, GRASS_VARIANTS);
  fillVariedGround(ground, 3, 34, 5, 34, GRASS_VARIANTS);
  fillVariedGround(ground, 19, 33, 21, 34, GRASS_VARIANTS);
  fillVariedGround(ground, 10, 19, 13, 33, DIRT_PATH_VARIANTS);
  fillVariedGround(ground, 3, 26, 24, 28, DIRT_PATH_VARIANTS);
  fillVariedGround(ground, 4, 16, 38, 18, DIRT_PATH_VARIANTS);
  fillVariedGround(ground, 24, 13, 27, 30, DIRT_PATH_VARIANTS);
  props.push(
    { frame: 'rustic_bamboo_fence', tileX: 6.2, tileY: 19.65, layer: 'building' },
    { frame: 'jiangnan_shrub_b', tileX: 4.5, tileY: 19.75, layer: 'building' },
    { frame: 'jiangnan_shrub_a', tileX: 18.6, tileY: 19.75, layer: 'building' },
    { frame: 'rustic_bamboo_fence', tileX: 16.5, tileY: 34.35, layer: 'building' }
  );
  // 9. 無方框乾淨去背江南林木點綴
  for (const [wx, wy] of [
    [38, 15],
    [38, 25],
    [31, 29],
    [23, 29],
    [29, 21],
    [21, 15]
  ]) {
    placeWillowTree(deco, solid, roof, shadow, props, wx, wy);
  }
  placePineTree(deco, solid, roof, shadow, props, 2, 18);
  placePineTree(deco, solid, roof, shadow, props, 31, 15);
  softenGroundTransitions(ground, deco, solid, props);
  computeWallShadows(ground, deco, solid, shadow);
  return {
    cols,
    rows,
    spawnX: 26,
    spawnY: 16,
    ground,
    shadow,
    deco,
    solid,
    roof,
    props,
    boatPosition: { tileX: 50, tileY: 21 },
    zones: [
      { name: '西北校場軍營', x1: 1, y1: 1, x2: 20, y2: 15 },
      { name: '御駕行營與官邸', x1: 21, y1: 1, x2: 38, y2: 15 },
      { name: '旱裂農田', x1: 1, y1: 19, x2: 23, y2: 36 },
      { name: '海岸長路', x1: 37, y1: 4, x2: 42, y2: 33 },
      { name: '東岸碼頭與御船', x1: 42, y1: 17, x2: 53, y2: 25 }
    ],
    triggers: [
      {
        id: 'qianlong_emperor',
        kind: 'npc',
        label: '乾隆皇帝',
        tileX: 26,
        tileY: 8,
        spriteKey: 'char_qianlong_emperor',
        facing: 'down'
      },
      {
        id: 'qing_soldier',
        kind: 'npc',
        label: '清兵',
        tileX: 10,
        tileY: 9,
        spriteKey: 'char_qing_soldier',
        facing: 'down'
      },
      {
        id: 'archery_station',
        kind: 'minigame',
        label: '射箭平亂挑戰',
        tileX: 15,
        tileY: 6,
        minigameId: 'archery_game',
        sceneKey: 'ArcheryMinigame'
      },
      {
        id: 'heshen',
        kind: 'npc',
        label: '和珅',
        tileX: 35,
        tileY: 9,
        spriteKey: 'char_heshen',
        facing: 'down'
      },
      {
        id: 'farmer',
        kind: 'npc',
        label: '農夫',
        tileX: 12,
        tileY: 25,
        spriteKey: 'char_farmer',
        facing: 'down'
      },
      {
        id: 'tour_station',
        kind: 'minigame',
        label: '六下江南挑戰',
        tileX: 38,
        tileY: 28,
        minigameId: 'tour_game',
        sceneKey: 'SouthernTourMinigame'
      },
      {
        id: 'southern_fleet',
        kind: 'clue',
        label: '南巡船隊',
        tileX: 44,
        tileY: 20
      },
      {
        id: 'qianlong_exit',
        kind: 'exit',
        label: '登上御船',
        tileX: 48,
        tileY: 21
      }
    ]
  };
}
