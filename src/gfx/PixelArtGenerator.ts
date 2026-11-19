import Phaser from 'phaser';

export const TILE_SIZE = 24;

export const CHAR_IDLE_FRAME = {
  down: 1,
  left: 5,
  right: 9,
  up: 13
} as const;

export enum TileIndex {
  EMPTY = 0,
  COURTYARD_BRICK_A = 1,
  COURTYARD_BRICK_B = 2,
  COURTYARD_BRICK_C = 3,
  MARBLE_PATH_A = 4,
  MARBLE_PATH_B = 5,
  MARBLE_DRAGON_CARVING = 6,
  MARBLE_STAIR = 7,
  GRASS_A = 8,
  GRASS_B = 9,
  GRASS_FLOWER = 10,
  SAND_A = 11,
  SAND_B = 12,
  DRY_FARMLAND_A = 13,
  DRY_FARMLAND_B = 14,
  DIRT_PATH_A = 15,
  DIRT_PATH_B = 16,
  HALL_GOLD_BRICK_A = 17,
  HALL_GOLD_BRICK_B = 18,
  RED_CARPET_CENTER = 19,
  STONE_PAVING = 20,
  WATER_1 = 21,
  WATER_2 = 22,
  WATER_3 = 23,
  WATER_BANK_TOP = 24,
  LOTUS_LEAF = 25,
  LOTUS_FLOWER = 26,
  STONE_BRIDGE_DECK = 27,
  MARBLE_BALUSTRADE_H = 28,
  MARBLE_BALUSTRADE_V = 29,
  WOOD_PIER = 30,
  TERRACE_BASE = 31,
  RED_WALL_BASE = 32,
  RED_WALL_MID = 33,
  RED_WALL_FRIEZE = 34,
  PALACE_WINDOW = 35,
  GATE_DOOR_LEFT = 36,
  GATE_DOOR_RIGHT = 37,
  MOON_GATE = 38,
  ROOF_GOLD_SLOPE = 39,
  ROOF_GOLD_RIDGE = 40,
  ROOF_EAVE_GOLD = 41,
  WHITE_WALL_WINDOW = 42,
  DARK_ROOF_SLOPE = 43,
  DARK_ROOF_EAVE = 44,
  RED_PILLAR = 45,
  PINE_TRUNK = 46,
  PINE_CANOPY = 47,
  WILLOW_TRUNK = 48,
  WILLOW_CANOPY = 49,
  BRONZE_INCENSE = 50,
  LANTERN_POST = 51,
  TREASURY_CHEST = 52,
  MINIGAME_TABLE = 53,
  EMPEROR_THRONE_DESK = 54,
  EMPEROR_SCREEN = 55,
  ARCHERY_TARGET = 56,
  ARMY_TENT_LEFT = 57,
  ARMY_TENT_RIGHT = 58,
  WEAPON_RACK = 59,
  FLEET_BANNER = 60,
  TOUR_ARCHWAY_L = 61,
  TOUR_ARCHWAY_R = 62,
  TAIHU_ROCK = 63
}

type HeadwearStyle = 'student' | 'court' | 'scholar' | 'farmer';

interface CharPalette {
  headwear: HeadwearStyle;
  hatMain: string;
  hatTrim: string;
  finial?: string;
  tassel?: string;
  skin: string;
  skinShadow: string;
  robeMain: string;
  robeShade: string;
  robeTrim: string;
  cuff: string;
  belt: string;
  badgeColor?: string;
  necklace?: string;
  beard?: string;
  soleColor: string;
}

const CHAR_PALETTES: Record<string, CharPalette> = {
  student: {
    headwear: 'student',
    hatMain: '#241c18',
    hatTrim: '#3d302a',
    skin: '#f7d2ab',
    skinShadow: '#dfa97a',
    robeMain: '#2d5c88',
    robeShade: '#1f4263',
    robeTrim: '#f2f5f7',
    cuff: '#f2f5f7',
    belt: '#1c2d3d',
    soleColor: '#dce3e8'
  },
  kangxi_emperor: {
    headwear: 'court',
    hatMain: '#2b1d19',
    hatTrim: '#d93829',
    finial: '#ffe066',
    tassel: '#e63929',
    skin: '#f6d1aa',
    skinShadow: '#dea97b',
    robeMain: '#f2b929',
    robeShade: '#c78c14',
    robeTrim: '#234a75',
    cuff: '#1e3f66',
    belt: '#245282',
    badgeColor: '#fff099',
    necklace: '#5c2c16',
    soleColor: '#f5f2eb'
  },
  yongzheng_emperor: {
    headwear: 'court',
    hatMain: '#291b17',
    hatTrim: '#cf3223',
    finial: '#ffe066',
    tassel: '#e63929',
    skin: '#f2ca9f',
    skinShadow: '#d6a072',
    robeMain: '#e8ab20',
    robeShade: '#b87b10',
    robeTrim: '#1c3e63',
    cuff: '#183554',
    belt: '#1e4670',
    badgeColor: '#ffe885',
    necklace: '#4f2412',
    beard: '#2b201b',
    soleColor: '#f5f2eb'
  },
  qianlong_emperor: {
    headwear: 'court',
    hatMain: '#2e1e19',
    hatTrim: '#e03b2b',
    finial: '#ffe680',
    tassel: '#f04333',
    skin: '#f5cea6',
    skinShadow: '#dba576',
    robeMain: '#f5c236',
    robeShade: '#c98d16',
    robeTrim: '#224b78',
    cuff: '#1d4066',
    belt: '#265382',
    badgeColor: '#fff2a6',
    necklace: '#612a15',
    beard: '#e3ded6',
    soleColor: '#f5f2eb'
  },
  manchu_person: {
    headwear: 'court',
    hatMain: '#232736',
    hatTrim: '#c93429',
    finial: '#47b098',
    tassel: '#d93629',
    skin: '#f3cca2',
    skinShadow: '#d9a475',
    robeMain: '#263e63',
    robeShade: '#192b47',
    robeTrim: '#5278ad',
    cuff: '#3d5e8c',
    belt: '#d1a138',
    badgeColor: '#e8c458',
    necklace: '#754b24',
    soleColor: '#f0ede4'
  },
  han_person: {
    headwear: 'scholar',
    hatMain: '#283645',
    hatTrim: '#4c6278',
    skin: '#f5cfa6',
    skinShadow: '#dba676',
    robeMain: '#5a8773',
    robeShade: '#3f6353',
    robeTrim: '#e3ede8',
    cuff: '#dce8e1',
    belt: '#2f4d3f',
    soleColor: '#ebe6dc'
  },
  corrupt_a: {
    headwear: 'court',
    hatMain: '#241f29',
    hatTrim: '#a82c22',
    finial: '#d9a636',
    tassel: '#b82b21',
    skin: '#e8c096',
    skinShadow: '#c9986b',
    robeMain: '#4a385c',
    robeShade: '#322440',
    robeTrim: '#7a5c94',
    cuff: '#322440',
    belt: '#9c7c38',
    badgeColor: '#cfa64a',
    beard: '#362a24',
    soleColor: '#e6e1d6'
  },
  corrupt_b: {
    headwear: 'court',
    hatMain: '#26201e',
    hatTrim: '#a82c22',
    finial: '#d9a636',
    tassel: '#b82b21',
    skin: '#e3ba90',
    skinShadow: '#c49366',
    robeMain: '#5c4136',
    robeShade: '#3f2b23',
    robeTrim: '#876354',
    cuff: '#3f2b23',
    belt: '#9c7c38',
    badgeColor: '#cfa64a',
    soleColor: '#e6e1d6'
  },
  qing_soldier: {
    headwear: 'court',
    hatMain: '#303640',
    hatTrim: '#d63327',
    finial: '#f0c048',
    tassel: '#e63b2e',
    skin: '#ebbf94',
    skinShadow: '#cc986a',
    robeMain: '#9e2920',
    robeShade: '#731b14',
    robeTrim: '#e3bc4b',
    cuff: '#292e36',
    belt: '#242930',
    badgeColor: '#ffe07d',
    soleColor: '#ded9ce'
  },
  heshen: {
    headwear: 'court',
    hatMain: '#2b1922',
    hatTrim: '#e33b2b',
    finial: '#ff4d6a',
    tassel: '#eb3d2d',
    skin: '#f7d3ad',
    skinShadow: '#dea97b',
    robeMain: '#8a2235',
    robeShade: '#611423',
    robeTrim: '#f0c854',
    cuff: '#3d1522',
    belt: '#42a888',
    badgeColor: '#ffe27a',
    necklace: '#f2e8c9',
    soleColor: '#f5f2eb'
  },
  farmer: {
    headwear: 'farmer',
    hatMain: '#cfa95b',
    hatTrim: '#9c7834',
    skin: '#dead80',
    skinShadow: '#ba8557',
    robeMain: '#5d6e7d',
    robeShade: '#424f5c',
    robeTrim: '#877259',
    cuff: '#78634c',
    belt: '#423527',
    beard: '#47392e',
    soleColor: '#bfa373'
  }
};

