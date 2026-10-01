package com.app.service.user;

import java.util.Map;

import com.app.dto.user.Users;

public interface UserService {
	/**
	 * 신규 회원가입 (비밀번호 암호화 및 기본 권한 부여)
	 */
	Users signup(Users user);

	/**
	 * 로그인 검증 (아이디/비밀번호 확인)
	 */
	Users login(String loginId, String password);

	/**
	 * 아이디 중복 확인 (사용 가능 여부: 중복 없으면 true)
	 */
	boolean isLoginIdAvailable(String loginId);

	/**
	 * 닉네임 중복 확인 (사용 가능 여부: 중복 없으면 true)
	 */
	boolean isNicknameAvailable(String nickname);

	/**
	 * 이메일 중복 확인 (사용 가능 여부: 중복 없으면 true)
	 */
	boolean isEmailAvailable(String email);

	/**
	 * 마이페이지 사용자 상세 정보 조회
	 */
	Users getUserProfile(Long userId);

	/**
	 * 사용자 기본 정보 수정 (닉네임, 이메일, 응원 구단)
	 */
	Users updateUserProfile(Users user);

	/**
	 * 비밀번호 변경
	 */
	boolean changePassword(Long userId, String currentPassword, String newPassword);

	/**
	 * 회원 탈퇴 (회원 데이터 및 연관 데이터 삭제)
	 */
	boolean withdraw(Long userId, String email);

	/**
	 * 로그인 아이디로 사용자 정보 조회 (비밀번호 제외)
	 */
	Users getUserByLoginId(String loginId);

	/**
	 * 마이페이지 활동 요약 통계 (작성글 수, 작성댓글 수, 좋아요 수)
	 */
	Map<String, Object> getUserActivitySummary(Long userId);

	/**
	 * 사용자가 작성한 게시글 목록 조회 (페이징)
	 */
	Map<String, Object> getUserPosts(Long userId, int page, int size);

	/**
	 * 사용자가 작성한 댓글 목록 조회 (페이징)
	 */
	Map<String, Object> getUserComments(Long userId, int page, int size);

	/**
	 * 사용자가 좋아요(추천)한 게시글 목록 조회 (페이징)
	 */
	Map<String, Object> getUserLikedPosts(Long userId, int page, int size);

	/**
	 * 사용자의 최근 포인트 변동 이력 (최근 5건) 조회
	 */
	java.util.List<com.app.dto.prediction.PointHistory> getUserPointHistories(Long userId);

	/**
	 * 마이페이지 / 포인트샵: 보유 아이템 목록 및 구매 내역 조회
	 */
	Map<String, Object> getUserShopData(Long userId);

	/**
	 * 포인트샵 아이템 구매 처리 (포인트 차감 + 보관함 등록 + 주문/거래 이력 저장)
	 */
	Map<String, Object> purchaseShopItem(Long userId, Map<String, Object> itemRequest);
}
