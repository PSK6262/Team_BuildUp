package com.app.dao.community;

import java.util.List;
import java.util.Map;
import com.app.dto.community.CommunityCategory;
import com.app.dto.community.Comments;
import com.app.dto.community.PostLikes;
import com.app.dto.community.PostAttachments;
import com.app.dto.community.Posts;
public interface CommunityDAO {
    // 커뮤니티 카테고리 목록을 조회합니다.
    List<CommunityCategory> findCategories();
    // 검색 조건에 맞는 전체 게시글 수를 조회합니다.
    long countPosts(Map<String, Object> params);
    // 현재 페이지의 게시글 목록을 조회합니다.
    List<Posts> findPosts(Map<String, Object> params);
    // 게시글 상세 정보를 조회합니다.
    Posts findPostById(Long postId);
    // 게시글 조회수를 증가시킵니다.
    int increaseViewCount(Long postId);
    // 로그인한 사용자의 게시글을 등록합니다.
    int insertPost(Posts post);
    // 작성자의 게시글 내용을 수정합니다.
    int updatePost(Posts post);
    // 작성자의 게시글을 숨김 처리합니다.
    int blindPost(Long postId, Long userId);
    // 작성자의 게시글을 삭제(소프트 딜리트) 처리합니다.
    int deletePost(Long postId, Long userId);
    // 사용자의 게시글 추천 여부를 조회합니다.
    int countPostLike(PostLikes postLike);
    // 게시글 추천 내역을 등록합니다.
    int insertPostLike(PostLikes postLike);
    // 게시글 추천 내역을 삭제합니다.
    int deletePostLike(PostLikes postLike);
    // 게시글 추천수를 증가시킵니다.
    int increaseLikeCount(Long postId);
    // 게시글 추천수를 감소시킵니다.
    int decreaseLikeCount(Long postId);
    // 게시글의 댓글과 대댓글 목록을 조회합니다.
    List<Comments> findComments(Long postId);
    // 댓글 번호로 댓글 정보를 조회합니다.
    Comments findCommentById(Long commentId);
    // 로그인한 사용자의 댓글 또는 대댓글을 등록합니다.
    int insertComment(Comments comment);
    // 작성자의 댓글 또는 대댓글 내용을 수정합니다.
    int updateComment(Comments comment);
    // 작성자의 댓글 또는 대댓글을 숨김 처리합니다.
    int blindComment(Long commentId, Long userId);
    // 작성자의 댓글 또는 대댓글을 삭제(소프트 딜리트) 처리합니다.
    int deleteComment(Long commentId, Long userId);
    // 게시글에 등록된 첨부파일 목록을 조회합니다.
    List<PostAttachments> findPostAttachments(Long postId);
    // 첨부파일 번호로 파일 정보를 조회합니다.
    PostAttachments findPostAttachmentById(Long attachmentId);
    // 게시글에 등록된 첨부파일 수를 조회합니다.
    int countPostAttachments(Long postId);
    // 게시글에 등록된 첨부파일의 전체 크기를 조회합니다.
    long sumPostAttachmentSize(Long postId);
    // 게시글 첨부파일 정보를 등록합니다.
    int insertPostAttachment(PostAttachments attachment);
    // 게시글 첨부파일 정보를 삭제합니다.
    int deletePostAttachment(Long attachmentId);
}
