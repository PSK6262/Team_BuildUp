package com.app.dto.custom;

import lombok.Data;

@Data
public class CustomSquads {
    private Long squadId;              // [PK] 스쿼드 슬롯 식별자
    private Long customTeamId;         // [FK] 소속 커스텀 팀 식별자
    private Long playerId;             // [FK] 배치된 선수 식별자
    private Long positionNo;           // 포메이션 내 배치 슬롯 번호 (1~11)
}
