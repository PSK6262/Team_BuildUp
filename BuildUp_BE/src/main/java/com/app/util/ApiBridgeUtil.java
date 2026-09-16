package com.app.util;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.app.dto.team.Players;
import com.app.dto.team.Teams;

/**
 * [API 연결 유틸리티 - ApiBridgeUtil]
 * 
 * 외부 축구 API(Big Balls Data 등)와 내부 DB(football-data.org 기준 마스터) 사이의
 * 구단명, 선수명, 이벤트 유형을 안전하고 직관적으로 연결해주는 브릿지 유틸리티 클래스입니다.
 */
public class ApiBridgeUtil {

    // EPL 20개 대표 구단 기본 매핑 테이블 (외부 API 구단명 약칭/풀네임 -> 우리 DB TEAM_ID)
    private static final Map<String, Long> CANONICAL_TEAM_MAP = new HashMap<>();

    static {
        // 주요 프리미어리그 팀 ID 매핑 (football-data.org 표준 ID)
        CANONICAL_TEAM_MAP.put("arsenal", 57L);
        CANONICAL_TEAM_MAP.put("aston villa", 58L);
        CANONICAL_TEAM_MAP.put("chelsea", 61L);
        CANONICAL_TEAM_MAP.put("everton", 62L);
        CANONICAL_TEAM_MAP.put("fulham", 63L);
        CANONICAL_TEAM_MAP.put("liverpool", 64L);
        CANONICAL_TEAM_MAP.put("manchester city", 65L);
        CANONICAL_TEAM_MAP.put("man city", 65L);
        CANONICAL_TEAM_MAP.put("manchester united", 66L);
        CANONICAL_TEAM_MAP.put("man utd", 66L);
        CANONICAL_TEAM_MAP.put("newcastle united", 67L);
        CANONICAL_TEAM_MAP.put("newcastle", 67L);
        CANONICAL_TEAM_MAP.put("tottenham hotspur", 73L);
        CANONICAL_TEAM_MAP.put("tottenham", 73L);
        CANONICAL_TEAM_MAP.put("spurs", 73L);
        CANONICAL_TEAM_MAP.put("wolverhampton wanderers", 76L);
        CANONICAL_TEAM_MAP.put("wolverhampton", 76L);
        CANONICAL_TEAM_MAP.put("wolves", 76L);
        CANONICAL_TEAM_MAP.put("bournemouth", 1044L);
        CANONICAL_TEAM_MAP.put("afc bournemouth", 1044L);
        CANONICAL_TEAM_MAP.put("brighton & hove albion", 397L);
        CANONICAL_TEAM_MAP.put("brighton", 397L);
        CANONICAL_TEAM_MAP.put("brentford", 402L);
        CANONICAL_TEAM_MAP.put("west ham united", 563L);
        CANONICAL_TEAM_MAP.put("west ham", 563L);
        CANONICAL_TEAM_MAP.put("crystal palace", 354L);
        CANONICAL_TEAM_MAP.put("nottingham forest", 351L);
        CANONICAL_TEAM_MAP.put("nottingham", 351L);
        CANONICAL_TEAM_MAP.put("leicester city", 338L);
        CANONICAL_TEAM_MAP.put("leicester", 338L);
        CANONICAL_TEAM_MAP.put("southampton", 340L);
        CANONICAL_TEAM_MAP.put("ipswich town", 349L);
        CANONICAL_TEAM_MAP.put("ipswich", 349L);
    }

    /**
     * 1. 경기 내 홈/원정 구단 우선 판별 (가장 안전하고 빠른 매칭)
     * 
     * 경기 이벤트는 원칙적으로 해당 경기의 홈팀 또는 원정팀에서만 발생하므로,
     * 리그 전체 20개 구단을 뒤지기 전에 대상 경기의 2개 구단을 우선 대조하여
     * 구단명 중복(United, City 등)으로 인한 오매칭을 원천 방지합니다.
     */
    public static Long resolveMatchTeam(String rawTeamName, Teams homeTeam, Teams awayTeam, List<Teams> allTeams) {
        if (rawTeamName == null || rawTeamName.isBlank()) {
            return null;
        }

        String normalizedInput = cleanTeamName(rawTeamName);

        // 1단계: 홈팀 / 원정팀과 완전 일치(equals) 대조
        if (homeTeam != null && homeTeam.getTeamName() != null) {
            String homeNorm = cleanTeamName(homeTeam.getTeamName());
            if (homeNorm.equals(normalizedInput)) return homeTeam.getTeamId();
        }
        if (awayTeam != null && awayTeam.getTeamName() != null) {
            String awayNorm = cleanTeamName(awayTeam.getTeamName());
            if (awayNorm.equals(normalizedInput)) return awayTeam.getTeamId();
        }

        // 2단계: 홈팀 / 원정팀과 부분 일치(contains) 대조
        if (homeTeam != null && homeTeam.getTeamName() != null) {
            String homeNorm = cleanTeamName(homeTeam.getTeamName());
            if (homeNorm.contains(normalizedInput) || normalizedInput.contains(homeNorm)) return homeTeam.getTeamId();
        }
        if (awayTeam != null && awayTeam.getTeamName() != null) {
            String awayNorm = cleanTeamName(awayTeam.getTeamName());
            if (awayNorm.contains(normalizedInput) || normalizedInput.contains(awayNorm)) return awayTeam.getTeamId();
        }

        // 3단계: 홈/원정 모두 불일치 시 리그 전체 구단 대상 2-Pass 매칭
        return mapTeamToId(rawTeamName, allTeams);
    }

