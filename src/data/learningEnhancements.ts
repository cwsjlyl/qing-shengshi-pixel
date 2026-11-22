import { StageId } from './content';

/**
 * 歷史詞彙小辭典（點擊對話中標示詞彙即可彈出小六適齡白話解釋）
 */
export interface GlossaryEntry {
  term: string;
  pinyinHint?: string;
  meaning: string;
  stageHint: string;
}

export const HISTORICAL_GLOSSARY: GlossaryEntry[] = [
  {
    term: '三藩之亂',
    meaning: '清初吳三桂等三位藩王起兵反叛朝廷，康熙皇帝派兵平定，鞏固國家統一。',
    stageHint: '康熙時期'
  },
  {
    term: '滿漢一家',
    meaning: '不分滿族或漢族，只要有才能都獲朝廷公平任用，促進民族融洽與合作。',
    stageHint: '康熙時期'
  },
  {
    term: '科舉',
    meaning: '古代朝廷透過公開讀書考試選拔官員的制度，讓漢族讀書人也能入朝為官。',
    stageHint: '康熙時期'
  },
  {
    term: '整頓吏治',
    meaning: '嚴格監督官員操守、查辦貪污受賄，令政府運作廉潔有效率。',
    stageHint: '雍正時期'
  },
  {
    term: '抄家追贓',
    meaning: '依法沒收貪官非法斂財的家產，把贓款歸還國庫以幫助百姓與建設。',
    stageHint: '雍正時期'
  },
  {
    term: '國庫充裕',
    meaning: '國家財政儲備充足，有足夠銀両救災、興修水利及維持社會安定。',
    stageHint: '雍正時期'
  },
  {
    term: '十全武功',
    meaning: '乾隆皇帝自誇任內十次重大軍事勝利；雖然擴展版圖，但亦耗費大量軍餉。',
    stageHint: '乾隆時期'
  },
  {
    term: '六下江南',
    meaning: '乾隆皇帝六次乘船南巡視察江南；初期可體察民情，後期排場奢華勞民傷財。',
    stageHint: '乾隆時期'
  },
  {
    term: '和珅',
    meaning: '乾隆晚期最受寵信的大臣，暗中大肆貪污斂財，導致吏治敗壞、百姓受苦。',
    stageHint: '乾隆時期'
  },
  {
    term: '由盛轉衰',
    meaning: '國家由原本富強安定的盛世，因為貪污與揮霍而漸漸走向衰落。',
    stageHint: '乾隆晚期'
  }
];

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function annotateHistoricalGlossary(rawText: string): string {
  let safe = escapeHtml(rawText);
  const sorted = [...HISTORICAL_GLOSSARY].sort((a, b) => b.term.length - a.term.length);
  sorted.forEach((entry, idx) => {
    const token = `__GLOSS_${idx}__`;
    safe = safe.split(entry.term).join(token);
  });
  sorted.forEach((entry, idx) => {
    const token = `__GLOSS_${idx}__`;
    const chip = `<button type="button" class="glossary-term-btn" data-term="${entry.term}" title="點擊查看「${entry.term}」解釋">${entry.term}</button>`;
    safe = safe.split(token).join(chip);
  });
  return safe;
}

/**
 * CER（觀點 Claim・證據 Evidence・推論 Reasoning）歷史探究反思資料
 */
export interface CerReflectionConfig {
  question: string;
  claims: string[];
  evidences: Array<{ text: string; isCorrect: boolean }>;
  reasoningSummary: string;
}

