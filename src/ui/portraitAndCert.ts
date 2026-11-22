import Phaser from 'phaser';
import { StageId } from '../data/content';
import {
  DynastyMeters,
  MedalRank,
  computeOverallRank
} from '../data/learningEnhancements';

const SPEAKER_SPRITE_MAP: Record<string, string> = {
  康熙皇帝: 'char_kangxi_emperor',
  滿族人: 'char_manchu_person',
  漢族人: 'char_han_person',
  雍正皇帝: 'char_yongzheng_emperor',
  貪官甲: 'char_corrupt_a',
  貪官乙: 'char_corrupt_b',
  乾隆皇帝: 'char_qianlong_emperor',
  清兵: 'char_qing_soldier',
  和珅: 'char_heshen',
  農夫: 'char_farmer',
  御船船夫: 'char_farmer',
  學生: 'char_student'
};

const portraitDataUrls = new Map<string, string>();

/**
 * 於 Preload 完成後由角色高清紋理裁切半身頭像 DataURL，供對話框左側即時顯示
 */
export function extractAllCharacterPortraits(scene: Phaser.Scene): void {
  portraitDataUrls.clear();
  const uniqueKeys = new Set(Object.values(SPEAKER_SPRITE_MAP));
  for (const texKey of uniqueKeys) {
    if (!scene.textures.exists(texKey)) continue;
    const tex = scene.textures.get(texKey);
    const frame0 = tex.get(0);
    const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!frame0 || !src) continue;

    const fw = frame0.width;
    const fh = frame0.height;
    const cropH = Math.round(fh * 0.64);

    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = false;

    const grad = ctx.createRadialGradient(36, 36, 8, 36, 36, 40);
    grad.addColorStop(0, '#4f3224');
    grad.addColorStop(1, '#24140d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 72, 72);

    const scale = Math.min(66 / fw, 68 / cropH);
    const dw = Math.round(fw * scale);
    const dh = Math.round(cropH * scale);
    const dx = Math.round((72 - dw) / 2);
    const dy = 72 - dh;

    ctx.drawImage(src, 0, 0, fw, cropH, dx, dy, dw, dh);

    ctx.strokeStyle = '#e8ba4b';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, 69, 69);

    portraitDataUrls.set(texKey, canvas.toDataURL('image/png'));
  }
}

export function getSpeakerPortraitUrl(speaker: string): string | null {
  const texKey = SPEAKER_SPRITE_MAP[speaker];
  if (!texKey) return null;
  return portraitDataUrls.get(texKey) ?? null;
}

/**
 * 繪製並匯出「康雍乾盛世歷史探究嘉許狀」PNG DataURL（供學生於 iPad 儲存或列印）
 */
export function renderImperialCertificateDataUrl(opts: {
  studentName: string;
  stageRanks: Partial<Record<StageId, MedalRank>>;
  meters: DynastyMeters;
  cerReflectionText: string;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, 640);
  bg.addColorStop(0, '#fcf5e3');
  bg.addColorStop(1, '#f0dfc0');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 960, 640);

  ctx.strokeStyle = '#8c2218';
  ctx.lineWidth = 12;
  ctx.strokeRect(22, 22, 916, 596);

  ctx.strokeStyle = '#c99426';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 888, 568);

  ctx.fillStyle = '#781912';
  ctx.font = 'bold 36px "PingFang HK", "Noto Sans TC", "Microsoft JhengHei", serif';
  ctx.textAlign = 'center';
  ctx.fillText('清朝康雍乾盛世・歷史探究嘉許狀', 480, 98);

  ctx.fillStyle = '#5c3b1e';
  ctx.font = 'bold 20px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillText('《最後的皇朝：康雍乾盛世》互動學習成果紀錄', 480, 136);

  const nameDisplay = (opts.studentName || '小史學家').trim();
  ctx.fillStyle = '#24140d';
  ctx.font = 'bold 28px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`嘉許學生：${nameDisplay}`, 480, 192);

  const overall = computeOverallRank(opts.stageRanks);
  const rankName =
    overall === 'gold'
      ? '🏅 御賜金牌大學士'
      : overall === 'silver'
        ? '🥈 欽點銀牌翰林官'
        : '🥉 勤學銅牌小史官';

  ctx.fillStyle = '#8c2218';
  ctx.font = 'bold 26px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`綜合考評等第：${rankName}`, 480, 236);

  const stageItems: Array<[StageId, string]> = [
    ['kangxi', '康熙（平三藩・選賢能）'],
    ['yongzheng', '雍正（肅貪腐・充國庫）'],
    ['qianlong', '乾隆（十全武功・盛極而衰）']
  ];
  ctx.font = 'bold 19px "PingFang HK", "Microsoft JhengHei", sans-serif';
  stageItems.forEach(([id, title], idx) => {
    const r = opts.stageRanks[id];
    const badge =
      r === 'gold' ? '金牌' : r === 'silver' ? '銀牌' : r === 'bronze' ? '銅牌' : '已探索';
    const x = 180 + idx * 300;
    ctx.fillStyle = '#3b2416';
    ctx.fillText(title, x, 294);
    ctx.fillStyle = '#b07412';
    ctx.fillText(`【${badge}】`, x, 324);
  });

  ctx.fillStyle = '#2c1d14';
  ctx.font = 'bold 18px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillText(
    `最終國勢指標｜國庫盈餘：${opts.meters.treasury}　民生安定：${opts.meters.livelihood}　吏治清廉：${opts.meters.governance}`,
    480,
    376
  );

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillRect(86, 402, 788, 134);
  ctx.strokeStyle = '#c9a66b';
  ctx.lineWidth = 2;
  ctx.strokeRect(86, 402, 788, 134);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#4a2e1b';
  ctx.font = 'bold 17px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillText('歷史興衰反思摘要：', 106, 430);

  ctx.font = '16px "PingFang HK", "Microsoft JhengHei", sans-serif';
  const summary =
    (opts.cerReflectionText || '').trim() ||
    '康熙任用滿漢賢能並平定三藩，雍正嚴懲貪官充實國庫，奠定盛世根基；惟乾隆晚期寵信和珅、揮霍無度，令盛世由盛轉衰。';
  const maxChars = 42;
  for (let i = 0; i < 3; i++) {
    const slice = summary.slice(i * maxChars, (i + 1) * maxChars);
    if (slice) ctx.fillText(slice, 106, 460 + i * 26);
  }

  ctx.save();
  ctx.translate(810, 520);
  ctx.rotate(-0.08);
  ctx.strokeStyle = 'rgba(180, 32, 24, 0.82)';
  ctx.lineWidth = 4;
  ctx.strokeRect(-54, -54, 108, 108);
  ctx.fillStyle = 'rgba(180, 32, 24, 0.82)';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px serif';
  ctx.fillText('清史探究', 0, -10);
  ctx.fillText('御覽之寶', 0, 24);
  ctx.restore();

  const today = new Date().toISOString().slice(0, 10);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#6e5239';
  ctx.font = '15px "PingFang HK", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`頒發日期：${today}`, 480, 576);

  return canvas.toDataURL('image/png');
}
