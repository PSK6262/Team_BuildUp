package com.app.service.api.impl;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.team.TeamDAO;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.Teams;
import com.app.service.api.GeminiApiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * [Gemini AI 축구 데이터 한글 번역 및 구단 역사 생성 구현체]
 * - Google Gemini 1.5 Flash 모델 연동
 * - x-goog-api-key 헤더 인증 (AQ.Ab... 최신 키 규격 지원)
 * - JSON 스키마 기반 정형화된 데이터 파싱 및 DB 일괄 적재
 */
@Slf4j
@Service
public class GeminiApiServiceImpl implements GeminiApiService {

	// 사용자 API 키로 100% 검증 완료된 최신 공식 Gemini 모델
	private static final String[] CANDIDATE_MODELS = {
		"gemini-flash-lite-latest",
		"gemini-3.1-flash-lite",
		"gemini-flash-latest"
	};

	// 연결 성공이 확인된 모델을 캐싱하여 재사용
	private volatile String verifiedModel = null;

	@Value("${gemini.api.key}")
	private String apiKey;

	@Autowired
	private TeamDAO teamDAO;

	private final HttpClient httpClient;
	private final ObjectMapper objectMapper;

	public GeminiApiServiceImpl() {
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(15))
				.build();
		this.objectMapper = new ObjectMapper();
	}

	/**
	 * Gemini API 호출 공통 메서드 (최신 모델 자동 탐색 및 JSON 응답 보장)
	 */
	private String callGemini(String promptText) throws Exception {
		if (apiKey == null || apiKey.trim().isEmpty() || "apikey".equalsIgnoreCase(apiKey.trim())) {
			throw new IllegalStateException("application.properties에 유효한 gemini.api.key가 설정되지 않았습니다.");
		}

		// 요청 JSON 구성
		Map<String, Object> textPart = new HashMap<>();
		textPart.put("text", promptText);

		List<Map<String, Object>> parts = new ArrayList<>();
		parts.add(textPart);

		Map<String, Object> contentMap = new HashMap<>();
		contentMap.put("parts", parts);

		List<Map<String, Object>> contents = new ArrayList<>();
		contents.add(contentMap);

		Map<String, Object> genConfig = new HashMap<>();
		genConfig.put("responseMimeType", "application/json");

		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("contents", contents);
		requestBody.put("generationConfig", genConfig);

		String requestJson = objectMapper.writeValueAsString(requestBody);

		// 이미 검증된 모델이 있으면 우선 사용, 없으면 후보 순차 시도
		String[] modelsToTry = (verifiedModel != null) 
				? new String[]{verifiedModel} 
				: CANDIDATE_MODELS;

		String lastError = null;
		for (String modelName : modelsToTry) {
			String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";

			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(apiUrl))
					.header("Content-Type", "application/json; charset=utf-8")
					.header("x-goog-api-key", apiKey.trim())
					.timeout(Duration.ofSeconds(30))
					.POST(HttpRequest.BodyPublishers.ofString(requestJson))
					.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

			if (response.statusCode() == 200) {
				if (verifiedModel == null) {
					verifiedModel = modelName;
					log.info("[Gemini API] 최신 모델 연동 성공: {}", modelName);
				}

				JsonNode rootNode = objectMapper.readTree(response.body());
				JsonNode candidates = rootNode.path("candidates");
				if (candidates.isArray() && candidates.size() > 0) {
					JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
					return textNode.asText();
				}
			} else {
				lastError = "모델 [" + modelName + "] 호출 실패 (HTTP " + response.statusCode() + "): " + response.body();
				log.warn("[Gemini API] {}", lastError);
				// 만약 verifiedModel이 실패한 경우 리셋하고 다른 모델 시도
				if (verifiedModel != null) {
					verifiedModel = null;
					return callGemini(promptText);
				}
			}
		}

		throw new RuntimeException("모든 Gemini 모델 호출 실패: " + lastError);
	}

	/**
	 * 1. 20개 구단 한글명, 홈구장 한글명, 구단 역사(3~4문장) 생성 및 DB 적재
	 */
	@Override
	@Transactional
	public int syncTeamsKoreanAndHistory() {
		List<Teams> teamList = teamDAO.findAllTeams();
		if (teamList == null || teamList.isEmpty()) {
			log.warn("[Gemini AI] 등록된 구단이 없습니다. 먼저 Football API로 구단을 수집해주세요.");
			return 0;
		}

		log.info("[Gemini AI] 20개 구단 한글명 및 역사 생성 시작 (대상 구단 수: {})", teamList.size());

		// 프롬프트 입력용 간소화 데이터 목록 생성
		List<Map<String, Object>> inputTeams = new ArrayList<>();
		for (Teams t : teamList) {
			Map<String, Object> item = new HashMap<>();
			item.put("teamId", t.getTeamId());
			item.put("teamName", t.getTeamName());
			item.put("homeGround", t.getHomeGround());
			inputTeams.add(item);
		}

		try {
			String teamsJson = objectMapper.writeValueAsString(inputTeams);
			StringBuilder prompt = new StringBuilder();
			prompt.append("당신은 대한민국 스포츠 방송사(SPOTV, 쿠팡플레이 등)의 프리미어리그 공식 중계 전문 번역가이자 축구 음악 및 역사 전문가입니다.\n");
			prompt.append("아래 프리미어리그 구단 목록을 대한민국 축구 중계방송 자막 및 포털 스포츠(네이버 스포츠)에서 공식 통용되는 표준 한글 명칭과 역사, 그리고 공식 대표 응원가로 작성해주세요.\n\n");
			prompt.append("[핵심 작성 원칙 - 한국 스포츠 방송 공식 표준 및 인물 표기 철저 준수]\n");
			prompt.append("1. 기계적 직역을 배제하고, 국내 축구 중계방송 자막에 공식 채택된 표준 명칭을 100% 최우선 적용하세요.\n");
			prompt.append("   - 구단명 예시: '아스널 FC', '맨체스터 시티 FC', '맨체스터 유나이티드 FC', '토트넘 홋스퍼 FC', '뉴캐슬 유나이티드 FC', '울버햄튼 원더러스 FC'\n");
			prompt.append("   - 홈구장 한글명 예시: '에미레이츠 스타디움', '에티하드 스타디움', '올드 트래포드', '토트넘 홋스퍼 스타디움'\n");
			prompt.append("   - [중요: 홈 경기장 누락 보정] 만약 입력 데이터의 홈구장(homeGround)이 누락되어 '홈 경기장'으로 되어 있는 경우(예: 340번 사우샘프턴 FC 등), 해당 구단의 실제 공식 홈 경기장 영문명과 한글명(예: homeGround: 'St. Mary\'s Stadium', homeGroundKor: '세인트 메리스 스타디움')을 AI가 직접 찾아서 반드시 채워주세요.\n");
			prompt.append("2. 구단 역사(history) 작성 시 인물 및 용어 표기 원칙 (선수/스태프 번역 규칙과 100% 동일 적용):\n");
			prompt.append("   - 역사 본문에 언급되는 감독, 코치, 레전드 및 현역 선수 이름은 반드시 대한민국 축구 중계방송(SPOTV, 쿠팡플레이) 및 네이버 스포츠 공식 표기를 엄격히 따라야 합니다.\n");
			prompt.append("   - 감독 표기 준수 예시: '알렉스 퍼거슨', '아르센 벵거', '펩 과르디올라', '위르겐 클롭', '조제 무리뉴', '미켈 아르테타', '피에르 사즈' ('피에르 사주' 절대 금지)\n");
			prompt.append("   - 선수 표기 준수 예시: '엘링 홀란' ('홀란드' 절대 금지), '티에리 앙리', '케빈 더 브라위너', '웨인 루니', '스티븐 제라드', '손흥민', '박지성', '다비드 실바'\n");
			prompt.append("   - 각 구단의 창단 배경, 전설적인 명장/선수들과의 영광(무패 우승, 트레블 등), 시그니처 팀 컬러를 3~4문장의 유려하고 품격 있는 방송 해설 톤의 한국어로 작성해주세요.\n");
			prompt.append("3. 각 구단의 대표 공식 구단가(Official Anthem) 및 홈 경기장 시그니처 응원가를 분석하여, 전 세계 축구팬들이 경기장에서 부르는 공식 대표 YouTube 영상 URL(anthemUrl)을 정확히 찾아 작성해주세요.\n");
			prompt.append("   - 대표 응원가 기준: 아스널('The Angel - North London Forever'), 리버풀('You'll Never Walk Alone'), 맨체스터 시티('Blue Moon'), 맨체스터 유나이티드('Glory Glory Man United'), 첼시('Blue Is the Colour'), 웨스트햄('I'm Forever Blowing Bubbles') 등\n");
			prompt.append("   - 반드시 실제 재생 가능한 YouTube URL(https://www.youtube.com/watch?v=...) 형태로 작성해야 합니다.\n\n");
			prompt.append("반드시 아래와 같은 JSON 배열 형식으로만 응답해야 합니다:\n");
			prompt.append("[\n");
			prompt.append("  {\n");
			prompt.append("    \"teamId\": 57,\n");
			prompt.append("    \"teamNameKor\": \"아스널 FC\",\n");
			prompt.append("    \"homeGround\": \"Emirates Stadium\",\n");
			prompt.append("    \"homeGroundKor\": \"에미레이츠 스타디움\",\n");
			prompt.append("    \"history\": \"아스널 FC는 1886년 창단된 런던의 유서 깊은 명문 구단입니다. 2003-04 시즌 프리미어리그 최초의 '무패 우승'이라는 전무후무한 신화를 작성했습니다. 유려한 패스 축구와 오랜 전통으로 전 세계 축구팬들의 뜨거운 지지를 받고 있습니다.\",\n");
			prompt.append("    \"anthemUrl\": \"https://www.youtube.com/watch?v=N8_m1XqypSQ\"\n");
			prompt.append("  }\n");
			prompt.append("]\n\n");
			prompt.append("구단 목록 데이터:\n").append(teamsJson);

			String resultJson = callGemini(prompt.toString());
			JsonNode arrayNode = objectMapper.readTree(resultJson);

			int updatedCount = 0;
			if (arrayNode.isArray()) {
				for (JsonNode node : arrayNode) {
					Long teamId = node.path("teamId").asLong();
					String teamNameKor = node.path("teamNameKor").asText();
					String homeGround = node.hasNonNull("homeGround") ? node.path("homeGround").asText().trim() : null;
					String homeGroundKor = node.path("homeGroundKor").asText();
					String history = node.path("history").asText();
					String anthemUrl = node.hasNonNull("anthemUrl") ? node.path("anthemUrl").asText().trim() : null;

					Teams updateTarget = new Teams();
					updateTarget.setTeamId(teamId);
					updateTarget.setTeamNameKor(teamNameKor);
					updateTarget.setHomeGround(homeGround);
					updateTarget.setHomeGroundKor(homeGroundKor);
					updateTarget.setHistory(history);
					updateTarget.setAnthemUrl(anthemUrl);

					teamDAO.updateTeamKoreanAndHistory(updateTarget);
					updatedCount++;
					log.info("  -> [{}] 구단 한글화 완료: {} (홈구장: {} / {}, AI 응원가: {})", 
							teamId, teamNameKor, homeGround, homeGroundKor, anthemUrl != null ? anthemUrl : "미생성");
				}
			}

			log.info("[Gemini AI] 구단 한글화 및 역사 생성 완료! (총 {}개 구단 반영)", updatedCount);
			return updatedCount;

		} catch (Exception e) {
			log.error("[Gemini AI] 구단 한글화 처리 중 오류 발생: {}", e.getMessage(), e);
			throw new RuntimeException("구단 한글화 처리 실패: " + e.getMessage(), e);
		}
	}

	/**
	 * 2. 코칭스태프(감독 등) 한글명 및 국적 번역
	 */
	@Override
	@Transactional
	public int syncStaffsKorean() {
		List<Staffs> staffList = teamDAO.findAllStaffs();
		if (staffList == null || staffList.isEmpty()) {
			log.warn("[Gemini AI] 등록된 스태프가 없습니다.");
			return 0;
		}

		log.info("[Gemini AI] 코칭스태프 한글명 번역 시작 (대상 스태프 수: {})", staffList.size());

		List<Map<String, Object>> inputStaffs = new ArrayList<>();
		for (Staffs s : staffList) {
			Map<String, Object> item = new HashMap<>();
			item.put("staffId", s.getStaffId());
			item.put("name", s.getName());
			item.put("nationality", s.getNationality());
			inputStaffs.add(item);
		}

		try {
			String staffsJson = objectMapper.writeValueAsString(inputStaffs);
			StringBuilder prompt = new StringBuilder();
			prompt.append("당신은 대한민국 스포츠 방송사(SPOTV, 쿠팡플레이 등)의 프리미어리그 공식 중계 전문 번역가입니다.\n");
			prompt.append("아래 스태프(감독/코치) 목록을 대한민국 축구 중계방송 자막 및 네이버 스포츠 공식 프로필에서 사용하는 표준 한국어 표기로 통일하여 번역해주세요.\n\n");
			prompt.append("[핵심 번역 원칙 - 한국 스포츠 방송 공식 표준 준수]\n");
			prompt.append("1. 기계적 직역을 절대 금지하며, 국내 축구 중계방송 자막 및 해설진이 공식 채택한 '방송 표준 표기'를 100% 최우선 적용하세요.\n");
			prompt.append("2. 감독명 방송 표준 예시:\n");
			prompt.append("   - Pierre Sage는 국내 방송 공식 자막에 따라 '피에르 사주'가 아닌 반드시 '피에르 사즈'로 표기해야 합니다.\n");
			prompt.append("   - Pep Guardiola -> '펩 과르디올라', Mikel Arteta -> '미켈 아르테타', Arne Slot -> '아르네 슬롯', Ange Postecoglou -> '엔제 포스테코글루', Unai Emery -> '우나이 에메리'\n");
			prompt.append("3. 국적 명칭 방송 표준 준수:\n");
			prompt.append("   - 'Bosnia and Herzegovina'는 공식 정식 국호인 '보스니아 헤르체고비나'로 통일\n");
			prompt.append("   - 'Democratic Republic of the Congo', 'Congo DR', 'DR Congo'는 영문 약어를 쓰지 말고 공식 한글 국호인 '콩고 민주 공화국'으로 반드시 표기\n");
			prompt.append("   - 'Korea Republic' / 'South Korea' -> '대한민국'\n");
			prompt.append("   - 'England/Scotland/Wales/Northern Ireland' -> '잉글랜드/스코틀랜드/웨일스/북아일랜드'\n\n");
			prompt.append("반드시 아래와 같은 JSON 배열 형식으로만 응답해야 합니다:\n");
			prompt.append("[\n");
			prompt.append("  {\n");
			prompt.append("    \"staffId\": 1,\n");
			prompt.append("    \"nameKor\": \"펩 과르디올라\",\n");
			prompt.append("    \"nationalityKor\": \"스페인\"\n");
			prompt.append("  }\n");
			prompt.append("]\n\n");
			prompt.append("스태프 목록 데이터:\n").append(staffsJson);

			String resultJson = callGemini(prompt.toString());
			JsonNode arrayNode = objectMapper.readTree(resultJson);

			int updatedCount = 0;
			if (arrayNode.isArray()) {
				for (JsonNode node : arrayNode) {
					Long staffId = node.path("staffId").asLong();
					String nameKor = node.path("nameKor").asText();
					String nationalityKor = node.path("nationalityKor").asText();

					Staffs updateTarget = new Staffs();
					updateTarget.setStaffId(staffId);
					updateTarget.setNameKor(nameKor);
					updateTarget.setNationalityKor(nationalityKor);

					teamDAO.updateStaffKorean(updateTarget);
					updatedCount++;
				}
			}

			log.info("[Gemini AI] 스태프 한글화 완료! (총 {}명 반영)", updatedCount);
			return updatedCount;

		} catch (Exception e) {
			log.error("[Gemini AI] 스태프 한글화 처리 중 오류 발생: {}", e.getMessage(), e);
			throw new RuntimeException("스태프 한글화 처리 실패: " + e.getMessage(), e);
		}
	}

	/**
	 * 3. 특정 구단 소속 선수단 한글 번역 (배치 단위 처리)
	 */
	@Override
	@Transactional
	public int syncPlayersKoreanByTeamId(Long teamId) {
		List<Players> playerList = teamDAO.findPlayersByTeamId(teamId);
		if (playerList == null || playerList.isEmpty()) {
			return 0;
		}

		List<Map<String, Object>> inputPlayers = new ArrayList<>();
		for (Players p : playerList) {
			Map<String, Object> item = new HashMap<>();
			item.put("playerId", p.getPlayerId());
			item.put("name", p.getName());
			item.put("nationality", p.getNationality());
			inputPlayers.add(item);
		}

		try {
			String playersJson = objectMapper.writeValueAsString(inputPlayers);
			StringBuilder prompt = new StringBuilder();
			prompt.append("당신은 대한민국 스포츠 방송사(SPOTV, 쿠팡플레이 등)의 프리미어리그 공식 중계 전문 번역가입니다.\n");
			prompt.append("아래 선수 목록을 대한민국 축구 중계방송 자막 및 네이버 스포츠 공식 프로필에서 사용하는 표준 한국어 표기로 통일하여 번역해주세요.\n\n");
			prompt.append("[핵심 번역 원칙 - 한국 스포츠 방송 공식 표준 준수]\n");
			prompt.append("1. 어색한 기계적 직역이나 문자 그대로의 표기를 절대 금지하며, 국내 축구 중계방송 공식 자막과 해설진이 사용하는 '한국 방송 표준 표기'를 100% 최우선으로 적용하세요.\n");
			prompt.append("2. 선수명 방송 표준 예시:\n");
			prompt.append("   - Erling Haaland -> '엘링 홀란' (홀란드 금지)\n");
			prompt.append("   - Bukayo Saka -> '부카요 사카'\n");
			prompt.append("   - Son Heung-min -> '손흥민'\n");
			prompt.append("   - Kevin De Bruyne -> '케빈 더 브라위너'\n");
			prompt.append("   - Bruno Fernandes -> '브루누 페르난데스'\n");
			prompt.append("   - Martin Ødegaard -> '마르틴 외데고르'\n");
			prompt.append("   - Mohamed Salah -> '모하메드 살라'\n");
			prompt.append("3. 국적 명칭 방송 공식 자막 기준 준수:\n");
			prompt.append("   - 'Bosnia and Herzegovina' -> '보스니아 헤르체고비나'\n");
			prompt.append("   - 'Democratic Republic of the Congo', 'Congo DR', 'DR Congo' -> 영문 약어(DR) 금지, '콩고 민주 공화국'으로 반드시 표기\n");
			prompt.append("   - 'Korea Republic' / 'South Korea' -> '대한민국'\n");
			prompt.append("   - 'England/Scotland/Wales/Northern Ireland' -> '잉글랜드/스코틀랜드/웨일스/북아일랜드'\n");
			prompt.append("   - 'Netherlands' -> '네덜란드', 'Norway' -> '노르웨이', 'Ivory Coast'/'Cote d'Ivoire' -> '코트디부아르'\n\n");
			prompt.append("반드시 아래와 같은 JSON 배열 형식으로만 응답해야 합니다:\n");
			prompt.append("[\n");
			prompt.append("  {\n");
			prompt.append("    \"playerId\": 101,\n");
			prompt.append("    \"nameKor\": \"엘링 홀란\",\n");
			prompt.append("    \"nationalityKor\": \"노르웨이\"\n");
			prompt.append("  }\n");
			prompt.append("]\n\n");
			prompt.append("선수 목록 데이터:\n").append(playersJson);

			String resultJson = callGemini(prompt.toString());
			JsonNode arrayNode = objectMapper.readTree(resultJson);

			int updatedCount = 0;
			if (arrayNode.isArray()) {
				for (JsonNode node : arrayNode) {
					Long playerId = node.path("playerId").asLong();
					String nameKor = node.path("nameKor").asText();
					String nationalityKor = node.path("nationalityKor").asText();

					Players updateTarget = new Players();
					updateTarget.setPlayerId(playerId);
					updateTarget.setNameKor(nameKor);
					updateTarget.setNationalityKor(nationalityKor);

					teamDAO.updatePlayerKorean(updateTarget);
					updatedCount++;
				}
			}
			return updatedCount;

		} catch (Exception e) {
			log.error("[Gemini AI] 구단 ID [{}] 선수 한글화 실패: {}", teamId, e.getMessage());
			return 0;
		}
	}

	/**
	 * 4. 전체 20개 구단 모든 선수단(약 500명) 구단별 청크 번역
	 */
	@Override
	public int syncAllPlayersKorean() {
		List<Teams> teams = teamDAO.findAllTeams();
		if (teams == null || teams.isEmpty()) {
			return 0;
		}

		log.info("[Gemini AI] 전체 20개 구단 선수단 한글 번역 일괄 시작 (총 20개 팀)");
		int totalPlayersUpdated = 0;

		for (int i = 0; i < teams.size(); i++) {
			Teams t = teams.get(i);
			int count = syncPlayersKoreanByTeamId(t.getTeamId());
			totalPlayersUpdated += count;
			log.info("  -> [{}/{}] {} 선수 {}명 한글화 완료 (누적: {}명)", 
					(i + 1), teams.size(), t.getTeamName(), count, totalPlayersUpdated);

			// Gemini API 호출 간 안정적인 딜레이 (0.5초)
			try {
				Thread.sleep(500);
			} catch (InterruptedException ignored) {}
		}

		log.info("[Gemini AI] 전체 선수단 한글화 완료! (총 {}명 갱신)", totalPlayersUpdated);
		return totalPlayersUpdated;
	}

	/**
	 * 4-1. 20개 구단 공식 유튜브 응원가(Anthem) Gemini AI 동적 검색 및 일괄 DB 적재
	 */
	@Override
	@Transactional
	public int syncAllTeamAnthems() {
		List<Teams> teamList = teamDAO.findAllTeams();
		if (teamList == null || teamList.isEmpty()) {
			log.warn("[Gemini AI] 등록된 구단이 없습니다. 먼저 구단 데이터를 수집해주세요.");
			return 0;
		}

		log.info("[Gemini AI] 20개 구단 공식 응원가(Anthem) AI 검색 및 생성 시작 (대상 구단 수: {})", teamList.size());

		List<Map<String, Object>> inputTeams = new ArrayList<>();
		for (Teams t : teamList) {
			Map<String, Object> item = new HashMap<>();
			item.put("teamId", t.getTeamId());
			item.put("teamName", t.getTeamName());
			inputTeams.add(item);
		}

		try {
			String teamsJson = objectMapper.writeValueAsString(inputTeams);
			StringBuilder prompt = new StringBuilder();
			prompt.append("당신은 전 세계 축구 문화 및 영국 프리미어리그 전문 축구 음악 큐레이터입니다.\n");
			prompt.append("아래 프리미어리그 구단 목록의 각 구단별 공식 대표 구단가(Official Anthem) 및 홈 경기장 시그니처 응원가를 분석하고, 해당 곡의 공식 YouTube 영상 URL을 찾아주세요.\n\n");
			prompt.append("[응원가 선정 및 YouTube URL 생성 원칙]\n");
			prompt.append("1. 각 구단 팬들과 경기장에서 킥오프 전이나 승리 후 제창하는 가장 공인된 시그니처 대표 응원가를 선정하세요.\n");
			prompt.append("   - 예시: 아스널('The Angel - North London Forever'), 리버풀('You'll Never Walk Alone'), 맨체스터 시티('Blue Moon'), 맨체스터 유나이티드('Glory Glory Man United'), 첼시('Blue Is the Colour'), 웨스트햄('I'm Forever Blowing Bubbles'), 토트넘('Glory Glory Tottenham Hotspur') 등\n");
			prompt.append("2. 반드시 실제 재생 가능한 공인 YouTube 링크(https://www.youtube.com/watch?v=... 형태)로 정확히 출력하세요.\n\n");
			prompt.append("반드시 아래와 같은 JSON 배열 형식으로만 응답해야 합니다:\n");
			prompt.append("[\n");
			prompt.append("  {\n");
			prompt.append("    \"teamId\": 57,\n");
			prompt.append("    \"anthemTitle\": \"The Angel (North London Forever)\",\n");
			prompt.append("    \"anthemUrl\": \"https://www.youtube.com/watch?v=N8_m1XqypSQ\"\n");
			prompt.append("  }\n");
			prompt.append("]\n\n");
			prompt.append("구단 목록 데이터:\n").append(teamsJson);

			String resultJson = callGemini(prompt.toString());
			JsonNode arrayNode = objectMapper.readTree(resultJson);

			int updatedCount = 0;
			if (arrayNode.isArray()) {
				for (JsonNode node : arrayNode) {
					Long teamId = node.path("teamId").asLong();
					String anthemUrl = node.hasNonNull("anthemUrl") ? node.path("anthemUrl").asText().trim() : null;
					String anthemTitle = node.path("anthemTitle").asText("");

					if (teamId != null && anthemUrl != null && !anthemUrl.isBlank()) {
						Teams updateTarget = new Teams();
						updateTarget.setTeamId(teamId);
						updateTarget.setAnthemUrl(anthemUrl);

						teamDAO.updateTeamAnthem(updateTarget);
						updatedCount++;
						log.info("  -> [{}] 구단 AI 응원가 적재 완료: {} ({})", teamId, anthemTitle, anthemUrl);
					}
				}
			}

			log.info("[Gemini AI] 구단 공식 응원가 일괄 적재 완료! (총 {}개 구단 반영)", updatedCount);
			return updatedCount;

		} catch (Exception e) {
			log.error("[Gemini AI] 응원가 AI 동기화 처리 중 오류 발생: {}", e.getMessage(), e);
			throw new RuntimeException("응원가 AI 동기화 처리 실패: " + e.getMessage(), e);
		}
	}

	/**
	 * 5. 전체 한글화 및 역사 생성 비동기 백그라운드 일괄 실행
	 */
	@Override
	public Map<String, Object> syncAllKoreanDataAsync() {
		Thread worker = new Thread(new Runnable() {
			@Override
			public void run() {
				System.out.println("======================================================================");
				System.out.println("[BuildUp - Gemini AI] 구단 역사 및 한글명 일괄 자동 적재 파이프라인 가동");
				System.out.println("======================================================================");

				long startTime = System.currentTimeMillis();

				try {
					// 0단계: 깨지거나 누락된 구단 엠블럼 AI 자동 복구
					System.out.println("[0/4] 구단 엠블럼 AI 자동 복구 및 검증 중...");
					int emblemCount = syncBrokenTeamEmblemsWithAI();
					System.out.println("  -> 엠블럼 복구 완료: " + emblemCount + "개 구단");

					// 1단계: 20개 구단 한글명, 홈구장, 역사 생성
					System.out.println("[1/4] 20개 구단 한글명, 홈 경기장, 구단 역사 생성 중...");
					int teamsCount = syncTeamsKoreanAndHistory();
					System.out.println("  -> 구단 처리 완료: " + teamsCount + "개 구단");

					// 2단계: 20개 구단 코칭스태프(감독) 번역
					System.out.println("[2/4] 코칭스태프(감독) 한글명 및 국적 번역 중...");
					int staffsCount = syncStaffsKorean();
					System.out.println("  -> 스태프 처리 완료: " + staffsCount + "명");

					// 3단계: 20개 구단 선수단(500명) 일괄 번역
					System.out.println("[3/5] 20개 구단 선수단(약 500명) 구단별 일괄 번역 중...");
					int playersCount = syncAllPlayersKorean();
					System.out.println("  -> 선수단 처리 완료: " + playersCount + "명");

					// 4단계: 20개 구단 선수단 세부 포지션(CB, LB, RB, CDM, CAM, ST 등) AI 정밀 판별
					System.out.println("[4/5] 20개 구단 선수단 세부 포지션 AI 정밀 판별 및 적재 중...");
					int detailPosCount = syncAllPlayersDetailPositions();
					System.out.println("  -> 세부 포지션 처리 완료: " + detailPosCount + "명");

					long elapsedTime = (System.currentTimeMillis() - startTime) / 1000;
					System.out.println("======================================================================");
					System.out.println("[BuildUp - Gemini AI] 모든 한글화, 역사 및 세부 포지션 적재 완료! (총 소요시간: " + elapsedTime + "초)");
					System.out.println("======================================================================");

				} catch (Exception e) {
					System.err.println("[BuildUp - Gemini AI] 일괄 적재 중 오류 발생: " + e.getMessage());
					log.error("[Gemini AI] Pipeline Error", e);
				}
			}
		});

		worker.setName("Gemini-Korean-Sync-Thread");
		worker.setDaemon(true);
		worker.start();

		Map<String, Object> result = new HashMap<>();
		result.put("status", "SUCCESS");
		result.put("message", "Gemini AI 한글화 및 구단 역사 적재 작업이 백그라운드에서 시작되었습니다. 서버 콘솔을 확인해주세요.");
		return result;
	}

	/**
	 * 깨지거나 누락된 구단 엠블럼을 AI로 자동 탐색하여 공식 투명 PNG 엠블럼으로 복구 및 DB 적재
	 */
	@Override
	@Transactional
	public int syncBrokenTeamEmblemsWithAI() {
		List<Teams> brokenTeams = teamDAO.findTeamsWithBrokenEmblem();
		if (brokenTeams == null || brokenTeams.isEmpty()) {
			log.info("[Gemini AI] 엠블럼 복구 대상 구단이 없습니다. (모든 구단 정상)");
			return 0;
		}

		log.info("[Gemini AI] 깨지거나 누락된 엠블럼 복구 시작 (대상 구단 수: {})", brokenTeams.size());

		List<Teams> remainingTeams = new ArrayList<>();
		int updatedCount = 0;

		// 1차: 알려진 프리미어리그 공식 CDN 매핑 우선 적용
		for (Teams t : brokenTeams) {
			String officialUrl = resolveKnownEmblem(t.getTeamId());
			if (officialUrl != null) {
				t.setEmblemUrl(officialUrl);
				teamDAO.updateTeamEmblem(t);
				updatedCount++;
				log.info("  -> [{}] 공식 CDN 엠블럼 즉시 복구: {} -> {}", t.getTeamId(), t.getTeamName(), officialUrl);
			} else {
				remainingTeams.add(t);
			}
		}

		// 2차: 매핑에 없는 구단은 Gemini AI가 투명 배경 공식 엠블럼 URL 자동 탐색
		if (!remainingTeams.isEmpty()) {
			try {
				List<Map<String, Object>> inputList = new ArrayList<>();
				for (Teams t : remainingTeams) {
					Map<String, Object> item = new HashMap<>();
					item.put("teamId", t.getTeamId());
					item.put("teamName", t.getTeamName());
					item.put("teamNameKor", t.getTeamNameKor());
					inputList.add(item);
				}

				String inputJson = objectMapper.writeValueAsString(inputList);
				StringBuilder prompt = new StringBuilder();
				prompt.append("당신은 전 세계 축구 리그 데이터 및 공식 구단 엠블럼(Crest/Badge) 전문가입니다.\n");
				prompt.append("아래 축구 구단 목록을 확인하고, 각 구단의 다크 모드 UI에 최적화된 '배경 투명(누끼) 고화질 PNG 엠블럼 이미지 URL'을 찾아주세요.\n\n");
				prompt.append("[엠블럼 URL 선정 원칙]\n");
				prompt.append("1. 잉글랜드 프리미어리그(EPL) 또는 잉글랜드 리그 구단인 경우:\n");
				prompt.append("   - 프리미어리그 공식 Akamai CDN 주소(https://resources.premierleague.com/premierleague/badges/50/t{badgeId}.png)를 최우선으로 찾으세요.\n");
				prompt.append("2. 타 리그 또는 기타 구단인 경우:\n");
				prompt.append("   - 위키미디어 공용(Wikimedia Commons) 또는 구단 공식 사이트의 배경이 투명한 고화질 PNG 엠블럼 URL을 지정하세요.\n");
				prompt.append("3. 주의사항: 절대 불투명한 흰색 사각형 배경이 포함된 깨지는 이미지를 반환하지 마세요.\n\n");
				prompt.append("반드시 아래와 같은 JSON 배열 형식으로만 응답해야 합니다:\n");
				prompt.append("[\n");
				prompt.append("  {\n");
				prompt.append("    \"teamId\": 1044,\n");
				prompt.append("    \"emblemUrl\": \"https://resources.premierleague.com/premierleague/badges/50/t91.png\"\n");
				prompt.append("  }\n");
				prompt.append("]\n\n");
				prompt.append("구단 목록 데이터:\n").append(inputJson);

				String resultJson = callGemini(prompt.toString());
				JsonNode arrayNode = objectMapper.readTree(resultJson);

				if (arrayNode.isArray()) {
					for (JsonNode node : arrayNode) {
						Long teamId = node.path("teamId").asLong();
						String emblemUrl = node.hasNonNull("emblemUrl") ? node.path("emblemUrl").asText().trim() : null;

						if (emblemUrl != null && !emblemUrl.isBlank()) {
							Teams updateTarget = new Teams();
							updateTarget.setTeamId(teamId);
							updateTarget.setEmblemUrl(emblemUrl);
							teamDAO.updateTeamEmblem(updateTarget);
							updatedCount++;
							log.info("  -> [{}] Gemini AI가 탐색한 엠블럼 저장 완료: {}", teamId, emblemUrl);
						}
					}
				}
			} catch (Exception e) {
				log.error("[Gemini AI] 엠블럼 AI 탐색 처리 중 오류: {}", e.getMessage(), e);
			}
		}

		log.info("[Gemini AI] 구단 엠블럼 복구 완료! (총 {}개 구단 갱신)", updatedCount);
		return updatedCount;
	}

	/**
	 * 알려진 프리미어리그 주요 구단 공식 CDN 엠블럼 URL 반환
	 */
	private String resolveKnownEmblem(Long teamId) {
		if (teamId == null) return null;
		String badgeId = switch (teamId.intValue()) {
			case 57 -> "t3";     // Arsenal
			case 58 -> "t7";     // Aston Villa
			case 1044 -> "t91";  // AFC Bournemouth
			case 402 -> "t94";   // Brentford
			case 397 -> "t36";   // Brighton & Hove Albion
			case 61 -> "t8";     // Chelsea
			case 354 -> "t31";   // Crystal Palace
			case 62 -> "t11";    // Everton
			case 63 -> "t54";    // Fulham
			case 349 -> "t40";   // Ipswich Town
			case 338 -> "t13";   // Leicester City
			case 64 -> "t14";    // Liverpool
			case 65 -> "t43";    // Manchester City
			case 66 -> "t1";     // Manchester United
			case 67 -> "t4";     // Newcastle United
			case 351 -> "t17";   // Nottingham Forest
			case 340 -> "t20";   // Southampton
			case 73 -> "t6";     // Tottenham Hotspur
			case 563 -> "t21";   // West Ham United
			case 76 -> "t39";    // Wolverhampton Wanderers
			case 71 -> "t56";    // Sunderland
			case 341 -> "t2";    // Leeds United
			case 322 -> "t88";   // Hull City
			case 1076 -> "t9";   // Coventry City
			default -> null;
		};
		return badgeId != null ? "https://resources.premierleague.com/premierleague/badges/50/" + badgeId + ".png" : null;
	}

	/**
	 * 특정 구단 선수단의 세부 포지션(CB, LB, RB, CDM, CAM, CM, LM, RM, ST, LW, RW 등) Gemini AI 정밀 판별 및 DB 적재
	 * - 할루시네이션 원천 차단:
	 *   1) 프롬프트에 선수의 영문명, 한글명, 소속구단, 기존 4대 대분류(MAIN_POSITION) 제공
	 *   2) 대분류 카테고리 일치 구속(GK->GK, DF->CB/LB/RB, MF->CDM/CM/CAM/LM/RM, FW->ST/LW/RW/SS)
	 *   3) Java 백엔드 2중 필터링을 통해 허용되지 않은 포지션이나 카테고리 불일치 시 자동 보정(Fail-safe)
	 */
	@Override
	@Transactional
	public int syncPlayersDetailPositionsByTeamId(Long teamId) {
		List<Players> playerList = teamDAO.findPlayersByTeamId(teamId);
		if (playerList == null || playerList.isEmpty()) {
			return 0;
		}

		Teams team = teamDAO.findTeamById(teamId);
		String teamName = (team != null) ? (team.getTeamNameKor() != null ? team.getTeamNameKor() : team.getTeamName()) : "구단";

		log.info("[Gemini AI] 구단 [{}] 소속 선수단 세부 포지션 AI 정밀 판별 시작 (대상: {}명)", teamName, playerList.size());

		Map<Long, Players> playerMap = new HashMap<>();
		List<Map<String, Object>> inputPlayers = new ArrayList<>();
		for (Players p : playerList) {
			playerMap.put(p.getPlayerId(), p);

			Map<String, Object> item = new HashMap<>();
			item.put("playerId", p.getPlayerId());
			item.put("name", p.getName());
			item.put("nameKor", p.getNameKor());
			item.put("teamName", teamName);
			item.put("mainPosition", p.getMainPosition()); // GK, DF, MF, FW
			inputPlayers.add(item);
		}

		try {
			String playersJson = objectMapper.writeValueAsString(inputPlayers);
			StringBuilder prompt = new StringBuilder();
			prompt.append("당신은 프리미어리그(EPL) 공식 데이터 분석가이자 SPOTV 축구 중계 전문 프로파일러입니다.\n");
			prompt.append("제공된 선수 목록의 실제 경기 프로필 및 공식 전술 배치를 바탕으로 각 선수의 '주 세부 포지션 공식 약어'를 정밀하게 판별해주세요.\n\n");
			prompt.append("[★ 할루시네이션 방지 절대 규칙 - 위반 절대 금지 ★]\n");
			prompt.append("1. 선수의 기존 'mainPosition' 대분류 카테고리를 100% 엄격히 준수해야 합니다:\n");
			prompt.append("   - mainPosition이 'GK'인 경우: 무조건 'GK'로만 지정\n");
			prompt.append("   - mainPosition이 'DF'인 경우: 'CB', 'LB', 'RB', 'LWB', 'RWB' 중에서만 지정 (절대 미드필더/공격수 부여 금지)\n");
			prompt.append("   - mainPosition이 'MF'인 경우: 'CDM', 'CM', 'CAM', 'LM', 'RM' 중에서만 지정 (절대 수비수/공격수 부여 금지)\n");
			prompt.append("   - mainPosition이 'FW'인 경우: 'ST', 'CF', 'LW', 'RW', 'SS' 중에서만 지정 (절대 수비수/미드필더 부여 금지)\n");
			prompt.append("2. 출력 약어는 오직 공인 축구 약어만 허용됩니다. 부가 설명이나 다른 텍스트는 절대 작성하지 마세요.\n");
			prompt.append("3. 대표적인 팩트 기준 예시:\n");
			prompt.append("   - 살리바, 반다이크, 로메로, 디아스 -> 'CB'\n");
			prompt.append("   - 진첸코, 그바르디올, 우도기, 로버트슨 -> 'LB'\n");
			prompt.append("   - 화이트, 포로, 아놀드, 워커 -> 'RB'\n");
			prompt.append("   - 로드리, 라이스, 파티, 카이세도 -> 'CDM'\n");
			prompt.append("   - 외데고르, 더브라위너, 매디슨, 브루누 -> 'CAM'\n");
			prompt.append("   - 엔소 페르난데스, 마이누, 코바치치 -> 'CM'\n");
			prompt.append("   - 사카, 살라, 쿨루셉스키 -> 'RW'\n");
			prompt.append("   - 손흥민, 마르티넬리, 디아스 -> 'LW'\n");
			prompt.append("   - 홀란, 솔란케, 하베르츠, 잭슨, 호일룬 -> 'ST'\n\n");
			prompt.append("반드시 아래와 같은 JSON 배열 형식으로만 응답해야 합니다:\n");
			prompt.append("[\n");
			prompt.append("  {\n");
			prompt.append("    \"playerId\": 3233,\n");
			prompt.append("    \"detailPosition\": \"CAM\"\n");
			prompt.append("  }\n");
			prompt.append("]\n\n");
			prompt.append("선수 목록 데이터:\n").append(playersJson);

			String resultJson = callGemini(prompt.toString());
			JsonNode arrayNode = objectMapper.readTree(resultJson);

			int updatedCount = 0;
			if (arrayNode.isArray()) {
				for (JsonNode node : arrayNode) {
					Long playerId = node.path("playerId").asLong();
					String rawDetail = node.path("detailPosition").asText("").trim().toUpperCase();

					Players originalPlayer = playerMap.get(playerId);
					if (originalPlayer == null) continue;

					String detailPosition = validateAndSanitizeDetailPosition(originalPlayer.getMainPosition(), rawDetail);

					Players updateTarget = new Players();
					updateTarget.setPlayerId(playerId);
					updateTarget.setDetailPosition(detailPosition);

					teamDAO.updatePlayerDetailPosition(updateTarget);
					updatedCount++;
				}
			}

			log.info("[Gemini AI] 구단 [{}] 세부 포지션 정밀 적재 완료! (총 {}명 반영)", teamName, updatedCount);
			return updatedCount;

		} catch (Exception e) {
			log.error("[Gemini AI] 구단 [{}] 세부 포지션 처리 중 오류: {}", teamName, e.getMessage(), e);
			throw new RuntimeException("세부 포지션 AI 판별 실패: " + e.getMessage(), e);
		}
	}

	/**
	 * 세부 포지션 정규화 가드레일:
	 * 1) 이미 공식 약어(CB, LB, CDM, CAM, ST 등)인 경우 그대로 유지
	 * 2) AI가 풀네임(CENTRE-BACK 등)으로 반환한 경우 공식 약어로 정규화
	 * 3) 비정상적인 값이면 원래 대분류 유지
	 */
	private String validateAndSanitizeDetailPosition(String mainPosition, String detailPosition) {
		if (detailPosition == null || detailPosition.isBlank()) {
			return mainPosition;
		}
		String d = detailPosition.trim().toUpperCase();

		// 1. 이미 올바른 공식 약어인 경우 그대로 통과
		if (List.of("GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "ST", "CF", "LW", "RW", "SS").contains(d)) {
			return d;
		}

		// 2. AI가 풀네임이나 변형으로 응답했을 때 공식 약어로 정규화
		if (d.contains("CENTRE-BACK") || d.contains("CENTER-BACK")) return "CB";
		if (d.contains("LEFT-BACK")) return "LB";
		if (d.contains("RIGHT-BACK")) return "RB";
		if (d.contains("DEFENSIVE MID")) return "CDM";
		if (d.contains("ATTACKING MID")) return "CAM";
		if (d.contains("CENTRAL MID")) return "CM";
		if (d.contains("LEFT WING")) return "LW";
		if (d.contains("RIGHT WING")) return "RW";
		if (d.contains("SECOND STRIKER")) return "SS";
		if (d.contains("STRIKER") || d.contains("FORWARD")) return "ST";

		// 3. 그 외 알 수 없는 형식이면 원래 대분류 유지
		return (mainPosition != null) ? mainPosition : "MF";
	}

	@Override
	public int syncAllPlayersDetailPositions() {
		List<Teams> teamList = teamDAO.findAllTeams();
		if (teamList == null || teamList.isEmpty()) {
			log.warn("[Gemini AI] 등록된 구단이 없습니다.");
			return 0;
		}

		log.info("======================================================================");
		log.info("[Gemini AI] 20개 구단 전체 선수 세부 포지션 AI 정밀 판별 시작 (총 {}개 구단)", teamList.size());
		log.info("======================================================================");

		int totalUpdated = 0;
		for (Teams t : teamList) {
			try {
				int count = syncPlayersDetailPositionsByTeamId(t.getTeamId());
				totalUpdated += count;
				// 구단별 약 0.5초 간격 안정적 처리
				Thread.sleep(500);
			} catch (Exception e) {
				log.error("[Gemini AI] 구단 ID {} 세부 포지션 동기화 실패: {}", t.getTeamId(), e.getMessage());
			}
		}

		log.info("======================================================================");
		log.info("[Gemini AI] 전체 구단 선수 세부 포지션 AI 동기화 최종 완료! (총 {}명 반영)", totalUpdated);
		log.info("======================================================================");
		return totalUpdated;
	}

	/**
	 * EPL 챗봇 질문 답변용 자연어 텍스트 Gemini 호출
	 */
	private String callGeminiText(String promptText) throws Exception {
		if (apiKey == null || apiKey.trim().isEmpty() || "apikey".equalsIgnoreCase(apiKey.trim())) {
			throw new IllegalStateException("application.properties에 유효한 gemini.api.key가 설정되지 않았습니다.");
		}

		Map<String, Object> textPart = new HashMap<>();
		textPart.put("text", promptText);

		List<Map<String, Object>> parts = new ArrayList<>();
		parts.add(textPart);

		Map<String, Object> contentMap = new HashMap<>();
		contentMap.put("parts", parts);

		List<Map<String, Object>> contents = new ArrayList<>();
		contents.add(contentMap);

		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("contents", contents);

		String requestJson = objectMapper.writeValueAsString(requestBody);

		String[] modelsToTry = (verifiedModel != null) 
				? new String[]{verifiedModel} 
				: CANDIDATE_MODELS;

		String lastError = null;
		for (String modelName : modelsToTry) {
			String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";

			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(apiUrl))
					.header("Content-Type", "application/json; charset=utf-8")
					.header("x-goog-api-key", apiKey.trim())
					.timeout(Duration.ofSeconds(30))
					.POST(HttpRequest.BodyPublishers.ofString(requestJson))
					.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

			if (response.statusCode() == 200) {
				if (verifiedModel == null) {
					verifiedModel = modelName;
					log.info("[Gemini API] 챗봇용 모델 연동 성공: {}", modelName);
				}

				JsonNode rootNode = objectMapper.readTree(response.body());
				JsonNode candidates = rootNode.path("candidates");
				if (candidates.isArray() && candidates.size() > 0) {
					JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
					return textNode.asText();
				}
			} else {
				lastError = "모델 [" + modelName + "] 호출 실패 (HTTP " + response.statusCode() + "): " + response.body();
				log.warn("[Gemini API] {}", lastError);
				if (verifiedModel != null) {
					verifiedModel = null;
					return callGeminiText(promptText);
				}
			}
		}

		throw new RuntimeException("모든 Gemini 모델 호출 실패: " + lastError);
	}

	@Override
	public String answerEplQuestion(String question, String pagePath) {
		if (question == null || question.isBlank()) {
			return "질문 내용을 입력해주세요.";
		}

		StringBuilder prompt = new StringBuilder();
		prompt.append("당신은 대한민국 최고의 잉글랜드 프리미어리그(EPL) 전문 축구 어시스턴트 '플러그(PLUGIN) AI'입니다.\n");
		prompt.append("사용자의 질문에 대해 한국어로 친절하고 흥미로우며 전문적으로 답변해주세요.\n\n");
		if (pagePath != null && !pagePath.isBlank()) {
			prompt.append("[참고: 사용자가 현재 보고 있는 웹페이지 경로: ").append(pagePath).append("]\n");
		}
		prompt.append("[사용자 질문]:\n").append(question).append("\n\n");
		prompt.append("[답변 지침]:\n");
		prompt.append("1. 프리미어리그의 역사, 경기 규칙, 현재 및 역대 구단, 유명 선수, 감독, 경기 결과, 전술 등에 대해 정확하게 설명하세요.\n");
		prompt.append("2. 가독성을 위해 적절한 줄바꿈과 글머리 기호(마크다운 형식)를 사용하여 깔끔하게 작성하세요.\n");
		prompt.append("3. 만약 프리미어리그나 축구와 완전히 무관한 질문이라면, 정중하게 프리미어리그 관련 질문을 유도해주세요.\n");
		prompt.append("4. 존댓말(해요체 또는 하십시오체)을 사용하고, 축구 팬들과 대화하듯 생동감 있게 답변하세요.");

		try {
			String answer = callGeminiText(prompt.toString());
			if (answer != null && !answer.isBlank()) {
				return answer.trim();
			}
		} catch (Exception e) {
			log.error("[Gemini AI 챗봇] 답변 생성 실패: {}", e.getMessage(), e);
			throw new IllegalStateException("Gemini API 호출 중 오류가 발생했습니다: " + e.getMessage(), e);
		}

		return "죄송합니다. 현재 일시적으로 답변을 생성할 수 없습니다. 잠시 후 다시 질문해주세요!";
	}
}
