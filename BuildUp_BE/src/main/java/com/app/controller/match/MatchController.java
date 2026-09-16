package com.app.controller.match;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MatchController {

	@GetMapping("/api/matchs")
	public String matchs() {
		return "";
	}
}
