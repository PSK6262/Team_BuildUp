package com.app.service.user.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.team.TeamDAO;
import com.app.dao.user.UserDAO;
import com.app.dao.user.UserMailDAO;
import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.team.Teams;
import com.app.dto.user.Users;
import com.app.service.user.UserService;
import com.app.service.user.UserMailService;
import com.app.util.SHA256Encryptor;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserServiceImpl implements UserService {

	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9](?!.*\\.\\.)[a-zA-Z0-9._-]{2,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
	private static final Pattern LOGIN_ID_PATTERN = Pattern.compile("^[a-z0-9]{4,20}$");
	private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[\\uAC00-\\uD7A3a-zA-Z0-9]{2,20}$");

	@Autowired
	private UserDAO userDAO;

	@Autowired
	private TeamDAO teamDAO;

	@Autowired
	private UserMailDAO userMailDAO;

	@Autowired
	private UserMailService userMailService;

	@Override
	@Transactional
	public Users signup(Users user) {
		if (user == null) {
			throw new IllegalArgumentException("회원 정보가 올바르지 않습니다.");
		}
		if (user.getLoginId() == null || user.getLoginId().trim().isEmpty()) {
			throw new IllegalArgumentException("아이디를 입력해주세요.");
		}
		if (!LOGIN_ID_PATTERN.matcher(user.getLoginId().trim()).matches()) {
			throw new IllegalArgumentException("아이디는 4~20자의 영문 소문자와 숫자만 사용할 수 있습니다.");
		}
		if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
			throw new IllegalArgumentException("비밀번호를 입력해주세요.");
		}
		if (user.getNickname() == null || user.getNickname().trim().isEmpty()) {
			throw new IllegalArgumentException("닉네임을 입력해주세요.");
		}
		if (!NICKNAME_PATTERN.matcher(user.getNickname().trim()).matches()) {
			throw new IllegalArgumentException("닉네임은 2~20자의 한글, 영문, 숫자만 사용할 수 있습니다.");
		}
		if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
			throw new IllegalArgumentException("이메일을 입력해주세요.");
		}
		if (!EMAIL_PATTERN.matcher(user.getEmail().trim()).matches()) {
			throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
		}

		// 아이디 중복 체크
		if (!isLoginIdAvailable(user.getLoginId())) {
			throw new IllegalStateException("이미 사용 중인 아이디입니다.");
		}

		// 닉네임 중복 체크
		if (!isNicknameAvailable(user.getNickname())) {
			throw new IllegalStateException("이미 사용 중인 닉네임입니다.");
		}

		// 이메일 중복 체크
		if (!isEmailAvailable(user.getEmail())) {
			throw new IllegalStateException("이미 등록된 이메일입니다.");
		}

		// 비밀번호 암호화 (사용자별 고유 Salt인 loginId를 결합하고 1,000회 키 스트레칭 적용)
		String encryptedPassword = SHA256Encryptor.encrypt(user.getPassword(), user.getLoginId());
		user.setPassword(encryptedPassword);

		// 기본 권한(1: 일반회원) 및 가입 포인트(100) 설정
		user.setRoleCode(1L);
		user.setPoint(100L);

		// 선호 구단 유효성 검증 및 더미 번호(1~20) 자동 실구단 ID 변환
		user.setFavoriteTeamId(resolveRealTeamId(user.getFavoriteTeamId()));

		// 회원 저장
		userDAO.insertUser(user);

		// 승부예측 전적 초기화 레코드 생성
		if (user.getUserId() != null) {
			userDAO.insertUserPredictsInitial(user.getUserId());
		}

		log.info("[회원가입 완료] userId={}, loginId={}, nickname={}", user.getUserId(), user.getLoginId(), user.getNickname());

		// 보안을 위해 비밀번호 제거 후 반환
		user.setPassword(null);
		return user;
	}

	@Override
	public Users login(String loginId, String password) {
		if (loginId == null || loginId.trim().isEmpty() || password == null || password.trim().isEmpty()) {
			throw new IllegalArgumentException("아이디와 비밀번호를 모두 입력해주세요.");
		}

		Users user = userDAO.selectUserByLoginId(loginId.trim());
		if (user == null) {
			throw new IllegalArgumentException("존재하지 않는 아이디입니다.");
		}

		// 1단계: 사용자별 고유 Salt(loginId) + 1,000회 키 스트레칭 방식으로 검증
		String encryptedInputPassword = SHA256Encryptor.encrypt(password, user.getLoginId());
		boolean passwordMatches = encryptedInputPassword.equals(user.getPassword());

		// 2단계: 만약 불일치 시, 기존 단일 Salt 방식으로 가입했던 사용자인지 하위 호환성 확인
		if (!passwordMatches) {
			String legacyEncrypted = SHA256Encryptor.encrypt(password);
			if (legacyEncrypted.equals(user.getPassword())) {
				passwordMatches = true;
				// 기존 방식 사용자가 로그인에 성공하면 새 보안 방식(고유 Salt + 키 스트레칭)으로 비밀번호 자동 업그레이드
				userDAO.updatePassword(user.getUserId(), encryptedInputPassword);
				log.info("[보안 자동 업그레이드] 사용자 {}의 비밀번호 해시가 고유 Salt 방식으로 마이그레이션되었습니다.", user.getLoginId());
			}
		}

		if (!passwordMatches) {
			throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
		}

		// 보안을 위해 비밀번호는 null 처리하여 반환
		user.setPassword(null);
		log.info("[로그인 성공] userId={}, loginId={}", user.getUserId(), user.getLoginId());
		return user;
	}

	@Override
	public boolean isLoginIdAvailable(String loginId) {
		if (loginId == null || loginId.trim().isEmpty()) {
			return false;
		}
		return userDAO.countByLoginId(loginId.trim()) == 0;
	}

	@Override
	public boolean isNicknameAvailable(String nickname) {
		if (nickname == null || nickname.trim().isEmpty()) {
			return false;
		}
		return userDAO.countByNickname(nickname.trim()) == 0;
	}

	@Override
	public boolean isEmailAvailable(String email) {
		if (email == null || email.trim().isEmpty()) {
			return false;
		}
		return userDAO.countByEmail(email.trim()) == 0;
	}

	@Override
	public Users getUserProfile(Long userId) {
		if (userId == null) {
			return null;
		}
		Users user = userDAO.selectUserByUserId(userId);
		if (user != null) {
			user.setPassword(null);
		}
		return user;
	}

	@Override
	@Transactional
	public Users updateUserProfile(Users user) {
		if (user == null || user.getUserId() == null) {
			throw new IllegalArgumentException("수정할 회원 식별자가 없습니다.");
		}
		if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
			if (!EMAIL_PATTERN.matcher(user.getEmail().trim()).matches()) {
				throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
			}
		}
		user.setFavoriteTeamId(resolveRealTeamId(user.getFavoriteTeamId()));
		userDAO.updateUser(user);
		return getUserProfile(user.getUserId());
	}

	@Override
	@Transactional
	public boolean changePassword(Long userId, String currentPassword, String newPassword) {
		if (userId == null || currentPassword == null || newPassword == null) {
			return false;
		}
		Users user = userDAO.selectUserByUserId(userId);
		if (user == null) {
			return false;
		}

		// 1단계: 현재 비밀번호 검증 (신규 고유 Salt 방식 우선, 기존 방식 하위 호환)
		String encryptedCurrent = SHA256Encryptor.encrypt(currentPassword, user.getLoginId());
		boolean currentMatches = encryptedCurrent.equals(user.getPassword());
		if (!currentMatches) {
			String legacyCurrent = SHA256Encryptor.encrypt(currentPassword);
			if (legacyCurrent.equals(user.getPassword())) {
				currentMatches = true;
			}
		}

		if (!currentMatches) {
			throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
		}

		// 2단계: 새 비밀번호는 무조건 신규 보안 방식(loginId 고유 Salt + 1,000회 키 스트레칭)으로 암호화하여 저장
		String encryptedNew = SHA256Encryptor.encrypt(newPassword, user.getLoginId());
		userDAO.updatePassword(userId, encryptedNew);
		log.info("[비밀번호 변경 완료] userId={}, loginId={}", user.getUserId(), user.getLoginId());
		return true;
	}

	/**
	 * 선호 구단 식별자 유효성 검증 (실제 DB TEAMS 테이블에 존재하는지 확인)
	 */
	private Long resolveRealTeamId(Long inputTeamId) {
		if (inputTeamId == null) return null;

		// 실제 DB에 등록된 구단인지 검증
		Teams team = teamDAO.findTeamById(inputTeamId);
		if (team != null) {
			return inputTeamId;
		}

		log.warn("[구단 ID 검증 실패] DB에 존재하지 않는 구단 식별자: {} -> null 처리", inputTeamId);
		return null;
	}

	@Override
	@Transactional
	public boolean withdraw(Long userId, String email) {
		if (userId == null) {
			return false;
		}

		// 탈퇴 메일 발송용 정보 사전 확보
		Users user = userDAO.selectUserByUserId(userId);
		String targetEmail = (email != null && !email.trim().isEmpty()) ? email : (user != null ? user.getEmail() : null);
		String nickname = (user != null) ? user.getNickname() : "회원";

		// 1. 회원 연관 데이터 정리 (외래키 제약조건 방지)
		userDAO.deleteUserRelatedData(userId);

		// 2. 회원 기본 레코드 삭제
		int deletedUsers = userDAO.deleteUser(userId);

		// 3. 인증 대기 및 만료 이메일 인증키 삭제 (재가입 테스트 완벽 지원)
		if (targetEmail != null && !targetEmail.trim().isEmpty()) {
			try {
				userMailDAO.deleteVerificationsByEmail(targetEmail.trim());
			} catch (Exception e) {
				log.warn("[UserServiceImpl] 회원탈퇴 중 이메일 인증 내역 삭제 예외 (무시 가능): {}", e.getMessage());
			}
		}

		// 4. 회원 탈퇴 완료 안내 메일 발송
		if (targetEmail != null && !targetEmail.trim().isEmpty() && deletedUsers > 0) {
			try {
				userMailService.sendWithdrawalMail(targetEmail.trim(), nickname);
				log.info("[UserServiceImpl] 회원 탈퇴 안내 메일 발송 완료 -> email: {}", targetEmail);
			} catch (Exception e) {
				log.warn("[UserServiceImpl] 회원 탈퇴 메일 발송 실패 (탈퇴 처리에는 영향 없음): {}", e.getMessage());
			}
		}

		log.info("[UserServiceImpl] 회원 탈퇴 처리 완료 -> userId={}, email={}", userId, targetEmail);
		return deletedUsers > 0;
	}

	@Override
	public Users getUserByLoginId(String loginId) {
		if (loginId == null || loginId.trim().isEmpty()) {
			return null;
		}
		Users user = userDAO.selectUserByLoginId(loginId.trim());
		if (user != null) {
			user.setPassword(null);
		}
		return user;
	}

	@Override
	public Map<String, Object> getUserActivitySummary(Long userId) {
		if (userId == null) {
			return new HashMap<>();
		}
		int postCount = userDAO.countUserPosts(userId);
		int commentCount = userDAO.countUserComments(userId);
		int likedCount = userDAO.countUserLikedPosts(userId);

		Map<String, Object> summary = new HashMap<>();
		summary.put("postCount", postCount);
		summary.put("commentCount", commentCount);
		summary.put("likedPostCount", likedCount);
		return summary;
	}

	@Override
	public Map<String, Object> getUserPosts(Long userId, int page, int size) {
		if (page < 1) page = 1;
		if (size < 1) size = 10;

		int offset = (page - 1) * size;
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("offset", offset);
		params.put("size", size);

		List<Posts> list = userDAO.selectUserPosts(params);
		int totalCount = userDAO.countUserPosts(userId);
		int totalPages = (int) Math.ceil((double) totalCount / size);

		Map<String, Object> result = new HashMap<>();
		result.put("list", list);
		result.put("totalCount", totalCount);
		result.put("totalPages", totalPages);
		result.put("currentPage", page);
		result.put("pageSize", size);
		return result;
	}

	@Override
	public Map<String, Object> getUserComments(Long userId, int page, int size) {
		if (page < 1) page = 1;
		if (size < 1) size = 10;

		int offset = (page - 1) * size;
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("offset", offset);
		params.put("size", size);

		List<Comments> list = userDAO.selectUserComments(params);
		int totalCount = userDAO.countUserComments(userId);
		int totalPages = (int) Math.ceil((double) totalCount / size);

		Map<String, Object> result = new HashMap<>();
		result.put("list", list);
		result.put("totalCount", totalCount);
		result.put("totalPages", totalPages);
		result.put("currentPage", page);
		result.put("pageSize", size);
		return result;
	}

	@Override
	public Map<String, Object> getUserLikedPosts(Long userId, int page, int size) {
		if (page < 1) page = 1;
		if (size < 1) size = 10;

		int offset = (page - 1) * size;
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("offset", offset);
		params.put("size", size);

		List<Posts> list = userDAO.selectUserLikedPosts(params);
		int totalCount = userDAO.countUserLikedPosts(userId);
		int totalPages = (int) Math.ceil((double) totalCount / size);

		Map<String, Object> result = new HashMap<>();
		result.put("list", list);
		result.put("totalCount", totalCount);
		result.put("totalPages", totalPages);
		result.put("currentPage", page);
		result.put("pageSize", size);
		return result;
	}

	@Override
	public List<com.app.dto.prediction.PointHistory> getUserPointHistories(Long userId) {
		return userDAO.selectUserPointHistories(userId);
	}

	private static final String[][] DEFAULT_SHOP_ITEMS = {
		{"ICON", "골든 트로피", "프리미어리그 챔피언의 영광을 상징하는 황금 트로피 프로필 아이콘", "300", "🏆"},
		{"ICON", "불타는 축구공", "경기장을 뜨겁게 달구는 클래식 축구공 시그니처 아이콘", "150", "⚽"},
		{"ICON", "골든 부츠", "리그 최고의 골잡이에게 주어지는 득점왕 골든부츠 아이콘", "250", "👟"},
		{"ICON", "황금 왕관", "PL 명예의 전당 레전드를 위한 시그니처 크라운 프로필 아이콘", "400", "👑"},
		{"ICON", "철벽 방패", "무실점 클린시트를 지켜내는 단단한 수호의 방패 아이콘", "200", "🛡️"},
		{"ICON", "캡틴 완장", "피치 위 팀을 이끄는 리더십의 상징 주장 완장 아이콘", "250", "🎖️"},
		{"ICON", "마법의 패서", "환상적인 어시스트를 찔러주는 플레이메이커의 마법 아이콘", "350", "🎯"},
		{"ICON", "거미손 글러브", "슈퍼 세이브로 팀을 구원하는 수문장의 골키퍼 글러브 아이콘", "200", "🧤"},
		{"EMOTICON", "골 세레머니", "짜릿한 득점 순간 열광하는 시그니처 축하 응원 이모티콘", "100", "🔥"},
		{"EMOTICON", "심판 레드카드", "거친 파울과 판정에 분노를 표현하는 레드카드 이모티콘", "150", "🟥"},
		{"EMOTICON", "승리의 축포", "극적인 역전승과 우승을 자축하는 화려한 팡파르 이모티콘", "120", "🎉"},
		{"EMOTICON", "VAR 판독중", "숨죽이고 주심의 판독을 기다리는 긴장감 넘치는 VAR 모니터", "150", "📺"},
		{"EMOTICON", "열광의 나팔", "경기장을 가득 메우는 서포터즈의 열렬한 함성과 나팔 이모티콘", "100", "📣"},
		{"EMOTICON", "통곡의 벽", "상대의 파상 공세를 빈틈없이 막아내는 짠물 수비 이모티콘", "120", "🧱"},
		{"EMOTICON", "승점 3점 V", "경기 종료 휘슬 후 승점 3점을 만끽하는 승리의 V 이모티콘", "80", "✌️"},
		{"EMOTICON", "눈물바다", "아쉬운 실점과 패배에 눈물 흘리는 서포터즈의 오열 이모티콘", "80", "😭"}
	};

	private void ensureDefaultShopItems() {
		try {
			if (userDAO.countShopItems() == 0) {
				for (String[] row : DEFAULT_SHOP_ITEMS) {
					Map<String, Object> item = new HashMap<>();
					item.put("itemType", row[0]);
					item.put("itemName", row[1]);
					item.put("description", row[2]);
					item.put("point", Integer.parseInt(row[3]));
					item.put("imageUrl", row[4]);
					userDAO.insertShopItem(item);
				}
			}
		} catch (Exception e) {
			log.debug("[UserServiceImpl] SHOP_ITEMS 기본 시딩 스킵: {}", e.getMessage());
		}
	}

	@Override
	public Map<String, Object> getUserShopData(Long userId) {
		Map<String, Object> result = new HashMap<>();
		if (userId == null) {
			result.put("inventory", java.util.Collections.emptyList());
			result.put("orders", java.util.Collections.emptyList());
			return result;
		}
		try {
			ensureDefaultShopItems();
			List<Map<String, Object>> inventory = userDAO.selectUserInventoryByUserId(userId);
			List<Map<String, Object>> orders = userDAO.selectUserItemOrdersByUserId(userId);
			result.put("inventory", inventory != null ? inventory : java.util.Collections.emptyList());
			result.put("orders", orders != null ? orders : java.util.Collections.emptyList());
		} catch (Exception e) {
			log.warn("[UserServiceImpl] 포인트샵 보유/구매내역 조회 실패: {}", e.getMessage());
			result.put("inventory", java.util.Collections.emptyList());
			result.put("orders", java.util.Collections.emptyList());
		}
		return result;
	}

	@Override
	@Transactional
	public Map<String, Object> purchaseShopItem(Long userId, Map<String, Object> itemRequest) {
		if (userId == null || itemRequest == null) {
			throw new IllegalArgumentException("구매 요청 정보가 올바르지 않습니다.");
		}
		ensureDefaultShopItems();

		String itemName = itemRequest.get("name") != null ? String.valueOf(itemRequest.get("name")).trim() : "";
		if (itemName.isEmpty()) {
			throw new IllegalArgumentException("구매할 상품명이 누락되었습니다.");
		}

		Map<String, Object> dbItem = userDAO.selectShopItemByName(itemName);
		if (dbItem == null) {
			// DB에 없는 신규 상품이면 즉시 등록 후 조회
			Map<String, Object> newItem = new HashMap<>();
			String rawType = itemRequest.get("type") != null ? String.valueOf(itemRequest.get("type")).toUpperCase() : "ICON";
			newItem.put("itemType", "EMOTICON".equals(rawType) ? "EMOTICON" : "ICON");
			newItem.put("itemName", itemName);
			newItem.put("description", itemRequest.get("desc") != null ? String.valueOf(itemRequest.get("desc")) : itemName);
			newItem.put("point", itemRequest.get("price") != null ? Integer.parseInt(String.valueOf(itemRequest.get("price"))) : 100);
			newItem.put("imageUrl", itemRequest.get("visual") != null ? String.valueOf(itemRequest.get("visual")) : "🎁");
			userDAO.insertShopItem(newItem);
			dbItem = userDAO.selectShopItemByName(itemName);
		}

		Long itemId = Long.parseLong(String.valueOf(dbItem.get("itemId")));
		int price = Integer.parseInt(String.valueOf(dbItem.get("point")));
		String categoryKor = "EMOTICON".equalsIgnoreCase(String.valueOf(dbItem.get("itemType"))) ? "이모티콘" : "아이콘";

		if (userDAO.countUserInventoryItem(userId, itemId) > 0) {
			throw new IllegalStateException("이미 보유 중인 아이템입니다.");
		}

		int updated = userDAO.deductUserPoint(userId, price);
		if (updated <= 0) {
			throw new IllegalStateException("보유 포인트가 부족합니다.");
		}

		Users updatedUser = userDAO.selectUserByUserId(userId);
		long balanceAfter = updatedUser != null && updatedUser.getPoint() != null ? updatedUser.getPoint() : 0L;

		// 1. 인벤토리(USER_INVENTORY) 저장
		userDAO.insertUserInventory(userId, itemId);

		// 2. 주문 내역(ITEM_ORDERS) 저장
		String orderId = "ORD_" + userId + "_" + itemId + "_" + System.currentTimeMillis();
		Map<String, Object> orderMap = new HashMap<>();
		orderMap.put("orderId", orderId);
		orderMap.put("userId", userId);
		orderMap.put("itemId", itemId);
		orderMap.put("point", price);
		userDAO.insertItemOrder(orderMap);

		String desc = "포인트샵 " + categoryKor + " 구매 [" + itemName + "]";

		// 3. 포인트 거래 원장(POINT_TRANSACTIONS) 저장
		Map<String, Object> txMap = new HashMap<>();
		txMap.put("userId", userId);
		txMap.put("amount", price);
		txMap.put("balanceAfter", balanceAfter);
		txMap.put("orderId", orderId);
		txMap.put("description", desc);
		userDAO.insertPointTransaction(txMap);

		// 4. 마이페이지 포인트 변동 이력(POINT_HISTORY) 동기화 저장
		Map<String, Object> histMap = new HashMap<>();
		histMap.put("userId", userId);
		histMap.put("amount", -price);
		histMap.put("balanceAfter", balanceAfter);
		histMap.put("description", desc);
		userDAO.insertShopPointHistory(histMap);

		if (updatedUser != null) {
			updatedUser.setPassword(null);
		}

		Map<String, Object> response = getUserShopData(userId);
		response.put("user", updatedUser);
		response.put("balanceAfter", balanceAfter);
		return response;
	}
}
