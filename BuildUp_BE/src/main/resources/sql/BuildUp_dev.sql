SELECT * FROM USERS;
SELECT * FROM USER_PREDICTS;
SELECT * FROM USER_ROLES;
SELECT * FROM EMAIL_VERIFICATIONS;
SELECT * FROM PREDICTIONS;
SELECT * FROM STAFFS;
SELECT * FROM STAFF_ROLES;
SELECT * FROM TEAMS;
SELECT * FROM TEAM_STATS;
SELECT * FROM PLAYERS;
SELECT * FROM PLAYER_STATS;
SELECT * FROM CUSTOM_TEAMS;
SELECT * FROM CUSTOM_SQUADS;
SELECT * FROM MATCHES;
SELECT * FROM MATCH_LINEUPS;
SELECT * FROM AI_MATCHES;
SELECT * FROM POSTS;
SELECT * FROM POST_ATTACHMENTS;
SELECT * FROM POST_LIKES;
SELECT * FROM COMMENTS;
SELECT * FROM COMMENT_LIKES;
SELECT * FROM CATEGORY;
SELECT * FROM EVENT_TYPE;
SELECT * FROM MATCH_EVENTS;
SELECT * FROM POINT_HISTORY;

-- 1. 경기 이벤트 조회 (선수 및 도움 선수의 한글명/영문명 JOIN)
select t.team_name as "팀명"
     , to_char(m.match_date, 'yyyy-mm-dd') as "경기일"
     , me.event_time as "분"
     , nvl(p1.name_kor, p1.name) as "선수명(한글)"
     , p1.name as "선수명(영문)"
     , et.event_type_name as "이벤트타입"
     , nvl(p2.name_kor, p2.name) as "도움(한글)"
     , p2.name as "도움(영문)"
from teams t
    inner join match_events me
        on t.team_id = me.team_id
    inner join event_type et
        on me.event_type = et.event_type_code
    inner join players p1
        on me.player_id = p1.player_id
    left join players p2
        on me.assist_player_id = p2.player_id
    inner join matches m
        on m.match_id = me.match_id;

-- 2. 경기별 라인업 조회 (PLAYERS 조인으로 한글명 및 포지션 조회)
select m.match_id as "경기ID"
     , t.team_name as "팀명"
     , ml.is_starter as "선발여부"
     , ml.match_position as "출전포지션"
     , nvl(p.name_kor, p.name) as "선수명(한글)"
     , p.name as "선수명(영문)"
     , p.main_position as "주포지션"
from match_lineups ml
    inner join teams t on ml.team_id = t.team_id
    inner join players p on ml.player_id = p.player_id
    inner join matches m on ml.match_id = m.match_id
order by ml.match_id, ml.team_id, ml.is_starter desc;

-- 3. 커스텀 팀 스쿼드 조회 (PLAYERS 조인으로 한글명 조회)
select ct.team_name as "나만의팀명"
     , cs.position_no as "슬롯번호"
     , nvl(p.name_kor, p.name) as "선수명(한글)"
     , p.name as "선수명(영문)"
     , p.main_position as "포지션"
     , t.team_name as "원소속팀"
from custom_squads cs
    inner join custom_teams ct on cs.custom_team_id = ct.custom_team_id
    inner join players p on cs.player_id = p.player_id
    left join teams t on p.team_id = t.team_id
order by cs.position_no;

-- 4. 팀 성적 및 순위 조회
select t.team_name , ts.current_rank , ts.wins , ts.draws , ts.losses
     , ts.points , ts.goals_for , ts.goals_against , ts.goal_diff
     , to_char(ts.updated_at,'yyyy-mm-dd') as "DATE" , ts.season
from team_stats ts 
    inner join teams t
        on ts.team_id = t.team_id
where ts.season in (2026)
order by current_rank;

-- 5. 승부예측 참여 및 정산 현황 조회 (회원명, 경기, 예측결과, 적중여부)
SELECT p.PREDICTION_ID,
       u.LOGIN_ID,
       u.NICKNAME,
       m.MATCH_ID,
       ht.TEAM_NAME AS HOME_TEAM,
       at.TEAM_NAME AS AWAY_TEAM,
       p.PREDICT_RESULT,
       m.STATUS AS MATCH_STATUS,
       m.HOME_SCORE || ' : ' || m.AWAY_SCORE AS SCORE,
       p.IS_SUCCESS,
       p.CREATED_AT
FROM PREDICTIONS p
JOIN USERS u ON p.USER_ID = u.USER_ID
JOIN MATCHES m ON p.MATCH_ID = m.MATCH_ID
JOIN TEAMS ht ON m.HOME_TEAM_ID = ht.TEAM_ID
JOIN TEAMS at ON m.AWAY_TEAM_ID = at.TEAM_ID
ORDER BY p.CREATED_AT DESC;

-- 6. 포인트 변동 이력 및 잔액 추이 조회
SELECT ph.POINT_HISTORY_ID,
       u.LOGIN_ID,
       u.NICKNAME,
       ph.AMOUNT,
       ph.BALANCE_AFTER,
       ph.DESCRIPTION,
       ph.CREATED_AT
FROM POINT_HISTORY ph
JOIN USERS u ON ph.USER_ID = u.USER_ID
ORDER BY ph.CREATED_AT DESC;

-- 7. 회원별 승부예측 랭킹 (다승 및 적중률)
SELECT up.USER_ID,
       u.NICKNAME,
       up.PREDICT_WIN AS "적중수",
       up.PREDICT_TOTAL AS "참여수",
       ROUND(up.PREDICT_WIN / NULLIF(up.PREDICT_TOTAL, 0) * 100, 1) || '%' AS "적중률"
FROM USER_PREDICTS up
JOIN USERS u ON up.USER_ID = u.USER_ID
WHERE up.PREDICT_TOTAL >= 1 AND u.ROLE_CODE != 7
ORDER BY up.PREDICT_WIN DESC, (up.PREDICT_WIN / NULLIF(up.PREDICT_TOTAL, 0)) DESC;

-- 8. AI 가상 대결 전적 TOP 10 랭킹
SELECT ct.USER_ID,
       ct.TEAM_NAME AS "커스텀팀명",
       u.NICKNAME AS "구단주",
       COUNT(*) AS "총경기수",
       SUM(CASE WHEN m.HOME_SCORE > m.AWAY_SCORE THEN 1 ELSE 0 END) AS "승리",
       SUM(CASE WHEN m.HOME_SCORE = m.AWAY_SCORE THEN 1 ELSE 0 END) AS "무승부",
       SUM(CASE WHEN m.HOME_SCORE < m.AWAY_SCORE THEN 1 ELSE 0 END) AS "패배"
FROM AI_MATCHES m
JOIN CUSTOM_TEAMS ct ON ct.CUSTOM_TEAM_ID = m.HOME_TEAM_ID
JOIN USERS u ON u.USER_ID = ct.USER_ID
WHERE u.ROLE_CODE != 7
GROUP BY ct.USER_ID, ct.CUSTOM_TEAM_ID, ct.TEAM_NAME, u.NICKNAME
ORDER BY "승리" DESC;

-- 9. 마스터 코드 등록 현황 확인
SELECT 'USER_ROLES' AS "TABLE", COUNT(*) AS "COUNT" FROM USER_ROLES UNION ALL
SELECT 'STAFF_ROLES', COUNT(*) FROM STAFF_ROLES UNION ALL
SELECT 'CATEGORY', COUNT(*) FROM CATEGORY UNION ALL
SELECT 'EVENT_TYPE', COUNT(*) FROM EVENT_TYPE;
