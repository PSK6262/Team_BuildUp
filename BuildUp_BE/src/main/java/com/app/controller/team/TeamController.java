package com.app.controller.team;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TeamController {
	
	@GetMapping("/api/teams")
	public String teams() {
		return "";
	}
}
