package com.app.dto.team;

import lombok.Data;

@Data
public class PlayerStats {
    private Long playerId;         // [PK, FK] 선수 식별자
    private Long goals;            // 시즌 득점 수
    private Long assists;          // 시즌 도움 수
    private Long momCount;         // 경기 최우수선수(MOM) 선정 횟수
    private Long yellowCards;      // 경고 누적 수
    private Long redCards;         // 퇴장 누적 수
    private String isInjured;      // 부상 여부 (Y/N)
    private String injuryNote;     // 부상 상세 메모 및 결장 사유
    private String isSuspended;    // 출장 정지 징계 여부 (Y/N)

    // 화면 표시 조인용 필드 (득점 랭킹 조회용)
    private String playerName;     // 선수명
    private Long backNumber;       // 등번호
    private String mainPosition;   // 주 포지션
    private String nationality;    // 국적
    private Long teamId;           // 소속 구단 ID
    private String teamName;       // 소속 구단명
    private String emblemUrl;      // 구단 엠블럼 URL
}