export const STAGE_CER_REFLECTIONS: Record<StageId, CerReflectionConfig> = {
  kangxi: {
    question: '為甚麼康熙皇帝能為清初盛世奠定穩固基礎？',
    claims: [
      '康熙同時平定內亂並廣納滿漢賢才，令政局穩定、人才輩出。',
      '康熙只重用滿族武將，完全禁止漢族讀書人參政。'
    ],
    evidences: [
      { text: '成功平定「三藩之亂」，消除地方割據威脅。', isCorrect: true },
      { text: '推行科舉並重用漢族學者與滿族官員，不分族裔唯才是用。', isCorrect: true },
      { text: '縱容地方貪官隨意侵吞國庫銀両。', isCorrect: false }
    ],
    reasoningSummary:
      '平定戰亂帶來和平環境，加上滿漢一家廣納人才，使朝廷施政得民心，奠定盛世根基。'
  },
  yongzheng: {
    question: '雍正皇帝整頓吏治對清朝國力有甚麼關鍵作用？',
    claims: [
      '雍正嚴懲貪官並追回贓款，令國庫轉虧為盈、吏治清明。',
      '雍正大量賞賜貪官，靠加徵百姓重稅來填補國庫。'
    ],
    evidences: [
      { text: '鐵腕查辦貪官甲、貪官乙等腐敗官員，革職抄家。', isCorrect: true },
      { text: '把追回的贓銀撥入國庫，令國家財政儲備大幅增加。', isCorrect: true },
      { text: '六次乘搭豪華御船南巡揮霍銀両。', isCorrect: false }
    ],
    reasoningSummary:
      '官員不敢貪污受賄，百姓免受剝削，國庫銀両充足，為下一朝的繁榮提供雄厚財力。'
  },
  qianlong: {
    question: '為甚麼乾隆時期會出現「盛極而衰」的轉變？',
    claims: [
      '乾隆前期國力鼎盛，但晚期寵信貪官和珅且連年征戰與奢華南巡，耗盡國力。',
      '乾隆時期因為外敵立即攻陷京城，所以一日之內滅亡。'
    ],
    evidences: [
      { text: '和珅獲乾隆寵信，趁機貪污斂財，官場風氣敗壞。', isCorrect: true },
      { text: '多次出兵征戰及六下江南排場奢華，大量消耗國庫儲備。', isCorrect: true },
      { text: '農夫反映賦稅沉重、貪官橫行，百姓生活日漸困苦。', isCorrect: true }
    ],
    reasoningSummary:
      '吏治腐敗加上財政過度消耗，令雍正留下的充裕國庫被掏空，民怨四起，清朝遂由盛轉衰。'
  }
};

/**
 * 三朝國勢動態指標（國庫、民生、吏治：0–100）
 */
export interface DynastyMeters {
  treasury: number;
  livelihood: number;
  governance: number;
}

export const INITIAL_METERS: Record<StageId, DynastyMeters> = {
  kangxi: { treasury: 58, livelihood: 62, governance: 65 },
  yongzheng: { treasury: 66, livelihood: 72, governance: 70 },
  qianlong: { treasury: 92, livelihood: 84, governance: 76 }
};

export const STAGE_CHOICE_DELTAS: Record<string, Partial<DynastyMeters>> = {
  kangxi_emperor: { governance: 6, livelihood: 5 },
  manchu_person: { governance: 4 },
  han_person: { livelihood: 6, governance: 5 },
  archery_minigame: { treasury: 4, livelihood: 8 },
  talent_minigame: { governance: 10, livelihood: 6 },
  yongzheng_emperor: { governance: 8 },
  corrupt_a: { governance: -4, treasury: -4 },
  corrupt_b: { governance: -4, livelihood: -4 },
  treasury_clue: { treasury: 6 },
  whack_minigame: { treasury: 18, governance: 16, livelihood: 10 },
  qianlong_emperor: { treasury: -6 },
  qing_soldier: { treasury: -8 },
  heshen: { governance: -18, treasury: -14 },
  farmer: { livelihood: -14 },
  southern_tour_minigame: { treasury: -12, livelihood: -6 }
};

/**
 * 小遊戲星級與歷史官階評級
 */
export type MedalRank = 'gold' | 'silver' | 'bronze';

export function computeMedalRank(scoreRatio: number): {
  rank: MedalRank;
  label: string;
  stars: string;
  title: string;
} {
  if (scoreRatio >= 0.85) {
    return {
      rank: 'gold',
      label: '金牌',
      stars: '★★★',
      title: '一品大學士'
    };
  }
  if (scoreRatio >= 0.6) {
    return {
      rank: 'silver',
      label: '銀牌',
      stars: '★★☆',
      title: '翰林院編修'
    };
  }
  return {
    rank: 'bronze',
    label: '銅牌',
    stars: '★☆☆',
    title: '國史館學錄'
  };
}

export function computeOverallRank(
  ranks: Partial<Record<StageId, MedalRank>>
): MedalRank {
  const vals = Object.values(ranks);
  if (vals.length === 0) return 'silver';
  const score =
    vals.reduce(
      (acc, r) => acc + (r === 'gold' ? 3 : r === 'silver' ? 2 : 1),
      0
    ) / vals.length;
  if (score >= 2.5) return 'gold';
  if (score >= 1.7) return 'silver';
  return 'bronze';
}

/**
 * 不同歷史人物專屬男聲設定（音調 Pitch、語速 Rate、男聲池槽位與角色聲線標籤）：
 * 支援 iPadOS / macOS / Windows / Android 多組系統男聲自動分配，
 * 即使單一語音環境亦透過獨立低頻共振音調與語速營造鮮明男聲差異。
 */
export interface SpeakerVoiceProfile {
  voiceSlot: number;
  preferElderMale?: boolean;
  pitch: number;
  rate: number;
  roleTag: string;
}

