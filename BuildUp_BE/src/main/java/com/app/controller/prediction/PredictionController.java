package com.app.controller.prediction;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PredictionController {

	@GetMapping("/api/predictions")
	public String predictions() {
		return "";
	}
}
