package com.app.dto.community;

// 게시판 조회 범위를 구분합니다.
public enum CommunityBoardType {
    ALL,
    FREE,
    TEAM;

    // 요청값을 게시판 종류로 변환합니다.
    public static CommunityBoardType fromValue(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Board type is required");
        }
        String board = value.trim();

        // 대소문자와 관계없이 게시판 종류를 확인합니다.
        if ("all".equalsIgnoreCase(board)) {
            return ALL;
        }
        if ("free".equalsIgnoreCase(board)) {
            return FREE;
        }
        if ("team".equalsIgnoreCase(board)) {
            return TEAM;
        }

        throw new IllegalArgumentException("Invalid board type");
    }

    // 자유 게시판 조회 여부를 반환합니다.
    public boolean isFree() {
        return this == FREE;
    }

    // 팀별 게시판 조회 여부를 반환합니다.
    public boolean isTeam() {
        return this == TEAM;
    }
}
