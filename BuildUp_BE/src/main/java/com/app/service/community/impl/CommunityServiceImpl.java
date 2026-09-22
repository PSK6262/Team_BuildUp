package com.app.service.community.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.app.dao.community.CommunityDAO;
import com.app.dao.user.UserDAO;
import com.app.dto.community.CommunityBoardType;
import com.app.dto.community.CommunityCategory;
import com.app.dto.community.Comments;
import com.app.dto.community.PostLikes;
import com.app.dto.community.PostListResponse;
import com.app.dto.community.Posts;
import com.app.dto.user.Users;
import com.app.service.community.CommunityService;
@Service
public class CommunityServiceImpl implements CommunityService {
    private final CommunityDAO communityDAO;
    private final UserDAO userDAO;
    public CommunityServiceImpl(CommunityDAO communityDAO, UserDAO userDAO) {
        this.communityDAO = communityDAO;
        this.userDAO = userDAO;
    }

    @Override
    public List<CommunityCategory> findCategories() {
        return communityDAO.findCategories();
    }

    @Override
    public PostListResponse findPosts(List<Long> categoryIds, CommunityBoardType board, Long teamId,
            String keyword, String sort, int page, int size) {
        // 조회 조건과 페이지 범위를 검사합니다.
        if (categoryIds == null || categoryIds.isEmpty() || categoryIds.size() > 50
                || categoryIds.stream().anyMatch(id -> id == null || id < 1)
                || board == null
                || !List.of("latest", "likes", "views").contains(sort)
                || page < 1 || size < 1 || size > 100 || keyword.length() > 255
                || (teamId != null && teamId < 1)
                || (board == CommunityBoardType.FREE && teamId != null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid community search parameters");
        }
        // DB 조회에 사용할 조건을 구성합니다.
        Map<String, Object> params = new HashMap<>();
        params.put("categoryIds", categoryIds);
        params.put("board", board);
        params.put("teamId", teamId);
        // 검색어의 공백을 정리하고 특수문자를 문자 그대로 검색합니다.
        params.put("keyword", keyword.trim().replace("!", "!!").replace("%", "!%").replace("_", "!_"));
        params.put("sort", sort);
        // 요청 페이지 앞에서 건너뛸 게시글 수를 계산합니다.
        params.put("offset", ((long) page - 1) * size);
        params.put("size", size);
        // 전체 글 수와 현재 페이지 목록을 조회하여 응답을 구성합니다.
        long total = communityDAO.countPosts(params);
        return new PostListResponse(communityDAO.findPosts(params), total, page, size,
            (total + size - 1) / size);
    }

    @Override
    @Transactional
    public Posts findPost(Long postId) {
        // 존재하는 공개 게시글만 조회수를 반영합니다.
        if (postId == null || postId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid post id");
        }
        if (communityDAO.increaseViewCount(postId) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }
        Posts post = communityDAO.findPostById(postId);
        if (post == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }
        return post;
    }

    @Override
    @Transactional
    public Posts createPost(String loginId, Posts post) {
        // 세션 또는 JWT에서 확인한 로그인 아이디로 실제 회원을 조회합니다.
        Users user = findLoginUser(loginId);
        validatePost(post);

        // 요청에서 받은 userId는 사용하지 않고 로그인 회원 번호를 작성자로 지정합니다.
        post.setUserId(user.getUserId());
        post.setTitle(post.getTitle().trim());
        post.setContent(post.getContent().trim());
        post.setNickname(user.getNickname());

        if (communityDAO.insertPost(post) != 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Post creation failed");
        }
        return post;
    }

    @Override
    @Transactional
    public Posts updatePost(String loginId, Long postId, Posts post) {
        Users user = findLoginUser(loginId);
        Posts savedPost = findSavedPost(postId);
        if (!savedPost.getUserId().equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Post owner required");
        }
        validatePost(post);

        post.setPostId(postId);
        post.setUserId(user.getUserId());
        post.setTitle(post.getTitle().trim());
        post.setContent(post.getContent().trim());
        if (communityDAO.updatePost(post) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }
        return communityDAO.findPostById(postId);
    }

    @Override
    @Transactional
    public void deletePost(String loginId, Long postId) {
        Users user = findLoginUser(loginId);
        Posts savedPost = findSavedPost(postId);
        if (!savedPost.getUserId().equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Post owner required");
        }
        if (communityDAO.deletePost(postId, user.getUserId()) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }
    }

    @Override
    public boolean isPostLiked(String loginId, Long postId) {
        Users user = findLoginUser(loginId);
        findSavedPost(postId);
        return communityDAO.countPostLike(toPostLike(user.getUserId(), postId)) > 0;
    }

    @Override
    @Transactional
    public Posts likePost(String loginId, Long postId) {
        Users user = findLoginUser(loginId);
        findSavedPost(postId);
        PostLikes postLike = toPostLike(user.getUserId(), postId);
        // 이미 추천한 게시글은 추천수를 중복으로 증가시키지 않습니다.
        if (communityDAO.countPostLike(postLike) == 0) {
            communityDAO.insertPostLike(postLike);
            communityDAO.increaseLikeCount(postId);
        }
        return communityDAO.findPostById(postId);
    }

    @Override
    @Transactional
    public Posts unlikePost(String loginId, Long postId) {
        Users user = findLoginUser(loginId);
        findSavedPost(postId);
        PostLikes postLike = toPostLike(user.getUserId(), postId);
        // 추천 내역이 있을 때만 추천수를 감소시킵니다.
        if (communityDAO.deletePostLike(postLike) == 1) {
            communityDAO.decreaseLikeCount(postId);
        }
        return communityDAO.findPostById(postId);
    }

    @Override
    public List<Comments> findComments(Long postId) {
        findSavedPost(postId);
        return communityDAO.findComments(postId);
    }

    @Override
    @Transactional
    public Comments createComment(String loginId, Long postId, Comments comment) {
        Users user = findLoginUser(loginId);
        findSavedPost(postId);
        if (comment == null || comment.getContent() == null || comment.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid comment");
        }

        // 부모 댓글이 같은 게시글의 일반 댓글인지 확인하여 대댓글 깊이를 한 단계로 제한합니다.
        if (comment.getPCommentId() != null) {
            Comments parent = communityDAO.findCommentById(comment.getPCommentId());
            if (parent == null || !postId.equals(parent.getPostId()) || parent.getPCommentId() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid parent comment");
            }
        }

        // 요청에서 받은 게시글과 회원 번호를 사용하지 않고 경로와 로그인 사용자로 지정합니다.
        comment.setPostId(postId);
        comment.setUserId(user.getUserId());
        comment.setContent(comment.getContent().trim());
        if (communityDAO.insertComment(comment) != 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Comment creation failed");
        }
        return communityDAO.findCommentById(comment.getCommentId());
    }

    @Override
    @Transactional
    public Comments updateComment(String loginId, Long postId, Long commentId, Comments comment) {
        Users user = findLoginUser(loginId);
        findSavedPost(postId);
        Comments savedComment = findSavedComment(postId, commentId);
        if (!savedComment.getUserId().equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Comment owner required");
        }
        if (comment == null || comment.getContent() == null || comment.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid comment");
        }

        comment.setCommentId(commentId);
        comment.setUserId(user.getUserId());
        comment.setContent(comment.getContent().trim());
        if (communityDAO.updateComment(comment) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }
        return communityDAO.findCommentById(commentId);
    }

    @Override
    @Transactional
    public void deleteComment(String loginId, Long postId, Long commentId) {
        Users user = findLoginUser(loginId);
        findSavedPost(postId);
        Comments savedComment = findSavedComment(postId, commentId);
        if (!savedComment.getUserId().equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Comment owner required");
        }
        if (communityDAO.deleteComment(commentId, user.getUserId()) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }
    }

    // 로그인 아이디에 해당하는 실제 회원을 확인합니다.
    private Users findLoginUser(String loginId) {
        if (loginId == null || loginId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        Users user = userDAO.selectUserByLoginId(loginId);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid login user");
        }
        return user;
    }

    // 변경 대상 게시글이 존재하는지 확인합니다.
    private Posts findSavedPost(Long postId) {
        if (postId == null || postId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid post id");
        }
        Posts savedPost = communityDAO.findPostById(postId);
        if (savedPost == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }
        return savedPost;
    }

    // 변경할 댓글이 해당 게시글에 존재하는지 확인합니다.
    private Comments findSavedComment(Long postId, Long commentId) {
        if (commentId == null || commentId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid comment id");
        }
        Comments savedComment = communityDAO.findCommentById(commentId);
        if (savedComment == null || !postId.equals(savedComment.getPostId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }
        return savedComment;
    }

    // 게시글 제목, 본문, 카테고리와 팀 값을 검사합니다.
    private void validatePost(Posts post) {
        if (post == null || post.getTitle() == null || post.getTitle().isBlank()
                || post.getTitle().trim().length() > 255
                || post.getContent() == null || post.getContent().isBlank()
                || post.getCategoryId() == null || post.getCategoryId() < 1
                || (post.getTeamId() != null && post.getTeamId() < 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid post");
        }
    }

    // 추천 처리에 사용할 사용자와 게시글 번호를 구성합니다.
    private PostLikes toPostLike(Long userId, Long postId) {
        PostLikes postLike = new PostLikes();
        postLike.setUserId(userId);
        postLike.setPostId(postId);
        return postLike;
    }
}
