package com.app.dto.prediction;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class Predictions {
    private Long predictionId;         // [PK] 승부예측 식별자
    private Long userId;               // [FK] 참여 회원 식별자
    private Long matchId;              // [FK] 대상 경기 식별자
    private String predictResult;      // 예측 결과 (HOME, DRAW, AWAY)
    private String isSuccess;          // 적중 여부 (Y/N/C, 경기 종료 전 NULL)
    private LocalDateTime createdAt;   // 예측 제출 일시

    // JOIN 결과 바인딩용 필드
    private String nickname;           // 참여 회원 닉네임
    private String homeTeamName;       // 홈팀 영문명
    private String awayTeamName;       // 원정팀 영문명
    private String homeTeamNameKor;    // 홈팀 한글명
    private String awayTeamNameKor;    // 원정팀 한글명
    private String homeEmblemUrl;      // 홈팀 엠블럼
    private String awayEmblemUrl;      // 원정팀 엠블럼
    private Integer homeScore;         // 홈팀 스코어
    private Integer awayScore;         // 원정팀 스코어
    private String matchStatus;        // 경기 상태 (SCHEDULED, LIVE, FINISHED 등)
    private LocalDateTime matchDate;   // 경기 시작 일시
    
    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getMatchDate() {
        if (this.matchDate == null) return null;
        return this.matchDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