export class PixelArtGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    this.generateTileset(scene);
    Object.entries(CHAR_PALETTES).forEach(([key, pal]) => {
      this.generateCharacterSheet(scene, `char_${key}`, pal);
    });
    this.generateRoyalBoat(scene);
    this.generateMarkersAndProps(scene);
  }

  private static generateTileset(scene: Phaser.Scene): void {
    const S = TILE_SIZE; // 24x24 高密度原創瓷磚
    const cols = 8;
    const rows = 8;
    const canvasTex = scene.textures.createCanvas(
      'palace_tiles_raw',
      cols * S,
      rows * S
    );
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();
    ctx.imageSmoothingEnabled = false;

    const drawAt = (index: number, fn: (ox: number, oy: number) => void) => {
      const ox = (index % cols) * S;
      const oy = Math.floor(index / cols) * S;
      fn(ox, oy);
    };

    const r = (
      ox: number,
      oy: number,
      x: number,
      y: number,
      w: number,
      h: number,
      color: string
    ) => {
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, w, h);
    };

    // 青磚地面繪製輔助（3款色調微差與磚縫）
    const drawCourtyardBrick = (
      ox: number,
      oy: number,
      base: string,
      mortar: string,
      hi: string,
      tintBrick: string,
      mossSpot?: [number, number]
    ) => {
      r(ox, oy, 0, 0, 24, 24, mortar);
      const rowH = 6;
      for (let row = 0; row < 4; row++) {
        const by = row * rowH;
        const shift = (row % 2) * 6;
        for (let bx = -6; bx < 24; bx += 12) {
          const x0 = Math.max(0, bx + shift);
          const x1 = Math.min(24, bx + shift + 11);
          if (x1 > x0) {
            const c = (row + bx) % 3 === 0 ? tintBrick : base;
            r(ox, oy, x0, by, x1 - x0, 5, c);
            r(ox, oy, x0, by, Math.min(4, x1 - x0), 1, hi);
          }
        }
      }
      if (mossSpot) {
        r(ox, oy, mossSpot[0], mossSpot[1], 2, 1, '#6f8769');
        r(ox, oy, mossSpot[0] + 1, mossSpot[1] + 1, 2, 1, '#5d7557');
      }
    };

    drawAt(TileIndex.COURTYARD_BRICK_A, (ox, oy) =>
      drawCourtyardBrick(ox, oy, '#949ca0', '#70777a', '#adb5b8', '#8c9498')
    );
    drawAt(TileIndex.COURTYARD_BRICK_B, (ox, oy) =>
      drawCourtyardBrick(ox, oy, '#8f979b', '#6d7477', '#a8b0b3', '#9aa2a6', [4, 11])
    );
    drawAt(TileIndex.COURTYARD_BRICK_C, (ox, oy) =>
      drawCourtyardBrick(ox, oy, '#979fa3', '#737a7d', '#b2babe', '#8a9296', [16, 17])
    );

    // 漢白玉御道 A/B
    const drawMarble = (ox: number, oy: number, main: string, vein: string) => {
      r(ox, oy, 0, 0, 24, 24, main);
      r(ox, oy, 0, 23, 24, 1, '#c7bfb0');
      r(ox, oy, 23, 0, 1, 24, '#d1c9ba');
      r(ox, oy, 0, 11, 24, 1, '#ded7c8');
      r(ox, oy, 11, 0, 1, 11, '#ded7c8');
      r(ox, oy, 1, 1, 8, 1, '#ffffff');
      r(ox, oy, 13, 13, 7, 1, '#ffffff');
      r(ox, oy, 4, 5, 4, 1, vein);
      r(ox, oy, 15, 17, 5, 1, vein);
    };
    drawAt(TileIndex.MARBLE_PATH_A, (ox, oy) => drawMarble(ox, oy, '#efebe1', '#dfd9ca'));
    drawAt(TileIndex.MARBLE_PATH_B, (ox, oy) => drawMarble(ox, oy, '#ebe6dc', '#dad3c3'));

    // 丹陛祥雲石雕
    drawAt(TileIndex.MARBLE_DRAGON_CARVING, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#e6e0d2');
      r(ox, oy, 0, 0, 3, 24, '#f7f4ec');
      r(ox, oy, 21, 0, 3, 24, '#f7f4ec');
      r(ox, oy, 3, 0, 1, 24, '#b8b09c');
      r(ox, oy, 20, 0, 1, 24, '#b8b09c');
      // 浮雕卷雲紋
      r(ox, oy, 7, 3, 10, 3, '#f7f4ec');
      r(ox, oy, 6, 6, 12, 2, '#beb5a2');
      r(ox, oy, 8, 10, 8, 4, '#faf8f2');
      r(ox, oy, 10, 9, 4, 6, '#faf8f2');
      r(ox, oy, 8, 14, 8, 2, '#b8b09c');
      r(ox, oy, 6, 18, 12, 3, '#f7f4ec');
      r(ox, oy, 7, 21, 10, 2, '#beb5a2');
    });

    // 漢白玉四級立體石階
    drawAt(TileIndex.MARBLE_STAIR, (ox, oy) => {
      for (let i = 0; i < 4; i++) {
        const y = i * 6;
        r(ox, oy, 0, y, 24, 3, '#f5f2e9');
        r(ox, oy, 0, y, 24, 1, '#ffffff');
        r(ox, oy, 0, y + 3, 24, 2, '#cfc7b6');
        r(ox, oy, 0, y + 5, 24, 1, '#9e9685');
      }
      r(ox, oy, 0, 0, 2, 24, '#ffffff');
      r(ox, oy, 22, 0, 2, 24, '#ffffff');
    });

    // 御苑草地 A/B/野花
    const drawGrassBase = (ox: number, oy: number, c1: string, c2: string, c3: string) => {
      r(ox, oy, 0, 0, 24, 24, c1);
      const tufts = [
        [2, 3],
        [9, 2],
        [17, 5],
        [5, 11],
        [14, 10],
        [20, 14],
        [3, 19],
        [11, 18],
        [18, 20]
      ];
      for (const [tx, ty] of tufts) {
        r(ox, oy, tx, ty, 1, 2, c3);
        r(ox, oy, tx + 1, ty - 1, 1, 3, c2);
        r(ox, oy, tx + 2, ty, 1, 2, c2);
      }
    };
    drawAt(TileIndex.GRASS_A, (ox, oy) =>
      drawGrassBase(ox, oy, '#558f43', '#6dab57', '#3f7330')
    );
    drawAt(TileIndex.GRASS_B, (ox, oy) =>
      drawGrassBase(ox, oy, '#508a3e', '#68a652', '#3c6e2d')
    );
    drawAt(TileIndex.GRASS_FLOWER, (ox, oy) => {
      drawGrassBase(ox, oy, '#558f43', '#6dab57', '#3f7330');
      r(ox, oy, 6, 6, 3, 3, '#fff5cc');
      r(ox, oy, 7, 7, 1, 1, '#e89f29');
      r(ox, oy, 16, 15, 3, 3, '#ffd6e0');
      r(ox, oy, 17, 16, 1, 1, '#e05a7a');
    });

    // 校場黃沙地 A/B
    drawAt(TileIndex.SAND_A, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#d1b784');
      r(ox, oy, 2, 4, 6, 1, '#dec695');
      r(ox, oy, 12, 9, 7, 1, '#bfa26d');
      r(ox, oy, 5, 16, 8, 1, '#dec695');
      r(ox, oy, 16, 20, 4, 2, '#b59762');
    });
    drawAt(TileIndex.SAND_B, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#ccb17e');
      r(ox, oy, 4, 6, 5, 1, '#dbc291');
      r(ox, oy, 14, 13, 6, 1, '#b89a65');
      r(ox, oy, 7, 20, 3, 1, '#9e814f');
    });

    // 乾裂旱田 A/B
    const drawDryField = (ox: number, oy: number, flip: boolean) => {
      r(ox, oy, 0, 0, 24, 24, '#a67b4c');
      r(ox, oy, 0, 0, 24, 2, '#946a3d');
      const gx = flip ? 4 : 0;
      r(ox, oy, 3 + gx, 2, 1, 8, '#523418');
      r(ox, oy, 4 + gx, 9, 7, 1, '#523418');
      r(ox, oy, 10 + gx, 9, 1, 9, '#523418');
      r(ox, oy, 11, 4, 7, 1, '#5c3b1c');
      r(ox, oy, 2, 16, 8, 1, '#523418');
      r(ox, oy, 14, 18, 7, 1, '#523418');
      // 枯黃殘苗
      r(ox, oy, 6, 12, 2, 3, '#8c8a45');
      r(ox, oy, 17, 10, 2, 3, '#82803e');
    };
    drawAt(TileIndex.DRY_FARMLAND_A, (ox, oy) => drawDryField(ox, oy, false));
    drawAt(TileIndex.DRY_FARMLAND_B, (ox, oy) => drawDryField(ox, oy, true));

    // 田埂土路 A/B
    drawAt(TileIndex.DIRT_PATH_A, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#ba9665');
      r(ox, oy, 2, 3, 6, 2, '#c9a675');
      r(ox, oy, 13, 11, 7, 2, '#a68253');
      r(ox, oy, 5, 19, 5, 2, '#c9a675');
    });
    drawAt(TileIndex.DIRT_PATH_B, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#b59160');
      r(ox, oy, 4, 7, 8, 1, '#9e7b4c');
      r(ox, oy, 10, 16, 8, 2, '#c7a473');
    });

    // 大殿蘇州金磚 A/B
    const drawGoldBrick = (ox: number, oy: number, tone: string) => {
      r(ox, oy, 0, 0, 24, 24, '#4d3c28');
      r(ox, oy, 1, 1, 22, 22, tone);
      r(ox, oy, 2, 2, 10, 1, '#a6895e');
      r(ox, oy, 2, 3, 1, 8, '#9c7f54');
      r(ox, oy, 18, 19, 4, 3, '#695236');
    };
    drawAt(TileIndex.HALL_GOLD_BRICK_A, (ox, oy) => drawGoldBrick(ox, oy, '#7d6342'));
    drawAt(TileIndex.HALL_GOLD_BRICK_B, (ox, oy) => drawGoldBrick(ox, oy, '#755c3d'));

    // 宮廷織錦紅毯
    drawAt(TileIndex.RED_CARPET_CENTER, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#9e221b');
      r(ox, oy, 0, 0, 3, 24, '#e0ac38');
      r(ox, oy, 21, 0, 3, 24, '#e0ac38');
      r(ox, oy, 3, 0, 1, 24, '#6e140f');
      r(ox, oy, 20, 0, 1, 24, '#6e140f');
      r(ox, oy, 9, 8, 6, 8, '#bd2d24');
      r(ox, oy, 10, 10, 4, 4, '#f0c249');
    });

    // 江南海岸長條青石板路
    drawAt(TileIndex.STONE_PAVING, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#83898c');
      for (let row = 0; row < 3; row++) {
        const py = row * 8;
        const off = (row % 2) * 8;
        r(ox, oy, 0, py, 24, 7, '#a8aeb0');
        r(ox, oy, off + 1, py, 10, 7, '#b4babd');
        r(ox, oy, off + 11, py, 1, 7, '#7d8387');
        r(ox, oy, 1, py + 1, 8, 1, '#c9cfd1');
      }
    });

    // 三幀碧水波紋
    const drawWater = (ox: number, oy: number, shift: number) => {
      r(ox, oy, 0, 0, 24, 24, '#216878');
      r(ox, oy, 0, 4, 24, 5, '#267385');
      r(ox, oy, 0, 14, 24, 6, '#267385');
      r(ox, oy, (2 + shift) % 18, 5, 6, 1, '#6cc4d6');
      r(ox, oy, (11 + shift) % 17, 11, 5, 1, '#4da3b5');
      r(ox, oy, (6 + shift) % 16, 18, 7, 1, '#7cd1e3');
    };
    drawAt(TileIndex.WATER_1, (ox, oy) => drawWater(ox, oy, 0));
    drawAt(TileIndex.WATER_2, (ox, oy) => drawWater(ox, oy, 5));
    drawAt(TileIndex.WATER_3, (ox, oy) => drawWater(ox, oy, 10));

    // 池岸漢白玉駁岸石壁（營造池水立體深度）
    drawAt(TileIndex.WATER_BANK_TOP, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 6, '#e8e3d5');
      r(ox, oy, 0, 0, 24, 2, '#ffffff');
      r(ox, oy, 0, 6, 24, 5, '#9e9788');
      r(ox, oy, 7, 2, 1, 9, '#b8b0a0');
      r(ox, oy, 17, 2, 1, 9, '#b8b0a0');
      r(ox, oy, 0, 11, 24, 13, '#1a5261');
      r(ox, oy, 2, 14, 8, 1, '#5bb5c9');
      r(ox, oy, 13, 19, 7, 1, '#5bb5c9');
    });

    // 荷葉與盛開荷花
    drawAt(TileIndex.LOTUS_LEAF, (ox, oy) => {
      drawWater(ox, oy, 2);
      r(ox, oy, 4, 7, 16, 12, '#174957');
      r(ox, oy, 4, 5, 16, 12, '#2f7d44');
      r(ox, oy, 6, 4, 12, 13, '#3e9655');
      r(ox, oy, 11, 9, 2, 2, '#78cf8a');
      r(ox, oy, 12, 5, 1, 5, '#286939');
    });
    drawAt(TileIndex.LOTUS_FLOWER, (ox, oy) => {
      drawWater(ox, oy, 4);
      r(ox, oy, 3, 9, 18, 11, '#2f7d44');
      r(ox, oy, 5, 8, 14, 11, '#419c58');
      r(ox, oy, 7, 4, 10, 8, '#f0789a');
      r(ox, oy, 8, 3, 8, 7, '#ffa6bf');
      r(ox, oy, 10, 2, 4, 5, '#ffd9e4');
      r(ox, oy, 11, 6, 2, 2, '#f5c542');
    });

    // 石拱橋橋面
    drawAt(TileIndex.STONE_BRIDGE_DECK, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#bdb9ae');
      for (let y = 0; y < 24; y += 6) {
        r(ox, oy, 0, y, 24, 5, '#cfcbc0');
        r(ox, oy, 2, y + 1, 20, 1, '#e3dfd5');
        r(ox, oy, 0, y + 5, 24, 1, '#8c887e');
      }
    });

    // 橫向與縱向漢白玉雕花欄杆
    drawAt(TileIndex.MARBLE_BALUSTRADE_H, (ox, oy) => {
      r(ox, oy, 0, 18, 24, 6, 'rgba(0,0,0,0.22)');
      r(ox, oy, 0, 7, 24, 3, '#ffffff');
      r(ox, oy, 0, 10, 24, 8, '#e3ded1');
      r(ox, oy, 1, 3, 5, 16, '#f7f5ef');
      r(ox, oy, 2, 1, 3, 3, '#ffffff');
      r(ox, oy, 18, 3, 5, 16, '#f7f5ef');
      r(ox, oy, 19, 1, 3, 3, '#ffffff');
      r(ox, oy, 8, 11, 8, 5, '#9e9889');
      r(ox, oy, 10, 12, 4, 3, '#ebe6da');
    });
    drawAt(TileIndex.MARBLE_BALUSTRADE_V, (ox, oy) => {
      r(ox, oy, 6, 0, 12, 24, '#dcd6c8');
      r(ox, oy, 8, 0, 8, 24, '#f7f4ec');
      r(ox, oy, 9, 0, 3, 24, '#ffffff');
      r(ox, oy, 7, 2, 10, 5, '#ffffff');
      r(ox, oy, 7, 16, 10, 5, '#ffffff');
      r(ox, oy, 16, 2, 3, 22, 'rgba(0,0,0,0.2)');
    });

    // 碼頭木棧板
    drawAt(TileIndex.WOOD_PIER, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#4a2e18');
      for (let x = 0; x < 24; x += 6) {
        r(ox, oy, x, 0, 5, 24, '#966238');
        r(ox, oy, x + 1, 0, 2, 24, '#ab7244');
        r(ox, oy, x + 1, 3, 1, 2, '#3b2310');
        r(ox, oy, x + 3, 19, 1, 2, '#3b2310');
      }
      r(ox, oy, 0, 0, 24, 2, '#b87e4d');
      r(ox, oy, 0, 22, 24, 2, '#694121');
    });

    // 漢白玉須彌座台基
    drawAt(TileIndex.TERRACE_BASE, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 5, '#ffffff');
      r(ox, oy, 0, 5, 24, 4, '#d9d2c3');
      r(ox, oy, 0, 9, 24, 6, '#b8b09e');
      for (let x = 2; x < 22; x += 6) {
        r(ox, oy, x, 10, 4, 4, '#ebe6da');
      }
      r(ox, oy, 0, 15, 24, 6, '#e6e1d3');
      r(ox, oy, 0, 21, 24, 3, '#8c8577');
    });

    // 紫禁紅牆（下段石裙、中段磚紋、上段和璽彩畫額枋）
    const drawRedBrickWall = (ox: number, oy: number) => {
      r(ox, oy, 0, 0, 24, 24, '#96261e');
      for (let y = 0; y < 24; y += 6) {
        r(ox, oy, 0, y + 5, 24, 1, '#7a1c15');
        const off = (y % 12 === 0 ? 0 : 6);
        r(ox, oy, off + 5, y, 1, 5, '#821f18');
        r(ox, oy, off + 17, y, 1, 5, '#821f18');
        r(ox, oy, off + 1, y + 1, 4, 1, '#ab3229');
      }
    };
    drawAt(TileIndex.RED_WALL_BASE, (ox, oy) => {
      drawRedBrickWall(ox, oy);
      r(ox, oy, 0, 17, 24, 2, '#ffffff');
      r(ox, oy, 0, 19, 24, 5, '#d6d0c2');
      r(ox, oy, 11, 19, 1, 5, '#aba495');
    });
    drawAt(TileIndex.RED_WALL_MID, (ox, oy) => {
      drawRedBrickWall(ox, oy);
    });
    drawAt(TileIndex.RED_WALL_FRIEZE, (ox, oy) => {
      drawRedBrickWall(ox, oy);
      r(ox, oy, 0, 0, 24, 4, '#d99e26');
      r(ox, oy, 0, 4, 24, 5, '#1e634d');
      r(ox, oy, 0, 9, 24, 4, '#264b78');
      for (let x = 2; x < 22; x += 6) {
        r(ox, oy, x, 5, 4, 3, '#f2c649');
        r(ox, oy, x + 1, 9, 2, 3, '#67bf9f');
      }
      r(ox, oy, 0, 13, 24, 2, '#5c140e');
    });

    // 雕花隔扇檻窗
    drawAt(TileIndex.PALACE_WINDOW, (ox, oy) => {
      drawRedBrickWall(ox, oy);
      r(ox, oy, 3, 2, 18, 20, '#691610');
      r(ox, oy, 4, 3, 16, 18, '#c9382c');
      r(ox, oy, 6, 5, 12, 14, '#fff2cc');
      // 步步錦金木窗櫺
      for (let x = 8; x <= 16; x += 4) {
        r(ox, oy, x, 5, 1, 14, '#b8761b');
      }
      for (let y = 8; y <= 16; y += 4) {
        r(ox, oy, 6, y, 12, 1, '#b8761b');
      }
      r(ox, oy, 3, 20, 18, 2, '#e3ddd0');
    });

    // 朱紅鎏金門釘宮門（左右對開）
    const drawGateDoor = (ox: number, oy: number, isLeft: boolean) => {
      r(ox, oy, 0, 0, 24, 24, '#8c1f17');
      r(ox, oy, 2, 0, 20, 24, '#a62920');
      if (isLeft) {
        r(ox, oy, 0, 0, 3, 24, '#6b140e');
        r(ox, oy, 22, 0, 2, 24, '#470c08');
      } else {
        r(ox, oy, 21, 0, 3, 24, '#6b140e');
        r(ox, oy, 0, 0, 2, 24, '#470c08');
      }
      // 九路鎏金門釘
      for (let dy = 3; dy <= 15; dy += 4) {
        for (let dx = 5; dx <= 17; dx += 4) {
          r(ox, oy, dx, dy, 2, 2, '#ffd559');
        }
      }
      // 銅鋪首門環
      const kx = isLeft ? 17 : 4;
      r(ox, oy, kx, 17, 4, 4, '#e6b235');
      r(ox, oy, kx + 1, 19, 2, 3, '#734f0d');
    };
    drawAt(TileIndex.GATE_DOOR_LEFT, (ox, oy) => drawGateDoor(ox, oy, true));
    drawAt(TileIndex.GATE_DOOR_RIGHT, (ox, oy) => drawGateDoor(ox, oy, false));

    // 圓洞月門
    drawAt(TileIndex.MOON_GATE, (ox, oy) => {
      drawRedBrickWall(ox, oy);
      r(ox, oy, 4, 2, 16, 22, '#e8e2d5');
      r(ox, oy, 6, 4, 12, 20, '#3d5943');
      r(ox, oy, 8, 6, 8, 18, '#588260');
      r(ox, oy, 10, 10, 4, 6, '#7cb086');
    });

    // 黃琉璃瓦坡面、正脊與重檐飛檐
    drawAt(TileIndex.ROOF_GOLD_SLOPE, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#b87c14');
      for (let x = 0; x < 24; x += 6) {
        r(ox, oy, x, 0, 3, 24, '#f2be42');
        r(ox, oy, x + 1, 0, 1, 24, '#ffe285');
        r(ox, oy, x + 3, 0, 2, 24, '#cf911d');
        r(ox, oy, x + 5, 0, 1, 24, '#8f5c0a');
        for (let y = 5; y < 24; y += 6) {
          r(ox, oy, x + 3, y, 2, 1, '#9e680e');
        }
      }
    });
    drawAt(TileIndex.ROOF_GOLD_RIDGE, (ox, oy) => {
      r(ox, oy, 0, 8, 24, 16, '#b87c14');
      for (let x = 0; x < 24; x += 6) {
        r(ox, oy, x, 8, 3, 16, '#f2be42');
        r(ox, oy, x + 1, 8, 1, 16, '#ffe285');
      }
      r(ox, oy, 0, 2, 24, 5, '#ffd866');
      r(ox, oy, 0, 0, 24, 2, '#fff2b3');
      r(ox, oy, 0, 7, 24, 2, '#7d4d08');
      r(ox, oy, 10, 3, 4, 3, '#d9951c');
    });
    drawAt(TileIndex.ROOF_EAVE_GOLD, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 12, '#cf911d');
      for (let x = 0; x < 24; x += 6) {
        r(ox, oy, x, 0, 3, 13, '#f7c84d');
        r(ox, oy, x + 1, 0, 1, 12, '#ffe694');
        r(ox, oy, x, 13, 3, 2, '#e3a629');
      }
      r(ox, oy, 0, 14, 24, 4, '#1d664f');
      r(ox, oy, 0, 18, 24, 3, '#254873');
      r(ox, oy, 0, 21, 24, 3, 'rgba(0,0,0,0.32)');
    });

    // 江南粉牆黛瓦建築組件
    drawAt(TileIndex.WHITE_WALL_WINDOW, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 20, '#f2efe9');
      r(ox, oy, 0, 20, 24, 4, '#7c8285');
      r(ox, oy, 5, 4, 14, 12, '#4a382b');
      r(ox, oy, 7, 6, 10, 8, '#d9d2c5');
      r(ox, oy, 11, 6, 2, 8, '#4a382b');
      r(ox, oy, 7, 9, 10, 2, '#4a382b');
    });
    drawAt(TileIndex.DARK_ROOF_SLOPE, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 24, '#39424a');
      for (let x = 0; x < 24; x += 4) {
        r(ox, oy, x, 0, 2, 24, '#505c66');
        for (let y = 3; y < 24; y += 5) {
          r(ox, oy, x, y, 4, 1, '#262d33');
        }
      }
      r(ox, oy, 0, 0, 24, 3, '#697682');
    });
    drawAt(TileIndex.DARK_ROOF_EAVE, (ox, oy) => {
      r(ox, oy, 0, 0, 24, 13, '#465159');
      for (let x = 0; x < 24; x += 4) {
        r(ox, oy, x, 0, 2, 14, '#5e6b75');
      }
      r(ox, oy, 0, 14, 24, 4, '#59402e');
      r(ox, oy, 0, 18, 24, 3, 'rgba(0,0,0,0.28)');
    });

    // 朱紅蟠龍大殿巨柱
    drawAt(TileIndex.RED_PILLAR, (ox, oy) => {
      r(ox, oy, 3, 19, 18, 5, '#e8e3d5');
      r(ox, oy, 5, 18, 14, 2, '#ffffff');
      r(ox, oy, 6, 0, 12, 19, '#941f17');
      r(ox, oy, 8, 0, 5, 19, '#cf382d');
      r(ox, oy, 9, 0, 2, 19, '#e65347');
      r(ox, oy, 6, 3, 12, 3, '#f0be42');
      r(ox, oy, 7, 10, 10, 2, '#e6b235');
    });

    // 古松樹幹與針葉樹冠（上下雙層）
    drawAt(TileIndex.PINE_TRUNK, (ox, oy) => {
      r(ox, oy, 3, 17, 18, 6, 'rgba(0,0,0,0.24)');
      r(ox, oy, 8, 2, 8, 19, '#4f321b');
      r(ox, oy, 9, 2, 3, 18, '#6e4728');
      r(ox, oy, 6, 18, 12, 3, '#3d2513');
      r(ox, oy, 3, 0, 18, 7, '#215230');
      r(ox, oy, 5, 0, 14, 5, '#2e6b3f');
    });
    drawAt(TileIndex.PINE_CANOPY, (ox, oy) => {
      r(ox, oy, 1, 9, 22, 14, '#1d4729');
      r(ox, oy, 2, 6, 20, 14, '#29633a');
      r(ox, oy, 4, 2, 16, 12, '#387d4c');
      r(ox, oy, 7, 1, 10, 6, '#4d9c63');
    });

    // 江南垂柳樹幹與柳絲冠
    drawAt(TileIndex.WILLOW_TRUNK, (ox, oy) => {
      r(ox, oy, 4, 18, 16, 5, 'rgba(0,0,0,0.22)');
      r(ox, oy, 9, 4, 6, 17, '#5e3f26');
      r(ox, oy, 10, 4, 2, 16, '#7a5435');
      for (let x = 3; x <= 19; x += 4) {
        r(ox, oy, x, 0, 2, 12, '#5ca349');
        r(ox, oy, x + 1, 2, 1, 12, '#78c462');
      }
    });
    drawAt(TileIndex.WILLOW_CANOPY, (ox, oy) => {
      r(ox, oy, 2, 4, 20, 18, '#468736');
      r(ox, oy, 3, 2, 18, 14, '#5da64b');
      r(ox, oy, 6, 1, 12, 8, '#7ad962');
      for (let x = 3; x <= 19; x += 4) {
        r(ox, oy, x, 12, 2, 12, '#6ebf58');
      }
    });

    // 宮廷鎏金銅香爐
    drawAt(TileIndex.BRONZE_INCENSE, (ox, oy) => {
      r(ox, oy, 4, 19, 16, 4, 'rgba(0,0,0,0.25)');
      r(ox, oy, 6, 18, 12, 4, '#d9d3c4');
      r(ox, oy, 7, 14, 2, 5, '#8c6520');
      r(ox, oy, 15, 14, 2, 5, '#8c6520');
      r(ox, oy, 5, 7, 14, 8, '#b88628');
      r(ox, oy, 7, 8, 10, 6, '#e0ac3d');
      r(ox, oy, 3, 6, 2, 5, '#d19b2e');
      r(ox, oy, 19, 6, 2, 5, '#d19b2e');
      r(ox, oy, 8, 4, 8, 3, '#f2c657');
      r(ox, oy, 11, 1, 2, 3, 'rgba(240,240,245,0.7)');
    });

    // 宮燈立柱
    drawAt(TileIndex.LANTERN_POST, (ox, oy) => {
      r(ox, oy, 6, 20, 12, 3, '#dcd6c8');
      r(ox, oy, 10, 9, 4, 12, '#692219');
      r(ox, oy, 5, 3, 14, 8, '#d93025');
      r(ox, oy, 7, 4, 10, 6, '#ffdf75');
      r(ox, oy, 9, 5, 6, 4, '#fff8cc');
      r(ox, oy, 4, 1, 16, 2, '#3b2416');
      r(ox, oy, 8, 11, 8, 2, '#f0bc3e');
    });

    // 戶部國庫官銀大箱
    drawAt(TileIndex.TREASURY_CHEST, (ox, oy) => {
      r(ox, oy, 2, 19, 20, 4, 'rgba(0,0,0,0.28)');
      r(ox, oy, 2, 7, 20, 14, '#6e3b1b');
      r(ox, oy, 3, 8, 18, 12, '#8a4c24');
      r(ox, oy, 2, 7, 20, 3, '#d9a432');
      // 箱內雪白元寶銀錠
      r(ox, oy, 4, 3, 6, 4, '#dce6ed');
      r(ox, oy, 5, 2, 4, 3, '#ffffff');
      r(ox, oy, 11, 3, 6, 4, '#e6eef5');
      r(ox, oy, 12, 2, 4, 3, '#ffffff');
      r(ox, oy, 16, 4, 5, 3, '#cfdbe3');
      r(ox, oy, 10, 12, 4, 5, '#ffd24d');
    });

    // 小遊戲雕花公案桌
    drawAt(TileIndex.MINIGAME_TABLE, (ox, oy) => {
      r(ox, oy, 1, 19, 22, 4, 'rgba(0,0,0,0.26)');
      r(ox, oy, 1, 5, 22, 5, '#cf9323');
      r(ox, oy, 2, 6, 20, 3, '#f5c64e');
      r(ox, oy, 2, 10, 20, 9, '#8c2219');
      r(ox, oy, 3, 18, 3, 5, '#54120d');
      r(ox, oy, 18, 18, 3, 5, '#54120d');
      r(ox, oy, 6, 4, 12, 5, '#fff9e8');
      r(ox, oy, 8, 6, 8, 1, '#8c2219');
    });

    // 皇帝雕龍御案與九龍屏風
    drawAt(TileIndex.EMPEROR_THRONE_DESK, (ox, oy) => {
      r(ox, oy, 0, 5, 24, 16, '#b87d14');
      r(ox, oy, 1, 6, 22, 6, '#f7ca48');
      r(ox, oy, 3, 12, 18, 8, '#d9981e');
      r(ox, oy, 6, 3, 8, 4, '#fff8e3');
      r(ox, oy, 16, 2, 4, 5, '#47a885');
    });
    drawAt(TileIndex.EMPEROR_SCREEN, (ox, oy) => {
      r(ox, oy, 1, 1, 22, 22, '#542419');
      r(ox, oy, 3, 3, 18, 18, '#c98e1e');
      r(ox, oy, 5, 5, 14, 14, '#f2c449');
      r(ox, oy, 8, 8, 8, 8, '#ffe694');
    });

    // 校場立式箭靶
    drawAt(TileIndex.ARCHERY_TARGET, (ox, oy) => {
      r(ox, oy, 4, 19, 16, 4, 'rgba(0,0,0,0.25)');
      r(ox, oy, 5, 15, 3, 8, '#5c3b1e');
      r(ox, oy, 16, 15, 3, 8, '#5c3b1e');
      r(ox, oy, 3, 2, 18, 16, '#7a5229');
      r(ox, oy, 4, 3, 16, 14, '#f5f0e4');
      r(ox, oy, 6, 5, 12, 10, '#cf2e23');
      r(ox, oy, 8, 7, 8, 6, '#f5f0e4');
      r(ox, oy, 10, 9, 4, 2, '#f5c238');
    });

    // 清軍大帳（左右雙格）
    drawAt(TileIndex.ARMY_TENT_LEFT, (ox, oy) => {
      r(ox, oy, 2, 11, 22, 12, '#e6dfd0');
      r(ox, oy, 6, 6, 18, 6, '#f5f1e6');
      r(ox, oy, 12, 2, 12, 5, '#ffffff');
      r(ox, oy, 2, 11, 22, 2, '#284a75');
      r(ox, oy, 20, 0, 4, 3, '#cf2e23');
      r(ox, oy, 18, 13, 6, 10, '#2e221b');
    });
    drawAt(TileIndex.ARMY_TENT_RIGHT, (ox, oy) => {
      r(ox, oy, 0, 11, 22, 12, '#dcd4c4');
      r(ox, oy, 0, 6, 18, 6, '#ebe6da');
      r(ox, oy, 0, 2, 12, 5, '#f7f4ec');
      r(ox, oy, 0, 11, 22, 2, '#284a75');
      r(ox, oy, 0, 0, 4, 3, '#cf2e23');
      r(ox, oy, 0, 13, 6, 10, '#2e221b');
    });

    // 校場兵器架
    drawAt(TileIndex.WEAPON_RACK, (ox, oy) => {
      r(ox, oy, 3, 18, 18, 4, '#5c3b1e');
      r(ox, oy, 3, 10, 18, 2, '#784f2a');
      for (let x = 6; x <= 18; x += 4) {
        r(ox, oy, x, 4, 2, 16, '#8f6339');
        r(ox, oy, x, 1, 2, 4, '#dce3e8');
        r(ox, oy, x - 1, 4, 4, 2, '#d93226');
      }
    });

    // 南巡龍紋旌旗
    drawAt(TileIndex.FLEET_BANNER, (ox, oy) => {
      r(ox, oy, 4, 19, 6, 4, '#dcd6c8');
      r(ox, oy, 6, 1, 2, 21, '#782219');
      r(ox, oy, 6, 0, 2, 2, '#ffd559');
      r(ox, oy, 8, 3, 14, 11, '#cf2e23');
      r(ox, oy, 8, 4, 12, 9, '#f2be38');
      r(ox, oy, 10, 6, 7, 4, '#9c2219');
    });

    // 江南石牌坊左右柱
    drawAt(TileIndex.TOUR_ARCHWAY_L, (ox, oy) => {
      r(ox, oy, 0, 1, 24, 5, '#3d4852');
      r(ox, oy, 2, 6, 22, 4, '#e3ded1');
      r(ox, oy, 8, 6, 16, 3, '#e8b638');
      r(ox, oy, 3, 10, 6, 13, '#d9d3c4');
      r(ox, oy, 1, 18, 10, 5, '#ebe6da');
    });
    drawAt(TileIndex.TOUR_ARCHWAY_R, (ox, oy) => {
      r(ox, oy, 0, 1, 24, 5, '#3d4852');
      r(ox, oy, 0, 6, 22, 4, '#e3ded1');
      r(ox, oy, 0, 6, 16, 3, '#e8b638');
      r(ox, oy, 15, 10, 6, 13, '#d9d3c4');
      r(ox, oy, 13, 18, 10, 5, '#ebe6da');
    });

    // 園林太湖石假山
    drawAt(TileIndex.TAIHU_ROCK, (ox, oy) => {
      r(ox, oy, 3, 19, 18, 4, 'rgba(0,0,0,0.24)');
      r(ox, oy, 4, 8, 16, 13, '#788085');
      r(ox, oy, 6, 3, 12, 16, '#959da3');
      r(ox, oy, 8, 2, 7, 10, '#b2bac0');
      r(ox, oy, 9, 9, 4, 4, '#52595e');
      r(ox, oy, 13, 14, 3, 3, '#52595e');
      r(ox, oy, 5, 17, 4, 2, '#538249');
    });

    canvasTex.refresh();

    scene.textures.addSpriteSheet(
      'palace_tiles',
      canvasTex.getSourceImage() as unknown as HTMLImageElement,
      {
        frameWidth: S,
        frameHeight: S
      }
    );
  }

  private static generateCharacterSheet(
    scene: Phaser.Scene,
    key: string,
    pal: CharPalette
  ): void {
    const fw = 24;
    const fh = 36;
    const cols = 4; // 0:左步, 1:站立, 2:右步, 3:站立
    const rows = 4; // 0:下, 1:左, 2:右, 3:上

    const raw = scene.textures.createCanvas(`${key}_raw`, fw * cols, fh * rows);
    if (!raw) return;
    const ctx = raw.getContext();
    ctx.imageSmoothingEnabled = false;

    const r = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };

    for (let dir = 0; dir < rows; dir++) {
      for (let step = 0; step < cols; step++) {
        const ox = step * fw;
        const oy = dir * fh;
        const isStride = step === 0 || step === 2;
        const bob = isStride ? -1 : 0;
        const strideSign = step === 0 ? -1 : step === 2 ? 1 : 0;

        // 1. 貼地橢圓柔和陰影
        r(ox + 5, oy + 32, 14, 3, 'rgba(12, 8, 6, 0.34)');
        r(ox + 7, oy + 31, 10, 4, 'rgba(12, 8, 6, 0.22)');

        // 2. 官靴／布鞋（含厚白底與步伐高低差）
        const leftFootY = step === 0 ? 29 : 30;
        const rightFootY = step === 2 ? 29 : 30;
        const leftFootX = dir === 1 ? 8 + strideSign * 2 : dir === 2 ? 8 + strideSign * 2 : 6;
        const rightFootX = dir === 1 ? 11 - strideSign * 2 : dir === 2 ? 11 - strideSign * 2 : 13;

        r(ox + leftFootX, oy + leftFootY, 5, 3, '#1f1917');
        r(ox + leftFootX, oy + leftFootY + 2, 5, 1, pal.soleColor);
        r(ox + rightFootX, oy + rightFootY, 5, 3, '#1f1917');
        r(ox + rightFootX, oy + rightFootY + 2, 5, 1, pal.soleColor);

        // 3. 袍服／校服主體與立體衣摺陰影
        r(ox + 5, oy + 17 + bob, 14, 13, pal.robeMain);
        r(ox + 5, oy + 17 + bob, 3, 13, pal.robeShade);
        r(ox + 16, oy + 17 + bob, 3, 13, pal.robeShade);
        // 裙擺衣摺暗線
        r(ox + 9, oy + 23 + bob, 1, 7, pal.robeShade);
        r(ox + 14, oy + 23 + bob, 1, 7, pal.robeShade);
        // 領襟與下擺滾邊
        r(ox + 5, oy + 29 + bob, 14, 1, pal.robeTrim);

        if (dir === 0) {
          r(ox + 10, oy + 17 + bob, 4, 12, pal.robeTrim);
          if (pal.badgeColor) {
            r(ox + 9, oy + 18 + bob, 6, 4, pal.badgeColor);
          }
          if (pal.necklace) {
            r(ox + 8, oy + 17 + bob, 1, 4, pal.necklace);
            r(ox + 15, oy + 17 + bob, 1, 4, pal.necklace);
            r(ox + 9, oy + 21 + bob, 6, 1, pal.necklace);
          }
        } else if (dir === 3 && pal.headwear !== 'student') {
          // 背面清代長辮細節
          r(ox + 11, oy + 16 + bob, 2, 10, '#1e1612');
          r(ox + 11, oy + 26 + bob, 2, 2, '#c92e24');
        }

        // 腰帶與玉扣
        r(ox + 5, oy + 22 + bob, 14, 2, pal.belt);
        if (dir === 0) {
          r(ox + 11, oy + 22 + bob, 2, 2, '#f5efe2');
        }

        // 4. 雙袖擺動、袖口與手部膚色
        const armSwing = strideSign * 2;
        if (dir === 0 || dir === 3) {
          r(ox + 3, oy + 18 + bob + armSwing, 3, 7, pal.robeMain);
          r(ox + 3, oy + 23 + bob + armSwing, 3, 2, pal.cuff);
          r(ox + 3, oy + 25 + bob + armSwing, 2, 2, pal.skin);

          r(ox + 18, oy + 18 + bob - armSwing, 3, 7, pal.robeShade);
          r(ox + 18, oy + 23 + bob - armSwing, 3, 2, pal.cuff);
          r(ox + 19, oy + 25 + bob - armSwing, 2, 2, pal.skin);
        } else if (dir === 1) {
          r(ox + 9 + armSwing, oy + 18 + bob, 5, 7, pal.robeShade);
          r(ox + 9 + armSwing, oy + 23 + bob, 4, 2, pal.cuff);
          r(ox + 9 + armSwing, oy + 25 + bob, 3, 2, pal.skin);
        } else {
          r(ox + 10 - armSwing, oy + 18 + bob, 5, 7, pal.robeShade);
          r(ox + 11 - armSwing, oy + 23 + bob, 4, 2, pal.cuff);
          r(ox + 12 - armSwing, oy + 25 + bob, 3, 2, pal.skin);
        }

        // 5. 頭部輪廓、耳部、眼白、瞳孔與眉型
        r(ox + 6, oy + 8 + bob, 12, 9, pal.skin);
        r(ox + 6, oy + 15 + bob, 12, 2, pal.skinShadow);

        if (dir === 0) {
          // 正面雙耳
          r(ox + 5, oy + 11 + bob, 1, 3, pal.skinShadow);
          r(ox + 18, oy + 11 + bob, 1, 3, pal.skinShadow);
          // 雙眉
          r(ox + 7, oy + 10 + bob, 3, 1, '#2b1e19');
          r(ox + 14, oy + 10 + bob, 3, 1, '#2b1e19');
          // 左眼（眼白＋深色瞳孔）
          r(ox + 7, oy + 11 + bob, 3, 2, '#ffffff');
          r(ox + 8, oy + 11 + bob, 2, 2, '#1a110d');
          // 右眼（眼白＋深色瞳孔）
          r(ox + 14, oy + 11 + bob, 3, 2, '#ffffff');
          r(ox + 14, oy + 11 + bob, 2, 2, '#1a110d');
          // 鼻影與嘴線
          r(ox + 11, oy + 13 + bob, 2, 1, pal.skinShadow);
          r(ox + 11, oy + 15 + bob, 2, 1, '#c97e6b');
          if (pal.beard) {
            r(ox + 9, oy + 15 + bob, 6, 4, pal.beard);
            r(ox + 10, oy + 19 + bob, 4, 2, pal.beard);
          }
        } else if (dir === 1) {
          // 朝左側面五官
          r(ox + 14, oy + 9 + bob, 4, 7, '#241a15');
          r(ox + 7, oy + 10 + bob, 3, 1, '#2b1e19');
          r(ox + 7, oy + 11 + bob, 3, 2, '#ffffff');
          r(ox + 7, oy + 11 + bob, 2, 2, '#1a110d');
          r(ox + 5, oy + 12 + bob, 1, 2, pal.skin);
          if (pal.beard) {
            r(ox + 6, oy + 15 + bob, 4, 4, pal.beard);
          }
        } else if (dir === 2) {
          // 朝右側面五官
          r(ox + 6, oy + 9 + bob, 4, 7, '#241a15');
          r(ox + 14, oy + 10 + bob, 3, 1, '#2b1e19');
          r(ox + 14, oy + 11 + bob, 3, 2, '#ffffff');
          r(ox + 15, oy + 11 + bob, 2, 2, '#1a110d');
          r(ox + 18, oy + 12 + bob, 1, 2, pal.skin);
          if (pal.beard) {
            r(ox + 14, oy + 15 + bob, 4, 4, pal.beard);
          }
        } else {
          // 背面後腦髮型
          r(ox + 6, oy + 8 + bob, 12, 8, '#241a15');
        }

        // 6. 帽冠與髮型細節
        if (pal.headwear === 'student') {
          r(ox + 5, oy + 5 + bob, 14, 5, pal.hatMain);
          r(ox + 7, oy + 4 + bob, 10, 2, pal.hatTrim);
          if (dir === 0) {
            r(ox + 6, oy + 8 + bob, 3, 2, pal.hatMain);
            r(ox + 11, oy + 8 + bob, 3, 2, pal.hatMain);
            r(ox + 16, oy + 8 + bob, 2, 2, pal.hatMain);
          }
        } else if (pal.headwear === 'court') {
          // 清代翻檐暖帽、紅纓與頂珠
          r(ox + 4, oy + 6 + bob, 16, 4, pal.hatMain);
          r(ox + 6, oy + 3 + bob, 12, 4, pal.tassel || pal.hatTrim);
          r(ox + 8, oy + 2 + bob, 8, 2, pal.hatTrim);
          if (pal.finial) {
            r(ox + 11, oy + 0 + bob, 2, 3, pal.finial);
          }
        } else if (pal.headwear === 'scholar') {
          // 漢族儒生方巾
          r(ox + 5, oy + 4 + bob, 14, 5, pal.hatMain);
          r(ox + 6, oy + 3 + bob, 12, 2, pal.hatTrim);
          r(ox + 5, oy + 8 + bob, 14, 1, '#1c2630');
        } else if (pal.headwear === 'farmer') {
          // 竹編寬檐斗笠
          r(ox + 2, oy + 7 + bob, 20, 3, pal.hatMain);
          r(ox + 5, oy + 4 + bob, 14, 3, pal.hatMain);
          r(ox + 9, oy + 2 + bob, 6, 2, pal.hatTrim);
          r(ox + 3, oy + 9 + bob, 18, 1, pal.hatTrim);
        }
      }
    }

    raw.refresh();
    scene.textures.addSpriteSheet(
      key,
      raw.getSourceImage() as unknown as HTMLImageElement,
      {
        frameWidth: fw,
        frameHeight: fh
      }
    );

    const dirNames = ['down', 'left', 'right', 'up'];
    dirNames.forEach((dName, rowIdx) => {
      const animKey = `${key}_${dName}`;
      if (!scene.anims.exists(animKey)) {
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
      }
    });
  }

  private static generateRoyalBoat(scene: Phaser.Scene): void {
    const raw = scene.textures.createCanvas('royal_boat', 120, 72);
    if (!raw) return;
    const ctx = raw.getContext();
    ctx.imageSmoothingEnabled = false;

    const r = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };

    // 水波與白色浪花倒影
    r(10, 62, 98, 4, 'rgba(255,255,255,0.42)');
    r(18, 66, 82, 2, 'rgba(130,225,245,0.55)');

    // 雕花檀木船身與吃水線
    r(10, 45, 98, 16, '#4d2612');
    r(4, 39, 110, 8, '#6e391c');
    r(6, 42, 106, 2, '#f0be42');
    for (let x = 14; x <= 96; x += 12) {
      r(x, 47, 8, 2, '#8c4c27');
    }

    // 昂首龍頭船首（朝右）與龍尾
    r(108, 25, 9, 16, '#f2c138');
    r(112, 22, 7, 7, '#ffe27a');
    r(115, 24, 2, 2, '#c9261d');
    r(2, 29, 7, 11, '#d99e26');

    // 雙層朱紅描金樓閣船艙與雕花亮窗
    r(24, 22, 66, 18, '#992219');
    r(22, 37, 70, 3, '#f2ede1');
    for (let x = 29; x <= 81; x += 10) {
      r(x, 26, 6, 9, '#ffdf75');
      r(x + 2, 26, 2, 9, '#a65c14');
    }

    // 重檐黃琉璃金頂與寶頂旌旗
    r(18, 15, 78, 8, '#d9981e');
    for (let x = 20; x <= 92; x += 6) {
      r(x, 15, 3, 8, '#f7ca4d');
    }
    r(30, 8, 54, 7, '#f2be38');
    r(34, 6, 46, 3, '#ffe382');
    r(55, 1, 4, 5, '#cf2a20');
    r(59, 1, 10, 4, '#ffd54f');

    raw.refresh();
  }

  private static generateMarkersAndProps(scene: Phaser.Scene): void {
    // 24x24 精緻金漆指引箭嘴
    const arrowTex = scene.textures.createCanvas('guide_arrow', 24, 24);
    if (arrowTex) {
      const ctx = arrowTex.getContext();
      ctx.fillStyle = '#3d2005';
      ctx.fillRect(8, 2, 8, 11);
      ctx.fillRect(3, 11, 18, 5);
      ctx.fillRect(6, 16, 12, 3);
      ctx.fillRect(9, 19, 6, 3);
      ctx.fillRect(11, 22, 2, 2);

      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(9, 3, 6, 10);
      ctx.fillRect(5, 12, 14, 4);
      ctx.fillRect(8, 16, 8, 3);
      ctx.fillRect(10, 19, 4, 2);

      ctx.fillStyle = '#fff6bf';
      ctx.fillRect(10, 4, 2, 9);
      arrowTex.refresh();
    }

    // 16x16 頭頂未訪提示玉牌
    const markTex = scene.textures.createCanvas('npc_badge', 16, 16);
    if (markTex) {
      const ctx = markTex.getContext();
      ctx.fillStyle = '#4f120d';
      ctx.fillRect(2, 1, 12, 13);
      ctx.fillStyle = '#f2c138';
      ctx.fillRect(3, 2, 10, 11);
      ctx.fillStyle = '#fff9e6';
      ctx.fillRect(4, 3, 8, 9);
      ctx.fillStyle = '#ad2017';
      ctx.fillRect(7, 4, 2, 5);
      ctx.fillRect(7, 10, 2, 2);
      markTex.refresh();
    }
  }
}
