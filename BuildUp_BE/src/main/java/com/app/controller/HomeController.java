package com.app.controller;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * [BuildUp 메인 및 SPA 라우팅 컨트롤러]
 * 
 * 브라우저에서 localhost:8080 접속 시 (/, /plug, /plug/** 등)
 * webapp/index.html을 직접 읽어 스트리밍함으로써
 * 404 없이 톰캣 단독(8080)으로 React 화면과 API를 완벽 서비스합니다.
 */
@Controller
public class HomeController {

    @Autowired
    private ServletContext servletContext;

    @GetMapping(value = {"", "/", "/index.html", "/plug", "/plug/**"}, produces = "text/html;charset=UTF-8")
    @ResponseBody
    public String serveSpa(HttpServletRequest request) {
        try (InputStream is = servletContext.getResourceAsStream("/index.html")) {
            if (is != null) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            // 읽기 실패 시 아래 안내 화면 출력
        }

        return "<!DOCTYPE html>\n"
             + "<html lang=\"ko\">\n"
             + "<head><meta charset=\"UTF-8\"><title>BuildUp</title></head>\n"
             + "<body style=\"font-family: sans-serif; text-align: center; padding: 60px;\">\n"
             + "  <h2>⚽ BuildUp 톰캣 서버 정상 구동 중!</h2>\n"
             + "  <p>React 프론트엔드 빌드 파일(index.html)을 불러오는 중입니다.</p>\n"
             + "  <p>터미널에서 <code>npm run build</code>를 실행해 주세요.</p>\n"
             + "</body>\n"
             + "</html>";
    }
}
