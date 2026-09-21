import fallbackBundle from './teamDbFallback.json';

// DB TEAMS 테이블 스냅샷 매핑 맵
const dbTeamsMap = new Map(
  (fallbackBundle.teams || []).map((t) => [Number(t.teamId), t])
);

/**
 * DB TEAMS 테이블의 EMBLEM_URL 조회 헬퍼
 */
export function getDbEmblemUrl(teamId, liveTeams = []) {
  const numId = Number(teamId);
  if (Array.isArray(liveTeams) && liveTeams.length > 0) {
    const liveTeam = liveTeams.find((t) => Number(t.teamId) === numId);
    if (liveTeam?.emblemUrl) return liveTeam.emblemUrl;
  }

  const fallbackTeam = dbTeamsMap.get(numId);
  if (fallbackTeam?.emblemUrl) return fallbackTeam.emblemUrl;

  return '';
}

// 1. 기본 7문항 데이터 (Q1 ~ Q7)
export const BASE_QUESTIONS = [
  {
    id: 1,
    category: "도파민 vs 실리",
    title: "경기를 볼 때 내가 원하는 승리의 맛은?",
    optionA: { label: "지더라도 90분 내내 심장 터지는 난타전과 극장골!", value: 'A' },
    optionB: { label: "수명 깎이기 싫어, 확실하고 깔끔한 완승!", value: 'B' }
  },
  {
    id: 2,
    category: "클럽 철학",
    title: "내가 선호하는 구단의 영입 및 운영 스타일은?",
    optionA: { label: "돈이 곧 파워! 월드클래스 슈퍼스타 대거 영입!", value: 'A' },
    optionB: { label: "흙 속의 진주 발굴! 데이터 분석과 유스 육성의 낭만!", value: 'B' }
  },
  {
    id: 3,
    category: "전술 템포",
    title: "내가 가장 매료되는 피치 위의 경기 템포는?",
    optionA: { label: "숨 막히게 몰아치는 미친 전방 압박과 헤비메탈 축구!", value: 'A' },
    optionB: { label: "공을 쥐고 상대를 서서히 말려 죽이는 정교한 지공 패스!", value: 'B' }
  },
  {
    id: 4,
    category: "클럽 서사",
    title: "내 가슴을 뛰게 하는 구단의 위상과 스토리는?",
    optionA: { label: "언제나 리그 정상과 유럽 챔피언스리그 우승을 노리는 초거함!", value: 'A' },
    optionB: { label: "거인을 무너뜨리며 반란을 쓰는 다크호스 & 끈질긴 생존자!", value: 'B' }
  },
  {
    id: 5,
    category: "스타디움",
    title: "내가 직접 찾아가고 싶은 홈구장의 분위기는?",
    optionA: { label: "벽돌 틈마다 거친 함성과 광기가 살아있는 유서 깊은 요새!", value: 'A' },
    optionB: { label: "최신식 인프라와 쾌적한 시설을 갖춘 세련된 메가 돔!", value: 'B' }
  },
  {
    id: 6,
    category: "연고지 바이브",
    title: "더 끌리는 팀의 연고지 분위기는?",
    optionA: { label: "문화와 트렌드의 중심! 화려한 런던 및 수도권!", value: 'A' },
    optionB: { label: "거칠지만 뼛속까지 축구 열정으로 가득 찬 북부/중부 도시!", value: 'B' }
  },
  {
    id: 7,
    category: "시그니처 컬러",
    title: "내가 서포터석에서 입고 싶은 유니폼 컬러는?",
    optionA: { label: "심장을 뛰게 하는 강렬한 붉은색/따뜻한 톤 (Red, Claret, Yellow)", value: 'A' },
    optionB: { label: "차갑고 세련된 푸른색/무채색 톤 (Blue, White, Stripes)", value: 'B' }
  }
];

// 하위 호환용 별칭
export const QUIZ_QUESTIONS = BASE_QUESTIONS;

