
const teamsData = [
    {
        teamId : 1,
        teamName : "AFC Bournemouth",
        history : "1899년 보스컴 FC(Boscombe FC)로 창단되었으며, 1971년 현재의 명칭으로 변경되었다. 클럽 역사상 오랜 기간 하부 리그를 맴돌았으나 에디 하우 감독 체제에서 2015년 사상 처음으로 프리미어리그 승격을 달성했다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t91.png",
        anithemUrl: "https://www.youtube.com/watch?v=_VU9DjQpvMQ&list=RD_VU9DjQpvMQ&start_radio=1",
        foundedYear : 1899,
        updatedAt : "2026-09-15",
        homeGround : "Vitality Stadium (Dean Court)"
    },
    {
        teamId : 2,
        teamName : "Arsenal",
        history : "1886년 런던 울위치의 왕립 무기고 노동자들이 창단한 구단이다. 2003-04 시즌 잉글랜드 축구 역사상 유일한 '무패 우승(The Invincibles)'을 기록했으며 FA컵 최다 우승(14회) 기록을 보유하고 있다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t3.png",
        anithemUrl: "https://www.youtube.com/watch?v=N8_m1XqypSQ&list=RDN8_m1XqypSQ&start_radio=1",
        foundedYear : 1886,
        updatedAt : "2026-09-15",
        homeGround : "Emirates Stadium"
    },
    {
        teamId : 3,
        teamName : "Aston Villa",
        history : "1874년 창단되었으며 1888년 풋볼 리그 창립을 주도한 12개 원년 멤버 중 하나다. 1981-82 시즌 유러피언컵(현 UEFA 챔피언스리그) 우승을 차지한 잉글랜드 6개 구단 중 하나로 깊은 전통을 자랑한다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t7.png",
        anithemUrl: "https://www.youtube.com/watch?v=cLO9N4lVo80&list=RDcLO9N4lVo80&start_radio=1",
        foundedYear : 1874,
        updatedAt : "2026-09-15",
        homeGround : "Villa Park"
    },
    {
        teamId : 4,
        teamName : "Brentford",
        history : "1889년 창단되어 런던 서부를 연고지로 삼아왔다. 데이터 분석 기반의 머니볼 영입 및 운영 정책을 통해 반등에 성공하여 2021년 74년 만에 1부 리그로 복귀한 이후 탄탄한 전력을 유지하고 있다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t94.png",
        anithemUrl: "https://www.youtube.com/watch?v=1Gq6mTI8SlU&list=RD1Gq6mTI8SlU&start_radio=1",
        foundedYear : 1889,
        updatedAt : "2026-09-15",
        homeGround : "Gtech community Stadium"
    },
    {
        teamId : 5,
        teamName : "Brighton & Hove Albion",
        history : "1901년 창단되었으며 별칭은 '갈매기(The Seagulls)'다. 1990년대 구단 파산 직전의 위기를 극복하고 아메리칸 익스프레스 스타디움 건립과 탁월한 스카우팅 시스템을 바탕으로 유럽 대항전 경쟁팀으로 도약했다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t36.png",
        anithemUrl: "https://www.youtube.com/watch?v=rRpkuAG98KA",
        foundedYear : 1901,
        updatedAt : "2026-09-15",
        homeGround : "American Express Stadium"
    },
    {
        teamId : 6,
        teamName : "Chealsea",
        history : "1905년 풀럼 로드의 펍 '더 라이징 선'에서 창단되었다. 2000년대 이후 대규모 투자를 기반으로 프리미어리그 5회 우승, UEFA 챔피언스리그 2회 우승을 달성하며 유럽 정상급 명문 구단으로 자리잡았다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t8.png",
        anithemUrl: "https://www.youtube.com/watch?v=LTbZr7-X3To&list=RDLTbZr7-X3To&start_radio=1",
        foundedYear : 1905,
        updatedAt : "2026-09-15",
        homeGround : "Stamford Bridge"
    },
    {
        teamId : 7,
        teamName : "Coventry City",
        history : "1883년 자전거 공장 노동자들에 의해 싱어스 FC(Singers FC)로 창단된 후 1898년 코번트리 시티로 개칭했다. 1987년 FA컵 우승을 차지했으며 1992년 프리미어리그 출범 원년 멤버로 활약했다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t9.png",
        anithemUrl: "https://www.youtube.com/watch?v=7miErQzz4Y8&list=RD7miErQzz4Y8&start_radio=1",
        foundedYear : 1883,
        updatedAt : "2026-09-15",
        homeGround : "Conventry Building Society Arena"
    },
    {
        teamId : 8,
        teamName : "Crystal Palace",
        history : "1905년 수정궁(Crystal Palace) 전시관 소유주들에 의해 설립되었다. 사우스런던을 대표하는 구단으로 열정적인 홈 서포터즈 문화를 자랑하며 꾸준히 프리미어리그 중상위권을 공략하는 저력을 보여준다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t31.png",
        anithemUrl: "https://www.youtube.com/watch?v=GD1v_iDmc-k&list=RDGD1v_iDmc-k&start_radio=1",
        foundedYear : 1905,
        updatedAt : "2026-09-15",
        homeGround : "Selhurst Park"
    },
    {
        teamId : 9,
        teamName : "Everton",
        history : "1878년 세인트 도밍고 FC로 시작해 풋볼 리그 창립 멤버로 합류했다. 잉글랜드 1부 리그 최다 잔류 기록(120시즌 이상)을 보유한 유서 깊은 전통 클럽으로, 신축 전용구장으로 둥지를 옮겨 새 시대를 열었다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t11.png",
        anithemUrl: "https://www.youtube.com/watch?v=OEekoV4en-g&list=RDOEekoV4en-g&start_radio=1",
        foundedYear : 1878,
        updatedAt : "2026-09-15",
        homeGround : "Hill Dickinson Stadium"
    },{
        teamId : 10,
        teamName : "Fulham",
        history : "1879년 창단된 런던에서 가장 오래된 프로 축구 클럽 중 하나다. 템스 강변에 위치한 역사적인 크레이븐 코티지(Craven Cottage)를 홈으로 사용하며 매력적인 패스 축구로 입지를 굳혔다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t54.png",
        anithemUrl: "https://www.youtube.com/watch?v=6v23tIwbBbU&list=RD6v23tIwbBbU&start_radio=1",
        foundedYear : 1879,
        updatedAt : "2026-09-15",
        homeGround : "Craven Cottage"
    },
    {
        teamId : 11,
        teamName : "Hull City",
        history : "1904년 창단되었으며 독특한 호랑이 무늬 스트라이프 유니폼 덕분에 '호랑이들(The Tigers)'이라는 별칭을 가졌다. 2008년 구단 역사상 처음으로 프리미어리그에 승격해 돌풍을 일으킨 바 있다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t88.png",
        anithemUrl: "https://www.youtube.com/watch?v=-sSSHNp1UeE&list=RD-sSSHNp1UeE&start_radio=1",
        foundedYear : 1904,
        updatedAt : "2026-09-15",
        homeGround : "MKM Stadium"
    },
    {
        teamId : 12,
        teamName : "Ipswich Town",
        history : "1878년 창단되었으며 알프 램지 경과 바비 롭슨 경 등 잉글랜드 명장들이 팀을 이끌며 1961-62 1부 리그 우승 및 1980-81 UEFA컵 우승을 차지했던 서퍽 지역의 유서 깊은 강호다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t40.png",
        anithemUrl: "https://www.youtube.com/watch?v=wJA8b3esxfE&list=RDwJA8b3esxfE&start_radio=1",
        foundedYear : 1878,
        updatedAt : "2026-09-15",
        homeGround : "Portman Road"
    },
    {
        teamId : 13,
        teamName : "Leeds United",
        history : "1919년 리즈 시티 해체 이후 창단되었다. 돈 레비 감독 시절 잉글랜드 축구를 지배하며 황금기를 구가했고, 특유의 격렬하고 저돌적인 압박 축구와 두터운 충성 팬층으로 유명하다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t2.png",
        anithemUrl: "https://www.youtube.com/watch?v=DuMyUh26twQ&list=RDDuMyUh26twQ&start_radio=1",
        foundedYear : 1919,
        updatedAt : "2026-09-15",
        homeGround : "Elland Road"
    },
    {
        teamId : 14,
        teamName : "Liverpool",
        history : "1892년 존 호울딩에 의해 창단되었다. 1부 리그 통산 19회 우승, UEFA 챔피언스리그 통산 6회 우승을 차지하며 잉글랜드를 대표하는 글로벌 메가 클럽이자 붉은 제국의 전통을 자랑한다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t14.png",
        anithemUrl: "https://www.youtube.com/watch?v=naGYqb8n6QY&list=RDnaGYqb8n6QY&start_radio=1",
        foundedYear : 1892,
        updatedAt : "2026-09-15",
        homeGround : "Anfield"
    },
    {
        teamId : 15,
        teamName : "Manchester City",
        history : "1880년 세인트 마크스(St. Mark's)로 창단된 후 1894년 현재의 명칭으로 재출범했다. 현대 축구에 이르러 전술적 혁신과 압도적인 리그 지배력을 구축하며 2022-23 시즌 트레블을 달성했다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t43.png",
        anithemUrl: "https://www.youtube.com/watch?v=oJF6EUf9J_k&list=RDoJF6EUf9J_k&start_radio=1",
        foundedYear : 1894,
        updatedAt : "2026-09-15",
        homeGround : "Etihad Stadium"
    },
    {
        teamId : 16,
        teamName : "Manchester United",
        history : "1880년 세인트 마크스(St. Mark's)로 창단된 후 1894년 현재의 명칭으로 재출범했다. 현대 축구에 이르러 전술적 혁신과 압도적인 리그 지배력을 구축하며 2022-23 시즌 트레블을 달성했다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t1.png",
        anithemUrl: "https://www.youtube.com/watch?v=9XGMpo4Sk2k&list=RD9XGMpo4Sk2k&start_radio=1",
        foundedYear : 1878,
        updatedAt : "2026-09-15",
        homeGround : "Old Trafford"
    },
    {
        teamId : 17,
        teamName : "Newcastle United",
        history : "1892년 뉴캐슬 이스트엔드와 웨스트엔드가 합병해 출범했다. 잉글랜드 북동부 타인사이드 지역의 열렬한 지지를 받는 구단으로, 전통적인 흑백 세로 스트라이프와 세인트 제임스 파크의 열기가 상징적이다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t4.png",
        anithemUrl: "https://www.youtube.com/watch?v=ECQQACr5ekw&list=RDECQQACr5ekw&start_radio=1",
        foundedYear : 1892,
        updatedAt : "2026-09-15",
        homeGround : "Stadium James' Park"
    },
    {
        teamId : 18,
        teamName : "Nottingham Forest",
        history : "1865년 창단된 역사 깊은 클럽으로, 브라이언 클러프 감독 체제에서 1978-79, 1979-80 시즌 2연속 유러피언컵 정상에 오르는 기적적인 신화를 작성했다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t17.png",
        anithemUrl: "https://www.youtube.com/watch?v=Plhtk_XJqhM&list=RDPlhtk_XJqhM&start_radio=1",
        foundedYear : 1865,
        updatedAt : "2026-09-15",
        homeGround : "The City Ground"
    },
    {
        teamId : 19,
        teamName : "Sunderland",
        history : "1879년 교사 제임스 앨런에 의해 창단되었으며 별칭은 '검은 고양이(The Black Cats)'다. 19세기 말 잉글랜드 리그를 지배하며 총 6회 1부 리그 우승을 거머쥔 북동부의 명문 구단이다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t56.png",
        anithemUrl: "https://www.youtube.com/watch?v=LJRA8UrlqCM&list=RDLJRA8UrlqCM&start_radio=1",
        foundedYear : 1879,
        updatedAt : "2026-09-15",
        homeGround : "Stadium of Light"
    },
    {
        teamId : 20,
        teamName : "Tottenham Hotspur",
        history : "1882년 북런던에서 창단되었으며 1960-61 시즌 20세기 최초로 리그와 FA컵을 동시 석권하는 더블을 기록했다. 공격적이고 화려한 축구 철학을 중시하며 최첨단 홈구장을 갖추고 있다.",
        emblemUrl : "https://resources.premierleague.com/premierleague/badges/50/t6.png",
        anithemUrl: "https://www.youtube.com/watch?v=GAdQkkY_Tow&list=RDGAdQkkY_Tow&start_radio=1",
        foundedYear : 1882,
        updatedAt : "2026-09-15",
        homeGround : "Tottenham Hotspur Stadium"
    }
]
export default teamsData;