package com.app.dto.team;

import lombok.Data;

@Data
public class Players {
	private Long playerId;
	private String name;
	private String nameKor;        // 선수 이름 한글명
	private String mainPosition;   // 주 포지션 대분류 (GK, DF, MF, FW)
	private String detailPosition; // 상세 포지션 공식 약어 (CB, LB, RB, CDM, CAM, ST 등)
	private String nationality;
	private String nationalityKor; // 선수 국적 한글명
	private Long teamId;
}
