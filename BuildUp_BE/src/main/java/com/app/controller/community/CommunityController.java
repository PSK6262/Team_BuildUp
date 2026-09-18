package com.app.controller.community;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.logging.Level;
import java.util.logging.Logger;
import com.app.common.ResultCode;
import com.app.dto.rest.RestApiResponse;
import org.springframework.web.server.ResponseStatusException;
import com.app.dto.community.CommunityBoardType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.app.dto.community.PostListResponse;
import com.app.service.community.CommunityService;
@RestController
public class CommunityController {
    private static final Logger log = Logger.getLogger(CommunityController.class.getName());
    private final CommunityService communityService;
    public CommunityController(CommunityService communityService) { this.communityService = communityService; }


    // 검색 조건을 받아 게시글 목록과 페이지 정보를 반환합니다.
    @GetMapping("/api/communities")
    public RestApiResponse<PostListResponse> communities(
            @RequestParam("categoryIds") List<Long> categoryIds,
            @RequestParam(value = "board", defaultValue = "all") String board,
            @RequestParam(value = "teamId", required = false) Long teamId,
            @RequestParam(value = "keyword", defaultValue = "") String keyword,
            @RequestParam(value = "sort", defaultValue = "latest") String sort,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        // 게시판 요청값을 enum으로 변환하고 잘못된 값은 거절합니다.
        CommunityBoardType boardType;
        try {
            boardType = CommunityBoardType.fromValue(board);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid community board type");
        }
        PostListResponse result = communityService.findPosts(categoryIds, boardType, teamId, keyword, sort, page, size);
        // 빈 목록도 페이지 정보를 유지하여 반환합니다.
        if (result.getItems().isEmpty()) {
            return RestApiResponse.response(ResultCode.SUC_EMPTY, result);
        }
        return RestApiResponse.success(result);
    }

    // 누락되거나 형식이 잘못된 요청값을 처리합니다.
    @ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<RestApiResponse<Void>> invalidParameter(Exception exception) {
        return ResponseEntity.badRequest().body(RestApiResponse.error(ResultCode.INVALID_INPUT));
    }

    // 요청 검증 오류의 HTTP 상태를 유지하여 반환합니다.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<RestApiResponse<Void>> invalidRequest(ResponseStatusException exception) {
        ResultCode code = exception.getStatus() == HttpStatus.BAD_REQUEST
            ? ResultCode.INVALID_INPUT : ResultCode.FAIL;
        return ResponseEntity.status(exception.getStatus()).body(RestApiResponse.error(code));
    }

    // 서버 오류를 기록하고 공통 실패 응답을 반환합니다.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<RestApiResponse<Void>> serverError(Exception exception) {
        log.log(Level.SEVERE, "Community API failed", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(RestApiResponse.error(ResultCode.FAIL));
    }
}
