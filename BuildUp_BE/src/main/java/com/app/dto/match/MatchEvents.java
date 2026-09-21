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

    // --- 조인용 확장 필드 (선수명, 팀명, 엠블럼) ---
    @JsonProperty("playerName")
    private String playerName;

    @JsonProperty("playerNameKor")
    private String playerNameKor;

    @JsonProperty("assistPlayerName")
    private String assistPlayerName;

    @JsonProperty("assistPlayerNameKor")
    private String assistPlayerNameKor;

    @JsonProperty("teamName")
    private String teamName;

    @JsonProperty("teamNameKor")
    private String teamNameKor;

    @JsonProperty("teamEmblemUrl")
    private String teamEmblemUrl;

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

    // --- 명시적 Getter / Setter (Lombok 미가동 빌드 환경 대비) ---
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public Long getMatchId() { return matchId; }
    public void setMatchId(Long matchId) { this.matchId = matchId; }

    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }

    public Long getEventTime() { return eventTime; }
    public void setEventTime(Long eventTime) { this.eventTime = eventTime; }

    public Long getEventType() { return eventType; }
    public void setEventType(Long eventType) { this.eventType = eventType; }

    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }

    public Long getAssistPlayerId() { return assistPlayerId; }
    public void setAssistPlayerId(Long assistPlayerId) { this.assistPlayerId = assistPlayerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public String getPlayerNameKor() { return playerNameKor; }
    public void setPlayerNameKor(String playerNameKor) { this.playerNameKor = playerNameKor; }

    public String getAssistPlayerName() { return assistPlayerName; }
    public void setAssistPlayerName(String assistPlayerName) { this.assistPlayerName = assistPlayerName; }

    public String getAssistPlayerNameKor() { return assistPlayerNameKor; }
    public void setAssistPlayerNameKor(String assistPlayerNameKor) { this.assistPlayerNameKor = assistPlayerNameKor; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getTeamNameKor() { return teamNameKor; }
    public void setTeamNameKor(String teamNameKor) { this.teamNameKor = teamNameKor; }

    public String getTeamEmblemUrl() { return teamEmblemUrl; }
    public void setTeamEmblemUrl(String teamEmblemUrl) { this.teamEmblemUrl = teamEmblemUrl; }
}
