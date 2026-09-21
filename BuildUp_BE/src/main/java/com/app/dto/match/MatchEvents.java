package com.app.dto.match;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class MatchEvents {
    @JsonProperty("eventId")
    private Long eventId;              // [PK] 경기 이벤트 식별자

    @JsonProperty("matchId")
    private Long matchId;              // [FK] 대상 경기 식별자

    @JsonProperty("teamId")
    private Long teamId;               // [FK] 이벤트 발생 구단 식별자

    @JsonProperty("eventTime")
    private Long eventTime;            // 이벤트 발생 시간 (분 단위)

    @JsonProperty("eventType")
    private Long eventType;            // [FK] 이벤트 유형 코드 식별자

    @JsonProperty("playerId")
    private Long playerId;             // [FK] 주요 행동 선수 식별자

    @JsonProperty("assistPlayerId")
    private Long assistPlayerId;       // [FK] 도움 선수 식별자 (없으면 NULL)

    // 조인 및 표시용 확장 필드
    private String eventTypeName;      // 이벤트 유형명 (GOAL, YELLOW_CARD 등)
    private String playerName;         // 선수 영문명
    private String playerNameKor;      // 선수 한글명
    private String assistPlayerName;   // 도움 선수 영문명
    private String assistPlayerNameKor;// 도움 선수 한글명
    private String teamName;           // 구단 영문명
    private String teamNameKor;        // 구단 한글명
    private String teamEmblemUrl;      // 구단 엠블럼 URL

    // --- snake_case 호환 Getter (프론트엔드/API snake_case 참조 지원) ---
    @JsonProperty("event_time")
    public Long getEventTimeSnake() {
        return this.eventTime;
    }

    @JsonProperty("event_type")
    public Long getEventTypeSnake() {
        return this.eventType;
    }

    @JsonProperty("event_id")
    public Long getEventIdSnake() {
        return this.eventId;
    }

    @JsonProperty("match_id")
    public Long getMatchIdSnake() {
        return this.matchId;
    }

    @JsonProperty("team_id")
    public Long getTeamIdSnake() {
        return this.teamId;
    }

    @JsonProperty("player_id")
    public Long getPlayerIdSnake() {
        return this.playerId;
    }

    @JsonProperty("assist_player_id")
    public Long getAssistPlayerIdSnake() {
        return this.assistPlayerId;
    }
}

