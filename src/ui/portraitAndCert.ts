import Phaser from 'phaser';
import { MEDAL_LABELS, MedalRank } from '../state/gameState';

const portraitDataUrls = new Map<string, string>();

const SPEAKER_TO_SPRITE_KEY: Record<string, string> = {
  康熙皇帝: 'char_kangxi_emperor',
  滿族人: 'char_manchu_person',
  漢族人: 'char_han_person',
  雍正皇帝: 'char_yongzheng_emperor',
  貪官甲: 'char_corrupt_a',
  貪官乙: 'char_corrupt_b',
  國庫線索: 'char_yongzheng_emperor',
  乾隆皇帝: 'char_qianlong_emperor',
  清兵: 'char_qing_soldier',
  和珅: 'char_heshen',
  農夫: 'char_farmer',
  南巡船隊: 'char_qing_soldier',
  御船船夫: 'char_farmer',
  探索提示: 'char_student',
  提示: 'char_student',
  過關提示: 'char_student',
  答題完成: 'char_student',
  完成本關: 'char_student'
};

/**
 * 於貼圖建構完成後，從 11 組 4x 高清角色精靈圖擷取正面半身頭像供對話框顯示
 */
export function extractAllCharacterPortraits(scene: Phaser.Scene): void {
  const keys = new Set<string>([
    ...Object.values(SPEAKER_TO_SPRITE_KEY),
    'char_student'
  ]);

  for (const key of keys) {
    if (portraitDataUrls.has(key) || !scene.textures.exists(key)) continue;
    const tex = scene.textures.get(key);
    const frame0 = tex.get(0);
    const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!frame0 || !src) continue;

    const fw = frame0.width;
    const fh = frame0.height;
    if (fw <= 0 || fh <= 0) continue;

    const canvas = document.createElement('canvas');
    const size = 96;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.imageSmoothingEnabled = false;
    // 取正面第 0 格上半身（頭冠至胸袍），置中放大呈現清晰表情與服飾
    const cropH = Math.floor(fh * 0.82);
    const scale = Math.min((size - 8) / fw, (size - 8) / cropH);
    const drawW = Math.floor(fw * scale);
    const drawH = Math.floor(cropH * scale);
    const dx = Math.floor((size - drawW) / 2);
    const dy = Math.floor(size - drawH - 2);

    ctx.drawImage(
      src,
      frame0.cutX,
      frame0.cutY,
      fw,
      cropH,
      dx,
      dy,
      drawW,
      drawH
    );

    try {
      portraitDataUrls.set(key, canvas.toDataURL('image/png'));
    } catch {
      // Ignore tainted canvas errors if any
    }
  }
}

export function getPortraitForSpeaker(speakerName: string): string | null {
  const key = SPEAKER_TO_SPRITE_KEY[speakerName] || 'char_student';
  return portraitDataUrls.get(key) || null;
}

/**
 * 繪製高解析度《大清特命盛世史官電子證書》PNG Data URL，支援 iPad 長按儲存或直接下載
 */