// 2. 서든데스 타이브레이커 3문항 (T1 ~ T3)
export const TIE_BREAKER_QUESTIONS = {
  T1: {
    id: 'T1',
    badge: '엠블럼 심볼',
    title: '내 가슴을 뛰게 하는 구단의 상징(엠블럼)은?',
    optionA: { label: '사자, 악마, 호랑이처럼 맹렬하고 위압감 넘치는 야수!', value: 'A' },
    optionB: { label: '대포, 배, 꿀벌, 수탉처럼 역사와 개성이 담긴 시그니처 심볼!', value: 'B' }
  },
  T2: {
    id: 'T2',
    badge: '축구 소비 성향',
    title: '경기를 볼 때 내가 더 열광하는 요소는?',
    optionA: { label: '카리스마 넘치는 전술 천재 명장의 두뇌 싸움!', value: 'A' },
    optionB: { label: '그라운드를 뒤흔드는 에이스 스타플레이어의 슈퍼 플레이!', value: 'B' }
  },
  T3: {
    id: 'T3',
    badge: '시청 도파민',
    title: '금요일 밤 맥주 한 캔과 함께 원하는 경기는?',
    optionA: { label: '0-2로 끌려가도 후반 추가시간 뒤집는 극장 대역전극!', value: 'A' },
    optionB: { label: '전반 20분 만에 2골 넣고 편안하게 숙면각 잡는 무패 완승!', value: 'B' }
  }
};

