import { getFlagUrl } from '../utils/flagUtils.js';

// 기본 DB 팀 데이터 (백엔드 서버 미구동 시 개발 및 UI 렌더링 유지용 Fallback)
const FALLBACK_TEAMS = [
  {
    "teamId": 1044,
    "teamName": "AFC Bournemouth",
    "history": "1899년 보스컴 FC(Boscombe FC)로 창단되었으며, 1971년 현재의 명칭으로 변경되었다. 클럽 역사상 오랜 기간 하부 리그를 맴돌았으나 에디 하우 감독 체제에서 2015년 사상 처음으로 프리미어리그 승격을 달성했다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t91.png",
    "anthemUrl": "https://www.youtube.com/watch?v=_VU9DjQpvMQ=RD_VU9DjQpvMQ=1",
    "foundedYear": 1899,
    "updatedAt": "2026-09-17",
    "homeGround": "Vitality Stadium (Dean Court)",
    "manager": "Marco Rose",
    "managerNationality": "Germany"
  },
  {
    "teamId": 57,
    "teamName": "Arsenal",
    "history": "1886년 런던 울위치의 왕립 무기고 노동자들이 창단한 구단이다. 2003-04 시즌 잉글랜드 축구 역사상 유일한 '무패 우승(The Invincibles)'을 기록했으며 FA컵 최다 우승(14회) 기록을 보유하고 있다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t3.png",
    "anthemUrl": "https://www.youtube.com/watch?v=N8_m1XqypSQ=RDN8_m1XqypSQ=1",
    "foundedYear": 1886,
    "updatedAt": "2026-09-17",
    "homeGround": "Emirates Stadium",
    "manager": "Mikel Arteta",
    "managerNationality": "Spain"
  },
  {
    "teamId": 58,
    "teamName": "Aston Villa",
    "history": "1874년 창단되었으며 1888년 풋볼 리그 창립을 주도한 12개 원년 멤버 중 하나다. 1981-82 시즌 유러피언컵(현 UEFA 챔피언스리그) 우승을 차지한 잉글랜드 6개 구단 중 하나로 깊은 전통을 자랑한다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t7.png",
    "anthemUrl": "https://www.youtube.com/watch?v=cLO9N4lVo80=RDcLO9N4lVo80=1",
    "foundedYear": 1874,
    "updatedAt": "2026-09-17",
    "homeGround": "Villa Park",
    "manager": "Unai Emery",
    "managerNationality": "Spain"
  },
  {
    "teamId": 402,
    "teamName": "Brentford",
    "history": "1889년 창단되어 런던 서부를 연고지로 삼아왔다. 데이터 분석 기반의 머니볼 영입 및 운영 정책을 통해 반등에 성공하여 2021년 74년 만에 1부 리그로 복귀한 이후 탄탄한 전력을 유지하고 있다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t94.png",
    "anthemUrl": "https://www.youtube.com/watch?v=1Gq6mTI8SlU=RD1Gq6mTI8SlU=1",
    "foundedYear": 1889,
    "updatedAt": "2026-09-17",
    "homeGround": "Gtech community Stadium",
    "manager": "Keith Andrews",
    "managerNationality": "Ireland"
  },
  {
    "teamId": 397,
    "teamName": "Brighton  Albion",
    "history": "1901년 창단되었으며 별칭은 '갈매기(The Seagulls)'다. 1990년대 구단 파산 직전의 위기를 극복하고 아메리칸 익스프레스 스타디움 건립과 탁월한 스카우팅 시스템을 바탕으로 유럽 대항전 경쟁팀으로 도약했다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t36.png",
    "anthemUrl": "https://www.youtube.com/watch?v=rRpkuAG98KA",
    "foundedYear": 1901,
    "updatedAt": "2026-09-17",
    "homeGround": "American Express Stadium",
    "manager": "Fabian Hurzeler",
    "managerNationality": "Germany"
  },
  {
    "teamId": 61,
    "teamName": "Chelsea",
    "history": "1905년 창단된 런던 남서부를 대표하는 클럽이다. 2000년대 이후 공격적인 투자와 체계적인 유스 육성을 통해 프리미어리그 5회 우승 및 UEFA 챔피언스리그 2회 우승을 차지하며 현대 축구의 강호로 자리매김했다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t8.png",
    "anthemUrl": "https://www.youtube.com/watch?v=LTbZr7-X3To=RDLTbZr7-X3To=1",
    "foundedYear": 1905,
    "updatedAt": "2026-09-17",
    "homeGround": "Stamford Bridge",
    "manager": "Xavi Alonso",
    "managerNationality": "Spain"
  },
  {
    "teamId": 1076,
    "teamName": "Coventry City",
    "history": "1883년 자전거 공장 노동자들에 의해 싱어스 FC(Singers FC)로 창단된 후 1898년 코번트리 시티로 개칭했다. 1987년 FA컵 우승을 차지했으며 1992년 프리미어리그 출범 원년 멤버로 활약했다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t9.png",
    "anthemUrl": "https://www.youtube.com/watch?v=7miErQzz4Y8=RD7miErQzz4Y8=1",
    "foundedYear": 1883,
    "updatedAt": "2026-09-17",
    "homeGround": "Coventry Building Society Arena",
    "manager": "Frank Lampard",
    "managerNationality": "England"
  },
  {
    "teamId": 354,
    "teamName": "Crystal Palace",
    "history": "1905년 세계 최초의 만국박람회 건물인 수정궁(Crystal Palace) 노동자들을 주축으로 창단되었다. 런던 남부를 대표하는 구단으로, 열정적인 서포터즈 문화와 잉글랜드 남부 특유의 끈끈한 축구 스타일을 유지하고 있다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t31.png",
    "anthemUrl": "https://www.youtube.com/watch?v=GD1v_iDmc-k=RDGD1v_iDmc-k=1",
    "foundedYear": 1905,
    "updatedAt": "2026-09-17",
    "homeGround": "Selhurst Park",
    "manager": "Pierre Sage",
    "managerNationality": "France"
  },
  {
    "teamId": 62,
    "teamName": "Everton",
    "history": "1878년 세인트 도밍고 FC로 시작해 풋볼 리그 창립 멤버로 합류했다. 잉글랜드 1부 리그 최다 잔류 기록(120시즌 이상)을 보유한 유서 깊은 전통 클럽으로, 신축 전용구장으로 둥지를 옮겨 새 시대를 열었다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t11.png",
    "anthemUrl": "https://www.youtube.com/watch?v=OEekoV4en-g=RDOEekoV4en-g=1",
    "foundedYear": 1878,
    "updatedAt": "2026-09-17",
    "homeGround": "Hill Dickinson Stadium",
    "manager": "David Moyes",
    "managerNationality": "Scotland"
  },
  {
    "teamId": 63,
    "teamName": "Fulham",
    "history": "1879년 창단된 런던에서 가장 오래된 프로 축구 클럽 중 하나다. 템스 강변에 위치한 역사적인 크레이븐 코티지(Craven Cottage)를 홈으로 사용하며 매력적인 패스 축구로 입지를 굳혔다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t54.png",
    "anthemUrl": "https://www.youtube.com/watch?v=6v23tIwbBbU=RD6v23tIwbBbU=1",
    "foundedYear": 1879,
    "updatedAt": "2026-09-17",
    "homeGround": "Craven Cottage",
    "manager": "Álvaro Arbeloa",
    "managerNationality": "Spain"
  },
  {
    "teamId": 322,
    "teamName": "Hull City",
    "history": "1904년 창단되었으며 독특한 호랑이 무늬 스트라이프 유니폼 덕분에 '호랑이들(The Tigers)'이라는 별칭을 가졌다. 2008년 구단 역사상 처음으로 프리미어리그에 승격해 돌풍을 일으킨 바 있다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t88.png",
    "anthemUrl": "https://www.youtube.com/watch?v=-sSSHNp1UeE=RD-sSSHNp1UeE=1",
    "foundedYear": 1904,
    "updatedAt": "2026-09-17",
    "homeGround": "MKM Stadium",
    "manager": "Sergej Jakirovic",
    "managerNationality": "Bosnia and Herzegovina"
  },
  {
    "teamId": 349,
    "teamName": "Ipswich Town",
    "history": "1878년 창단되었으며 알프 램지 경과 바비 롭슨 경 등 잉글랜드 명장들이 팀을 이끌며 1961-62 1부 리그 우승 및 1980-81 UEFA컵 우승을 차지했던 서퍽 지역의 유서 깊은 강호다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t40.png",
    "anthemUrl": "https://www.youtube.com/watch?v=wJA8b3esxfE=RDwJA8b3esxfE=1",
    "foundedYear": 1878,
    "updatedAt": "2026-09-17",
    "homeGround": "Portman Road",
    "manager": "Gary O'Neil",
    "managerNationality": "England"
  },
  {
    "teamId": 341,
    "teamName": "Leeds United",
    "history": "1919년 리즈 시티 해체 이후 창단되었다. 돈 레비 감독 시절 잉글랜드 축구를 지배하며 황금기를 구가했고, 특유의 격렬하고 저돌적인 압박 축구와 두터운 충성 팬층으로 유명하다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t2.png",
    "anthemUrl": "https://www.youtube.com/watch?v=DuMyUh26twQ=RDDuMyUh26twQ=1",
    "foundedYear": 1919,
    "updatedAt": "2026-09-17",
    "homeGround": "Elland Road",
    "manager": "Daniel Farke",
    "managerNationality": "Germany"
  },
  {
    "teamId": 64,
    "teamName": "Liverpool",
    "history": "1892년 존 호울딩에 의해 창단되었다. 1부 리그 통산 19회 우승, UEFA 챔피언스리그 통산 6회 우승을 차지하며 잉글랜드를 대표하는 글로벌 메가 클럽이자 붉은 제국의 전통을 자랑한다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t14.png",
    "anthemUrl": "https://www.youtube.com/watch?v=naGYqb8n6QY=RDnaGYqb8n6QY=1",
    "foundedYear": 1892,
    "updatedAt": "2026-09-17",
    "homeGround": "Anfield",
    "manager": "Andoni Iraola",
    "managerNationality": "Spain"
  },
  {
    "teamId": 65,
    "teamName": "Manchester City",
    "history": "1880년 세인트 마크스(St. Mark's)로 창단된 후 1894년 현재의 명칭으로 재출범했다. 현대 축구에 이르러 전술적 혁신과 압도적인 리그 지배력을 구축하며 2022-23 시즌 트레블을 달성했다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t43.png",
    "anthemUrl": "https://www.youtube.com/watch?v=oJF6EUf9J_k=RDoJF6EUf9J_k=1",
    "foundedYear": 1894,
    "updatedAt": "2026-09-17",
    "homeGround": "Etihad Stadium",
    "manager": "Enzo Maresca",
    "managerNationality": "Italy"
  },
  {
    "teamId": 66,
    "teamName": "Manchester United",
    "history": "1878년 뉴턴 히스 LYR FC로 창단되어 1902년 맨체스터 유나이티드로 개칭했다. 맷 버스비와 알렉스 퍼거슨 감독 시대를 거치며 리그 최다 우승(20회)과 1998-99 트레블을 기록한 세계적인 명문 구단이다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t1.png",
    "anthemUrl": "https://www.youtube.com/watch?v=9XGMpo4Sk2k=RD9XGMpo4Sk2k=1",
    "foundedYear": 1878,
    "updatedAt": "2026-09-17",
    "homeGround": "Old Trafford",
    "manager": "Michael Carrick",
    "managerNationality": "England"
  },
  {
    "teamId": 67,
    "teamName": "Newcastle United",
    "history": "1892년 뉴캐슬 이스트엔드와 웨스트엔드가 합병해 출범했다. 잉글랜드 북동부 타인사이드 지역의 열렬한 지지를 받는 구단으로, 전통적인 흑백 세로 스트라이프와 세인트 제임스 파크의 열기가 상징적이다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t4.png",
    "anthemUrl": "https://www.youtube.com/watch?v=ECQQACr5ekw=RDECQQACr5ekw=1",
    "foundedYear": 1892,
    "updatedAt": "2026-09-17",
    "homeGround": "Stadium James' Park",
    "manager": "Matthias Jaissle",
    "managerNationality": "Germany"
  },
  {
    "teamId": 351,
    "teamName": "Nottingham Forest",
    "history": "1865년 창단된 역사 깊은 클럽으로, 브라이언 클러프 감독 체제에서 1978-79, 1979-80 시즌 2연속 유러피언컵 정상에 오르는 기적적인 신화를 작성했다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t17.png",
    "anthemUrl": "https://www.youtube.com/watch?v=Plhtk_XJqhM=RDPlhtk_XJqhM=1",
    "foundedYear": 1865,
    "updatedAt": "2026-09-17",
    "homeGround": "The City Ground",
    "manager": "Oliver Glasner",
    "managerNationality": "Austria"
  },
  {
    "teamId": 71,
    "teamName": "Sunderland",
    "history": "1879년 교사 제임스 앨런에 의해 창단되었으며 별칭은 '검은 고양이(The Black Cats)'다. 19세기 말 잉글랜드 리그를 지배하며 총 6회 1부 리그 우승을 거머쥔 북동부의 명문 구단이다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t56.png",
    "anthemUrl": "https://www.youtube.com/watch?v=LJRA8UrlqCM=RDLJRA8UrlqCM=1",
    "foundedYear": 1879,
    "updatedAt": "2026-09-17",
    "homeGround": "Stadium of Light",
    "manager": "Regis Le Bris",
    "managerNationality": "France"
  },
  {
    "teamId": 73,
    "teamName": "Tottenham Hotspur",
    "history": "1882년 북런던에서 창단되었으며 1960-61 시즌 20세기 최초로 리그와 FA컵을 동시 석권하는 더블을 기록했다. 공격적이고 화려한 축구 철학을 중시하며 최첨단 홈구장을 갖추고 있다.",
    "emblemUrl": "https://resources.premierleague.com/premierleague/badges/50/t6.png",
    "anthemUrl": "https://www.youtube.com/watch?v=GAdQkkY_Tow=RDGAdQkkY_Tow=1",
    "foundedYear": 1882,
    "updatedAt": "2026-09-17",
    "homeGround": "Tottenham Hotspur Stadium",
    "manager": "Roberto De Zerbi",
    "managerNationality": "Italy"
  }
];

