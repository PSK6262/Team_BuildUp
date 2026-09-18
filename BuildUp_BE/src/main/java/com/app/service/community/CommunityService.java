package com.app.service.community;

import java.util.List;
import com.app.dto.community.CommunityBoardType;
import com.app.dto.community.CommunityCategory;
import com.app.dto.community.Comments;
import com.app.dto.community.PostListResponse;
import com.app.dto.community.Posts;
public interface CommunityService {
    // 커뮤니티 카테고리 목록을 조회합니다.
    List<CommunityCategory> findCategories();
    // 조건에 맞는 게시글 목록을 조회합니다.
    PostListResponse findPosts(List<Long> categoryIds, CommunityBoardType board, Long teamId,
        String keyword, String sort, int page, int size);

    // 게시글 상세 정보를 조회합니다.
    Posts findPost(Long postId);

    // 로그인 아이디를 작성자 회원 번호로 변환하여 게시글을 등록합니다.
    Posts createPost(String loginId, Posts post);
    // 로그인한 작성자의 게시글을 수정합니다.
    Posts updatePost(String loginId, Long postId, Posts post);
    // 로그인한 작성자의 게시글을 숨김 처리합니다.
    void deletePost(String loginId, Long postId);
    // 로그인 사용자의 게시글 추천 여부를 조회합니다.
    boolean isPostLiked(String loginId, Long postId);
    // 로그인 사용자의 게시글 추천을 등록합니다.
    Posts likePost(String loginId, Long postId);
    // 로그인 사용자의 게시글 추천을 취소합니다.
    Posts unlikePost(String loginId, Long postId);
    // 게시글의 댓글과 대댓글 목록을 조회합니다.
    List<Comments> findComments(Long postId);
    // 로그인 아이디를 작성자로 지정하여 댓글 또는 대댓글을 등록합니다.
    Comments createComment(String loginId, Long postId, Comments comment);
    // 로그인한 작성자의 댓글 또는 대댓글을 수정합니다.
    Comments updateComment(String loginId, Long postId, Long commentId, Comments comment);
    // 로그인한 작성자의 댓글 또는 대댓글을 숨김 처리합니다.
    void deleteComment(String loginId, Long postId, Long commentId);
}
