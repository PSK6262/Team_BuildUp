package com.app.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.team.Players;
import com.app.service.api.FootballApiService;

@RestController
public class FootballTestController {

    private final FootballApiService footballApiService;

    // 생성자 주입
    public FootballTestController(FootballApiService footballApiService) {
        this.footballApiService = footballApiService;
    }

    @GetMapping("/test/fixtures")
    public String testFixtures() {
        // 서비스 메서드 호출 (API 요청)
        String jsonResult = footballApiService.fetchPremierLeagueFixtures();

        // 1. 서버 콘솔(Terminal/Log)에 sysout 출력
        System.out.println("========== 프리미어리그 데이터 API 응답 결과 ==========");
        System.out.println(jsonResult);
        System.out.println("==================================================");

        // 2. 브라우저 화면에서도 결과를 확인할 수 있도록 반환
        return jsonResult;
    }
}