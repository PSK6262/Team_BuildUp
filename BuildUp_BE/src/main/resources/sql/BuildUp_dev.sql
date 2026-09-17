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


select t.team_name as "팀명" , to_char(m.match_date,'yyyy-mm-dd') as "경기일"
     , me.event_time as "분" , p1.name as "선수명" , et.event_type_name as "타입"
     , p2.name as "도움"
from teams t
    inner join match_events me
        on t.team_id = me.team_id
    inner join event_type et
        on me.event_type = et.event_type_code
    inner join players p1
        on me.player_id = p1.player_id
    inner join players p2
        on me.assist_player_id = p2.player_id
    inner join matches m
        on m.match_id = me.match_id;
        
select t.team_name , ts.current_rank , ts.wins , ts.draws , ts.losses
     , ts.points , ts.goals_for , ts.goals_against , ts.goal_diff
     , to_char(ts.updated_at,'yyyy-mm-dd') as "DATE" , ts.season
from team_stats ts 
    inner join teams t
        on ts.team_id = t.team_id
where ts.season in (2026)
order by current_rank;