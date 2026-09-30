package com.app.dto.team;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Teams {
    private Long teamId;
    private String teamName;
    private String teamNameKor;
    private String history;
    private String emblemUrl;
    private String anthemUrl;
    private String foundedYear;
    private String homeGround;
    private String homeGroundKor;
    private LocalDateTime updatedAt;

    public String getUpdatedAt() {
        if (this.updatedAt == null) return null;
        return this.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
