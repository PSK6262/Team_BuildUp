package com.app.dto.team;

import lombok.Data;

@Data
public class Staffs {
	private Long staffId;
	private String name;
	private String nameKor;        // 스태프 이름 한글명
	private String nationality;
	private String nationalityKor; // 스태프 국적 한글명
	private Long teamId;
	private Long staffRoleId;
	
	// 조인용 (STAFF_ROLES)
	private String roleName;
}
