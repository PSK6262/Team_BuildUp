// 2026/27 시즌 기준. DB TEAMS 테이블과 연동되는 커뮤니티 구단 메타데이터
// 출처: https://www.premierleague.com/en/news/4675508/premier-league-fixture-schedulereleased-for-season-202627

const teamMeta = {
  arsenal: { teamId: 57, badge: 't3' },
  'aston-villa': { teamId: 58, badge: 't7' },
  bournemouth: { teamId: 1044, badge: 't91' },
  brentford: { teamId: 402, badge: 't94' },
  brighton: { teamId: 397, badge: 't36' },
  chelsea: { teamId: 61, badge: 't8' },
  coventry: { teamId: 1076, badge: 't9' },
  'crystal-palace': { teamId: 354, badge: 't31' },
  everton: { teamId: 62, badge: 't11' },
  fulham: { teamId: 63, badge: 't54' },
  hull: { teamId: 322, badge: 't88' },
  ipswich: { teamId: 349, badge: 't40' },
  leeds: { teamId: 341, badge: 't2' },
  liverpool: { teamId: 64, badge: 't14' },
  'man-city': { teamId: 65, badge: 't43' },
  'man-united': { teamId: 66, badge: 't1' },
  newcastle: { teamId: 67, badge: 't4' },
  nottingham: { teamId: 351, badge: 't17' },
  sunderland: { teamId: 71, badge: 't56' },
  tottenham: { teamId: 73, badge: 't6' },
};

export const TEAM_KOR_FULLNAMES = {
  57: '아스널 FC',
  58: '아스톤 빌라 FC',
  61: '첼시 FC',
  62: '에버튼 FC',
  63: '풀럼 FC',
  64: '리버풀 FC',
  65: '맨체스터 시티 FC',
  66: '맨체스터 유나이티드 FC',
  67: '뉴캐슬 유나이티드 FC',
  71: '선덜랜드 AFC',
  73: '토트넘 홋스퍼 FC',
  322: '헐 시티 AFC',
  341: '리즈 유나이티드 FC',
  349: '입스위치 타운 FC',
  351: '노팅엄 포레스트 FC',
  354: '크리스탈 팰리스 FC',
  397: '브라이튼 앤 호브 알비온 FC',
  402: '브렌트포드 FC',
  1044: 'AFC 본머스',
  1076: '코벤트리 시티 FC',
};

