package com.app.controller.custom;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import javax.servlet.http.HttpServletRequest;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.app.service.custom.CustomService;
import com.app.dto.custom.CustomTeams;
import com.app.dto.custom.AiMatches;
import com.app.dto.user.Users;
import com.app.dao.user.UserDAO;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

@RestController
public class CustomController {
    private static final Logger log = LoggerFactory.getLogger(CustomController.class);
    @Autowired private CustomService customService;
    @Autowired private UserDAO userDAO;

    @PostMapping("/api/customs/ai-matches")
    public ResponseEntity<?> playAiMatch(@RequestBody AiMatches.Request request) {
        try {
            return ResponseEntity.ok(customService.playAiMatch(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("AI 대전 생성 실패", e);
            return ResponseEntity.status(500).body(Map.of("message", "AI 대전을 생성하지 못했습니다. DB 연결을 확인한 후 다시 시도해주세요."));
        }
    }

	@GetMapping("/api/customs")
	public ResponseEntity<?> customs(HttpServletRequest request) {
        Users user = resolveUser(request);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "로그인 후 이용해주세요."));
        return ResponseEntity.ok(customService.findByUserId(user.getUserId()));
	}

    @PostMapping("/api/customs")
    public ResponseEntity<?> save(@RequestBody CustomTeams team, HttpServletRequest request) {
        Users user = resolveUser(request);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "로그인 후 이용해주세요."));
        try {
            return ResponseEntity.ok(customService.save(user.getUserId(), team));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("스쿼드 저장 실패", e);
            return ResponseEntity.status(500).body(Map.of("message", "스쿼드를 저장하지 못했습니다. 잠시 후 다시 시도해주세요."));
        }
    }

    private Users resolveUser(HttpServletRequest request) {
        String loginId = LoginManager.getLoginUserId(request);
        if (loginId == null) {
            String token = JwtProvider.extractToken(request);
            if (token != null && JwtProvider.isValidToken(token)) loginId = JwtProvider.getLoginIdFromToken(token);
        }
        return loginId == null ? null : userDAO.selectUserByLoginId(loginId);
    }
}
