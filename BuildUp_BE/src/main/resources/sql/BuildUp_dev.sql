SELECT * FROM USERS;
SELECT * FROM USER_PREDICTS;
SELECT * FROM USER_ROLES;
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