export const TEAM_NAME_TO_KOR_FULLNAME = {
  'Arsenal FC': '아스널 FC',
  'Arsenal': '아스널 FC',
  'Aston Villa FC': '아스톤 빌라 FC',
  'Aston Villa': '아스톤 빌라 FC',
  'Chelsea FC': '첼시 FC',
  'Chelsea': '첼시 FC',
  'Everton FC': '에버튼 FC',
  'Everton': '에버튼 FC',
  'Fulham FC': '풀럼 FC',
  'Fulham': '풀럼 FC',
  'Liverpool FC': '리버풀 FC',
  'Liverpool': '리버풀 FC',
  'Manchester City FC': '맨체스터 시티 FC',
  'Manchester City': '맨체스터 시티 FC',
  'Man City': '맨체스터 시티 FC',
  'Manchester United FC': '맨체스터 유나이티드 FC',
  'Manchester United': '맨체스터 유나이티드 FC',
  'Man United': '맨체스터 유나이티드 FC',
  'Newcastle United FC': '뉴캐슬 유나이티드 FC',
  'Newcastle United': '뉴캐슬 유나이티드 FC',
  'Newcastle': '뉴캐슬 유나이티드 FC',
  'Sunderland AFC': '선덜랜드 AFC',
  'Sunderland': '선덜랜드 AFC',
  'Tottenham Hotspur FC': '토트넘 홋스퍼 FC',
  'Tottenham Hotspur': '토트넘 홋스퍼 FC',
  'Tottenham': '토트넘 홋스퍼 FC',
  'Hull City AFC': '헐 시티 AFC',
  'Hull City': '헐 시티 AFC',
  'Hull': '헐 시티 AFC',
  'Leeds United FC': '리즈 유나이티드 FC',
  'Leeds United': '리즈 유나이티드 FC',
  'Leeds': '리즈 유나이티드 FC',
  'Ipswich Town FC': '입스위치 타운 FC',
  'Ipswich Town': '입스위치 타운 FC',
  'Ipswich': '입스위치 타운 FC',
  'Nottingham Forest FC': '노팅엄 포레스트 FC',
  'Nottingham Forest': '노팅엄 포레스트 FC',
  'Nottingham': '노팅엄 포레스트 FC',
  'Crystal Palace FC': '크리스탈 팰리스 FC',
  'Crystal Palace': '크리스탈 팰리스 FC',
  'Brighton & Hove Albion FC': '브라이튼 앤 호브 알비온 FC',
  'Brighton & Hove Albion': '브라이튼 앤 호브 알비온 FC',
  'Brighton': '브라이튼 앤 호브 알비온 FC',
  'Brentford FC': '브렌트포드 FC',
  'Brentford': '브렌트포드 FC',
  'AFC Bournemouth': 'AFC 본머스',
  'Bournemouth': 'AFC 본머스',
  'Coventry City FC': '코벤트리 시티 FC',
  'Coventry City': '코벤트리 시티 FC',
  'Coventry': '코벤트리 시티 FC',
  // 축약형 한글명 매핑
  '아스널': '아스널 FC',
  '애스턴 빌라': '아스톤 빌라 FC',
  '첼시': '첼시 FC',
  '에버턴': '에버튼 FC',
  '풀럼': '풀럼 FC',
  '리버풀': '리버풀 FC',
  '맨체스터 시티': '맨체스터 시티 FC',
  '맨체스터 유나이티드': '맨체스터 유나이티드 FC',
  '뉴캐슬 유나이티드': '뉴캐슬 유나이티드 FC',
  '뉴캐슬': '뉴캐슬 유나이티드 FC',
  '선덜랜드': '선덜랜드 AFC',
  '토트넘': '토트넘 홋스퍼 FC',
  '헐 시티': '헐 시티 AFC',
  '리즈 유나이티드': '리즈 유나이티드 FC',
  '입스위치 타운': '입스위치 타운 FC',
  '노팅엄 포리스트': '노팅엄 포레스트 FC',
  '노팅엄 포레스트': '노팅엄 포레스트 FC',
  '노팅엄': '노팅엄 포레스트 FC',
  '크리스털 팰리스': '크리스탈 팰리스 FC',
  '크리스탈 팰리스': '크리스탈 팰리스 FC',
  '브라이턴': '브라이튼 앤 호브 알비온 FC',
  '브렌트퍼드': '브렌트포드 FC',
  '본머스': 'AFC 본머스',
  '코번트리 시티': '코벤트리 시티 FC',
};

/**
 * 구단 ID 및 구단명을 기반으로 DB TEAMS 기준 한국어 풀네임을 반환하는 헬퍼 함수
 */
export function getTeamFullNameKor(teamId, fallback = '') {
  if (teamId && TEAM_KOR_FULLNAMES[teamId]) {
    return TEAM_KOR_FULLNAMES[teamId];
  }
  if (fallback && TEAM_NAME_TO_KOR_FULLNAME[String(fallback).trim()]) {
    return TEAM_NAME_TO_KOR_FULLNAME[String(fallback).trim()];
  }
  return fallback || '미정 구단';
}

export const communityTeams = [
  ['arsenal', '아스널'], ['aston-villa', '애스턴 빌라'], ['bournemouth', '본머스'],
  ['brentford', '브렌트퍼드'], ['brighton', '브라이턴'], ['chelsea', '첼시'],
  ['coventry', '코번트리 시티'], ['crystal-palace', '크리스털 팰리스'], ['everton', '에버턴'],
  ['fulham', '풀럼'], ['hull', '헐 시티'], ['ipswich', '입스위치 타운'],
  ['leeds', '리즈 유나이티드'], ['liverpool', '리버풀'], ['man-city', '맨체스터 시티'],
  ['man-united', '맨체스터 유나이티드'], ['newcastle', '뉴캐슬 유나이티드'],
  ['nottingham', '노팅엄 포리스트'], ['sunderland', '선덜랜드'], ['tottenham', '토트넘'],
].map(([slug, name]) => {
  const meta = teamMeta[slug];
  const tId = meta?.teamId;
  return {
    slug,
    name,
    fullNameKor: (tId && TEAM_KOR_FULLNAMES[tId]) || name,
    teamId: tId,
    emblemUrl: meta ? `https://resources.premierleague.com/premierleague/badges/50/${meta.badge}.png` : ''
  };
});
