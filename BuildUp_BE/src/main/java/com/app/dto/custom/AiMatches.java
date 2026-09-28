package com.app.dto.custom;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import com.app.dto.team.Players;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import lombok.Data;

@Data
public class AiMatches {
    private Long aiMatchId;            // [PK] AI 경기 식별자
    private Long homeTeamId;           // [FK] 내 커스텀 팀 식별자
    private Long awayTeamId;           // [FK] 상대 커스텀 팀 식별자
    private Long homeScore;            // 홈팀 점수
    private Long awayScore;            // 원정팀 점수
    private String aiReview;           // AI 경기 관전평 및 요약
    private LocalDateTime createdAt;   // 진행 일시
    private String homeName;
    private String homeFormation;
    private String opponentName;
    private List<LineupSlot> home;
    private Opponent opponent;
    private int[] score;
    private List<Event> events;
    private List<PositionPenalty> positionPenalties;

    @Data
    public static class Request {
        private String teamName;
        private String presetLabel;
        private Long opponentTeamId;
        private List<CustomSquads> squads;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class MatchPlayer extends Players {
        private String teamName;
        private String teamNameKor;
        private String teamEmblem;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineupSlot {
        private String pos;
        private MatchPlayer player;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Formation {
        private String label;
        private int df;
        private int mf;
        private int fw;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Opponent {
        private Formation formation;
        private List<LineupSlot> lineup;
    }

    @Data
    public static class Event {
        private int minute;
        private Long playerId;
        private Integer side;
        private String type;
        private String label;
        private String description;
        private Boolean isGoal;
        private int[] score;
        private List<Long> dismissedAiIds;
        private List<Long> dismissedHomeIds;
    }

    @Data
    public static class PositionPenalty {
        private Boolean isAi;
        private int totalPlayers;
        private int mismatchCount;
        private Boolean isAllMismatch;
        private Boolean isPerfectSynergy;
        private int synergyBuffPercent;
        private int fwMismatchCount;
        private int mfMismatchCount;
        private int dfMismatchCount;
        private int gkMismatchCount;
        private int fwPenaltyPercent;
        private int mfPenaltyPercent;
        private int dfPenaltyPercent;
        private int gkPenaltyPercent;
        private double goalRateMultiplier;
        private double passRateMultiplier;
        private double defenseEfficiencyMultiplier;
        private double saveRateMultiplier;
    }
    
    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
