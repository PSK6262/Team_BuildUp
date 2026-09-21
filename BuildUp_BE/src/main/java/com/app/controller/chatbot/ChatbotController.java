package com.app.controller.chatbot;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.common.ApiResponse;
import com.app.common.ResultCode;
import com.app.service.api.GeminiApiService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @Autowired
    private GeminiApiService geminiApiService;

    public ChatbotController() {
    }

    public ChatbotController(GeminiApiService geminiApiService) {
        this.geminiApiService = geminiApiService;
    }

    // EPL 질문을 받아 Gemini 답변을 공통 JSON 형식으로 반환합니다.
    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<String>> ask(@RequestBody(required = false) Map<String, String> body) {
        if (body == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ResultCode.INVALID_INPUT));
        }
        String question = body.get("question");
        if (question == null || question.trim().isEmpty() || question.length() > 1000) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ResultCode.INVALID_INPUT));
        }

        try {
            String answer = geminiApiService.answerEplQuestion(question.trim(), body.get("pagePath"));
            return ResponseEntity.ok(ApiResponse.success(answer));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.error(ResultCode.FAIL));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(ResultCode.FAIL));
        }
    }
}
