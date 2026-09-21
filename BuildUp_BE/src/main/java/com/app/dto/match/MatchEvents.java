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

    // --- 조인용 확장 필드 (선수명, 팀명, 엠블럼) ---
    @JsonProperty("playerName")
    @JsonAlias({"player_name", "PLAYER_NAME"})
    private String playerName;

    @JsonProperty("playerNameKor")
    @JsonAlias({"player_name_kor", "PLAYER_NAME_KOR"})
    private String playerNameKor;

    @JsonProperty("assistPlayerName")
    @JsonAlias({"assist_player_name", "ASSIST_PLAYER_NAME"})
    private String assistPlayerName;

    @JsonProperty("assistPlayerNameKor")
    @JsonAlias({"assist_player_name_kor", "ASSIST_PLAYER_NAME_KOR"})
    private String assistPlayerNameKor;

    @JsonProperty("teamName")
    @JsonAlias({"team_name", "TEAM_NAME"})
    private String teamName;

    @JsonProperty("teamNameKor")
    @JsonAlias({"team_name_kor", "TEAM_NAME_KOR"})
    private String teamNameKor;

    @JsonProperty("teamEmblemUrl")
    @JsonAlias({"team_emblem_url", "TEAM_EMBLEM_URL"})
    private String teamEmblemUrl;

    // --- 명시적 Getter / Setter (Lombok 미가동 빌드 환경 대비 안전장치) ---
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
