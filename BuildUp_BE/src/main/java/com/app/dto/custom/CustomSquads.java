package com.app.dto.custom;

import lombok.Data;

@Data
public class CustomSquads {
    private Long squadId;              // [PK] 스쿼드 슬롯 식별자
    private Long customTeamId;         // [FK] 소속 커스텀 팀 식별자
    private Long playerId;             // [FK] 배치된 선수 식별자
    private Long positionNo;           // 포메이션 내 배치 슬롯 번호 (1~11)
    private String playerName;         // PLAYERS JOIN으로 조회한 선수 이름
    private String position;           // 요청의 배치 포지션 (FW, MF, DF, GK)
    private String mainPosition;       // 조회 시 선수의 원래 포지션
}
