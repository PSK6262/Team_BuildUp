package com.app.dto.match;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class MatchEvents {
    @JsonProperty("eventId")
    @JsonAlias({"event_id", "EVENT_ID"})
    private Long eventId;              // [PK] 경기 이벤트 식별자

    @JsonProperty("matchId")
    @JsonAlias({"match_id", "MATCH_ID"})
    private Long matchId;              // [FK] 대상 경기 식별자

    @JsonProperty("teamId")
    @JsonAlias({"team_id", "TEAM_ID"})
    private Long teamId;               // [FK] 이벤트 발생 구단 식별자

    @JsonProperty("eventTime")
    @JsonAlias({"event_time", "EVENT_TIME"})
    private Long eventTime;            // 이벤트 발생 시간 (분 단위)

    @JsonProperty("eventType")
    @JsonAlias({"event_type", "EVENT_TYPE"})
    private Long eventType;            // [FK] 이벤트 유형 코드 식별자

    @JsonProperty("playerId")
    @JsonAlias({"player_id", "PLAYER_ID"})
    private Long playerId;             // [FK] 주요 행동 선수 식별자

    @JsonProperty("assistPlayerId")
    @JsonAlias({"assist_player_id", "ASSIST_PLAYER_ID"})
    private Long assistPlayerId;       // [FK] 도움 선수 식별자 (없으면 NULL)

    // 조인 및 표시용 확장 필드
    @JsonProperty("eventTypeName")
    @JsonAlias({"event_type_name", "EVENT_TYPE_NAME"})
    private String eventTypeName;      // 이벤트 유형명 (GOAL, YELLOW_CARD 등)

    @JsonProperty("playerName")
    @JsonAlias({"player_name", "PLAYER_NAME"})
    private String playerName;         // 선수 영문명

    @JsonProperty("playerNameKor")
    @JsonAlias({"player_name_kor", "PLAYER_NAME_KOR"})
    private String playerNameKor;      // 선수 한글명

    @JsonProperty("assistPlayerName")
    @JsonAlias({"assist_player_name", "ASSIST_PLAYER_NAME"})
    private String assistPlayerName;   // 도움 선수 영문명

    @JsonProperty("assistPlayerNameKor")
    @JsonAlias({"assist_player_name_kor", "ASSIST_PLAYER_NAME_KOR"})
    private String assistPlayerNameKor;// 도움 선수 한글명

    @JsonProperty("teamName")
    @JsonAlias({"team_name", "TEAM_NAME"})
    private String teamName;           // 구단 영문명

    @JsonProperty("teamNameKor")
    @JsonAlias({"team_name_kor", "TEAM_NAME_KOR"})
    private String teamNameKor;        // 구단 한글명

    @JsonProperty("teamEmblemUrl")
    @JsonAlias({"team_emblem_url", "TEAM_EMBLEM_URL"})
    private String teamEmblemUrl;      // 구단 엠블럼 URL

    // --- snake_case 호환 Getter ---
    @JsonProperty("event_time")
    public Long getEventTimeSnake() {
        return this.eventTime;
    }
}
