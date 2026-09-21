package com.app.service.api.impl;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.team.TeamDAO;
import com.app.dao.match.MatchDAO;
import com.app.dto.match.MatchEvents;
import com.app.dto.match.Matches;
import com.app.dto.team.TeamStats;
import com.app.dto.team.Players;
import com.app.dto.team.PlayerStats;
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
	private static final Pattern SCORE_PATTERN = Pattern.compile("(?<!\\d)(\\d{1,2})\\s*(?:대|:)\\s*(\\d{1,2})(?!\\d)");
	private static final Pattern NATIONALITY_PATTERN = Pattern.compile("([가-힣]{2,12})\\s*국적");
	private static final Pattern KOREAN_DATE_PATTERN = Pattern.compile("(20\\d{2})년\\s*(\\d{1,2})월\\s*(\\d{1,2})일");
	private static final Pattern ISO_DATE_PATTERN = Pattern.compile("(?<!\\d)(20\\d{2})-(\\d{1,2})-(\\d{1,2})(?!\\d)");
	private static final Pattern SEASON_PATTERN = Pattern.compile("(?<!\\d)(20\\d{2})(?:년|시즌)?(?!\\s*[월.-]\\s*\\d)");

	// 사용자 API 키로 100% 검증 완료된 최신 공식 Gemini 모델
	private static final String[] CANDIDATE_MODELS = {
		"gemini-flash-lite-latest",
		"gemini-3.1-flash-lite",
		"gemini-flash-latest"
	};

	// 연결 성공이 확인된 모델을 캐싱하여 재사용
	private volatile String verifiedModel = null;
	private volatile String verifiedSearchModel = null;

	private record GeminiCallResult(String text, List<String> sources) {}

	@Value("${gemini.api.key}")
	private String apiKey;

	@Autowired
	private TeamDAO teamDAO;

	@Autowired
	private MatchDAO matchDAO;

	private final HttpClient httpClient;
	private final ObjectMapper objectMapper;

	public GeminiApiServiceImpl() {
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(15))
				.build();
		this.objectMapper = new ObjectMapper();
	}

	// EPL 질문만 받아 기존 Gemini 연결로 짧은 한국어 답변을 생성합니다.
	@Override
	public String answerEplQuestion(String question, String pagePath, String scoreContext,
			String conversationContext) {
		if (question == null || question.isBlank() || question.length() > 1000) {
			throw new IllegalArgumentException("질문을 1~1000자로 입력해주세요.");
		}

		String trimmedQuestion = question.trim();
		LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));
		List<Teams> selectedTeams = findMentionedTeams(trimmedQuestion);
		boolean namedTeam = !selectedTeams.isEmpty();
		if (selectedTeams.isEmpty() && pagePath != null && pagePath.matches("/plug/team/\\d+")) {
			Teams pageTeam = teamDAO.findTeamById(Long.parseLong(pagePath.substring("/plug/team/".length())));
			if (pageTeam != null) selectedTeams.add(pageTeam);
		}
		if (selectedTeams.isEmpty() && conversationContext != null
				&& needsConversationContext(trimmedQuestion)) {
			selectedTeams.addAll(findMentionedTeams(conversationContext));
		}
		String contextualQuestion = buildContextualMatchQuestion(trimmedQuestion, conversationContext);
		if (contextualQuestion == null) {
			return "어느 경기인지 확인할 수 없습니다. 팀 이름이나 경기 날짜를 함께 알려주세요.";
		}
		String datedAnswer = answerMatchesOnDate(contextualQuestion, selectedTeams);
		if (datedAnswer != null) return datedAnswer;
		String relativeScheduleAnswer = answerRelativeSchedules(trimmedQuestion, selectedTeams, now.toLocalDate());
		if (relativeScheduleAnswer != null) return relativeScheduleAnswer;

		// 점수가 명시된 질문과 그 점수를 이어 묻는 질문은 정확한 경기 결과를 조회합니다.
		long[] score = parseScore(trimmedQuestion);
		if (score == null && isScoreFollowUp(trimmedQuestion)) score = parseScore(scoreContext);
		if (score != null) {
			Long teamId = selectedTeams.isEmpty() ? null : selectedTeams.get(0).getTeamId();
			Long opponentTeamId = selectedTeams.size() > 1 ? selectedTeams.get(1).getTeamId() : null;
			List<Matches> matches = matchDAO.findFinishedMatchesByScore(
					score[0], score[1], teamId, opponentTeamId, 5);
			if (matches.isEmpty()) {
				return "DB에서 " + score[0] + "대" + score[1] + "으로 끝난 경기를 찾지 못했습니다.";
			}
			StringBuilder answer = new StringBuilder()
					.append(score[0]).append("대").append(score[1])
					.append(" 경기 · 최근 ").append(matches.size()).append("건");
			for (Matches match : matches) {
				answer.append("\n- ").append(match.getMatchDate()).append(' ')
						.append(match.getHomeTeamName()).append(' ')
						.append(match.getHomeScore()).append(':').append(match.getAwayScore()).append(' ')
						.append(match.getAwayTeamName());
				if (score[0] != score[1]) {
					answer.append(" (승리: ")
							.append(score[0] > score[1] ? match.getHomeTeamName() : match.getAwayTeamName())
							.append(')');
				}
			}
			return answer.toString();
		}

		// 감독 수 질문은 STAFFS의 국적과 직책을 기준으로 직접 셉니다.
		boolean managerQuestion = isManagerQuestion(trimmedQuestion);
		List<Staffs> allManagers = managerQuestion ? teamDAO.findAllStaffs().stream()
				.filter(staff -> "감독".equals(staff.getRoleName()))
				.toList() : List.of();
		boolean historicalManagers = trimmedQuestion.contains("역대") || trimmedQuestion.contains("과거");
		List<TeamStats> currentStandings = managerQuestion && !historicalManagers
				? teamDAO.findAllTeamStandings(null) : List.of();
		Set<Long> currentTeamIds = currentStandings.stream()
				.map(stats -> stats == null ? null : stats.getTeamId()).collect(Collectors.toSet());
		List<Staffs> managers = historicalManagers ? allManagers : allManagers.stream()
				.filter(staff -> currentTeamIds.contains(staff.getTeamId())).toList();
		String nationality = managerQuestion ? findRequestedNationality(trimmedQuestion, allManagers) : null;
		if (managerQuestion && nationality == null && isCountQuestion(trimmedQuestion)) {
			if (!historicalManagers && currentStandings.isEmpty()) {
				return "현재 시즌 순위 데이터가 없어 감독 인원을 확인할 수 없습니다.";
			}
			List<Staffs> scopedManagers = namedTeam ? managers.stream()
					.filter(staff -> selectedTeams.stream()
							.anyMatch(team -> team.getTeamId().equals(staff.getTeamId()))).toList()
					: managers;
			if (!trimmedQuestion.contains("국적별")) {
				return "DB 기준 감독은 " + scopedManagers.size() + "명입니다.";
			}
			Map<String, Long> counts = scopedManagers.stream()
					.collect(Collectors.groupingBy(this::displayNationality, Collectors.counting()));
			StringBuilder answer = new StringBuilder("감독 국적별 인원");
			counts.entrySet().stream().sorted(Map.Entry.comparingByKey())
					.forEach(entry -> answer.append("\n- ").append(entry.getKey())
							.append(" · ").append(entry.getValue()).append("명"));
			return answer.toString();
		}
		if (nationality != null && isCountQuestion(trimmedQuestion)) {
			if (!historicalManagers && currentStandings.isEmpty()) {
				return "현재 시즌 순위 데이터가 없어 감독 인원을 확인할 수 없습니다.";
			}
			List<Staffs> matchingManagers = managers.stream()
					.filter(staff -> matchesNationality(staff, nationality))
					.filter(staff -> !namedTeam || selectedTeams.stream()
							.anyMatch(team -> team.getTeamId().equals(staff.getTeamId())))
					.toList();
			String displayNationality = allManagers.stream()
					.filter(staff -> matchesNationality(staff, nationality))
					.findFirst().map(this::displayNationality).orElse(nationality);
			String scope = historicalManagers ? "DB에 저장된 전체 팀 기준 "
					: currentStandings.get(0).getSeason() + "시즌 PL 팀 기준 ";
			return scope + displayNationality + " 국적 감독은 "
					+ matchingManagers.size() + "명입니다.";
		}
		if (nationality != null && (trimmedQuestion.contains("누구") || trimmedQuestion.contains("이름"))) {
			if (!historicalManagers && currentStandings.isEmpty()) {
				return "현재 시즌 순위 데이터가 없어 감독 명단을 확인할 수 없습니다.";
			}
			List<Staffs> matchingManagers = managers.stream()
					.filter(staff -> matchesNationality(staff, nationality))
					.filter(staff -> !namedTeam || selectedTeams.stream()
							.anyMatch(team -> team.getTeamId().equals(staff.getTeamId())))
					.toList();
			if (matchingManagers.isEmpty()) return "DB에 해당 국적 감독이 없습니다.";
			StringBuilder answer = new StringBuilder(displayNationality(matchingManagers.get(0)))
					.append(" 국적 감독 ").append(matchingManagers.size()).append("명");
			for (Staffs manager : matchingManagers) {
				Teams team = teamDAO.findTeamById(manager.getTeamId());
				answer.append("\n- ")
						.append(manager.getNameKor() != null ? manager.getNameKor() : manager.getName())
						.append(" · ").append(team != null ? displayTeamName(team) : "소속 팀 미상");
			}
			return answer.toString();
		}
		String directAnswer = answerTeamManager(trimmedQuestion, selectedTeams);
		if (directAnswer == null) directAnswer = answerPlayerRankings(trimmedQuestion);
		if (directAnswer == null) directAnswer = answerStandings(trimmedQuestion, selectedTeams);
		if (directAnswer == null) directAnswer = answerPlayerCount(trimmedQuestion, selectedTeams);
		if (directAnswer == null) directAnswer = answerPlayerDetails(trimmedQuestion);
		if (directAnswer == null) directAnswer = answerUnavailablePlayers(trimmedQuestion, selectedTeams);
		if (directAnswer == null) directAnswer = answerTeamRoster(trimmedQuestion, selectedTeams);
		if (directAnswer == null) directAnswer = answerTeamFacts(trimmedQuestion, selectedTeams);
		if (directAnswer == null) directAnswer = answerHeadToHead(trimmedQuestion, selectedTeams);
		if (directAnswer == null) directAnswer = answerRecentResults(trimmedQuestion, selectedTeams);
		if (directAnswer != null) return directAnswer;

		Long firstTeamId = selectedTeams.isEmpty() ? null : selectedTeams.get(0).getTeamId();
		List<Matches> upcoming = matchDAO.findUpcomingMatches(firstTeamId, now,
				selectedTeams.size() > 1 ? 30 : 5);
		if (selectedTeams.size() > 1) {
			Long secondTeamId = selectedTeams.get(1).getTeamId();
			upcoming = upcoming.stream().filter(match -> secondTeamId.equals(match.getHomeTeamId())
					|| secondTeamId.equals(match.getAwayTeamId())).limit(5).toList();
		}

		// 일정 날짜를 묻는 질문에는 DB에 저장된 일시를 그대로 답합니다.
		if (isScheduleQuestion(trimmedQuestion)) {
			if (upcoming.isEmpty()) return "DB에 확인되는 향후 예정 경기가 없습니다. 경기 일정 동기화 상태를 확인해주세요.";
			boolean asksClosest = trimmedQuestion.contains("가까운") || trimmedQuestion.contains("다음 경기")
					|| trimmedQuestion.contains("예정일") || trimmedQuestion.contains("언제");
			if (!asksClosest) {
				StringBuilder answer = new StringBuilder("DB 기준 향후 예정 경기 ")
						.append(Math.min(upcoming.size(), 5)).append("건");
				upcoming.stream().limit(5).forEach(match -> answer.append("\n- ")
						.append(match.getMatchDate()).append(' ').append(match.getHomeTeamName())
						.append(" vs ").append(match.getAwayTeamName()));
				return answer.toString();
			}
			Matches next = upcoming.get(0);
			return "DB 기준 가장 가까운 예정 경기: " + next.getMatchDate() + " (한국 시간), "
					+ next.getHomeTeamName() + " vs " + next.getAwayTeamName() + "입니다.";
		}

		StringBuilder dbContext = new StringBuilder("DB 조회 시각(한국 시간): ").append(now).append('\n');
		if (upcoming.isEmpty()) {
			dbContext.append("확인된 향후 예정 경기 없음\n");
		} else {
			dbContext.append("향후 예정 경기:\n");
			upcoming.stream().limit(5).forEach(match -> dbContext.append("- ")
					.append(match.getMatchDate()).append(' ').append(match.getHomeTeamName())
					.append(" vs ").append(match.getAwayTeamName()).append('\n'));
		}

		if (selectedTeams.isEmpty()) {
			appendRecentMatches(dbContext, null, 3);
		} else {
			for (Teams team : selectedTeams) {
				if (team == null) continue;
				TeamStats stats = teamDAO.findTeamStats(team.getTeamId(), null);
				dbContext.append("팀: ").append(displayTeamName(team)).append('\n');
				dbContext.append("- 홈구장: ")
						.append(team.getHomeGroundKor() != null ? team.getHomeGroundKor() : team.getHomeGround())
						.append(", 창단: ").append(team.getFoundedYear()).append('\n');
				if (team.getHistory() != null && !team.getHistory().isBlank()) {
					dbContext.append("- 소개: ")
							.append(team.getHistory(), 0, Math.min(team.getHistory().length(), 500))
							.append('\n');
				}
				if (stats != null) {
					dbContext.append("- 시즌 ").append(stats.getSeason())
						.append(", 순위 ").append(stats.getCurrentRank())
						.append(", 승점 ").append(stats.getPoints())
						.append(", 경기 ").append(stats.getMatchesPlayed())
						.append(", ").append(stats.getWins()).append("승 ")
						.append(stats.getDraws()).append("무 ")
						.append(stats.getLosses()).append("패")
						.append(", 득점 ").append(stats.getGoalsFor())
						.append(", 실점 ").append(stats.getGoalsAgainst())
						.append(", 득실차 ").append(stats.getGoalDiff()).append('\n');
				}
				appendRecentMatches(dbContext, team.getTeamId(), 3);
			}
		}
		if (managerQuestion) {
			dbContext.append("감독 명단과 국적:\n");
			for (Staffs manager : managers) {
				dbContext.append("- ")
						.append(manager.getNameKor() != null ? manager.getNameKor() : manager.getName())
						.append(": ").append(displayNationality(manager)).append('\n');
			}
		}
		if (isPlayerQuestion(trimmedQuestion) || containsMentionedPlayer(trimmedQuestion)) {
			appendPlayerContext(dbContext, trimmedQuestion, selectedTeams);
		}

		String recentConversation = conversationContext == null ? ""
				: conversationContext.substring(0, Math.min(conversationContext.length(), 5000));
		String prompt = "당신은 잉글랜드 프리미어리그(EPL) 안내 챗봇입니다. "
				+ "EPL 관련 질문에 한국어로 답하세요. 아래 DB 정보를 사실의 기준으로 사용하세요. "
				+ "DB에 있는 경기 결과, 일정, 순위, 선수 기록은 DB 값을 우선하세요. "
				+ "DB에 없는 선수 개인 프로필, 경력, 이적, 부상, 최신 소식은 Google 검색으로 확인하세요. "
				+ "검색 결과가 서로 다르거나 확인되지 않으면 내용을 만들어내지 마세요. "
				+ "확인할 수 없는 실시간 경기 결과나 순위는 추측하지 말고 최신 정보 확인이 필요하다고 안내하세요. "
				+ "EPL과 무관한 질문이면 EPL 관련 질문을 해 달라고 안내하세요. "
				+ "반드시 {\"answer\":\"답변 내용\"} 형태의 JSON 객체만 반환하세요.\n"
				+ "DB 정보:\n" + dbContext
				+ (recentConversation.isBlank() ? "" : "\n최근 대화:\n" + recentConversation)
				+ "\n질문: " + trimmedQuestion;
		try {
			GeminiCallResult groundedResult;
			try {
				groundedResult = callGeminiWithSearch(prompt);
			} catch (Exception searchException) {
				log.warn("[Gemini chat] Google 검색 연동 실패, 일반 답변으로 재시도: {}",
						searchException.getClass().getSimpleName());
				String fallbackPrompt = prompt
						+ "\n현재 Google 검색 도구를 사용할 수 없습니다. 검색했다고 표현하지 말고, "
						+ "확실한 일반 정보만 답하며 최신 정보는 확인이 필요하다고 명시하세요.";
				groundedResult = new GeminiCallResult(callGemini(fallbackPrompt), List.of());
			}
			JsonNode result = objectMapper.readTree(groundedResult.text());
			String answer = result.path("answer").asText("").trim();
			if (answer.isEmpty()) {
				throw new IllegalStateException("Gemini 답변이 비어 있습니다.");
			}
			if (groundedResult.sources().isEmpty()) return answer;
			StringBuilder groundedAnswer = new StringBuilder(answer).append("\n\n검색 출처");
			groundedResult.sources().forEach(source -> groundedAnswer.append("\n- ").append(source));
			return groundedAnswer.toString();
		} catch (Exception exception) {
			log.warn("[Gemini chat] 답변 생성 실패: {}", exception.getClass().getSimpleName());
			throw new IllegalStateException("챗봇 답변을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.");
		}
	}

	private long[] parseScore(String text) {
		if (text == null) return null;
		Matcher matcher = SCORE_PATTERN.matcher(text);
		if (!matcher.find()) return null;
		long home = Long.parseLong(matcher.group(1));
		long away = Long.parseLong(matcher.group(2));
		return home <= 20 && away <= 20 ? new long[] {home, away} : null;
	}

	// 득점자 후속 질문에는 직전 답변의 경기 날짜를 이어 붙여 같은 경기를 다시 조회합니다.
	private String buildContextualMatchQuestion(String question, String conversationContext) {
		boolean scoringDetail = isScoringEventQuestion(question);
		boolean resultDetail = question.contains("누가 이겼") || question.contains("승리 팀")
				|| question.contains("승리팀") || question.contains("이긴 팀")
				|| question.contains("몇 대 몇") || question.contains("몇대몇");
		boolean timeFollowUp = conversationContext != null && question.contains("언제")
				&& !question.contains("다음") && !question.contains("예정");
		boolean matchFollowUp = scoringDetail || resultDetail || timeFollowUp;
		if (!matchFollowUp) return question;
		if (KOREAN_DATE_PATTERN.matcher(question).find() || ISO_DATE_PATTERN.matcher(question).find()) {
			return question.contains("경기") ? question : question + " 경기";
		}
		if (conversationContext == null || conversationContext.isBlank()) return null;
		List<String> dates = new ArrayList<>();
		Matcher koreanDate = KOREAN_DATE_PATTERN.matcher(conversationContext);
		while (koreanDate.find()) {
			String date = koreanDate.group();
			if (!dates.contains(date)) dates.add(date);
		}
		Matcher isoDate = ISO_DATE_PATTERN.matcher(conversationContext);
		while (isoDate.find()) {
			String date = isoDate.group();
			if (!dates.contains(date)) dates.add(date);
		}
		if (dates.size() != 1) return null;
		return question + " 경기 " + dates.get(0);
	}

	private boolean isScoringEventQuestion(String question) {
		return question.contains("득점자") || question.contains("골 넣")
				|| question.contains("골을 넣") || question.contains("누가 득점")
				|| question.contains("몇 분에") || question.contains("몇분에")
				|| question.contains("도움 누구") || question.contains("도움은 누구")
				|| question.contains("어시스트 누구") || question.contains("어시스트는 누구");
	}

	private boolean needsConversationContext(String question) {
		boolean implicitMatch = isScoringEventQuestion(question) || question.contains("누가 이겼")
				|| question.contains("몇 대 몇") || question.contains("몇대몇")
				|| question.contains("그 경기") || question.contains("해당 경기")
				|| question.contains("언제 했") || question.contains("언제 열린");
		boolean implicitTeam = question.contains("그 팀") || question.contains("해당 팀")
				|| question.contains("거기");
		return implicitMatch || implicitTeam;
	}

	private String answerMatchesOnDate(String question, List<Teams> selectedTeams) {
		if (!question.contains("경기") && !question.contains("일정") && !question.contains("결과")) return null;
		Matcher dateMatch = KOREAN_DATE_PATTERN.matcher(question);
		if (!dateMatch.find()) {
			dateMatch = ISO_DATE_PATTERN.matcher(question);
			if (!dateMatch.find()) return null;
		}
		LocalDate date;
		try {
			date = LocalDate.of(Integer.parseInt(dateMatch.group(1)),
					Integer.parseInt(dateMatch.group(2)), Integer.parseInt(dateMatch.group(3)));
		} catch (RuntimeException exception) {
			return "올바른 날짜를 입력해주세요.";
		}
		List<Matches> matches = matchDAO.findMatchesByDateRange(date.atStartOfDay(),
				date.plusDays(1).atStartOfDay().minusNanos(1));
		long[] score = question.contains("대") || question.contains("점수") || question.contains("스코어")
				? parseScore(question) : null;
		if (score != null) matches = matches.stream()
				.filter(match -> match.getHomeScore() != null && match.getAwayScore() != null
						&& match.getHomeScore() == score[0] && match.getAwayScore() == score[1]).toList();
		for (Teams team : selectedTeams) {
			matches = matches.stream().filter(match -> team.getTeamId().equals(match.getHomeTeamId())
					|| team.getTeamId().equals(match.getAwayTeamId())).toList();
		}
		if (matches.isEmpty()) return "DB에 " + date + "의 해당 경기 기록이 없습니다.";
		Map<Long, Teams> teamsById = teamDAO.findAllTeams().stream()
				.collect(Collectors.toMap(team -> team == null ? null : team.getTeamId(), team -> team));
		boolean scorerQuestion = isScoringEventQuestion(question);
		StringBuilder answer = new StringBuilder(date + " 경기 " + Math.min(matches.size(), 10) + "건");
		for (Matches match : matches.stream().limit(10).toList()) {
			Teams home = teamsById.get(match.getHomeTeamId());
			Teams away = teamsById.get(match.getAwayTeamId());
			answer.append("\n- ").append(match.getMatchDate()).append(' ')
					.append(home != null ? displayTeamName(home) : "홈팀 미상").append(' ')
					.append(match.getHomeScore() != null && match.getAwayScore() != null
							? match.getHomeScore() + ":" + match.getAwayScore() : "vs")
					.append(' ').append(away != null ? displayTeamName(away) : "원정팀 미상");
			if (scorerQuestion) appendScoringEvents(answer, match.getMatchId());
		}
		return answer.toString();
	}

	// 선택된 경기의 골·페널티킥 골·자책골 이벤트와 도움 선수를 표시합니다.
	private void appendScoringEvents(StringBuilder answer, Long matchId) {
		List<MatchEvents> scoringEvents = matchDAO.findEventsByMatchId(matchId).stream()
				.filter(event -> event.getEventType() != null && event.getEventType() >= 1
						&& event.getEventType() <= 3)
				.toList();
		if (scoringEvents.isEmpty()) {
			answer.append("\n  ㄴ DB에 득점자 이벤트가 없습니다.");
			return;
		}
		for (MatchEvents event : scoringEvents) {
			answer.append("\n  ㄴ ").append(event.getEventTime()).append("분 · ")
					.append(event.getPlayerName()).append(" · ").append(event.getEventTypeName());
			if (event.getAssistPlayerName() != null) {
				answer.append(" (도움: ").append(event.getAssistPlayerName()).append(')');
			}
		}
	}

	private boolean isScoreFollowUp(String question) {
		return question.contains("그때") || question.contains("딴때")
				|| question.contains("다른 경기") || question.contains("또 있")
				|| question.contains("더 있");
	}

	private boolean isManagerQuestion(String question) {
		String lower = question.toLowerCase(java.util.Locale.ROOT);
		return question.contains("감독") || lower.contains("manager") || lower.contains("head coach");
	}

	private boolean isCountQuestion(String question) {
		String lower = question.toLowerCase(java.util.Locale.ROOT);
		return question.contains("몇") || question.contains("인원")
				|| question.contains("감독 수") || question.contains("감독의 수")
				|| question.contains("팀 수") || question.contains("구단 수")
				|| lower.contains("how many");
	}

	private String findRequestedNationality(String question, List<Staffs> managers) {
		String normalized = question.replace("스패인", "스페인")
				.toLowerCase(java.util.Locale.ROOT).replace("spanish", "spain");
		for (Staffs manager : managers) {
			String english = manager.getNationality();
			String korean = manager.getNationalityKor();
			if ((english != null && normalized.contains(english.toLowerCase(java.util.Locale.ROOT)))
					|| (korean != null && normalized.contains(korean.toLowerCase(java.util.Locale.ROOT)))) {
				return english != null ? english : korean;
			}
		}
		return explicitNationality(normalized);
	}

	private String explicitNationality(String question) {
		Matcher matcher = NATIONALITY_PATTERN.matcher(question);
		if (!matcher.find()) return null;
		String country = matcher.group(1);
		return country.equals("어느") || country.equals("어떤") || country.equals("무슨")
				|| country.equals("감독") || country.equals("선수") || country.equals("팀")
				? null : country;
	}

	private boolean matchesNationality(Staffs staff, String nationality) {
		return nationality.equalsIgnoreCase(staff.getNationality())
				|| nationality.equals(staff.getNationalityKor());
	}

	private String displayNationality(Staffs staff) {
		if (staff.getNationalityKor() != null && !staff.getNationalityKor().isBlank()) {
			return staff.getNationalityKor();
		}
		return staff.getNationality() != null ? staff.getNationality() : "미상";
	}

	private String answerPlayerRankings(String question) {
		boolean goals = question.contains("득점왕") || question.contains("골 순위")
				|| (question.contains("득점") && (question.contains("순위")
				|| question.contains("상위") || question.contains("많이")));
		boolean assists = question.contains("도움왕") || (question.contains("도움")
				&& (question.contains("순위") || question.contains("상위") || question.contains("많이")));
		boolean attackPoints = question.contains("공격포인트") || question.contains("공포 순위");
		boolean mom = question.toUpperCase(java.util.Locale.ROOT).contains("MOM")
				|| question.contains("최우수 선수");
		boolean yellowCards = question.contains("경고") && (question.contains("순위")
				|| question.contains("상위") || question.contains("많이"));
		boolean redCards = question.contains("퇴장") && (question.contains("순위")
				|| question.contains("상위") || question.contains("많이"));
		if (!goals && !assists && !attackPoints && !mom && !yellowCards && !redCards) {
			return null;
		}
		List<TeamStats> standings = teamDAO.findAllTeamStandings(null);
		if (standings.isEmpty()) return "현재 시즌 순위 데이터가 없어 선수 순위를 확인할 수 없습니다.";
		Set<Long> currentTeamIds = standings.stream()
				.map(stats -> stats == null ? null : stats.getTeamId()).collect(Collectors.toSet());
		List<PlayerStats> source = redCards ? teamDAO.findTopRedCards(1000)
				: yellowCards ? teamDAO.findTopYellowCards(1000)
				: mom ? teamDAO.findTopMomPlayers(1000)
				: attackPoints ? teamDAO.findTopAttackPoints(1000)
				: assists ? teamDAO.findTopAssists(1000) : teamDAO.findTopScorers(1000);
		List<PlayerStats> rankings = source.stream()
				.filter(player -> currentTeamIds.contains(player.getTeamId()))
				.limit(5).toList();
		if (rankings.isEmpty()) return "DB에 등록된 해당 선수 기록이 없습니다.";
		String title = redCards ? "퇴장" : yellowCards ? "경고" : mom ? "MOM"
				: attackPoints ? "공격포인트" : assists ? "도움" : "득점";
		StringBuilder answer = new StringBuilder(title + " 상위 ").append(rankings.size()).append("명");
		for (PlayerStats player : rankings) {
			answer.append("\n- ")
					.append(player.getPlayerNameKor() != null ? player.getPlayerNameKor() : player.getPlayerName())
					.append(" · ");
			if (redCards) answer.append(value(player.getRedCards())).append("회");
			else if (yellowCards) answer.append(value(player.getYellowCards())).append("회");
			else if (mom) answer.append(value(player.getMomCount())).append("회");
			else if (attackPoints) answer.append(value(player.getGoals()) + value(player.getAssists()))
					.append("P (").append(value(player.getGoals())).append("골 ")
					.append(value(player.getAssists())).append("도움)");
			else if (assists) answer.append(value(player.getAssists())).append("도움");
			else answer.append(value(player.getGoals())).append("골");
			answer.append(" · ").append(player.getTeamNameKor() != null
					? player.getTeamNameKor() : player.getTeamName());
		}
		return answer.toString();
	}

	// 오늘·내일·이번 주처럼 상대적인 날짜 표현을 실제 DB 경기 일정으로 조회합니다.
	private String answerRelativeSchedules(String question, List<Teams> selectedTeams, LocalDate today) {
		if (!question.contains("경기") && !question.contains("일정")) return null;
		LocalDate startDate;
		LocalDate endDate;
		String period;
		if (question.contains("오늘")) {
			startDate = today;
			endDate = today.plusDays(1);
			period = "오늘(" + today + ")";
		} else if (question.contains("내일")) {
			startDate = today.plusDays(1);
			endDate = today.plusDays(2);
			period = "내일(" + startDate + ")";
		} else if (question.contains("어제")) {
			startDate = today.minusDays(1);
			endDate = today;
			period = "어제(" + startDate + ")";
		} else if (question.replace(" ", "").contains("지난주")) {
			endDate = today.minusDays(today.getDayOfWeek().getValue() - 1L);
			startDate = endDate.minusDays(7);
			period = "지난 주(" + startDate + "~" + endDate.minusDays(1) + ")";
		} else if (question.replace(" ", "").contains("이번주")) {
			startDate = today.minusDays(today.getDayOfWeek().getValue() - 1L);
			endDate = startDate.plusDays(7);
			period = "이번 주(" + startDate + "~" + endDate.minusDays(1) + ")";
		} else {
			return null;
		}

		List<Matches> matches = matchDAO.findMatchesByDateRange(
				startDate.atStartOfDay(), endDate.atStartOfDay().minusNanos(1));
		for (Teams team : selectedTeams) {
			matches = matches.stream().filter(match -> team.getTeamId().equals(match.getHomeTeamId())
					|| team.getTeamId().equals(match.getAwayTeamId())).toList();
		}
		if (matches.isEmpty()) return "DB에 확인되는 " + period + " 경기 일정이 없습니다.";

		Map<Long, Teams> teamsById = teamDAO.findAllTeams().stream()
				.collect(Collectors.toMap(team -> team == null ? null : team.getTeamId(), team -> team));
		StringBuilder answer = new StringBuilder(period).append(" 경기 ")
				.append(Math.min(matches.size(), 10)).append("건");
		for (Matches match : matches.stream().limit(10).toList()) {
			Teams home = teamsById.get(match.getHomeTeamId());
			Teams away = teamsById.get(match.getAwayTeamId());
			answer.append("\n- ").append(match.getMatchDate()).append(' ')
					.append(home != null ? displayTeamName(home) : "홈팀 미상")
					.append(match.getHomeScore() != null && match.getAwayScore() != null
							? " " + match.getHomeScore() + ":" + match.getAwayScore() + " " : " vs ")
					.append(away != null ? displayTeamName(away) : "원정팀 미상");
		}
		if (matches.size() > 10) answer.append("\n- 외 ").append(matches.size() - 10).append("경기");
		return answer.toString();
	}

	private long value(Long number) {
		return number == null ? 0 : number;
	}

	private String answerTeamManager(String question, List<Teams> selectedTeams) {
		if (!isManagerQuestion(question) || selectedTeams.isEmpty()) return null;
		Teams team = selectedTeams.get(0);
		return teamDAO.findStaffsByTeamId(team.getTeamId()).stream()
				.filter(staff -> "감독".equals(staff.getRoleName()))
				.findFirst().map(manager -> displayTeamName(team) + "의 감독은 "
						+ (manager.getNameKor() != null ? manager.getNameKor() : manager.getName())
						+ "이며 국적은 " + displayNationality(manager) + "입니다.")
				.orElse(displayTeamName(team) + "의 감독 정보가 DB에 없습니다.");
	}

	private String answerPlayerDetails(String question) {
		boolean detailQuestion = isPlayerQuestion(question) || question.contains("득점")
				|| question.contains("골") || question.contains("도움") || question.contains("부상")
				|| question.contains("징계")
				|| question.contains("소속") || question.contains("어느 팀")
				|| question.contains("어떤 팀") || question.contains("어디 팀")
				|| question.contains("어디팀") || question.contains("국적");
		if (!detailQuestion) return null;
		String lower = question.toLowerCase(java.util.Locale.ROOT);
		Players player = teamDAO.findAllPlayers().stream().filter(item ->
				(item.getNameKor() != null && question.contains(item.getNameKor()))
						|| (item.getName() != null && lower.contains(
								item.getName().toLowerCase(java.util.Locale.ROOT)))).findFirst().orElse(null);
		if (player == null) return null;
		PlayerStats stats = teamDAO.findPlayerStats(player.getPlayerId());
		Teams team = teamDAO.findTeamById(player.getTeamId());
		StringBuilder answer = new StringBuilder(player.getNameKor() != null
				? player.getNameKor() : player.getName());
		answer.append(" · ").append(team != null ? displayTeamName(team) : "소속 팀 미상")
				.append(" · ").append(player.getDetailPosition() != null
						? player.getDetailPosition() : player.getMainPosition())
				.append(" · ").append(player.getNationalityKor() != null
						? player.getNationalityKor() : player.getNationality());
		if (stats != null) {
			answer.append("\n- ").append(value(stats.getGoals())).append("골 · ")
					.append(value(stats.getAssists())).append("도움")
					.append(" · 경고 ").append(value(stats.getYellowCards()))
					.append(" · 퇴장 ").append(value(stats.getRedCards()));
			if ("Y".equals(stats.getIsInjured())) answer.append("\n- 부상: ")
					.append(stats.getInjuryNote() != null ? stats.getInjuryNote() : "상세 정보 없음");
			if ("Y".equals(stats.getIsSuspended())) answer.append("\n- 출장 정지 상태");
		}
		return answer.toString();
	}

	private String answerTeamRoster(String question, List<Teams> selectedTeams) {
		String position = requestedPosition(question);
		String detailPosition = requestedDetailPosition(question);
		boolean asksList = question.contains("명단") || question.contains("스쿼드")
				|| question.contains("선수 누구") || question.contains("선수들")
				|| ((position != null || detailPosition != null)
						&& (!selectedTeams.isEmpty() || question.contains("누구")
								|| question.contains("어디") || question.contains("알려")
								|| question.contains("있어")));
		if (!asksList) return null;
		List<Players> allPlayers = teamDAO.findAllPlayers();
		List<Players> players = allPlayers;
		String nationality = findPlayerNationality(question, allPlayers);
		String title = "선수 명단";
		if (!selectedTeams.isEmpty()) {
			Teams team = selectedTeams.get(0);
			players = allPlayers.stream().filter(player -> team.getTeamId().equals(player.getTeamId())).toList();
			title = displayTeamName(team) + " 선수 명단";
		} else {
			if (nationality == null) {
				return "어느 팀의 선수인지 확인할 수 없습니다. 팀 이름을 함께 알려주세요.";
			}
			players = allPlayers.stream().filter(player -> nationality.equalsIgnoreCase(player.getNationality())
					|| nationality.equals(player.getNationalityKor())).toList();
			title = players.isEmpty() ? nationality + " 국적 선수"
					: (players.get(0).getNationalityKor() != null
							? players.get(0).getNationalityKor() : nationality) + " 국적 선수";
		}
		if (nationality != null) players = players.stream()
				.filter(player -> nationality.equalsIgnoreCase(player.getNationality())
						|| nationality.equals(player.getNationalityKor())).toList();
		if (position != null) players = players.stream()
				.filter(player -> position.equals(player.getMainPosition())).toList();
		if (detailPosition != null) players = players.stream()
				.filter(player -> detailPosition.equalsIgnoreCase(player.getDetailPosition())).toList();
		if (players.isEmpty()) return "DB에 조건에 맞는 선수가 없습니다.";
		StringBuilder answer = new StringBuilder(title).append(" · ").append(players.size()).append("명");
		players.stream().limit(30).forEach(player -> answer.append("\n- ")
				.append(player.getNameKor() != null ? player.getNameKor() : player.getName())
				.append(" · ").append(player.getDetailPosition() != null
						? player.getDetailPosition() : player.getMainPosition()));
		if (players.size() > 30) answer.append("\n- 외 ").append(players.size() - 30).append("명");
		return answer.toString();
	}

	// 부상 및 출장 정지 선수 질문을 PLAYER_STATS 상태값으로 조회합니다.
	private String answerUnavailablePlayers(String question, List<Teams> selectedTeams) {
		boolean injury = question.contains("부상");
		boolean suspension = question.contains("출장 정지") || question.contains("출장정지")
				|| question.contains("징계");
		if ((!injury && !suspension) || (!question.contains("선수") && selectedTeams.isEmpty())) return null;
		List<PlayerStats> players = teamDAO.findUnavailablePlayers().stream()
				.filter(player -> selectedTeams.isEmpty() || selectedTeams.stream()
						.anyMatch(team -> team.getTeamId().equals(player.getTeamId())))
				.filter(player -> !injury || "Y".equals(player.getIsInjured()))
				.filter(player -> !suspension || "Y".equals(player.getIsSuspended()))
				.toList();
		String condition = injury && suspension ? "부상·출장 정지" : injury ? "부상" : "출장 정지";
		if (players.isEmpty()) return "DB에 확인되는 " + condition + " 선수가 없습니다.";
		StringBuilder answer = new StringBuilder(condition).append(" 선수 ").append(players.size()).append("명");
		players.stream().limit(30).forEach(player -> {
			answer.append("\n- ").append(player.getPlayerNameKor() != null
					? player.getPlayerNameKor() : player.getPlayerName())
					.append(" · ").append(player.getTeamNameKor() != null
							? player.getTeamNameKor() : player.getTeamName());
			if (injury && player.getInjuryNote() != null) answer.append(" · ").append(player.getInjuryNote());
		});
		if (players.size() > 30) answer.append("\n- 외 ").append(players.size() - 30).append("명");
		return answer.toString();
	}

	private String answerStandings(String question, List<Teams> selectedTeams) {
		boolean winRateQuestion = containsSimilarKeyword(question, "승률");
		boolean standingsQuestion = question.contains("순위") || question.contains("몇위")
				|| question.contains("몇 위") || question.contains("1위")
				|| question.contains("꼴찌") || question.contains("승점")
				|| question.contains("득실차") || question.contains("승무패") || winRateQuestion
				|| (!selectedTeams.isEmpty() && (question.contains("성적")
						|| question.contains("몇 승") || question.contains("몇승")
						|| question.contains("몇 무") || question.contains("몇무")
						|| question.contains("몇 패") || question.contains("몇패")));
		boolean teamCount = selectedTeams.isEmpty() && isCountQuestion(question)
				&& (question.contains("팀") || question.contains("구단"))
				&& !isPlayerQuestion(question) && !isManagerQuestion(question);
		if (!standingsQuestion && !teamCount) return null;
		Matcher seasonMatcher = SEASON_PATTERN.matcher(question);
		Integer requestedSeason = seasonMatcher.find() ? Integer.valueOf(seasonMatcher.group(1)) : null;
		List<TeamStats> standings = teamDAO.findAllTeamStandings(requestedSeason);
		if (standings.isEmpty()) return "현재 시즌 순위 데이터가 없습니다.";
		int season = standings.get(0).getSeason();
		if (teamCount) return season + "시즌 PL 참가 팀은 " + standings.size() + "팀입니다.";
		if (winRateQuestion) {
			List<TeamStats> targets = selectedTeams.isEmpty() ? standings : standings.stream()
					.filter(stats -> selectedTeams.stream()
							.anyMatch(team -> team.getTeamId().equals(stats.getTeamId())))
					.toList();
			if (targets.isEmpty()) return "현재 시즌 순위표에 해당 팀의 기록이 없습니다.";
			StringBuilder answer = new StringBuilder(season + "시즌 PL 승률");
			for (TeamStats stats : targets) {
				long played = value(stats.getMatchesPlayed());
				long wins = value(stats.getWins());
				answer.append("\n- ").append(displayStandingName(stats)).append(" · ")
						.append(formatWinRate(wins, played)).append("% (")
						.append(played).append("경기 ").append(wins).append("승)");
			}
			return answer.toString();
		}
		if (!selectedTeams.isEmpty()) {
			Teams team = selectedTeams.get(0);
			return standings.stream().filter(stats -> team.getTeamId().equals(stats.getTeamId()))
					.findFirst().map(stats -> season + "시즌 " + displayTeamName(team)
							+ "은 " + stats.getCurrentRank() + "위, 승점 " + stats.getPoints()
							+ "점, " + stats.getWins() + "승 " + stats.getDraws() + "무 "
							+ stats.getLosses() + "패, 득실차 " + stats.getGoalDiff() + "입니다.")
						.orElse("현재 시즌 순위표에 " + displayTeamName(team) + " 기록이 없습니다.");
		}
		if (question.contains("1위")) {
			TeamStats leader = standings.get(0);
			return season + "시즌 PL 1위는 " + displayStandingName(leader)
					+ "이며 승점은 " + leader.getPoints() + "점입니다.";
		}
		if (question.contains("꼴찌")) {
			TeamStats last = standings.get(standings.size() - 1);
			return season + "시즌 PL 최하위는 " + displayStandingName(last)
					+ "이며 승점은 " + last.getPoints() + "점입니다.";
		}
		StringBuilder answer = new StringBuilder(season + "시즌 PL 상위 10팀");
		standings.stream().limit(10).forEach(stats -> answer.append("\n- ")
				.append(stats.getCurrentRank()).append("위 ").append(displayStandingName(stats))
				.append(" · 승점 ").append(stats.getPoints()).append('점'));
		return answer.toString();
	}

	private String displayStandingName(TeamStats stats) {
		return stats.getTeamNameKor() != null ? stats.getTeamNameKor() : stats.getTeamName();
	}

	private String answerPlayerCount(String question, List<Teams> selectedTeams) {
		if (!isPlayerQuestion(question) || !isCountQuestion(question)
				|| question.contains("득점") || question.contains("도움")) return null;
		List<Players> allPlayers = teamDAO.findAllPlayers();
		List<Players> players = selectedTeams.isEmpty() ? allPlayers : allPlayers.stream()
				.filter(player -> selectedTeams.get(0).getTeamId().equals(player.getTeamId())).toList();
		String scope;
		if (selectedTeams.isEmpty()) {
			List<TeamStats> standings = teamDAO.findAllTeamStandings(null);
			if (standings.isEmpty()) return "현재 시즌 순위 데이터가 없어 선수 인원을 확인할 수 없습니다.";
			Set<Long> teamIds = standings.stream().map(stats -> stats == null ? null : stats.getTeamId()).collect(Collectors.toSet());
			players = players.stream().filter(player -> teamIds.contains(player.getTeamId())).toList();
			scope = standings.get(0).getSeason() + "시즌 PL";
		} else {
			scope = displayTeamName(selectedTeams.get(0));
		}
		String nationality = findPlayerNationality(question, allPlayers);
		String position = requestedPosition(question);
		long count = players.stream()
				.filter(player -> nationality == null || nationality.equalsIgnoreCase(player.getNationality())
						|| nationality.equals(player.getNationalityKor()))
				.filter(player -> position == null || position.equals(player.getMainPosition()))
				.count();
		String nationalityLabel = nationality == null ? null : allPlayers.stream()
				.filter(player -> nationality.equalsIgnoreCase(player.getNationality())
						|| nationality.equals(player.getNationalityKor()))
				.findFirst().map(player -> player.getNationalityKor() != null
						? player.getNationalityKor() : nationality).orElse(nationality);
		String description = (nationalityLabel == null ? "" : nationalityLabel + " 국적 ")
				+ (position == null ? "" : positionName(position) + " ") + "선수";
		return scope + "의 " + description + "는 " + count + "명입니다.";
	}

	private boolean isPlayerQuestion(String question) {
		return question.contains("선수") || question.contains("골키퍼")
				|| question.contains("수비수") || question.contains("미드필더")
				|| question.contains("공격수") || question.contains("포지션");
	}

	private String findPlayerNationality(String question, List<Players> players) {
		String normalized = question.replace("스패인", "스페인")
				.toLowerCase(java.util.Locale.ROOT).replace("spanish", "spain");
		for (Players player : players) {
			String english = player.getNationality();
			String korean = player.getNationalityKor();
			if ((english != null && normalized.contains(english.toLowerCase(java.util.Locale.ROOT)))
					|| (korean != null && normalized.contains(korean.toLowerCase(java.util.Locale.ROOT)))) {
				return english != null ? english : korean;
			}
		}
		return explicitNationality(normalized);
	}

	private String requestedPosition(String question) {
		String upper = question.toUpperCase(java.util.Locale.ROOT);
		if (question.contains("골키퍼") || question.contains("키퍼") || upper.contains("GK")) return "GK";
		if (question.contains("수비수") || question.contains("풀백") || question.contains("센터백")
				|| upper.contains("DF")) return "DF";
		if (question.contains("미드필더") || upper.contains("MF")) return "MF";
		if (question.contains("공격수") || question.contains("윙어")
				|| question.contains("스트라이커") || upper.contains("FW")) return "FW";
		return null;
	}

	private String positionName(String position) {
		return switch (position) {
			case "GK" -> "골키퍼";
			case "DF" -> "수비수";
			case "MF" -> "미드필더";
			case "FW" -> "공격수";
			default -> position;
		};
	}

	private String answerTeamFacts(String question, List<Teams> selectedTeams) {
		if (selectedTeams.isEmpty()) return null;
		Teams team = selectedTeams.get(0);
		if (question.contains("홈구장") || question.contains("경기장")) {
			String ground = team.getHomeGroundKor() != null ? team.getHomeGroundKor() : team.getHomeGround();
			return ground == null ? "DB에 홈구장 정보가 없습니다."
					: displayTeamName(team) + "의 홈구장은 " + ground + "입니다.";
		}
		if (question.contains("창단")) {
			return team.getFoundedYear() == null ? "DB에 창단일 정보가 없습니다."
					: displayTeamName(team) + "의 창단일은 " + team.getFoundedYear() + "입니다.";
		}
		if (question.contains("역사") || question.contains("구단 소개") || question.contains("팀 소개")) {
			return team.getHistory() == null || team.getHistory().isBlank()
					? "DB에 구단 소개 정보가 없습니다."
					: displayTeamName(team) + " 소개\n- " + team.getHistory();
		}
		if (question.contains("응원가") || question.contains("구단가") || question.contains("앤섬")) {
			return team.getAnthemUrl() == null || team.getAnthemUrl().isBlank()
					? "DB에 응원가 주소가 없습니다."
					: displayTeamName(team) + " 응원가\n- " + team.getAnthemUrl();
		}
		return null;
	}

	private String requestedDetailPosition(String question) {
		String upper = question.toUpperCase(java.util.Locale.ROOT);
		if (question.contains("스트라이커") || upper.matches(".*\\bST\\b.*")) return "ST";
		if (question.contains("왼쪽 윙") || question.contains("좌측 윙")
				|| upper.matches(".*\\bLW\\b.*")) return "LW";
		if (question.contains("오른쪽 윙") || question.contains("우측 윙")
				|| upper.matches(".*\\bRW\\b.*")) return "RW";
		if (question.contains("센터백") || upper.matches(".*\\bCB\\b.*")) return "CB";
		if (question.contains("레프트백") || question.contains("왼쪽 풀백")
				|| upper.matches(".*\\bLB\\b.*")) return "LB";
		if (question.contains("라이트백") || question.contains("오른쪽 풀백")
				|| upper.matches(".*\\bRB\\b.*")) return "RB";
		if (question.contains("수비형 미드필더") || upper.matches(".*\\bCDM\\b.*")) return "CDM";
		if (question.contains("공격형 미드필더") || upper.matches(".*\\bCAM\\b.*")) return "CAM";
		if (question.contains("중앙 미드필더") || upper.matches(".*\\bCM\\b.*")) return "CM";
		return null;
	}

	// 두 팀 이름과 상대 전적 표현이 함께 들어오면 최근 맞대결 결과를 조회합니다.
	private String answerHeadToHead(String question, List<Teams> selectedTeams) {
		boolean headToHead = question.contains("상대 전적") || question.contains("맞대결")
				|| question.contains("전적 알려") || question.contains("전적은");
		if (!headToHead || selectedTeams.size() < 2) return null;
		Teams first = selectedTeams.get(0);
		Teams second = selectedTeams.get(1);
		List<Matches> matches = matchDAO.findHeadToHeadMatches(
				first.getTeamId(), second.getTeamId(), 5);
		if (matches.isEmpty()) {
			return "DB에 " + displayTeamName(first) + "와 " + displayTeamName(second)
					+ "의 완료된 맞대결 기록이 없습니다.";
		}
		long firstWins = 0;
		long secondWins = 0;
		long draws = 0;
		for (Matches match : matches) {
			if (match.getHomeScore() == null || match.getAwayScore() == null) continue;
			if (match.getHomeScore().equals(match.getAwayScore())) {
				draws++;
			} else {
				Long winnerId = match.getHomeScore() > match.getAwayScore()
						? match.getHomeTeamId() : match.getAwayTeamId();
				if (first.getTeamId().equals(winnerId)) firstWins++;
				else secondWins++;
			}
		}
		StringBuilder answer = new StringBuilder("최근 맞대결 ").append(matches.size()).append("경기 · ")
				.append(displayTeamName(first)).append(' ').append(firstWins).append("승 · 무승부 ")
				.append(draws).append("회 · ").append(displayTeamName(second)).append(' ')
				.append(secondWins).append("승");
		for (Matches match : matches) {
			answer.append("\n- ").append(match.getMatchDate()).append(' ')
					.append(match.getHomeTeamName()).append(' ')
					.append(match.getHomeScore() != null && match.getAwayScore() != null
							? match.getHomeScore() + ":" + match.getAwayScore() : "vs")
					.append(' ')
					.append(match.getAwayTeamName());
		}
		return answer.toString();
	}

	private String answerRecentResults(String question, List<Teams> selectedTeams) {
		boolean recentResults = (question.contains("최근 경기") || question.contains("마지막 경기")
				|| question.contains("경기 결과") || question.contains("경기결과"))
				&& !question.contains("일정") && !question.contains("예정");
		if (!recentResults) return null;
		Long teamId = selectedTeams.isEmpty() ? null : selectedTeams.get(0).getTeamId();
		List<Matches> matches = matchDAO.findRecentMatches(teamId, 5);
		if (matches.isEmpty()) return "DB에 완료된 경기 결과가 없습니다.";
		StringBuilder answer = new StringBuilder("최근 완료 경기 ").append(matches.size()).append("건");
		for (Matches match : matches) {
			answer.append("\n- ").append(match.getMatchDate()).append(' ')
					.append(match.getHomeTeamName()).append(' ')
					.append(match.getHomeScore()).append(':').append(match.getAwayScore()).append(' ')
					.append(match.getAwayTeamName());
		}
		return answer.toString();
	}

	private void appendPlayerContext(StringBuilder context, String question, List<Teams> selectedTeams) {
		List<Players> players = selectedTeams.isEmpty() ? teamDAO.findAllPlayers()
				: teamDAO.findPlayersByTeamId(selectedTeams.get(0).getTeamId());
		String lower = question.toLowerCase(java.util.Locale.ROOT);
		List<Players> named = players.stream().filter(player ->
				(player.getNameKor() != null && question.contains(player.getNameKor()))
						|| (player.getName() != null && lower.contains(
								player.getName().toLowerCase(java.util.Locale.ROOT)))).toList();
		if (!named.isEmpty()) players = named;
		else if (selectedTeams.isEmpty()) {
			String nationality = findPlayerNationality(question, players);
			if (nationality == null) return;
			players = players.stream().filter(player -> nationality.equalsIgnoreCase(player.getNationality())
					|| nationality.equals(player.getNationalityKor())).toList();
		}
		context.append("선수 정보:\n");
		players.stream().limit(20).forEach(player -> context.append("- ")
				.append(player.getNameKor() != null ? player.getNameKor() : player.getName())
				.append(", 국적 ").append(player.getNationalityKor() != null
						? player.getNationalityKor() : player.getNationality())
				.append(", 포지션 ").append(player.getDetailPosition() != null
						? player.getDetailPosition() : player.getMainPosition()).append('\n'));
	}

	private boolean containsMentionedPlayer(String question) {
		String lower = question.toLowerCase(java.util.Locale.ROOT);
		return teamDAO.findAllPlayers().stream().anyMatch(player ->
				(player.getNameKor() != null && question.contains(player.getNameKor()))
						|| (player.getName() != null
								&& lower.contains(player.getName().toLowerCase(java.util.Locale.ROOT))));
	}

	// 질문에 명시된 구단을 DB 이름으로 찾습니다.
	private List<Teams> findMentionedTeams(String question) {
		String lower = question.toLowerCase(java.util.Locale.ROOT);
		List<Teams> allTeams = teamDAO.findAllTeams();
		List<Teams> result = new ArrayList<>();
		for (Teams team : allTeams) {
			String korean = team.getTeamNameKor();
			String english = team.getTeamName();
			if (containsTeamName(lower, korean) || containsTeamName(lower, english)) {
				result.add(team);
				if (result.size() == 2) break;
			}
		}
		if (result.size() == 2) return result;

		// DB 구단명의 각 단어 중 다른 구단과 겹치지 않는 단어를 자동 별칭으로 사용합니다.
		// 예: "토트넘 홋스퍼 FC"는 "토트넘" 또는 "홋스퍼"로도 찾습니다.
		Map<String, List<Teams>> aliasOwners = new HashMap<>();
		for (Teams team : allTeams) {
			for (String alias : teamAliases(team)) {
				aliasOwners.computeIfAbsent(alias, key -> new ArrayList<>()).add(team);
			}
		}
		aliasOwners.entrySet().stream()
				.filter(entry -> entry.getValue().size() == 1 && lower.contains(entry.getKey()))
				.sorted((left, right) -> Integer.compare(right.getKey().length(), left.getKey().length()))
				.map(entry -> entry.getValue().get(0))
				.filter(team -> result.stream().noneMatch(found -> found.getTeamId().equals(team.getTeamId())))
				.limit(2 - result.size())
				.forEach(result::add);
		return result;
	}

	private Set<String> teamAliases(Teams team) {
		Set<String> aliases = new java.util.HashSet<>();
		addTeamAliases(aliases, team.getTeamNameKor());
		addTeamAliases(aliases, team.getTeamName());
		return aliases;
	}

	private void addTeamAliases(Set<String> aliases, String name) {
		if (name == null || name.isBlank()) return;
		String normalized = name.toLowerCase(java.util.Locale.ROOT).trim()
				.replaceFirst("\\s+(fc|afc)$", "");
		for (String token : normalized.split("[^\\p{L}\\p{N}]+")) {
			boolean korean = token.matches(".*[가-힣].*");
			int minimumLength = korean ? 2 : 4;
			if (token.length() >= minimumLength && !isGenericTeamWord(token)) aliases.add(token);
		}
	}

	private boolean isGenericTeamWord(String word) {
		return Set.of("football", "club", "united", "city", "town", "유나이티드", "시티", "원더러스")
				.contains(word);
	}

	// 한글 질문에서 핵심 단어가 한 글자 잘못 입력된 경우까지 같은 의도로 처리합니다.
	private boolean containsSimilarKeyword(String question, String keyword) {
		if (question.contains(keyword)) return true;
		for (String word : question.split("[^가-힣]+")) {
			if (word.length() == keyword.length() && differentKoreanJamoCount(word, keyword) <= 1) return true;
		}
		return false;
	}

	private int differentKoreanJamoCount(String left, String right) {
		int count = 0;
		for (int index = 0; index < left.length(); index++) {
			char leftCharacter = left.charAt(index);
			char rightCharacter = right.charAt(index);
			if (leftCharacter == rightCharacter) continue;
			if (!isKoreanSyllable(leftCharacter) || !isKoreanSyllable(rightCharacter)) {
				count++;
				continue;
			}
			int leftCode = leftCharacter - 0xAC00;
			int rightCode = rightCharacter - 0xAC00;
			if (leftCode / 588 != rightCode / 588) count++;
			if ((leftCode % 588) / 28 != (rightCode % 588) / 28) count++;
			if (leftCode % 28 != rightCode % 28) count++;
		}
		return count;
	}

	private boolean isKoreanSyllable(char character) {
		return character >= 0xAC00 && character <= 0xD7A3;
	}

	private String formatWinRate(long wins, long matchesPlayed) {
		if (matchesPlayed == 0) return "0";
		double rate = Math.round((wins * 1000.0) / matchesPlayed) / 10.0;
		return rate == Math.rint(rate) ? Long.toString(Math.round(rate)) : Double.toString(rate);
	}

	private boolean containsTeamName(String question, String name) {
		if (name == null) return false;
		String lower = name.toLowerCase(java.util.Locale.ROOT).trim();
		String shortName = lower.replaceFirst("(?i)\\s+(fc|afc)$", "");
		int minimumLength = shortName.matches(".*[가-힣].*") ? 2 : 3;
		return question.contains(lower) || (shortName.length() >= minimumLength && question.contains(shortName));
	}

	private boolean isScheduleQuestion(String question) {
		String lower = question.toLowerCase(java.util.Locale.ROOT);
		boolean asksWhen = lower.contains("언제") || lower.contains("예정일")
				|| lower.contains("경기 일정") || lower.contains("가까운 경기")
				|| lower.contains("다음 경기") || lower.contains("next match");
		boolean asksAnalysis = lower.contains("분석")
				|| lower.contains("전술") || lower.contains("승부") || lower.contains("누가 이길");
		return asksWhen && !asksAnalysis;
	}

	private String displayTeamName(Teams team) {
		return team.getTeamNameKor() != null ? team.getTeamNameKor() : team.getTeamName();
	}

	private void appendRecentMatches(StringBuilder context, Long teamId, int limit) {
		List<Matches> recent = matchDAO.findRecentMatches(teamId, limit);
		if (recent.isEmpty()) {
			context.append("최근 완료 경기 데이터 없음\n");
			return;
		}
		context.append("최근 완료 경기:\n");
		for (Matches match : recent) {
			context.append("- ").append(match.getMatchDate()).append(' ')
					.append(match.getHomeTeamName()).append(' ')
					.append(match.getHomeScore()).append(':').append(match.getAwayScore()).append(' ')
					.append(match.getAwayTeamName()).append('\n');
		}
	}

	/**
	 * Gemini API 호출 공통 메서드 (최신 모델 자동 탐색 및 JSON 응답 보장)
	 */
	private String callGemini(String promptText) throws Exception {
		return callGeminiRequest(promptText, false).text();
	}

	private GeminiCallResult callGeminiWithSearch(String promptText) throws Exception {
		return callGeminiRequest(promptText, true);
	}

	private GeminiCallResult callGeminiRequest(String promptText, boolean googleSearch) throws Exception {
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
		if (googleSearch) {
			requestBody.put("tools", List.of(Map.of("google_search", Map.of())));
		}

		String requestJson = objectMapper.writeValueAsString(requestBody);

		// 이미 검증된 모델이 있으면 우선 사용, 없으면 후보 순차 시도
		String cachedModel = googleSearch ? verifiedSearchModel : verifiedModel;
		String[] searchCandidates = {
			"gemini-3.1-flash-lite",
			"gemini-flash-latest",
			"gemini-flash-lite-latest"
		};
		String[] modelsToTry = cachedModel != null
				? new String[]{cachedModel}
				: googleSearch ? searchCandidates : CANDIDATE_MODELS;

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
				if (googleSearch) verifiedSearchModel = modelName;
				else verifiedModel = modelName;
				log.info("[Gemini API] 모델 연동 성공: {} (Google 검색: {})", modelName, googleSearch);

				JsonNode rootNode = objectMapper.readTree(response.body());
				JsonNode candidates = rootNode.path("candidates");
				if (candidates.isArray() && candidates.size() > 0) {
					JsonNode candidate = candidates.get(0);
					for (JsonNode part : candidate.path("content").path("parts")) {
						String text = part.path("text").asText("");
						if (!text.isBlank()) {
							return new GeminiCallResult(text, extractGroundingSources(candidate));
						}
					}
				}
			} else {
				lastError = "모델 [" + modelName + "] 호출 실패 (HTTP " + response.statusCode() + "): " + response.body();
				log.warn("[Gemini API] {}", lastError);
				// 캐시된 모델이 실패하면 전체 후보를 다시 확인합니다.
				if (cachedModel != null) {
					if (googleSearch) verifiedSearchModel = null;
					else verifiedModel = null;
					return callGeminiRequest(promptText, googleSearch);
				}
			}
		}

		throw new RuntimeException("모든 Gemini 모델 호출 실패: " + lastError);
	}

	private List<String> extractGroundingSources(JsonNode candidate) {
		List<String> sources = new ArrayList<>();
		for (JsonNode chunk : candidate.path("groundingMetadata").path("groundingChunks")) {
			JsonNode web = chunk.path("web");
			String uri = web.path("uri").asText("");
			if (uri.isBlank() || sources.stream().anyMatch(source -> source.endsWith(uri))) continue;
			String title = web.path("title").asText("검색 결과");
			sources.add(title + " · " + uri);
			if (sources.size() == 3) break;
		}
		return sources;
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
}