const SPEAKER_VOICE_PROFILES: Record<string, SpeakerVoiceProfile> = {
  康熙皇帝: {
    voiceSlot: 0,
    pitch: 0.72,
    rate: 0.88,
    roleTag: '沉穩帝王男聲'
  },
  雍正皇帝: {
    voiceSlot: 1,
    pitch: 0.62,
    rate: 0.95,
    roleTag: '威嚴果斷男聲'
  },
  乾隆皇帝: {
    voiceSlot: 2,
    preferElderMale: true,
    pitch: 0.56,
    rate: 0.85,
    roleTag: '雄渾帝王男聲'
  },
  滿族人: {
    voiceSlot: 3,
    pitch: 0.78,
    rate: 0.99,
    roleTag: '豪邁滿臣男聲'
  },
  漢族人: {
    voiceSlot: 4,
    pitch: 0.88,
    rate: 0.92,
    roleTag: '溫文儒生男聲'
  },
  貪官甲: {
    voiceSlot: 5,
    pitch: 0.66,
    rate: 0.83,
    roleTag: '低沉心虛男聲'
  },
  貪官乙: {
    voiceSlot: 6,
    pitch: 0.9,
    rate: 1.08,
    roleTag: '急促慌張男聲'
  },
  清兵: {
    voiceSlot: 7,
    pitch: 0.76,
    rate: 1.05,
    roleTag: '鏗鏘將士男聲'
  },
  和珅: {
    voiceSlot: 8,
    pitch: 0.84,
    rate: 1.03,
    roleTag: '圓滑寵臣男聲'
  },
  農夫: {
    voiceSlot: 9,
    preferElderMale: true,
    pitch: 0.52,
    rate: 0.81,
    roleTag: '滄桑老農男聲'
  },
  御船船夫: {
    voiceSlot: 10,
    preferElderMale: true,
    pitch: 0.58,
    rate: 0.86,
    roleTag: '渾厚船夫男聲'
  },
  國庫線索: {
    voiceSlot: 11,
    pitch: 0.68,
    rate: 0.91,
    roleTag: '莊重史官男聲'
  },
  南巡船隊: {
    voiceSlot: 12,
    pitch: 0.74,
    rate: 0.94,
    roleTag: '洪亮隨扈男聲'
  },
  學生: {
    voiceSlot: 0,
    pitch: 0.94,
    rate: 0.98,
    roleTag: '清朗少年男聲'
  }
};

const DEFAULT_MALE_PROFILE: SpeakerVoiceProfile = {
  voiceSlot: 1,
  pitch: 0.76,
  rate: 0.94,
  roleTag: '沉穩旁白男聲'
};

export function getSpeakerVoiceProfile(speaker?: string): SpeakerVoiceProfile {
  if (!speaker) return DEFAULT_MALE_PROFILE;
  const trimmed = speaker.trim();
  return SPEAKER_VOICE_PROFILES[trimmed] ?? DEFAULT_MALE_PROFILE;
}

const MALE_VOICE_KEYWORDS = [
  'wanlung',
  'wan-lung',
  '雲龍',
  '云龙',
  'aasing',
  'aa-sing',
  '阿成',
  'eddy',
  'reed',
  'rocko',
  'grandpa',
  '祖父',
  '爺爺',
  '爷爷',
  'danny',
  'daniel',
  'fred',
  'ralph',
  'albert',
  'bruce',
  'kangkang',
  '康康',
  'yunxi',
  '雲希',
  '云希',
  'yunjian',
  '雲健',
  '云健',
  'yunyang',
  '雲揚',
  '云扬',
  'yunjhe',
  '允哲',
  'yunhao',
  'yunze',
  'male',
  '男'
];

const ELDER_MALE_KEYWORDS = ['grandpa', '祖父', '爺爺', '爷爷', 'reed', 'fred'];

const FEMALE_VOICE_KEYWORDS = [
  'sinji',
  'sin-ji',
  'sin ji',
  '善怡',
  'hiugaai',
  'hiumaan',
  '曉佳',
  '曉曼',
  '晓佳',
  '晓曼',
  'hsiaochen',
  'hsiaoyu',
  '曉臻',
  '曉雨',
  'xiaoxiao',
  'xiaoyi',
  '曉曉',
  '曉伊',
  'tingting',
  'ting-ting',
  '婷婷',
  'meijia',
  'mei-jia',
  '美佳',
  'flo',
  'sandy',
  'shelley',
  'grandma',
  '祖母',
  '奶奶',
  '婆婆',
  'alice',
  'victoria',
  'samantha',
  'kathy',
  'lili',
  'shanshan',
  'jiajia',
  'female',
  '女'
];