// 3. 20개 구단 프로필 및 통합 매핑 데이터 (DB TEAMS 테이블 연계)
export const CLUBS_DATA = [
  {
    id: 'mancity',
    name: '맨체스터 시티',
    teamId: 65,
    baseAnswers: ['B', 'A', 'B', 'A', 'B', 'B', 'B'],
    tieAnswers: { T1: 'B', T2: 'A', T3: 'B' }, // 배 심볼 / 펩 명장 / 압도 완승
    emblemUrl: dbTeamsMap.get(65)?.emblemUrl || 'https://crests.football-data.org/65.png',
    description: '압도적인 점유율과 트로피를 쓸어 담는 완성형 북부 거함'
  },
  {
    id: 'arsenal',
    name: '아스널',
    teamId: 57,
    baseAnswers: ['B', 'A', 'B', 'A', 'B', 'A', 'A'],
    tieAnswers: { T1: 'B', T2: 'A', T3: 'B' }, // 대포 심볼 / 아르테타 / 실리 완승
    emblemUrl: dbTeamsMap.get(57)?.emblemUrl || 'https://crests.football-data.org/57.png',
    description: '런던의 자존심, 세련된 패스 축구와 탄탄한 수비 밸런스'
  },
  {
    id: 'liverpool',
    name: '리버풀',
    teamId: 64,
    baseAnswers: ['A', 'B', 'A', 'A', 'A', 'B', 'A'],
    tieAnswers: { T1: 'B', T2: 'A', T3: 'A' }, // 라이버버드 / 슬롯 명장 / 안필드 극장
    emblemUrl: dbTeamsMap.get(64)?.emblemUrl || 'https://crests.football-data.org/64.png',
    description: '안필드의 붉은 심장, 심장을 울리는 헤비메탈 전방 압박'
  },
  {
    id: 'manutd',
    name: '맨체스터 유나이티드',
    teamId: 66,
    baseAnswers: ['A', 'A', 'A', 'A', 'A', 'B', 'A'],
    tieAnswers: { T1: 'A', T2: 'B', T3: 'A' }, // 붉은 악마 / 스타 군단 / 극장골 본산
    emblemUrl: dbTeamsMap.get(66)?.emblemUrl || 'https://crests.football-data.org/66.png',
    description: '극장골의 원조, 영광의 역사를 되찾으려는 북부의 붉은 제국'
  },
  {
    id: 'chelsea',
    name: '첼시',
    teamId: 61,
    baseAnswers: ['A', 'A', 'B', 'A', 'B', 'A', 'B'],
    tieAnswers: { T1: 'A', T2: 'B', T3: 'A' }, // 푸른 사자 / 젊은 스타군단 / 화력 난타전
    emblemUrl: dbTeamsMap.get(61)?.emblemUrl || 'https://crests.football-data.org/61.png',
    description: '런던의 푸른 사자, 젊은 재능 폭풍 영입과 다이내믹 화력전'
  },
  {
    id: 'tottenham',
    name: '토트넘 홋스퍼',
    teamId: 73,
    baseAnswers: ['A', 'B', 'A', 'A', 'B', 'A', 'B'],
    tieAnswers: { T1: 'B', T2: 'B', T3: 'A' }, // 수탉 심볼 / 에이스 해결사 / 롤러코스터
    emblemUrl: dbTeamsMap.get(73)?.emblemUrl || 'https://crests.football-data.org/73.png',
    description: '런던 최첨단 메가 돔, 화끈한 공격 일변도 롤러코스터'
  },
  {
    id: 'newcastle',
    name: '뉴캐슬 유나이티드',
    teamId: 67,
    baseAnswers: ['A', 'A', 'A', 'B', 'A', 'B', 'B'],
    tieAnswers: { T1: 'A', T2: 'A', T3: 'A' }, // 해마/사자 모티브 / 하우 전술 / 광기 화력
    emblemUrl: dbTeamsMap.get(67)?.emblemUrl || 'https://crests.football-data.org/67.png',
    description: '오일머니와 북부 서포터즈의 광기가 합쳐진 신흥 맹주'
  },
  {
    id: 'astonvilla',
    name: '애스턴 빌라',
    teamId: 58,
    baseAnswers: ['A', 'A', 'B', 'B', 'A', 'B', 'A'],
    tieAnswers: { T1: 'A', T2: 'A', T3: 'A' }, // 사자 엠블럼 / 에메리 명장 / 매운맛 역습
    emblemUrl: dbTeamsMap.get(58)?.emblemUrl || 'https://crests.football-data.org/58.png',
    description: '버밍엄의 전통 명가, 빅클럽을 긴장시키는 치명적인 카운터'
  },
  {
    id: 'brighton',
    name: '브라이튼',
    teamId: 397,
    baseAnswers: ['A', 'B', 'B', 'B', 'B', 'A', 'B'],
    tieAnswers: { T1: 'B', T2: 'A', T3: 'B' }, // 갈매기 심볼 / 스마트 전술 / 머니볼 빌드업
    emblemUrl: dbTeamsMap.get(397)?.emblemUrl || 'https://crests.football-data.org/397.png',
    description: '남부 해안의 혁신, 머니볼 스카우팅과 스마트 빌드업'
  },
  {
    id: 'brentford',
    name: '브렌트퍼드',
    teamId: 402,
    baseAnswers: ['A', 'B', 'A', 'B', 'B', 'A', 'A'],
    tieAnswers: { T1: 'B', T2: 'A', T3: 'A' }, // 꿀벌 심볼 / 세트피스 전술 / 끈끈한 승부
    emblemUrl: dbTeamsMap.get(402)?.emblemUrl || 'https://crests.football-data.org/402.png',
    description: '데이터 사이언스 기반의 끈끈함, 세트피스 스페셜리스트'
  },
  {
    id: 'bournemouth',
    name: 'AFC 본머스',
    teamId: 1044,
    baseAnswers: ['A', 'B', 'A', 'B', 'A', 'A', 'A'],
    tieAnswers: { T1: 'B', T2: 'A', T3: 'A' }, // 선수 실루엣 심볼 / 무한 압박 전술 / 투혼
    emblemUrl: dbTeamsMap.get(1044)?.emblemUrl || 'https://crests.football-data.org/bournemouth.png',
    description: '남부 해안의 요새, 90분 내내 지치지 않는 전방 압박'
  },
  {
    id: 'palace',
    name: '크리스털 팰리스',
    teamId: 354,
    baseAnswers: ['A', 'B', 'A', 'B', 'A', 'A', 'B'],
    tieAnswers: { T1: 'A', T2: 'B', T3: 'A' }, // 독수리 엠블럼 / 측면 크랙 스타 / 거친 역습
    emblemUrl: dbTeamsMap.get(354)?.emblemUrl || 'https://crests.football-data.org/354.png',
    description: '런던에서 가장 뜨거운 셀허스트 파크, 날카로운 측면 파괴자'
  },
  {
    id: 'everton',
    name: '에버턴',
    teamId: 62,
    baseAnswers: ['A', 'B', 'A', 'B', 'A', 'B', 'B'],
    tieAnswers: { T1: 'B', T2: 'B', T3: 'A' }, // 루퍼트 타워 심볼 / 피지컬 스타 / 생존 투혼
    emblemUrl: dbTeamsMap.get(62)?.emblemUrl || 'https://crests.football-data.org/62.png',
    description: '머지사이드의 푸른 심장, 거친 투혼과 끈질긴 생존 본능'
  },
  {
    id: 'fulham',
    name: '풀럼',
    teamId: 63,
    baseAnswers: ['B', 'B', 'B', 'B', 'A', 'A', 'B'],
    tieAnswers: { T1: 'B', T2: 'A', T3: 'B' }, // FFC 모노그램 심볼 / 실바 전술 / 안정 밸런스
    emblemUrl: dbTeamsMap.get(63)?.emblemUrl || 'https://crests.football-data.org/63.png',
    description: '런던 템스강변 크레이븐 코티지의 고즈넉한 낭만과 밸런스 축구'
  },
  {
    id: 'nottingham',
    name: '노팅엄 포레스트',
    teamId: 351,
    baseAnswers: ['A', 'A', 'A', 'B', 'A', 'B', 'A'],
    tieAnswers: { T1: 'B', T2: 'B', T3: 'A' }, // 로빈후드 참나무 심볼 / 폭풍 역습 스타 / 챔피언 자부심
    emblemUrl: dbTeamsMap.get(351)?.emblemUrl || 'https://crests.football-data.org/351.png',
    description: '유럽 챔피언 역사를 품은 시티 그라운드, 매운맛 직선 역습'
  },
  {
    id: 'leeds',
    name: '리즈 유나이티드',
    teamId: 341,
    baseAnswers: ['A', 'B', 'A', 'B', 'A', 'B', 'B'],
    tieAnswers: { T1: 'B', T2: 'A', T3: 'A' }, // 화이트 로즈 심볼 / 불꽃 압박 전술 / 격정 팬덤
    emblemUrl: dbTeamsMap.get(341)?.emblemUrl || 'https://crests.football-data.org/341.png',
    description: '엘런드 로드의 거침없는 압박, 요크셔의 불꽃 군단'
  },
  {
    id: 'sunderland',
    name: '선덜랜드',
    teamId: 71,
    baseAnswers: ['A', 'B', 'A', 'B', 'A', 'B', 'A'],
    tieAnswers: { T1: 'A', T2: 'B', T3: 'A' }, // 블랙 캣츠(사자/고양이과) / 영건 스타들 / 서사의 낭만
    emblemUrl: dbTeamsMap.get(71)?.emblemUrl || 'https://crests.football-data.org/71.png',
    description: '뜨거운 팬덤의 서사, 빛의 경기장을 가득 채우는 유망주 열정'
  },
  {
    id: 'ipswich',
    name: '입스위치 타운',
    teamId: 349,
    baseAnswers: ['B', 'B', 'A', 'B', 'A', 'A', 'B'],
    tieAnswers: { T1: 'A', T2: 'A', T3: 'B' }, // 말(서퍽 펀치) 야수 / 매케나 전술 / 조직력 축구
    emblemUrl: dbTeamsMap.get(349)?.emblemUrl || 'https://crests.football-data.org/349.png',
    description: '조직력과 끈기로 무장한 동부의 파란 돌풍'
  },
  {
    id: 'coventry',
    name: '코번트리 시티',
    teamId: 1076,
    baseAnswers: ['B', 'B', 'B', 'B', 'A', 'B', 'B'],
    tieAnswers: { T1: 'A', T2: 'A', T3: 'B' }, // 피닉스/코끼리 맹수 / 끈끈한 실리 전술 / 부활 신화
    emblemUrl: dbTeamsMap.get(1076)?.emblemUrl || 'https://crests.football-data.org/1076.png',
    description: '긴 시련을 딛고 귀환한 스카이블루, 단단한 실리 축구'
  },
  {
    id: 'hullcity',
    name: '헐 시티',
    teamId: 322,
    baseAnswers: ['B', 'B', 'B', 'B', 'A', 'B', 'A'],
    tieAnswers: { T1: 'A', T2: 'B', T3: 'B' }, // 호랑이(타이거즈) 맹수 / 해결사 본능 / 냉철 카운터
    emblemUrl: dbTeamsMap.get(322)?.emblemUrl || 'https://crests.football-data.org/322.png',
    description: '요크셔의 호랑이, 냉철한 경기 운영과 한 방 카운터'
  }
];

