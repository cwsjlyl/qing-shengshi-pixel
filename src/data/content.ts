export type StageId = 'kangxi' | 'yongzheng' | 'qianlong';

export interface QuizItem {
  question: string;
  correct: string;
  wrongs: [string, string];
}

export interface NpcContent {
  id: string;
  name: string;
  lines: string[];
  requiredForStage: boolean;
}

export interface StageConfig {
  id: StageId;
  stageName: string;
  shortTitle: string;
  password: string;
  lockedExitMessage: string;
  evidenceReadyMessage: string;
  npcs: Record<string, NpcContent>;
  minigames: {
    id: string;
    stationName: string;
    sceneKey: string;
  }[];
  quizzes: [QuizItem, QuizItem, QuizItem];
}

export const TITLE = '最後的皇朝：康雍乾盛世';

export const MODE_SEQUENTIAL_LABEL = '由康熙順序探索';
export const MODE_CLASS_LABEL = '課堂分關';
export const MODE_REMONSTRATE_LABEL = '向乾隆進諫';

export const OPENING_BLURB =
  '你將由現代返回清朝，走進康雍乾盛世，蒐集證據，思考國勢由盛轉衰。';

export const OPENING_TASK = '清朝早期為甚麼會出現盛世？後來有甚麼轉變？';

export const STAGE_ORDER: StageId[] = ['kangxi', 'yongzheng', 'qianlong'];

export const STAGE_NAMES: Record<StageId, string> = {
  kangxi: '康熙（宮殿庭院）',
  yongzheng: '雍正（大殿）',
  qianlong: '乾隆（戶外）'
};

// 僅供程式內部驗證比對
export const FINAL_TEACHER_PASSWORD = '111';

export const PROMPTS = {
  QUIZ_PASSED: '答對了！請在出口輸入密碼，繼續行程。',
  QIANLONG_AFTER_789_ARROW:
    '密碼正確。請跟著箭嘴再找乾隆皇帝，聽取最後挑戰的指示。',
  FIND_QIANLONG_AGAIN: '請再找乾隆皇帝，準備向乾隆進諫。',
  QIANLONG_WAIT_TEACHER:
    '證據與題目都完成了。請等待老師的指示輸入最後密碼，向朕進獻治國諫言；之後你便可以返回現代。',
  TEACHER_PASSWORD_HINT:
    '這是老師提供的最後密碼。答對後便可向乾隆皇帝進諫。',
  QIANLONG_FINAL_ASK_LINE:
    '你走訪了康熙、雍正與朕三朝，見證了盛世與晚年隱憂。請寫下你想向朕進獻的諫言，系統會為你輸出專屬 Prompt，讓你複製貼到 Gemini 查看朕的回應及對清朝導致的後果！',
  ASK_QIANLONG_HUD: '請向乾隆皇帝進諫並複製 Gemini 指令；完成後便可返回現代。',
  CLASS_STAGE_DONE: '本關完成。請返回課堂分關，準備用證據教組員。',
  ENDING_RETURNED:
    '你已返回現代。回想剛才的證據：早期康雍乾治國有方，國勢強盛；乾隆晚年國勢轉弱。',
  ENDING_REFLECTION:
    '請將剛才複製的「向乾隆進諫 Prompt」貼到你的 Gemini，看看乾隆皇帝如何回應你的進諫，以及令清朝導致甚麼後果！',
  ENDING_SUMMARY:
    '本課小結：早期康熙、雍正、乾隆治國有方，國勢強盛；乾隆晚年國勢轉弱。',
  CONTROLS_GUIDE:
    'iPad／手機請拖曳左下角「圓形虛擬搖桿」移動，點按右下角「調查／傾談」鍵互動；電腦可用 WASD／方向鍵移動，空白鍵或 Enter 調查／傾談。'
} as const;

