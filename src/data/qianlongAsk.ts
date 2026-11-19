const MAX_REPLY_CHARS = 40;

const UNRELATED_REPLY =
  '且慢。請改問康熙、雍正、乾隆或清朝盛世與轉弱之事。';

const INAPPROPRIATE_REPLY =
  '此問不宜。請改問康熙、雍正、乾隆或清朝史事。';

const TOPIC_FALLBACK_REPLY =
  '清朝事繁。且問康熙用人、雍正吏治，或朕用兵與南巡之得失。';

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

const TOPIC_KEYWORDS = [
  '康熙',
  '雍正',
  '乾隆',
  '清朝',
  '滿族',
  '漢族',
  '盛世',
  '轉弱',
  '國力',
  '國庫',
  '貪官',
  '虧空',
  '吏治',
  '準噶爾',
  '版圖',
  '南巡',
  '江南',
  '派兵',
  '軍費',
  '和珅',
  '農',
  '田',
  '人才',
  '反抗',
  '財政',
  '虛耗',
  '遊江南',
  '十次',
  '六次',
  '七十',
  '滿漢',
  '任用',
  '誰建',
  '哪個民族',
  '平定',
  '貪污',
  '受賄',
  '人口',
  '收成',
  '盛轉衰',
  '衰落',
  '強盛',
  '為甚麼弱',
  '為何弱',
  '為甚麼盛',
  '為何盛'
];

interface RuleEntry {
  match: (q: string) => boolean;
  answer: string;
}

const RULES: RuleEntry[] = [
  {
    match: (q) =>
      includesAny(q, ['盛轉衰', '轉弱', '為甚麼弱', '為何弱', '衰落', '由盛轉衰']),
    answer: '版圖雖定，惟南巡與連年用兵虛耗國力，遂由盛轉弱。'
  },
  {
    match: (q) =>
      includesAny(q, ['滿族建立', '誰建', '哪個民族']),
    answer: '清朝由滿族建立；康熙善用各族人才，國基始固。'
  },
  {
    match: (q) =>
      includesAny(q, ['反抗', '漢族士人']),
    answer: '漢族士人見有出仕之路，反抗意識便漸漸消除。'
  },
  {
    match: (q) =>
      includesAny(q, ['康熙', '滿漢', '人才', '任用']),
    answer: '朕祖康熙任用不分滿漢，士人得用，國乃安定。'
  },
  {
    match: (q) =>
      includesAny(q, ['和珅', '受賄']) ||
      (q.includes('貪污') && !q.includes('雍正')),
    answer: '晚年朝中有人受賄壞吏治；盛世之下，隱憂已生。'
  },
  {
    match: (q) =>
      includesAny(q, ['雍正', '貪官', '虧空', '吏治']),
    answer: '朕父雍正嚴懲貪官、嚴查虧空，吏治清明，國庫得充。'
  },
  {
    match: (q) =>
      includesAny(q, ['國庫', '財政']),
    answer: '整頓虧空後國庫充實，財政改善，此乃盛世之基。'
  },
  {
    match: (q) => q.includes('七十'),
    answer: '康雍約七十多年治理，國家日漸繁榮，乃盛世根基。'
  },
  {
    match: (q) =>
      includesAny(q, ['準噶爾', '版圖', '平定']),
    answer: '朕平定準噶爾，奠定版圖；然征戰亦耗國力，不可不知。'
  },
  {
    match: (q) =>
      includesAny(q, ['南巡', '江南', '遊江南', '六次']),
    answer: '朕六次遊江南，可知民情、治河道，惟花費亦甚大。'
  },
  {
    match: (q) =>
      includesAny(q, ['十次', '派兵', '軍費', '虛耗']),
    answer: '十次派兵軍費巨大，虛耗康雍積蓄，國力由是轉弱。'
  },
  {
    match: (q) =>
      includesAny(q, ['農', '田', '人口', '收成']),
    answer: '人口日眾而田不足，民生艱苦，亦見盛世轉弱之兆。'
  },
  {
    match: (q) =>
      includesAny(q, ['盛世', '為甚麼盛', '為何盛', '強盛']),
    answer: '康雍任賢懲貪，國庫充實；朕承其業，盛世一時達巔。'
  }
];

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function clampUnicodeChars(str: string, maxChars: number): string {
  const codePoints = Array.from(str);
  if (codePoints.length <= maxChars) {
    return str;
  }
  return codePoints.slice(0, maxChars).join('');
}

export function askQianlong(rawQuestion: string): string {
  const q = rawQuestion.trim();

  if (!q) {
    return clampUnicodeChars(UNRELATED_REPLY, MAX_REPLY_CHARS);
  }

  if (includesAny(q, BLOCKED_WORDS)) {
    return clampUnicodeChars(INAPPROPRIATE_REPLY, MAX_REPLY_CHARS);
  }

  const hitsTopic = includesAny(q, TOPIC_KEYWORDS);
  if (!hitsTopic) {
    return clampUnicodeChars(UNRELATED_REPLY, MAX_REPLY_CHARS);
  }

  for (const rule of RULES) {
    if (rule.match(q)) {
      return clampUnicodeChars(rule.answer, MAX_REPLY_CHARS);
    }
  }

  return clampUnicodeChars(TOPIC_FALLBACK_REPLY, MAX_REPLY_CHARS);
}
