package com.app.dto.match;

import lombok.Data;

@Data
public class MatchLineups {
    private Long lineupId;             // [PK] 라인업 식별자
    private Long matchId;              // [FK] 대상 경기 식별자
    private Long teamId;               // [FK] 소속 구단 식별자
    private Long playerId;             // [FK] 출전 선수 식별자
    private String matchPosition;      // 경기 소화 포지션
    private String isStarter;          // 선발 출전 여부 (Y/N)
}