    /**
     * 2. 외부 API 구단명 -> 우리 DB TEAM_ID 2-Pass 매핑
     * 
     * [2-Pass 안전장치]:
     * - 1차 패스: 완전 일치(equals) 우선 조사 (United, City 등 중복 단어 오매칭 방지)
     * - 2차 패스: 부분 포함(contains) 조사
     * 
     * @param rawTeamName 외부 API에서 전달받은 구단명
     * @param dbTeams DB에 저장된 전체 구단 목록 (승격팀 동적 감지용)
     * @return 매칭된 구단 ID (없으면 null)
     */
    public static Long mapTeamToId(String rawTeamName, List<Teams> dbTeams) {
        if (rawTeamName == null || rawTeamName.isBlank()) {
            return null;
        }

        String normalizedInput = cleanTeamName(rawTeamName);

        // [Pass 1 - 완전 일치 우선]
        // 1-1. DB 구단명 완전 일치 (새 시즌 승격팀 우선 반영)
        if (dbTeams != null && !dbTeams.isEmpty()) {
            for (Teams t : dbTeams) {
                if (t.getTeamName() == null) continue;
                String normalizedDb = cleanTeamName(t.getTeamName());
                if (normalizedDb.equals(normalizedInput)) {
                    return t.getTeamId();
                }
            }
        }

        // 1-2. 표준 구단 맵 완전 일치
        if (CANONICAL_TEAM_MAP.containsKey(normalizedInput)) {
            return CANONICAL_TEAM_MAP.get(normalizedInput);
        }

        // [Pass 2 - 부분 일치 조사 (완전 일치가 없을 때만 동작)]
        // 2-1. DB 구단명 부분 포함
        if (dbTeams != null && !dbTeams.isEmpty()) {
            for (Teams t : dbTeams) {
                if (t.getTeamName() == null) continue;
                String normalizedDb = cleanTeamName(t.getTeamName());
                if (normalizedDb.contains(normalizedInput) || normalizedInput.contains(normalizedDb)) {
                    return t.getTeamId();
                }
            }
        }

        // 2-2. 표준 구단 맵 부분 포함
        for (Map.Entry<String, Long> entry : CANONICAL_TEAM_MAP.entrySet()) {
            if (normalizedInput.contains(entry.getKey()) || entry.getKey().contains(normalizedInput)) {
                return entry.getValue();
            }
        }

        return null;
    }

    /**
     * 2. 외부 API 선수명 -> 우리 DB PLAYER_ID 매핑
     * 
     * [단순화 핵심 원칙]:
     * 전체 선수를 검색하지 않고, 이미 정해진 해당 구단 소속 선수단(25명 안팎) 내에서만 성(Last Name)을 대조합니다.
     * 
     * @param rawPlayerName 외부 API 이벤트에 기록된 선수 이름 (예: "Bukayo Saka", "B. Saka", "Saka")
     * @param teamPlayers 해당 구단에 등록된 선수 목록 (최대 25~30명)
     * @return 매칭된 선수 ID (없을 경우 null)
     */
    public static Long findPlayerIdByName(String rawPlayerName, List<Players> teamPlayers) {
        if (rawPlayerName == null || rawPlayerName.isBlank() || teamPlayers == null || teamPlayers.isEmpty()) {
            return null;
        }

        String cleanInput = normalizeText(rawPlayerName);
        String inputLastName = extractLastName(cleanInput);

        // 1단계: 풀네임 정확히 일치
        for (Players p : teamPlayers) {
            if (p.getName() == null) continue;
            String cleanDbName = normalizeText(p.getName());
            if (cleanDbName.equalsIgnoreCase(cleanInput)) {
                return p.getPlayerId();
            }
        }

        // 2단계: 성(Last Name) 일치 (예: "Saka", "Rice", "Havertz")
        if (!inputLastName.isBlank() && inputLastName.length() >= 3) {
            for (Players p : teamPlayers) {
                if (p.getName() == null) continue;
                String dbLastName = extractLastName(normalizeText(p.getName()));
                if (dbLastName.equalsIgnoreCase(inputLastName)) {
                    return p.getPlayerId();
                }
            }
        }

        // 3단계: 복합 성(Dewsbury-Hall vs Dewsbury Hall, Alexander-Arnold) 및 이니셜(K. Dewsbury-Hall) 특화 매칭
        String surnamePart = extractSurnameForMatching(cleanInput);
        String simplifiedInput = simplifyAlphaNumeric(cleanInput);

        for (Players p : teamPlayers) {
            if (p.getName() == null) continue;
            String simplifiedDb = simplifyAlphaNumeric(p.getName());

            if (!surnamePart.isBlank() && surnamePart.length() >= 3 && simplifiedDb.contains(surnamePart)) {
                return p.getPlayerId();
            }
            if (!simplifiedInput.isBlank() && simplifiedInput.length() >= 3 && 
                (simplifiedDb.contains(simplifiedInput) || simplifiedInput.contains(simplifiedDb))) {
                return p.getPlayerId();
            }
        }

        // 4단계: 부분 문자열 포함 (예: "Martinelli" in "Gabriel Martinelli")
        for (Players p : teamPlayers) {
            if (p.getName() == null) continue;
            String cleanDbName = normalizeText(p.getName());
            if ((!inputLastName.isBlank() && cleanDbName.contains(inputLastName)) || 
                (!cleanInput.isBlank() && cleanInput.contains(cleanDbName))) {
                return p.getPlayerId();
            }
        }

        return null;
    }

