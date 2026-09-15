package com.app.controller.custom;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CustomController {
	
	@GetMapping("/api/customs")
	public String customs() {
		return "";
	}
}
