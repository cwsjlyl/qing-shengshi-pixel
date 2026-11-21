import { StageId } from './content';

export interface GlossaryEntry {
  term: string;
  meaning: string;
}

/** 小六常識科歷史難詞點按白話註解表 */
export const GLOSSARY_TERMS: ReadonlyArray<GlossaryEntry> = [
  { term: '出仕', meaning: '出來做官，為朝廷服務。' },
  { term: '反抗意識', meaning: '不服從朝廷統治、想要反抗的想法。' },
  { term: '吏治', meaning: '官員管理國家政務的風氣與表現（吏治清明即官員廉潔守法）。' },
  { term: '虧空', meaning: '官員挪用或貪污公款，令政府帳目出現短缺。' },
  { term: '國庫', meaning: '國家存放銀兩與財物的倉庫，代表政府財政儲備。' },
  { term: '準噶爾', meaning: '清朝時活動於西北地區的強大蒙古部落，乾隆派兵平定了其叛亂。' },
  { term: '版圖', meaning: '國家的領土與疆域範圍。' },
  { term: '受賄', meaning: '官員暗中收受別人的金錢或禮物，以換取私利（貪污行為）。' },
  { term: '長江三角洲', meaning: '長江入海口一帶富庶地區，包括江蘇、浙江的揚州、蘇州、杭州、南京等城市。' },
  { term: '賦稅', meaning: '百姓向政府繳交的田稅與稅金。' },
  { term: '休養生息', meaning: '減少戰爭與大型開支，讓百姓安心生產、恢復國家元氣。' }
];

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 將對話文字內的歷史難詞轉為可點按顯示白話解釋的標籤
 */
export function annotateGlossaryHtml(rawLine: string): string {
  let html = escapeHtml(rawLine);
  for (let i = 0; i < GLOSSARY_TERMS.length; i++) {
    const { term } = GLOSSARY_TERMS[i];
    const safeTerm = escapeHtml(term);
    if (html.includes(safeTerm)) {
      html = html.replace(
        safeTerm,
        `<button type="button" class="glossary-term" data-glossary-idx="${i}" title="點按查看詞語解釋">${safeTerm}</button>`
      );
    }
  }
  return html;
}

/** 答錯出關問題時的史料回溯提示（引導翻閱證據而非盲猜） */
export function getQuizEvidenceHint(stageId: StageId, questionText: string): string {
  if (stageId === 'kangxi') {
    if (questionText.includes('原則')) {
      return '💡 史料回溯：回想「康熙皇帝」與「用人唯才挑戰」——無論滿族或漢族，只要有才能都怎樣處理？可點右上「📜 證據簿」重溫！';
    }
    if (questionText.includes('重要作用')) {
      return '💡 史料回溯：回想「滿族人」與「漢族人」的話——當漢族讀書人也有機會做官，他們心中的甚麼想法便消除了？';
    }
    return '💡 史料回溯：回想「漢族人」第一句話提到的建國民族，或點按右上「📜 證據簿」查閱！';
  }

  if (stageId === 'yongzheng') {
    if (questionText.includes('主要做法')) {
      return '💡 史料回溯：回想「雍正皇帝」與兩名貪官的對話——皇上對貪官和公款短缺採取了哪兩項嚴厲行動？';
    }
    if (questionText.includes('好處')) {
      return '💡 史料回溯：回想大殿「國庫線索」——把貪污銀兩追回後，國庫和官員風氣有甚麼轉變？';
    }
    return '💡 史料回溯：康熙在位六十一年、雍正在位十三年，兩代合共治理了約多少年？';
  }

  if (questionText.includes('準噶爾')) {
    return '💡 史料回溯：回想「乾隆皇帝」與「清兵」的話——平定叛亂後，清朝的疆域範圍得到了甚麼成果？';
  }
  if (questionText.includes('遊江南')) {
    return '💡 史料回溯：回想「南巡船隊」與剛才的乘船挑戰——乾隆皇帝一共乘船南巡了多少次？';
  }
  return '💡 史料回溯：回想「乾隆皇帝」第二句話——前後十次派兵打了二十六年，龐大的軍費造成了甚麼影響？';
}

export interface JigsawSummaryCardData {
  dynastyTitle: string;
  corePolicies: string[];
  positiveEffects: string;
  risksOrLimits: string;
  teachingScript: string;
}

