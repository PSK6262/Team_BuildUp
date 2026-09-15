package com.app.dto.match;

import lombok.Data;

@Data
public class MatchEvents {
    private Long eventId;              // [PK] 경기 이벤트 식별자
    private Long matchId;              // [FK] 대상 경기 식별자
    private Long teamId;               // [FK] 이벤트 발생 구단 식별자
    private Long eventTime;            // 이벤트 발생 시간 (분/초 단위)
    private Long eventType;            // [FK] 이벤트 유형 코드 식별자
    private Long playerId;             // [FK] 주요 행동 선수 식별자
    private Long assistPlayerId;       // [FK] 도움 선수 식별자 (없으면 NULL)
}
