# PLUGIN 프로젝트 작업 규칙

팀명은 BUILDUP, 사용자에게 표시하는 프로젝트명은 PLUGIN이다.

## 작업 방식

- 기능을 한꺼번에 확장하지 않고 사용자와 합의한 단계만 구현한다.
- 새 파일명은 후보를 5개 이상 제안하고 사용자 승인 후 생성한다.
- 수정 전에 현재 브랜치를 확인한다. 커뮤니티 작업은 `feature-comu`에서 진행한다.
- `main`이나 `develop`에서 직접 수정하지 않는다. 다른 담당자의 변경을 보존한다.
- 커밋, 푸시, 병합은 별도 요청이 있을 때 수행한다.

## 백엔드

- `BuildUp_BE`의 기존 Spring MVC, MyBatis, Oracle 및 패키지 구조를 따른다.
- 기존 Controller → Service → ServiceImpl → DAO → DAOImpl → MyBatis 매퍼 흐름을 따른다.
- 기존 DTO를 우선 재사용한다. JOIN 결과는 기존 DTO에 JOIN용 필드를 추가한다.
  - 예: `Posts`에 `nickname`, `teamName`, `categoryType`을 추가하고 `List<Posts>`로 조회한다.
  - 같은 게시글 정보를 위한 별도 목록 DTO를 불필요하게 만들지 않는다.
  - 목록과 페이지 정보를 묶는 기존 `PostListResponse` 같은 응답 구조는 유지할 수 있다.
- 매퍼에서 사용하는 DTO 별칭은 `mybatis/mybatis-config.xml`의 명시적 `typeAlias`로 등록한다.
  매퍼의 `resultType`과 필요한 `parameterType`에는 등록된 별칭을 사용한다.
- SQL 매퍼는 `mybatis/match/match_mapper.xml`의 형식을 기준으로 작성한다.
  - 탭 들여쓰기, SELECT 컬럼은 한 줄씩, 쿼리 사이 빈 줄을 사용한다.
  - 각 쿼리에서 SELECT, FROM, JOIN, WHERE 흐름을 바로 읽을 수 있게 작성한다.
  - 단순한 쿼리를 과도한 `sql/include` 조각으로 나누지 않는다.
  - 기존 `mapUnderscoreToCamelCase` 설정을 활용한다.
- 주석은 해당 코드의 기능만 짧게 설명한다. 문법 강의나 장황한 구현 원리 설명은 넣지 않는다.
- 요청값은 바인딩하고, 정렬은 허용된 값으로 제한한다. 기존 검증 기능은 유지한다.
- 게시판 구분은 승인된 `CommunityBoardType` enum을 사용하여 매퍼까지 전달한다.
- 커뮤니티 API는 frade 형식의 `ResultCode`와 `RestApiResponse`로 `code/message/data` JSON을 반환한다.
- 카테고리 ID, 팀 ID 등 DB 식별자를 임의로 확정하지 않는다.
- 커뮤니티 작성자 조회는 `POSTS.USER_ID = USERS.USER_ID`로 JOIN하고 `NICKNAME`을 사용한다.
- 임시 프론트 데이터를 계속 늘리기보다 실제 백엔드 API 연결을 우선한다.

## 프론트엔드

- 페이지 JSX는 `BuildUp_FE/src/pages`, CSS는 `BuildUp_FE/src/css`에 둔다.
- 공통 네비게이션 파일명은 `AllUseNav.jsx`를 유지한다.
- 화면 경로는 `/plug/`로 시작한다.
- 팀 엠블럼은 기존 `Assets/data/teamsData.js`의 `emblemUrl`을 활용한다.
- 목록에서 상세로 이동했다가 돌아올 때 검색, 필터, 페이지 상태를 보존한다.
- 미구현 기능과 임시 데이터는 실제 저장이나 조회가 완료된 것처럼 표시하지 않는다.

## 검증

- 변경 범위에 맞는 컴파일, 매퍼 확인, 프론트 빌드·린트를 수행한다.
- 정적 검사 통과와 실제 Oracle/Tomcat 실행 검증 여부를 구분해 보고한다.
