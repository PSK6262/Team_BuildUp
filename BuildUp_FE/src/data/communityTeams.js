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
  return {
    slug,
    name,
    teamId: meta?.teamId,
    emblemUrl: meta ? `https://resources.premierleague.com/premierleague/badges/50/${meta.badge}.png` : ''
  };
});
