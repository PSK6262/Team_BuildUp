package com.app.dto.team;

import lombok.Data;

@Data
public class Players {
	private Long playerId;
	private String name;
	private String nameKor;        // 선수 이름 한글명
	private String mainPosition;
	private String nationality;
	private String nationalityKor; // 선수 국적 한글명
	private Long teamId;
}
