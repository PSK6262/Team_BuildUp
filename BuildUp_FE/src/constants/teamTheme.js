// constants/teamTheme.js
export const TEAM_GLOW_COLORS = {
  LIVERPOOL: { hex: '#C8102E', glow: 'rgba(200, 16, 46, 0.7)' },
  MAN_CITY: { hex: '#6CABDD', glow: 'rgba(108, 171, 221, 0.8)' },
  MAN_UTD: { hex: '#DA291C', glow: 'rgba(218, 41, 28, 0.7)' },
  NEWCASTLE: { hex: '#C0C0C0', glow: 'rgba(192, 192, 192, 0.75)' },
  NOTTINGHAM: { hex: '#FF3B30', glow: 'rgba(255, 59, 48, 0.7)' },
  SUNDERLAND: { hex: '#E5A823', glow: 'rgba(229, 168, 35, 0.75)' },
  TOTTENHAM: { hex: '#001C58', glow: 'rgba(26, 68, 155, 0.8)' },
  BOURNEMOUTH: { hex: '#8F1D2C', glow: 'rgba(143, 29, 44, 0.75)' },
  ARSENAL: { hex: '#EF0107', glow: 'rgba(239, 1, 7, 0.75)' },
  ASTON_VILLA: { hex: '#670E36', glow: 'rgba(103, 14, 54, 0.8)' },
  BRENTFORD: { hex: '#FFA300', glow: 'rgba(255, 163, 0, 0.8)' },
  BRIGHTON: { hex: '#0057B8', glow: 'rgba(0, 87, 184, 0.75)' },
  CHELSEA: { hex: '#034694', glow: 'rgba(3, 70, 148, 0.8)' },
  COVENTRY: { hex: '#41B6E6', glow: 'rgba(65, 182, 230, 0.8)' },
  PALACE: { hex: '#1B458F', glow: 'rgba(27, 69, 143, 0.8)' },
  EVERTON: { hex: '#003399', glow: 'rgba(0, 51, 153, 0.8)' },
  FULHAM: { hex: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.75)' },
  WOLVES: { hex: '#FDB913', glow: 'rgba(253, 185, 19, 0.8)' },
  IPSWICH: { hex: '#002B7F', glow: 'rgba(0, 43, 127, 0.85)' },
  LEEDS: { hex: '#FFCD00', glow: 'rgba(255, 205, 0, 0.8)' },
};

const TEAM_ID_MAP = {
  57: 'ARSENAL',
  58: 'ASTON_VILLA',
  61: 'CHELSEA',
  62: 'EVERTON',
  63: 'FULHAM',
  64: 'LIVERPOOL',
  65: 'MAN_CITY',
  66: 'MAN_UTD',
  67: 'NEWCASTLE',
  71: 'SUNDERLAND',
  73: 'TOTTENHAM',
  322: 'WOLVES',
  341: 'LEEDS',
  349: 'IPSWICH',
  351: 'NOTTINGHAM',
  354: 'PALACE',
  397: 'BRIGHTON',
  402: 'BRENTFORD',
  1044: 'BOURNEMOUTH',
  1076: 'COVENTRY',
};

/**
 * 팀 정보를 전달받아 해당 팀 고유의 테마 색상(hex) 및 네온 글로우(glow)를 반환합니다.
 * @param {object} team
 * @returns {{ hex: string, glow: string }}
 */
export function getTeamTheme(team) {
  if (!team) {
    return { hex: '#00ff87', glow: 'rgba(0, 255, 135, 0.75)' };
  }

  // 1. teamId 기반 매핑
  if (team.teamId && TEAM_ID_MAP[team.teamId]) {
    const key = TEAM_ID_MAP[team.teamId];
    if (TEAM_GLOW_COLORS[key]) return TEAM_GLOW_COLORS[key];
  }

  // 2. 영문/한글 이름 키워드 기반 매핑
  const name = ((team.teamName || '') + ' ' + (team.teamNameKor || '')).toLowerCase();
  if (name.includes('liverpool') || name.includes('리버풀')) return TEAM_GLOW_COLORS.LIVERPOOL;
  if (name.includes('manchester city') || name.includes('맨체스터 시티') || name.includes('맨시티')) return TEAM_GLOW_COLORS.MAN_CITY;
  if (name.includes('manchester united') || name.includes('맨체스터 유나이티드') || name.includes('맨유')) return TEAM_GLOW_COLORS.MAN_UTD;
  if (name.includes('newcastle') || name.includes('뉴캐슬')) return TEAM_GLOW_COLORS.NEWCASTLE;
  if (name.includes('nottingham') || name.includes('노팅엄')) return TEAM_GLOW_COLORS.NOTTINGHAM;
  if (name.includes('sunderland') || name.includes('선덜랜드')) return TEAM_GLOW_COLORS.SUNDERLAND;
  if (name.includes('tottenham') || name.includes('토트넘')) return TEAM_GLOW_COLORS.TOTTENHAM;
  if (name.includes('bournemouth') || name.includes('본머스')) return TEAM_GLOW_COLORS.BOURNEMOUTH;
  if (name.includes('arsenal') || name.includes('아스널') || name.includes('아스날')) return TEAM_GLOW_COLORS.ARSENAL;
  if (name.includes('aston villa') || name.includes('아스톤 빌라') || name.includes('아스톤빌라')) return TEAM_GLOW_COLORS.ASTON_VILLA;
  if (name.includes('brentford') || name.includes('브렌트포드')) return TEAM_GLOW_COLORS.BRENTFORD;
  if (name.includes('brighton') || name.includes('브라이튼')) return TEAM_GLOW_COLORS.BRIGHTON;
  if (name.includes('chelsea') || name.includes('첼시')) return TEAM_GLOW_COLORS.CHELSEA;
  if (name.includes('coventry') || name.includes('코벤트리')) return TEAM_GLOW_COLORS.COVENTRY;
  if (name.includes('palace') || name.includes('팰리스') || name.includes('크리스탈')) return TEAM_GLOW_COLORS.PALACE;
  if (name.includes('everton') || name.includes('에버튼')) return TEAM_GLOW_COLORS.EVERTON;
  if (name.includes('fulham') || name.includes('풀럼')) return TEAM_GLOW_COLORS.FULHAM;
  if (name.includes('wolves') || name.includes('울버햄튼') || name.includes('울브스') || name.includes('hull') || name.includes('헐 시티')) return TEAM_GLOW_COLORS.WOLVES;
  if (name.includes('ipswich') || name.includes('입스위치')) return TEAM_GLOW_COLORS.IPSWICH;
  if (name.includes('leeds') || name.includes('리즈')) return TEAM_GLOW_COLORS.LEEDS;

  // 기본 프리미어리그 네온 그린 fallback
  return { hex: '#00ff87', glow: 'rgba(0, 255, 135, 0.75)' };
}

