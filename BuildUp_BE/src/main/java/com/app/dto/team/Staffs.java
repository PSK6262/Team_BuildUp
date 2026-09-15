package com.app.dto.team;

import lombok.Data;

@Data
public class Staffs {
	private Long staffId;
	private String name;
	private String nationality;
	private Long teamId;
	private Long staffRoleId;
	
	// 조인용 (STAFF_ROLES)
	private String roleName;
}
