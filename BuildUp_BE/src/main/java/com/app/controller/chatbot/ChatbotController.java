package com.app.controller.chatbot;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.common.ApiResponse;
import com.app.common.ResultCode;
import com.app.service.api.GeminiApiService;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {
    private final GeminiApiService geminiApiService;

    public ChatbotController(GeminiApiService geminiApiService) {
        this.geminiApiService = geminiApiService;
    }

    // EPL 질문을 받아 Gemini 답변을 공통 JSON 형식으로 반환합니다.
    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<String>> ask(@RequestBody Map<String, String> body) {
        String question = body == null ? null : body.get("question");
        if (question == null || question.isBlank() || question.length() > 1000) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ResultCode.INVALID_INPUT));
        }

        try {
            return ResponseEntity.ok(ApiResponse.success(geminiApiService.answerEplQuestion(
                question, body.get("pagePath"))));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.error(ResultCode.FAIL));
        }
    }
}