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
        if (body == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ResultCode.INVALID_INPUT));
        }
        String question = body.get("question");
        String teamContext = body.get("teamContext");
        if (question == null || question.isBlank() || question.length() > 1000
                || (teamContext != null && teamContext.length() > 20000)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ResultCode.INVALID_INPUT));
        }

		try {
			return ResponseEntity.ok(ApiResponse.success(geminiApiService.answerEplQuestion(
				question, body.get("pagePath"), body.get("scoreContext"),
				body.get("conversationContext"), teamContext)));
        } catch (IllegalStateException exception) {
            // 내부 예외 내용 대신 서비스에서 정의한 사용자 안내만 전달합니다.
            String message = exception.getMessage();
            if (!"AI 서비스가 답변 요청을 제한했습니다. 잠시 후 다시 질문해주세요.".equals(message)
                    && !"AI 서비스에 연결하지 못했습니다. 잠시 후 다시 질문해주세요.".equals(message)) {
                message = "챗봇 답변을 생성하지 못했습니다. 잠시 후 다시 질문해주세요.";
            }
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.error(ResultCode.FAIL, message));
        }
    }
}
