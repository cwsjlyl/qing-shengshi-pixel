const BLOCKED_WORDS = [
  '殺死',
  '血腥',
  '自殺',
  '斬首',
  '砍死',
  '打死',
  '暴力',
  '色情',
  '淫',
  '裸',
  '性交',
  '強姦',
  '粗口',
  '笨蛋',
  '去死'
];

export interface RemonstranceSuggestion {
  label: string;
  text: string;
}

export const REMONSTRANCE_SUGGESTIONS: ReadonlyArray<RemonstranceSuggestion> = [
  {
    label: '嚴懲和珅整頓吏治',
    text: '皇上，請勿再寵信貪官和珅，應效法雍正皇帝嚴懲貪污、嚴查虧空，令朝廷吏治重歸清明。'
  },
  {
    label: '節制南巡與軍費開支',
    text: '皇上，六次遊江南與十次派兵花費龐大，請減少奢華排場與連年征戰，休養生息以充實國庫。'
  },
  {
    label: '解決人口與田地不足',
    text: '皇上，如今人口日漸增加但田地不足，百姓生活艱苦，請鼓勵開墾農田、興修水利並減輕賦稅。'
  },
  {
    label: '用人唯才居安思危',
    text: '皇上，盛世之下已現轉弱危機，請效法康熙皇帝用人唯才，廣納大臣諫言，切勿自滿大意。'
  }
];

function includesBlockedWord(text: string): boolean {
  return BLOCKED_WORDS.some((w) => text.includes(w));
}

export type BuildPromptResult =
  | { ok: true; prompt: string }
  | { ok: false; error: string };

/**
 * 將學生的進諫內容組裝為可直接複製貼上至 Gemini 的互動角色扮演指令（Prompt）
 */
export function buildQianlongGeminiPrompt(rawAdvice: string): BuildPromptResult {
  const advice = rawAdvice.trim();

  if (!advice) {
    return {
      ok: false,
      error: '請先輸入你想向乾隆皇帝進獻的諫言（或點選上方靈感標籤參考），再產生 Gemini 指令！'
    };
  }

  if (includesBlockedWord(advice)) {
    return {
      ok: false,
      error: '此進諫用語不宜，請以有禮、合乎史實的方式向乾隆皇帝提出治國建議。'
    };
  }

  const prompt = [
    '請你扮演清朝晚年時期的「乾隆皇帝」（以第一人稱「朕」自稱），使用香港繁體中文回應，語氣兼具帝王威嚴與長輩叮嚀，深淺程度適合香港小學六年級常識科學生閱讀。',
    '',
    '【背景設定】',
    '我是一位剛完成《最後的皇朝：康雍乾盛世》歷史探索遊戲的小學六年級學生，觀察了康熙（不分滿漢用人唯才）、雍正（嚴懲貪官充實國庫）與乾隆（平定準噶爾奠定版圖、六次遊江南耗費巨資、十次派兵軍費浩繁、晚年寵信貪官和珅、人口激增導致田地不足）的歷史證據。現在我向你呈上以下治國進諫：',
    '',
    '【學生的進諫內容】',
    `「${advice}」`,
    '',
    '請你根據我的進諫內容，分以下兩個部分回應我：',
    '1. 【乾隆皇帝的御批回應】：以乾隆皇帝的身份，針對我的進諫作出具體回應（說明朕是否採納、內心的想法或當政的考量）。',
    '2. 【對清朝導致的後果】：根據我的進諫內容，具體推演這項建議會令清朝在吏治、國庫財政、百姓民生及日後國勢發展上導致甚麼後果？（若進諫具體可行，說明如何改善或延緩清朝由盛轉弱；若進諫空泛、偏頗或有副作用，亦請誠實指出對清朝導致的不良後果。）最後附上一句簡短的歷史反思鼓勵我。'
  ].join('\n');

  return { ok: true, prompt };
}
