// 2026/27 시즌 기준. DB 연동 시 TEAMS 응답으로 교체하며 slug는 DB ID가 아닙니다.
// 출처: https://www.premierleague.com/en/news/4675508/premier-league-fixture-schedulereleased-for-season-202627
import teamsData from '../../Assets/data/teamsData.js'

const teamIds = { arsenal: 2, 'aston-villa': 3, bournemouth: 1, brentford: 4, brighton: 5, chelsea: 6, coventry: 7, 'crystal-palace': 8, everton: 9, fulham: 10, hull: 11, ipswich: 12, leeds: 13, liverpool: 14, 'man-city': 15, 'man-united': 16, newcastle: 17, nottingham: 18, sunderland: 19, tottenham: 20 }

export const communityTeams = [
  ['arsenal', '아스널'], ['aston-villa', '애스턴 빌라'], ['bournemouth', '본머스'],
  ['brentford', '브렌트퍼드'], ['brighton', '브라이턴'], ['chelsea', '첼시'],
  ['coventry', '코번트리 시티'], ['crystal-palace', '크리스털 팰리스'], ['everton', '에버턴'],
  ['fulham', '풀럼'], ['hull', '헐 시티'], ['ipswich', '입스위치 타운'],
  ['leeds', '리즈 유나이티드'], ['liverpool', '리버풀'], ['man-city', '맨체스터 시티'],
  ['man-united', '맨체스터 유나이티드'], ['newcastle', '뉴캐슬 유나이티드'],
  ['nottingham', '노팅엄 포리스트'], ['sunderland', '선덜랜드'], ['tottenham', '토트넘'],
].map(([slug, name]) => {
  // 이름 표기 차이와 무관하게 공통 팀 데이터의 ID로 엠블럼을 연결합니다.
  const team = teamsData.find((item) => item.teamId === teamIds[slug])
  return { slug, name, teamId: team?.teamId, emblemUrl: team?.emblemUrl }
})
