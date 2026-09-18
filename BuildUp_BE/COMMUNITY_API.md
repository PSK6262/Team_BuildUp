# 커뮤니티 목록 API

`GET {Tomcat 컨텍스트 경로}/api/communities`

## 요청

- `categoryIds` (필수): 실제 등록된 자유/팀별 카테고리 ID, 쉼표로 구분. 내 팀 자랑 ID는 전달하지 않습니다.
- `board`: `all`(기본), `free`(TEAM_ID 없음), `team`(TEAM_ID 있음)
  - 대문자도 허용합니다. Controller에서 `CommunityBoardType`으로 변환하고
    Service → DAO → 매퍼에는 enum 객체를 전달합니다. 알 수 없는 값은 HTTP 400입니다.
  - 매퍼의 `board.free`, `board.team`으로 게시판 조건을 구분합니다.
- `teamId`: 선택한 팀의 실제 DB ID. 자유 필터와 함께 사용하면 400.
- `keyword`: 제목 부분 검색. 공백 제거, 대소문자 무시, %, _는 문자 그대로 검색.
- `sort`: `latest`(기본), `likes`, `views`
- `page`: 1부터 시작 (기본 1)
- `size`: 1~100 (기본 10)

예: `/api/communities?categoryIds=1,2&board=all&page=1&size=10`
**1,2는 예시이며 아직 확정하거나 DB에 등록한 값이 아닙니다.**

공통 JSON 응답: `code`, `message`, `data`.
`data` 안에 `items`, `totalCount`, `page`, `size`, `totalPages`가 들어갑니다.
성공은 `suc_001`, 빈 목록은 `suc_002`이며 빈 목록도 페이지 정보를 유지합니다.
잘못된 요청은 HTTP 400 / `rej_002`, 서버 오류는 HTTP 500 / `rej_001`입니다.
현재 적용 범위는 CommunityController이며 다른 담당자의 API 응답은 변경하지 않습니다.
각 item: `postId`, `userId`, `nickname`, `teamId`, `teamName`, `categoryId`,
`categoryType`, `title`, `viewCount`, `likeCount`, `createdAt`.
목록은 기존 `Posts` DTO를 사용하고 `nickname`, `teamName`을 JOIN하여 채웁니다.
본문은 조회하지 않으며 `content`, `isBlind`, `updatedAt`은 목록 응답에서 null입니다.
비밀번호와 이메일은 조회하지 않습니다. `createdAt`은 기존 Posts getter에 따라
`yyyy-MM-dd HH:mm` 형식으로 반환됩니다.
결과가 없으면 items는 빈 배열, totalCount/totalPages는 0입니다.
범위를 넘는 페이지는 빈 items를 반환합니다. 잘못된 파라미터는 HTTP 400입니다.

## 구조

CommunityController → CommunityServiceImpl → CommunityDAOImpl → community_mapper.xml
기존 SqlSessionTemplate과 mapperLocations 자동 탐색 설정을 이용합니다.
조회는 IS_BLIND='N'만 포함하며 USERS.USER_ID로 JOIN하여 NICKNAME을 반환합니다.
정렬 필드는 MyBatis choose로 제한하고 입력값은 모두 바인딩합니다.

## 현재 단계 및 확인

목록 API 구현 단계입니다. React는 아직 예시 데이터를 사용합니다.
카테고리 데이터 등록 후 자유/팀별 ID를 확정하고 실제 요청을 연결해야 합니다.
현재 분류는 요청한 categoryIds에 따르므로 향후 내 팀 자랑 추가 시 서버에서
통합 목록에 허용할 카테고리를 확정하는 설정/분류 코드가 필요합니다.
DB 데이터 생성이나 변경은 수행하지 않았습니다.

확인할 항목: 빈 결과, 닉네임 JOIN, 블라인드 제외, 자유/팀별 필터,
팀 ID 필터, 제목 검색, 추천/조회 정렬, 페이지 경계, 잘못된 파라미터 400.
실제 Oracle 접속 및 HTTP 실행 검증은 별도 필요합니다.