function classifyVoiceGender(v: SpeechSynthesisVoice): 'male' | 'female' | 'unknown' {
  const label = `${v.name} ${v.voiceURI}`.toLowerCase();
  if (MALE_VOICE_KEYWORDS.some((kw) => label.includes(kw))) return 'male';
  if (FEMALE_VOICE_KEYWORDS.some((kw) => label.includes(kw))) return 'female';
  return 'unknown';
}

function isCantoneseVoice(v: SpeechSynthesisVoice): boolean {
  const lang = v.lang.toLowerCase();
  const name = v.name.toLowerCase();
  return (
    lang.includes('zh-hk') ||
    lang.includes('yue') ||
    name.includes('cantonese') ||
    name.includes('hong kong') ||
    name.includes('粵') ||
    name.includes('香港')
  );
}

function isChineseVoice(v: SpeechSynthesisVoice): boolean {
  const lang = v.lang.toLowerCase();
  return lang.startsWith('zh') || lang.includes('yue') || lang.includes('cmn');
}

// 預先喚醒瀏覽器語音列表（避免 iPad Safari / Chrome 首次呼叫 getVoices 為空陣列）
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  } catch {
    // Ignore restricted environments
  }
}

function selectMaleVoiceForProfile(
  voices: SpeechSynthesisVoice[],
  profile: SpeakerVoiceProfile
): { voice: SpeechSynthesisVoice | null; pitchMultiplier: number } {
  const cantonese = voices.filter(isCantoneseVoice);
  const cantoneseMale = cantonese.filter((v) => classifyVoiceGender(v) === 'male');
  const cantoneseUnknown = cantonese.filter((v) => classifyVoiceGender(v) === 'unknown');

  if (cantoneseMale.length > 0) {
    if (profile.preferElderMale) {
      const elder = cantoneseMale.find((v) =>
        ELDER_MALE_KEYWORDS.some((kw) =>
          `${v.name} ${v.voiceURI}`.toLowerCase().includes(kw)
        )
      );
      if (elder) return { voice: elder, pitchMultiplier: 1 };
    }
    const chosen = cantoneseMale[profile.voiceSlot % cantoneseMale.length];
    return { voice: chosen, pitchMultiplier: 1 };
  }

  if (cantoneseUnknown.length > 0) {
    const chosen = cantoneseUnknown[profile.voiceSlot % cantoneseUnknown.length];
    return { voice: chosen, pitchMultiplier: 0.88 };
  }

  // 若裝置僅內建粵語女聲（例如未下載額外語音包的預設 iPad），保留粵語發音並壓低基頻營造不同男聲聲線
  if (cantonese.length > 0) {
    const chosen = cantonese[profile.voiceSlot % cantonese.length];
    return { voice: chosen, pitchMultiplier: 0.76 };
  }

  // 若完全無粵語語音，優先挑選中文男聲池
  const chinese = voices.filter(isChineseVoice);
  const chineseMale = chinese.filter((v) => classifyVoiceGender(v) === 'male');
  if (chineseMale.length > 0) {
    const chosen = chineseMale[profile.voiceSlot % chineseMale.length];
    return { voice: chosen, pitchMultiplier: 1 };
  }

  if (chinese.length > 0) {
    const chosen = chinese[profile.voiceSlot % chinese.length];
    return { voice: chosen, pitchMultiplier: 0.82 };
  }

  return { voice: null, pitchMultiplier: 0.85 };
}

/**
 * 粵語多角色專屬男聲朗讀（Web Speech API）：
 * 自動識別「角色說：對白」格式，以該角色的專屬男聲、音調與語速直接演繹台詞！
 */
export function speakTextCantonese(rawText: string, explicitSpeaker?: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();

    let speaker = explicitSpeaker?.trim() || '';
    let spokenBody = rawText.trim();

    const prefixMatch = spokenBody.match(/^([^：:\s]{1,12})說[：:]\s*([\s\S]+)$/);
    if (prefixMatch) {
      if (!speaker) {
        speaker = prefixMatch[1];
      }
      // 若為劇中歷史人物，直接以第一人稱男聲演繹台詞，更具臨場戲劇感
      if (SPEAKER_VOICE_PROFILES[prefixMatch[1]]) {
        spokenBody = prefixMatch[2].trim();
      }
    }

    const profile = getSpeakerVoiceProfile(speaker);
    const utter = new SpeechSynthesisUtterance(spokenBody);
    const voices = window.speechSynthesis.getVoices();
    const { voice, pitchMultiplier } = selectMaleVoiceForProfile(voices, profile);

    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      utter.lang = 'zh-HK';
    }

    const finalPitch = Math.max(0.5, Math.min(1.2, profile.pitch * pitchMultiplier));
    utter.pitch = Number(finalPitch.toFixed(2));
    utter.rate = Number(profile.rate.toFixed(2));
    utter.volume = 1;

    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
