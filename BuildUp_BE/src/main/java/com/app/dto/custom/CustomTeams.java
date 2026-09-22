package com.app.dto.custom;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import lombok.Data;

@Data
public class CustomTeams {
    private Long customTeamId;         // [PK] 커스텀 팀 식별자
    private Long userId;               // [FK] 구단주 회원 식별자 (1:1)
    private String teamName;           // 유저가 설정한 팀 명칭
    private String formation;          // 적용 포메이션 (예: 4-3-3)
    private LocalDateTime createdAt;   // 커스텀 팀 생성 일시
    private List<CustomSquads> squads;
    
    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