// 하위 호환성용 별칭
export const CLUB_PROFILES = CLUBS_DATA;
export const EXTENDED_CLUB_PROFILES = CLUBS_DATA;

/**
 * 기본 7문항에 대한 채점 및 동점 후보군 추출
 * @param {('A'|'B')[]} userAnswers 
 * @param {Array<any>} liveTeams 
 * @returns {{ highestScore: number, matchPercentage: number, topClubs: Array<any>, allScored: Array<any> }}
 */
export function evaluateBaseAnswers(userAnswers, liveTeams = []) {
  if (!Array.isArray(userAnswers) || userAnswers.length === 0) {
    const firstClub = CLUBS_DATA[0];
    const dbEmblem = getDbEmblemUrl(firstClub.teamId, liveTeams);
    return {
      highestScore: 7,
      matchPercentage: 100,
      topClubs: [{ ...firstClub, emblemUrl: dbEmblem || firstClub.emblemUrl }],
      allScored: []
    };
  }

  const scoredClubs = CLUBS_DATA.map((club) => {
    let matchCount = 0;
    for (let i = 0; i < 7; i++) {
      if (userAnswers[i] && userAnswers[i] === club.baseAnswers[i]) {
        matchCount++;
      }
    }
    const dbEmblem = getDbEmblemUrl(club.teamId, liveTeams);
    return {
      club: {
        ...club,
        emblemUrl: dbEmblem || club.emblemUrl
      },
      score: matchCount,
      percentage: Math.round((matchCount / 7) * 100)
    };
  });

  scoredClubs.sort((a, b) => b.score - a.score);
  const highestScore = scoredClubs[0].score;
  const topMatches = scoredClubs.filter((item) => item.score === highestScore).map((item) => item.club);

  return {
    highestScore,
    matchPercentage: scoredClubs[0].percentage,
    topClubs: topMatches,
    allScored: scoredClubs
  };
}

