package com.app.service.community.impl;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.app.dao.community.CommunityDAO;
import com.app.dao.user.UserDAO;
import com.app.dto.community.CommunityBoardType;
import com.app.dto.community.CommunityCategory;
import com.app.dto.community.Comments;
import com.app.dto.community.PostLikes;
import com.app.dto.community.PostListResponse;
import com.app.dto.community.PostAttachments;
import com.app.dto.community.Posts;
import com.app.dto.user.Users;
import com.app.service.community.CommunityService;
@Service
public class CommunityServiceImpl implements CommunityService {
    private static final int POST_CONTENT_MAX_LENGTH = 1000;
    private static final int COMMENT_MAX_LENGTH = 100;
    private static final int POST_ATTACHMENT_MAX_COUNT = 5;
    private static final long POST_ATTACHMENT_MAX_SIZE = 10L * 1024 * 1024;
    private static final long POST_ATTACHMENT_MAX_TOTAL_SIZE = 20L * 1024 * 1024;
    private static final Map<String, Set<String>> ALLOWED_ATTACHMENT_TYPES = Map.of(
        ".jpg", Set.of("image/jpeg", "image/jpg", "application/octet-stream"),
        ".jpeg", Set.of("image/jpeg", "image/jpg", "application/octet-stream"),
        ".png", Set.of("image/png", "application/octet-stream"),
        ".gif", Set.of("image/gif", "application/octet-stream"),
        ".webp", Set.of("image/webp", "application/octet-stream"),
        ".pdf", Set.of("application/pdf", "application/octet-stream"),
        ".txt", Set.of("text/plain", "application/octet-stream"),
        ".docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"),
        ".xlsx", Set.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"),
        ".zip", Set.of("application/zip", "application/x-zip-compressed", "application/octet-stream")
    );
    private final CommunityDAO communityDAO;
    private final UserDAO userDAO;
    @Value("${community.upload.path:}")
    private String configuredUploadPath;
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
        String content = validateCommentContent(comment);

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
        comment.setContent(content);
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
        String content = validateCommentContent(comment);

        comment.setCommentId(commentId);
        comment.setUserId(user.getUserId());
        comment.setContent(content);
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

    @Override
    public List<PostAttachments> findPostAttachments(Long postId) {
        findSavedPost(postId);
        return communityDAO.findPostAttachments(postId);
    }

    @Override
    @Transactional
    public List<PostAttachments> uploadPostAttachments(
            String loginId, Long postId, List<MultipartFile> files) {
        Users user = findLoginUser(loginId);
        Posts post = findSavedPost(postId);
        if (!post.getUserId().equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Attachment owner required");
        }
        validateAttachmentRequest(postId, files);

        int savedCount = communityDAO.countPostAttachments(postId);
        Path postDirectory = postAttachmentDirectory(postId);
        List<Path> storedPaths = new ArrayList<>();
        try {
            Files.createDirectories(postDirectory);
            for (int index = 0; index < files.size(); index++) {
                MultipartFile file = files.get(index);
                String originalName = safeOriginalName(file.getOriginalFilename());
                String extension = fileExtension(originalName);
                String storedName = UUID.randomUUID() + extension;
                Path storedPath = postDirectory.resolve(storedName).normalize();
                if (!storedPath.startsWith(postDirectory)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment");
                }
                try (InputStream input = file.getInputStream()) {
                    Files.copy(input, storedPath);
                }
                storedPaths.add(storedPath);

                PostAttachments attachment = new PostAttachments();
                attachment.setPostId(postId);
                attachment.setOriginalName(originalName);
                attachment.setStoredName(storedName);
                attachment.setContentType(storedContentType(file.getContentType(), extension));
                attachment.setFileSize(file.getSize());
                attachment.setSortOrder(savedCount + index);
                if (communityDAO.insertPostAttachment(attachment) != 1) {
                    throw new IOException("Attachment metadata creation failed");
                }
            }
            return communityDAO.findPostAttachments(postId);
        } catch (IOException | RuntimeException exception) {
            storedPaths.forEach(this::deleteStoredFileQuietly);
            if (exception instanceof ResponseStatusException) {
                throw (ResponseStatusException) exception;
            }
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "Attachment storage failed", exception);
        }
    }

    @Override
    public PostAttachments findPostAttachment(Long attachmentId) {
        if (attachmentId == null || attachmentId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment");
        }
        PostAttachments attachment = communityDAO.findPostAttachmentById(attachmentId);
        if (attachment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
        }
        findSavedPost(attachment.getPostId());
        return attachment;
    }

    @Override
    public Resource loadPostAttachmentFile(PostAttachments attachment) {
        Path directory = postAttachmentDirectory(attachment.getPostId());
        Path storedPath = directory.resolve(attachment.getStoredName()).normalize();
        if (!storedPath.startsWith(directory) || !Files.isRegularFile(storedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
        }
        return new FileSystemResource(storedPath);
    }

    @Override
    @Transactional
    public void deletePostAttachment(String loginId, Long postId, Long attachmentId) {
        Users user = findLoginUser(loginId);
        Posts post = findSavedPost(postId);
        if (!post.getUserId().equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Attachment owner required");
        }
        PostAttachments attachment = communityDAO.findPostAttachmentById(attachmentId);
        if (attachment == null || !postId.equals(attachment.getPostId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
        }
        if (communityDAO.deletePostAttachment(attachmentId) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
        }
        try {
            Path directory = postAttachmentDirectory(postId);
            Path storedPath = directory.resolve(attachment.getStoredName()).normalize();
            if (!storedPath.startsWith(directory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment");
            }
            Files.deleteIfExists(storedPath);
        } catch (IOException exception) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "Attachment storage failed", exception);
        }
    }

    // 첨부파일 개수, 크기, 확장자와 MIME 타입을 검사합니다.
    private void validateAttachmentRequest(Long postId, List<MultipartFile> files) {
        if (files == null || files.isEmpty() || files.stream().anyMatch(MultipartFile::isEmpty)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment");
        }
        int savedCount = communityDAO.countPostAttachments(postId);
        if (savedCount + files.size() > POST_ATTACHMENT_MAX_COUNT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment limit exceeded");
        }
        long totalSize = 0;
        for (MultipartFile file : files) {
            if (file.getSize() <= 0 || file.getSize() > POST_ATTACHMENT_MAX_SIZE) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment too large");
            }
            totalSize += file.getSize();
            String originalName = safeOriginalName(file.getOriginalFilename());
            String extension = fileExtension(originalName);
            Set<String> allowedTypes = ALLOWED_ATTACHMENT_TYPES.get(extension);
            if (allowedTypes == null || !allowedTypes.contains(normalizeContentType(file.getContentType()))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment");
            }
        }
        if (communityDAO.sumPostAttachmentSize(postId) + totalSize > POST_ATTACHMENT_MAX_TOTAL_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment too large");
        }
    }

    private String safeOriginalName(String originalName) {
        if (originalName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment");
        }
        String normalized = originalName.replace('\\', '/');
        String fileName = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (fileName.isBlank() || fileName.codePointCount(0, fileName.length()) > 255
                || fileName.codePoints().anyMatch(character -> character < 32 || character == 127)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment");
        }
        return fileName;
    }

    private String fileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 1 || dotIndex == fileName.length() - 1) return "";
        return fileName.substring(dotIndex).toLowerCase(Locale.ROOT);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) return "application/octet-stream";
        return contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
    }

    // 브라우저가 일반 바이너리 타입으로 보낸 파일은 허용된 확장자 기준 타입으로 저장합니다.
    private String storedContentType(String contentType, String extension) {
        String normalized = normalizeContentType(contentType);
        if (!"application/octet-stream".equals(normalized)) return normalized;
        return switch (extension) {
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".png" -> "image/png";
            case ".gif" -> "image/gif";
            case ".webp" -> "image/webp";
            case ".pdf" -> "application/pdf";
            case ".txt" -> "text/plain";
            case ".docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case ".xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case ".zip" -> "application/zip";
            default -> normalized;
        };
    }

    private Path postAttachmentDirectory(Long postId) {
        String root = configuredUploadPath == null || configuredUploadPath.isBlank()
            ? Paths.get(System.getProperty("user.home"), "plugin-uploads").toString()
            : configuredUploadPath.trim();
        return Paths.get(root).toAbsolutePath().normalize().resolve("posts")
            .resolve(String.valueOf(postId)).normalize();
    }

    private void deleteStoredFileQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // 실패 응답 처리 중 생성된 파일을 가능한 범위에서 정리합니다.
        }
    }

    // 댓글의 공백과 최대 글자 수를 등록·수정에서 동일하게 검사합니다.
    private String validateCommentContent(Comments comment) {
        if (comment == null || comment.getContent() == null || comment.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid comment");
        }
        String content = comment.getContent().trim();
        if (content.codePointCount(0, content.length()) > COMMENT_MAX_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment too long");
        }
        return content;
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
        String content = post.getContent().trim();
        if (content.codePointCount(0, content.length()) > POST_CONTENT_MAX_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post content too long");
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
