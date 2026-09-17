package com.app.service.api;

import java.util.List;
import com.app.dto.match.MatchEvents;

public interface BigBallsApiService {

    /**
     * 외부 Big Balls Data API에서 경기 이벤트 JSON 문자열을 직접 호출
     * @param externalMatchId Big Balls Data의 match ID (예: "bb_match_xxx" 등)
     * @return 원본 JSON 응답 문자열
     */
    String fetchMatchEventsRaw(String externalMatchId);

    /**
     * Big Balls Data 경기 ID를 명시하여 우리 DB MATCH_EVENTS에 동기화
     * @param matchId 우리 DB의 MATCH_ID
     * @param externalMatchId Big Balls Data의 경기 ID
     * @return 저장된 이벤트 건수
     */
    int syncMatchEvents(Long matchId, String externalMatchId);

    /**
     * 우리 DB의 MATCH_ID를 기반으로 경기 정보(날짜, 홈팀, 원정팀)를 조회하여
     * Big Balls Data에서 자동으로 대진을 검색하고 이벤트를 동기화
     * @param matchId 우리 DB의 MATCH_ID
     * @return 저장된 이벤트 건수
     */
    int syncMatchEventsAuto(Long matchId);

    /**
     * 우리 DB에 저장된 특정 경기의 타임라인 이벤트 목록 조회
     * @param matchId 우리 DB의 MATCH_ID
     * @return 이벤트 리스트 (시간순 정렬)
     */
    List<MatchEvents> getMatchEvents(Long matchId);

    /**
     * DB에 등록된 모든 종료(FINISHED) 경기의 타임라인 이벤트 일괄 동기화
     * @return 일괄 저장된 총 이벤트 건수
     */
    int syncAllFinishedMatchEvents();

    /**
     * 특정 일자(YYYY-MM-DD)에 치러진 경기들의 타임라인 이벤트 일괄 동기화
     * @param dateStr "YYYY-MM-DD" 형태 일자
     * @return 일괄 저장된 총 이벤트 건수
     */
    int syncMatchEventsByDate(String dateStr);
}
