package com.app.controller.community;

import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.app.common.ResultCode;
import com.app.common.ApiResponse;
import org.springframework.web.server.ResponseStatusException;
import com.app.dto.community.CommunityBoardType;
import com.app.dto.community.CommunityCategory;
import com.app.dto.community.Comments;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.app.dto.community.PostListResponse;
import com.app.dto.community.Posts;
import com.app.service.community.CommunityService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;
@RestController
public class CommunityController {
    private final CommunityService communityService;
    public CommunityController(CommunityService communityService) { this.communityService = communityService; }


    // DB에 등록된 커뮤니티 카테고리 목록을 반환합니다.
    @GetMapping("/api/communities/categories")
    public ApiResponse<List<CommunityCategory>> communityCategories() {
        List<CommunityCategory> categories = communityService.findCategories();
        if (categories.isEmpty()) {
            return ApiResponse.response(ResultCode.SUC_EMPTY, categories);
        }
        return ApiResponse.success(categories);
    }


    // 검색 조건을 받아 게시글 목록과 페이지 정보를 반환합니다.
    @GetMapping("/api/communities")
    public ApiResponse<PostListResponse> communities(
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
            return ApiResponse.response(ResultCode.SUC_EMPTY, result);
        }
        return ApiResponse.success(result);
    }

    // 게시글을 조회하고 조회수가 반영된 상세 정보를 반환합니다.
    @GetMapping("/api/communities/{postId}")
    public ApiResponse<Posts> communityDetail(@PathVariable("postId") Long postId) {
        return ApiResponse.success(communityService.findPost(postId));
    }

    // 로그인한 사용자의 아이디로 작성자를 확인하여 게시글을 등록합니다.
    @PostMapping("/api/communities")
    public ResponseEntity<ApiResponse<Posts>> createCommunity(
            @RequestBody Posts post, HttpServletRequest request) {
        String loginId = resolveLoginId(request);
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ResultCode.COMMUNITY_LOGIN_REQUIRED));
        }
        Posts createdPost = communityService.createPost(loginId, post);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(createdPost));
    }

    // 로그인한 작성자의 게시글을 수정합니다.
    @PutMapping("/api/communities/{postId}")
    public ResponseEntity<ApiResponse<Posts>> updateCommunity(
            @PathVariable("postId") Long postId, @RequestBody Posts post, HttpServletRequest request) {
        String loginId = resolveLoginId(request);
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ResultCode.COMMUNITY_LOGIN_REQUIRED));
        }
        return ResponseEntity.ok(ApiResponse.success(communityService.updatePost(loginId, postId, post)));
    }

    // 로그인한 작성자의 게시글을 목록과 상세에서 숨김 처리합니다.
    @DeleteMapping("/api/communities/{postId}")
    public ResponseEntity<ApiResponse<Void>> deleteCommunity(
            @PathVariable("postId") Long postId, HttpServletRequest request) {
        String loginId = resolveLoginId(request);
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ResultCode.COMMUNITY_LOGIN_REQUIRED));
        }
        communityService.deletePost(loginId, postId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // 로그인 사용자의 게시글 추천 여부를 반환합니다.
    @GetMapping("/api/communities/{postId}/likes/me")
    public ResponseEntity<ApiResponse<Boolean>> communityLikeStatus(
            @PathVariable("postId") Long postId, HttpServletRequest request) {
        String loginId = resolveLoginId(request);
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ResultCode.COMMUNITY_LOGIN_REQUIRED));
        }
        return ResponseEntity.ok(ApiResponse.success(communityService.isPostLiked(loginId, postId)));
    }

    // 로그인 사용자의 게시글 추천을 등록합니다.
    @PostMapping("/api/communities/{postId}/likes")
    public ResponseEntity<ApiResponse<Posts>> likeCommunity(
            @PathVariable("postId") Long postId, HttpServletRequest request) {
        String loginId = resolveLoginId(request);
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ResultCode.COMMUNITY_LOGIN_REQUIRED));
        }
        return ResponseEntity.ok(ApiResponse.success(communityService.likePost(loginId, postId)));
    }

    // 로그인 사용자의 게시글 추천을 취소합니다.
    @DeleteMapping("/api/communities/{postId}/likes")
    public ResponseEntity<ApiResponse<Posts>> unlikeCommunity(
            @PathVariable("postId") Long postId, HttpServletRequest request) {
        String loginId = resolveLoginId(request);
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ResultCode.COMMUNITY_LOGIN_REQUIRED));
        }
        return ResponseEntity.ok(ApiResponse.success(communityService.unlikePost(loginId, postId)));
    }

    // 게시글에 등록된 댓글과 대댓글 목록을 반환합니다.
    @GetMapping("/api/communities/{postId}/comments")
    public ApiResponse<List<Comments>> communityComments(@PathVariable("postId") Long postId) {
        List<Comments> comments = communityService.findComments(postId);
        if (comments.isEmpty()) {
            return ApiResponse.response(ResultCode.SUC_EMPTY, comments);
        }
        return ApiResponse.success(comments);
    }

    // 로그인 사용자의 댓글 또는 대댓글을 등록합니다.
    @PostMapping("/api/communities/{postId}/comments")
    public ResponseEntity<ApiResponse<Comments>> createCommunityComment(
            @PathVariable("postId") Long postId, @RequestBody Comments comment, HttpServletRequest request) {
        String loginId = resolveLoginId(request);
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ResultCode.COMMUNITY_LOGIN_REQUIRED));
        }
        Comments createdComment = communityService.createComment(loginId, postId, comment);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(createdComment));
    }

    // 로그인한 작성자의 댓글 또는 대댓글을 수정합니다.
    @PutMapping("/api/communities/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Comments>> updateCommunityComment(
            @PathVariable("postId") Long postId, @PathVariable("commentId") Long commentId,
            @RequestBody Comments comment, HttpServletRequest request) {
        String loginId = resolveLoginId(request);
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ResultCode.COMMUNITY_LOGIN_REQUIRED));
        }
        return ResponseEntity.ok(ApiResponse.success(
            communityService.updateComment(loginId, postId, commentId, comment)));
    }

    // 로그인한 작성자의 댓글 또는 대댓글을 숨김 처리합니다.
    @DeleteMapping("/api/communities/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteCommunityComment(
            @PathVariable("postId") Long postId, @PathVariable("commentId") Long commentId,
            HttpServletRequest request) {
        String loginId = resolveLoginId(request);
        if (loginId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ResultCode.COMMUNITY_LOGIN_REQUIRED));
        }
        communityService.deleteComment(loginId, postId, commentId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // 세션을 먼저 확인하고 세션이 없으면 JWT에서 로그인 아이디를 확인합니다.
    private String resolveLoginId(HttpServletRequest request) {
        String loginId = LoginManager.getLoginUserId(request);
        if (loginId != null) {
            return loginId;
        }
        String token = JwtProvider.extractToken(request);
        if (token != null && JwtProvider.isValidToken(token)) {
            return JwtProvider.getLoginIdFromToken(token);
        }
        return null;
    }
}