/**
 * 동점인 구단들을 분별할 수 있는 타이브레이커 질문 목록 선별 (T1, T2, T3)
 * @param {Array<typeof CLUBS_DATA[0]>} candidateClubs 
 * @returns {Array<typeof TIE_BREAKER_QUESTIONS[keyof typeof TIE_BREAKER_QUESTIONS]>}
 */
export function findDifferentiatingTieBreakers(candidateClubs) {
  if (!Array.isArray(candidateClubs) || candidateClubs.length <= 1) {
    return [];
  }

  const keys = ['T1', 'T2', 'T3'];
  const differentiating = [];

  for (const qKey of keys) {
    const question = TIE_BREAKER_QUESTIONS[qKey];

    const values = new Set();
    let countA = 0;
    let countB = 0;

    for (const club of candidateClubs) {
      const val = club.tieAnswers?.[qKey];
      if (val) {
        values.add(val);
        if (val === 'A') countA++;
        if (val === 'B') countB++;
      }
    }

    // A와 B가 모두 존재해야 변별력 있는 질문
    if (values.has('A') && values.has('B')) {
      const balanceDiff = Math.abs(countA - countB);
      differentiating.push({
        question,
        balanceDiff
      });
    }
  }

  // 50:50으로 가장 균형 있게 가르는 순서로 정렬
  differentiating.sort((a, b) => a.balanceDiff - b.balanceDiff);

  return differentiating.map((item) => item.question);
}

/**
 * 타이브레이커 응답으로 후보 구단 필터링
 * @param {Array<any>} candidates 
 * @param {'T1'|'T2'|'T3'} tieBreakerId 
 * @param {'A'|'B'} answer 
 * @returns {Array<any>}
 */
export function filterCandidatesByTieBreaker(candidates, tieBreakerId, answer) {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  const matched = candidates.filter((c) => c.tieAnswers?.[tieBreakerId] === answer);
  return matched.length > 0 ? matched : candidates;
}

/**
 * 단일 매칭 계산 함수 (기존 호환용)
 */
export function calculateBestMatch(userAnswers, liveTeams = []) {
  const { topClubs, matchPercentage } = evaluateBaseAnswers(userAnswers, liveTeams);
  const selected = topClubs[Math.floor(Math.random() * topClubs.length)];
  return {
    bestClub: selected,
    matchPercentage,
    topClubs
  };
}