/** 課堂分關（拼圖式合作學習 Jigsaw）組員互教重點卡 */
export const JIGSAW_SUMMARY_CARDS: Record<StageId, JigsawSummaryCardData> = {
  kangxi: {
    dynastyTitle: '康熙朝・組員互教匯報卡',
    corePolicies: [
      '任用人才不分滿族或漢族（只要是人才一律任用）',
      '讓漢族讀書人同樣有機會出仕為朝廷效力'
    ],
    positiveEffects: '成功消除漢族士人的反抗意識，令朝廷人才鼎盛，國家政局安定，奠定盛世根基。',
    risksOrLimits: '政局初定後，朝廷後期漸現官員鬆懈與財政問題，需由繼任者整頓。',
    teachingScript: '🗣️ 回組這樣教同學：「我負責探索康熙朝！康熙不分滿漢用人唯才，消除了漢族讀書人的反抗意識，令國家安定下來！」'
  },
  yongzheng: {
    dynastyTitle: '雍正朝・組員互教匯報卡',
    corePolicies: [
      '嚴懲貪官，掃除朝廷內的貪污風氣',
      '嚴查虧空，追回被貪污的公款銀兩'
    ],
    positiveEffects: '國庫重新充實、吏治變得清明、國家財政大幅改善，承先啟後將盛世推向高峰。',
    risksOrLimits: '高度依賴皇帝嚴厲監督；若後代君主放鬆監管，貪腐之風容易死灰復燃。',
    teachingScript: '🗣️ 回組這樣教同學：「我負責探索雍正朝！雍正嚴懲貪官、嚴查虧空，把銀兩追回充實國庫，令朝廷吏治清明！」'
  },
  qianlong: {
    dynastyTitle: '乾隆朝・組員互教匯報卡',
    corePolicies: [
      '前期文治武功：派兵平定準噶爾叛亂、六次南巡瞭解民情與治理河道',
      '晚年轉折隱憂：十次派兵軍費浩大、南巡排場奢華、寵信貪官和珅、人口激增而田地不足'
    ],
    positiveEffects: '平定準噶爾奠定了清朝的版圖，將康雍乾盛世推至最高峰。',
    risksOrLimits: '連年征戰與南巡虛耗康雍兩代積累的國力；加上和珅貪污、人多田少百姓困苦，令國勢由盛轉弱。',
    teachingScript: '🗣️ 回組這樣教同學：「我負責探索乾隆朝！乾隆雖奠定清朝版圖，但十次派兵與六下江南耗盡國庫，加上晚年寵信和珅及田地不足，令清朝由盛轉衰！」'
  }
};

export interface CerOption {
  id: string;
  label: string;
  clause: string;
}

/** CER 有根有據奏摺組合器：乾隆晚年危機選項 */
export const CER_PROBLEMS: ReadonlyArray<CerOption> = [
  {
    id: 'heshen',
    label: '寵信和珅・官員貪污',
    clause: '晚年寵信和珅導致受賄成風、國庫銀兩流失'
  },
  {
    id: 'spending',
    label: '十次派兵與六下江南耗資巨大',
    clause: '十次派兵軍費浩繁及六次南巡排場奢華，虛耗了康熙與雍正積累的國力'
  },
  {
    id: 'land',
    label: '人口激增・農田不足',
    clause: '人口越來越多但田地不足且乾旱龜裂，農民收成少、生活艱苦'
  }
];

/** CER 有根有據奏摺組合器：借鑑前朝治國經驗選項 */
export const CER_PRECEDENTS: ReadonlyArray<CerOption> = [
  {
    id: 'yongzheng_clean',
    label: '效法雍正「嚴懲貪官・嚴查虧空」',
    clause: '效法雍正皇帝嚴懲貪官、嚴查虧空以重新充實國庫'
  },
  {
    id: 'kangxi_talent',
    label: '效法康熙「用人唯才・廣納賢臣」',
    clause: '效法康熙皇帝不分滿漢用人唯才，選拔廉潔有能的大臣治理地方'
  },
  {
    id: 'frugal_farm',
    label: '節省開支・興修水利開墾農田',
    clause: '減少奢華南巡與連年征戰，將銀兩用於興修水利、開墾荒地及減輕農民賦稅'
  }
];

export function composeCerDraft(
  selectedProblemIds: string[],
  selectedPrecedentIds: string[]
): string {
  const probs = CER_PROBLEMS.filter((p) => selectedProblemIds.includes(p.id)).map(
    (p) => p.clause
  );
  const precs = CER_PRECEDENTS.filter((p) =>
    selectedPrecedentIds.includes(p.id)
  ).map((p) => p.clause);

  if (probs.length === 0 && precs.length === 0) {
    return '';
  }

  const part1 =
    probs.length > 0
      ? `皇上，臣學生觀察到目前大清正面對「${probs.join('；以及')}」的隱憂。`
      : '皇上，臣學生觀察到盛世之下已現國勢轉弱的危機。';
  const part2 =
    precs.length > 0
      ? `懇請皇上居安思危，${precs.join('，同時')}，方能令百姓安居樂業，延續大清盛世！`
      : '懇請皇上整頓吏治、節省開支並照顧百姓生計，延續大清盛世！';

  return `${part1}${part2}`;
}

/** 離線零流量粵語／普通話語音朗讀（Web Speech API） */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore Safari speech synthesis restrictions
  }
}

export function speakTextCantonese(text: string): boolean {
  if (!isSpeechSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[✓★☆○💡🗣️📋🔊]/g, '').trim();
    if (!clean) return false;

    const utter = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const hkVoice =
      voices.find((v) => v.lang.toLowerCase().includes('zh-hk')) ||
      voices.find((v) => v.lang.toLowerCase().includes('yue')) ||
      voices.find((v) => v.lang.toLowerCase().includes('zh-tw')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('zh'));

    if (hkVoice) {
      utter.voice = hkVoice;
      utter.lang = hkVoice.lang;
    } else {
      utter.lang = 'zh-HK';
    }
    utter.rate = 0.96;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}