export const STAGES: Record<StageId, StageConfig> = {
  kangxi: {
    id: 'kangxi',
    stageName: '康熙（宮殿庭院）',
    shortTitle: '康熙朝',
    password: '111',
    lockedExitMessage:
      '大門仍然鎖上。請先與康熙皇帝、滿族人和漢族人傾談，收集證據。',
    evidenceReadyMessage: '證據已齊全。請跟著箭嘴走到出口，回答三條問題。',
    npcs: {
      kangxi_emperor: {
        id: 'kangxi_emperor',
        name: '康熙皇帝',
        lines: ['無論是滿族人還是漢族人，只要是人才，朕一律任用。'],
        requiredForStage: true
      },
      manchu_person: {
        id: 'manchu_person',
        name: '滿族人',
        lines: [
          '皇上任用人才時，不分滿族還是漢族。只要是人才，都會得到任用。這樣能讓更多有才能的人為朝廷做事。',
          '這樣做也很重要：漢族讀書人看到自己同樣有機會出仕，反抗意識便漸漸消除了。'
        ],
        requiredForStage: true
      },
      han_person: {
        id: 'han_person',
        name: '漢族人',
        lines: [
          '清朝由滿族建立。起初不少漢族士人並不願意效忠朝廷。',
          '皇上任用不分種族，漢族士人也有機會發揮才能，反抗意識便消除了，國家才能安定下來。'
        ],
        requiredForStage: true
      }
    },
    minigames: [
      {
        id: 'talent_game',
        stationName: '用人唯才挑戰',
        sceneKey: 'TalentMinigame'
      }
    ],
    quizzes: [
      {
        question: '康熙任用人才的原則是甚麼？',
        correct: '只要是人才，不論滿族還是漢族都會任用',
        wrongs: ['只任用滿族人', '只任用漢族人']
      },
      {
        question: '康熙這樣做，對當時有甚麼重要作用？',
        correct: '消除漢族士人的反抗意識',
        wrongs: ['開放五個通商口岸', '六次遊江南']
      },
      {
        question: '清朝是由哪個民族建立的？',
        correct: '滿族',
        wrongs: ['漢族', '蒙古族']
      }
    ]
  },

  yongzheng: {
    id: 'yongzheng',
    stageName: '雍正（大殿）',
    shortTitle: '雍正朝',
    password: '111',
    lockedExitMessage:
      '出口仍然鎖上。請先與雍正皇帝、貪官傾談，並調查國庫線索。',
    evidenceReadyMessage: '證據已齊全。請跟著箭嘴走到出口，回答三條問題。',
    npcs: {
      yongzheng_emperor: {
        id: 'yongzheng_emperor',
        name: '雍正皇帝',
        lines: [
          '朕要嚴懲貪官，掃除朝廷內的貪污風氣。',
          '朕會嚴查虧空，把貪去的銀兩追回來，充實國庫，改善國家財政。'
        ],
        requiredForStage: true
      },
      corrupt_a: {
        id: 'corrupt_a',
        name: '貪官甲',
        lines: ['皇上嚴懲貪官，又嚴查虧空……臣再也不敢貪污了。'],
        requiredForStage: true
      },
      corrupt_b: {
        id: 'corrupt_b',
        name: '貪官乙',
        lines: [
          '以前我虧空公款，現在被查得清清楚楚。朝廷的貪污風氣真的被掃除了。'
        ],
        requiredForStage: true
      },
      treasury_clue: {
        id: 'treasury_clue',
        name: '國庫線索',
        lines: [
          '整頓之後，國庫重新充實，吏治變得清明，國家財政也改善了。旁邊這個官員再也不敢抬頭了。'
        ],
        requiredForStage: true
      }
    },
    minigames: [
      {
        id: 'whack_game',
        stationName: '打擊貪官挑戰',
        sceneKey: 'WhackMinigame'
      }
    ],
    quizzes: [
      {
        question: '雍正整頓吏治的主要做法是甚麼？',
        correct: '嚴懲貪官、嚴查虧空',
        wrongs: ['六次遊江南', '寵信和珅']
      },
      {
        question: '雍正整頓貪污後，對國家有甚麼好處？',
        correct: '充實國庫、吏治清明、改善財政',
        wrongs: ['人口大幅增加', '把香港島割讓']
      },
      {
        question: '經歷康熙、雍正兩代共約多少年的治理，國家繁榮起來？',
        correct: '七十多年',
        wrongs: ['十年', '三百年']
      }
    ]
  },

  qianlong: {
    id: 'qianlong',
    stageName: '乾隆（戶外）',
    shortTitle: '乾隆朝',
    password: '111',
    lockedExitMessage:
      '還不能登船。請先走訪準噶爾平亂、和珅、農田和南巡船隊，收集全部證據。',
    evidenceReadyMessage: '證據已齊全。請跟著箭嘴走到碼頭御船，回答三條問題。',
    npcs: {
      qianlong_emperor: {
        id: 'qianlong_emperor',
        name: '乾隆皇帝',
        lines: [
          '朕派兵平定了準噶爾叛亂，奠定了清朝的版圖！',
          '前後一共十次派兵，打了二十六年，雖然奠定了版圖，但軍費巨大，虛耗了康熙和雍正積累的國力。'
        ],
        requiredForStage: true
      },
      qing_soldier: {
        id: 'qing_soldier',
        name: '清兵',
        lines: [
          '我們奉皇上之命，平定準噶爾叛亂。這一仗過後，清朝的版圖更加穩固，可說是盛世的高峰。'
        ],
        requiredForStage: true
      },
      heshen: {
        id: 'heshen',
        name: '和珅',
        lines: [
          '嘿嘿，這些禮物我都收下了。皇上晚年寵信我，誰敢追究我受賄？',
          '國庫的銀兩？那些事情……你就不必多問了。'
        ],
        requiredForStage: true
      },
      farmer: {
        id: 'farmer',
        name: '農夫',
        lines: [
          '人口越來越多，田地卻不足夠。你看這些田，泥土都裂開了，收成很少，生活很艱苦。'
        ],
        requiredForStage: true
      },
      southern_fleet: {
        id: 'southern_fleet',
        name: '南巡船隊',
        lines: [
          '皇上曾經六次遊江南。江南是長江三角洲一帶，包括江蘇、浙江，例如揚州、蘇州、杭州、南京等。',
          '南巡花費龐大，耗用人力物力；但同時也能瞭解江南民情、治理河道，為當地帶來安定。'
        ],
        requiredForStage: true
      }
    },
    minigames: [
      {
        id: 'archery_game',
        stationName: '射箭平亂挑戰',
        sceneKey: 'ArcheryMinigame'
      },
      {
        id: 'tour_game',
        stationName: '六下江南挑戰',
        sceneKey: 'SouthernTourMinigame'
      }
    ],
    quizzes: [
      {
        question: '乾隆派兵平定準噶爾叛亂，主要意義是甚麼？',
        correct: '奠定清朝的版圖',
        wrongs: ['開辦新學堂', '銷毀鴉片']
      },
      {
        question: '乾隆皇帝曾經多少次遊江南？',
        correct: '六次',
        wrongs: ['十次', '一次']
      },
      {
        question: '為甚麼十次派兵作戰後來也令國力虛耗？',
        correct: '軍費巨大，用盡康熙和雍正積累的國力',
        wrongs: ['士兵都改去江南遊玩', '因為簽訂了《南京條約》']
      }
    ]
  }
};