export function renderHistorianCertificateDataUrl(opts: {
  studentName: string;
  modeTitle: string;
  medals: Partial<Record<string, MedalRank>>;
  totalVisitedCount: number;
}): string {
  const W = 960;
  const H = 640;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. 宮廷宣紙與朱紅描金雙層邊框
  ctx.fillStyle = '#5c150f';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#f0c246';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  ctx.fillStyle = '#fcf6e8';
  ctx.fillRect(32, 32, W - 64, H - 64);

  ctx.strokeStyle = '#9c2820';
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, W - 88, H - 88);

  // 四角宮廷回紋裝飾
  const corners = [
    [44, 44],
    [W - 72, 44],
    [44, H - 72],
    [W - 72, H - 72]
  ];
  ctx.fillStyle = '#d19924';
  for (const [cx, cy] of corners) {
    ctx.fillRect(cx, cy, 28, 6);
    ctx.fillRect(cx, cy, 6, 28);
  }

  // 2. 頂部御匾標題
  ctx.fillStyle = '#8c1d15';
  ctx.fillRect(210, 66, W - 420, 62);
  ctx.strokeStyle = '#f0c246';
  ctx.lineWidth = 3;
  ctx.strokeRect(210, 66, W - 420, 62);

  ctx.font = 'bold 30px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#ffe89e';
  ctx.textAlign = 'center';
  ctx.fillText('特命大清盛世史官褒獎狀', W / 2, 108);

  ctx.font = 'bold 18px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#681711';
  ctx.fillText('《最後的皇朝：康雍乾盛世》香港小學六年級常識科歷史探究證書', W / 2, 162);

  // 3. 學生姓名欄
  const displayName = opts.studentName.trim() || '優秀小史官';
  ctx.font = 'bold 34px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#1c120d';
  ctx.fillText(`茲褒獎　${displayName}　同學`, W / 2, 224);

  ctx.strokeStyle = '#b08854';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(260, 238);
  ctx.lineTo(W - 260, 238);
  ctx.stroke();

  // 4. 探究成就與三帝頭像印記
  ctx.font = 'bold 20px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#362210';
  ctx.fillText(
    `成功完成「${opts.modeTitle}」，深入考察康熙、雍正、乾隆三朝歷史現場，`,
    W / 2,
    280
  );
  ctx.fillText(
    `共蒐集 ${Math.max(opts.totalVisitedCount, 3)} 項關鍵史料證據，洞悉清朝早期盛世成因與晚年轉弱之啟示。`,
    W / 2,
    314
  );

  // 繪製三朝皇帝頭像（若已快取）
  const empCards = [
    { key: 'char_kangxi_emperor', label: '康熙・用人唯才', x: 240 },
    { key: 'char_yongzheng_emperor', label: '雍正・嚴懲貪官', x: 480 },
    { key: 'char_qianlong_emperor', label: '乾隆・盛極轉弱', x: 720 }
  ];

  for (const ec of empCards) {
    ctx.fillStyle = '#f3e7ce';
    ctx.fillRect(ec.x - 95, 340, 190, 92);
    ctx.strokeStyle = '#9e7544';
    ctx.lineWidth = 2;
    ctx.strokeRect(ec.x - 95, 340, 190, 92);

    ctx.font = 'bold 17px "PingFang HK", "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#681711';
    ctx.fillText('✓ 已完成考察', ec.x, 376);
    ctx.font = 'bold 16px "PingFang HK", "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#241813';
    ctx.fillText(ec.label, ec.x, 408);
  }

  // 5. 小遊戲御賜印章統計
  const mgNames: Array<[string, string]> = [
    ['talent_game', '用人唯才'],
    ['whack_game', '打擊貪官'],
    ['archery_game', '射箭平亂'],
    ['tour_game', '六下江南']
  ];
  const medalSummary = mgNames
    .map(([id, title]) => {
      const m = opts.medals[id];
      return `${title}：${m ? MEDAL_LABELS[m] : '已體驗'}`;
    })
    .join('　｜　');

  ctx.font = 'bold 16px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#472e08';
  ctx.fillText(medalSummary, W / 2, 476);

  // 6. 底部朱砂御印與日期
  ctx.save();
  ctx.translate(W - 156, H - 118);
  ctx.strokeStyle = 'rgba(178, 34, 24, 0.85)';
  ctx.lineWidth = 4;
  ctx.strokeRect(-46, -46, 92, 92);
  ctx.font = 'bold 20px "PingFang HK", serif';
  ctx.fillStyle = 'rgba(178, 34, 24, 0.88)';
  ctx.fillText('盛世史官', 0, -8);
  ctx.fillText('御覽之寶', 0, 22);
  ctx.restore();

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 頒授`;
  ctx.font = 'bold 16px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#5c4738';
  ctx.fillText(dateStr, W / 2, H - 72);

  return canvas.toDataURL('image/png');
}
