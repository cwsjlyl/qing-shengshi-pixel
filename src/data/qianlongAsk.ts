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

export interface CerPromptContext {
  problemLabels?: string[];
  precedentLabels?: string[];
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
 * 將學生的有根有據（CER）進諫內容組裝為可直接複製貼上至 Gemini 的互動角色扮演與四格漫畫生成指令（Prompt）
 */
export function buildQianlongGeminiPrompt(
  rawAdvice: string,
  cerContext?: CerPromptContext
): BuildPromptResult {
  const advice = rawAdvice.trim();

  if (!advice) {
    return {
      ok: false,
      error: '請先輸入你想向乾隆皇帝進獻的諫言（或先點選上方「奏摺組合器」／靈感標籤），再產生 Gemini 指令！'
    };
  }

  if (includesBlockedWord(advice)) {
    return {
      ok: false,
      error: '此進諫用語不宜，請以有禮、合乎史實的方式向乾隆皇帝提出治國建議。'
    };
  }

  const cerLines: string[] = [];
  if (cerContext?.problemLabels && cerContext.problemLabels.length > 0) {
    cerLines.push(`・學生鎖定的清朝晚年問題：${cerContext.problemLabels.join('、')}`);
  }
  if (cerContext?.precedentLabels && cerContext.precedentLabels.length > 0) {
    cerLines.push(`・學生引用的歷史治國根據：${cerContext.precedentLabels.join('、')}`);
  }

  const prompt = [
    '請你扮演清朝晚年時期的「乾隆皇帝」（以第一人稱「朕」自稱），使用香港繁體中文回應，語氣兼具帝王威嚴與溫和叮嚀，內容深淺適中，適合香港小學六年級常識科學生閱讀與理解。',
    '',
    '【歷史情境背景】',
    '我是一位剛完成《最後的皇朝：康雍乾盛世》探索學習的小學六年級學生，走訪了康熙（不分滿漢用人唯才）、雍正（嚴懲貪官、嚴查虧空充實國庫）與乾隆（平定準噶爾奠定版圖、六次遊江南耗費巨資、十次派兵軍費浩繁、晚年寵信貪官和珅、人口激增導致田地不足）的歷史現場。現在我向你呈上以下治國進諫：',
    ...(cerLines.length > 0 ? ['', '【學生的史料依據】', ...cerLines] : []),
    '',
    '【學生的進諫內容】',
    `「${advice}」`,
    '',
    '請你根據我的進諫內容，完成以下三項任務（請務必同時提供文字回應，並實際生成一張四格漫畫圖像）：',
    '',
    '1. 【乾隆皇帝的御批回應】：',
    '請以清朝晚年乾隆皇帝（「朕」）的身份，針對我的進諫內容作出具體回應（說明朕是否採納、內心的想法或當政的考量）。',
    '',
    '2. 【對清朝導致的後果推演】：',
    '請具體推演這項進諫對「清朝吏治」、「國庫財政」、「百姓民生」及「日後國勢發展」四方面所導致的後果（請用小六常識科學生易明的方式分點說明：若進諫具體可行，說明如何改善問題或延緩由盛轉衰；若進諫空泛、偏頗或有副作用，亦請誠實指出對清朝導致的不良影響），最後附上一句簡短的歷史反思鼓勵我。',
    '',
    '3. 【生成四格漫畫圖像】：',
    '請直接呼叫圖像生成功能，實際繪製並輸出一張「2x2 彩色歷史教育四格漫畫圖像」（不要只寫文字劇本，請務必生成圖片！畫風採用色彩鮮明、線條清晰的兒童歷史繪本／Q版卡通風格），將這項進諫的因果影響視覺化，四格內容依序為：',
    '・第 1 格（學生進諫）：穿越時空的小學生在宮殿向晚年乾隆皇帝呈上這項治國諫言；',
    '・第 2 格（皇帝決策）：乾隆皇帝在朝堂上針對這項進諫作出回應與決策；',
    '・第 3 格（朝政與民生變化）：展現這項決策對清朝官員吏治、國庫銀兩或百姓農田生活帶來的直接轉變；',
    '・第 4 格（大清國勢結果）：展現清朝日後國勢發展的最終後果，讓小學生一眼看懂這項進諫的影響（每格可配簡短清晰的繁體中文標題）。'
  ].join('\n');

  return { ok: true, prompt };
}