    /**
     * 선수명에서 이니셜("K. ", "T. ")을 제외한 성(Surname) 핵심 부분 추출 (하이픈/공백 제거)
     * 예: "K. Dewsbury-Hall" -> "dewsburyhall"
     */
    private static String extractSurnameForMatching(String name) {
        if (name == null || name.isBlank()) return "";
        String withoutInitial = name.trim().replaceFirst("^[a-zA-Z][\\.\\s]+", "");
        return simplifyAlphaNumeric(withoutInitial);
    }

    /**
     * 모든 공백 및 특수문자(하이픈, 점 등)를 제거하여 순수 알파벳+숫자만 추출
     */
    private static String simplifyAlphaNumeric(String text) {
        if (text == null) return "";
        String norm = normalizeText(text);
        return norm.replaceAll("[^a-z0-9]", "");
    }

    /**
     * 3. 외부 API 이벤트 문자열 -> 우리 DB EVENT_TYPE_CODE 매핑
     * 
     * EVENT_TYPE 마스터 코드 정의:
     * 1: 골
     * 2: 페널티킥 골
     * 3: 자책골
     * 4: 경고 (옐로카드)
     * 5: 경고 누적 퇴장
     * 6: 퇴장 (레드카드)
     * 7: 교체
     * 8: 페널티킥 실축
     * 
     * @param rawEventType 외부 API에서 내려온 이벤트 유형 (예: "goal", "yellow_card", "sub")
     * @return 매핑된 EVENT_TYPE_CODE (기본값: 1L - 골)
     */
    public static Long mapEventTypeToCode(String rawEventType) {
        if (rawEventType == null || rawEventType.isBlank()) {
            return 1L;
        }

        String type = rawEventType.toLowerCase(Locale.ROOT).trim();

        // 1. 자책골 (Own Goal) -> 3번
        if (type.contains("own_goal") || type.contains("own goal") || type.contains("og") || type.contains("own") || type.equals("자책골")) {
            return 3L;
        }
        // 2. 페널티킥 득점 (PK Goal) -> 2번
        if (type.contains("penalty_goal") || type.contains("pk_goal") || type.equals("penalty") || type.equals("페널티킥 골")) {
            return 2L;
        }
        // 3. 페널티킥 실축 (Missed Penalty) -> 8번
        if (type.contains("missed_penalty") || type.contains("penalty_missed") || type.equals("페널티킥 실축")) {
            return 8L;
        }
        // 4. 경고 누적 퇴장 (옐로카드 2회) -> 5번
        if (type.contains("second_yellow") || type.contains("yellow_red") || type.equals("경고 누적 퇴장")) {
            return 5L;
        }
        // 5. 경고 (옐로카드) -> 4번
        if (type.contains("yellow") || type.contains("booking") || type.equals("경고") || type.equals("옐로카드")) {
            return 4L;
        }
        // 6. 퇴장 (다이렉트 레드카드) -> 6번
        if (type.contains("red") || type.contains("dismissal") || type.equals("퇴장") || type.equals("레드카드")) {
            return 6L;
        }
        // 7. 선수 교체 (Substitution) -> 7번
        if (type.contains("sub") || type.contains("substitution") || type.equals("교체")) {
            return 7L;
        }
        // 8. 일반 필드골 (기본값) -> 1번
        return 1L;
    }

    // --- 보조 유틸리티 메소드 ---

    /**
     * 구단명 정규화 (FC, AFC 제거, 특수문자 제거, 소문자화)
     */
    private static String cleanTeamName(String name) {
        String clean = normalizeText(name);
        return clean.replaceAll("\\bfc\\b", "")
                    .replaceAll("\\bafc\\b", "")
                    .replaceAll("[^a-z0-9 ]", "")
                    .replaceAll("\\s+", " ")
                    .trim();
    }

    /**
     * 영문 성(Last Name) 추출 (마지막 단어)
     */
    private static String extractLastName(String name) {
        if (name == null || name.isBlank()) return "";
        String[] parts = name.trim().split("\\s+");
        return parts[parts.length - 1];
    }

    /**
     * 악센트 제거 및 알파벳 소문자 정규화 (Ø -> O, é -> e 등)
     */
    private static String normalizeText(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                         .replace("ø", "o")
                         .replace("Ø", "O")
                         .toLowerCase(Locale.ROOT)
                         .trim();
    }
}
