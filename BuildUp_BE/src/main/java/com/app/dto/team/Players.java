package com.app.dto.team;

import lombok.Data;

@Data
public class Players {
	private Long playerId;
	private String name;
	private String mainPosition;
	private String nationality;
	private Long teamId;
}