// 창단연도 순수 연도(4자리 숫자) 정제 함수
function normalizeTeam(t) {
  if (!t) return null;
  let year = t.foundedYear;
  if (typeof year === 'string') {
    const match = year.match(/\d{4}/);
    year = match ? parseInt(match[0], 10) : 1900;
  }
  return {
    ...t,
    foundedYear: year,
    anthemUrl: t.anthemUrl || t.anithemUrl,
  };
}

/**
 * 1. 전체 구단 목록 조회 (GET /api/teams)
 */
export async function getTeams() {
  try {
    const res = await fetch('/api/teams');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(normalizeTeam);
      }
    }
  } catch (err) {
    console.warn('[teamApi] 백엔드(/api/teams) 응답 없음, 기본 DB 스냅샷 사용:', err.message);
  }
  return FALLBACK_TEAMS.map(normalizeTeam);
}

/**
 * 2. 특정 구단 상세 조회 (GET /api/teams/{teamId})
 */
export async function getTeamById(teamId) {
  const numId = parseInt(teamId, 10);
  try {
    const res = await fetch(`/api/teams/${numId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.teamId) {
        return normalizeTeam(data);
      }
    }
  } catch (err) {
    console.warn(`[teamApi] 백엔드(/api/teams/${numId}) 응답 없음, 기본 DB 스냅샷 사용:`, err.message);
  }

  const fallback = FALLBACK_TEAMS.find((t) => t.teamId === numId);
  return normalizeTeam(fallback);
}

/**
 * 3. 특정 구단 소속 선수단 조회 (GET /api/teams/{teamId}/players)
 */
export async function getTeamPlayers(teamId) {
  const numId = parseInt(teamId, 10);
  try {
    const res = await fetch(`/api/teams/${numId}/players`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`[teamApi] 선수단(/api/teams/${numId}/players) 조회 실패:`, err.message);
  }
  return [];
}

/**
 * 4. 특정 구단 소속 스태프/감독 조회 (GET /api/teams/{teamId}/staffs)
 */
export async function getTeamStaffs(teamId) {
  const numId = parseInt(teamId, 10);
  try {
    const res = await fetch(`/api/teams/${numId}/staffs`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`[teamApi] 스태프(/api/teams/${numId}/staffs) 조회 실패:`, err.message);
  }
  return [];
}

