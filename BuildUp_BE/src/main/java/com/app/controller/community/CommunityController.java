package com.app.controller.community;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CommunityController {
	
	@GetMapping("/api/communities")
	public String communities() {
		return "";
	}
}
