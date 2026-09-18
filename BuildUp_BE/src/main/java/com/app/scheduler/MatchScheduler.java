package com.app.scheduler;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.app.dto.match.Matches;
import com.app.service.api.BigBallsApiService;
import com.app.service.api.FootballApiService;
import com.app.service.match.MatchService;

import lombok.extern.slf4j.Slf4j;

/**
 * [축구 데이터 자동 동기화 스케줄러 - MatchScheduler]
 * 
 * 1. 실시간 경기 스코어 모니터링: 2분 간격 (오늘 경기가 진행 중일 때만 동작)
 * 2. 일일 순위표 및 득점 순위 갱신: 매일 새벽 5시 1회 정기 실행
 * 3. 서버 기동 시 초기화: 기동 3초 후 순위표/득점왕 1회 자동 동기화
 */
@Slf4j
@Component
public class MatchScheduler {

	@Autowired
	private MatchService matchService;

	@Autowired
	private FootballApiService footballApiService;

	@Autowired
	private BigBallsApiService bigBallsApiService;

     //  [작업 1] 실시간 경기 스코어 및 타임라인 이벤트 동기화
     //  주기: 매 2분마다 실행 (0 */2 * * * *)
     //  기준: 오늘 날짜에 진행 중이거나 열릴 예정인 경기가 있을 때만 외부 API 호출
    @Scheduled(cron = "0 */2 * * * *")
    public void syncLiveMatches() {
        LocalDate today = LocalDate.now();

        // 1단계: 최근 3시간 전부터 오늘(23:59:59)까지 열리는 경기 목록 조회 (자정 전후 경기 누락 방지)
        LocalDateTime startWindow = LocalDateTime.now().minusHours(3);
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
        List<Matches> todayMatches = matchService.getMatchesByDateRange(startWindow, endOfDay);

        // 경기가 없는 날이면 즉시 종료 (외부 API 호출 한도 낭비 방지)
        if (todayMatches == null || todayMatches.isEmpty()) {
            return;
        }

        // 2단계: 아직 종료되지 않은 경기(SCHEDULED 또는 LIVE)가 있는지 확인
        boolean hasActiveMatch = false;
        for (Matches m : todayMatches) {
            String status = m.getStatus();
            if ("SCHEDULED".equals(status) || "LIVE".equals(status)) {
                hasActiveMatch = true;
                break;
            }
        }

        // 오늘 경기가 모두 이미 종료(FINISHED)되었으면 API 호출 없이 종료
        if (!hasActiveMatch) {
            return;
        }

        // 3단계: 진행 중인 경기가 있으므로 오늘 경기 최신 스코어 동기화 (football-data.org)
        System.out.println("======================================================================");
        System.out.println("[BuildUp 스케줄러] 진행 중인 경기 감지 -> 실시간 스코어/이벤트 동기화 (기준일: " + today + ")");
        System.out.println("----------------------------------------------------------------------");
        try {
            int updatedMatches = footballApiService.syncMatchesByDate(today);
            System.out.println("  - 스코어 갱신: 총 " + updatedMatches + "개 경기 갱신 완료");
        } catch (Exception e) {
            System.err.println("  - 스코어 갱신 중 오류: " + e.getMessage());
        }

        // 4단계: 방금 종료된 경기의 타임라인 이벤트(골, 자책골 등) 1회 수집 (Big Balls Data)
        try {
            int updatedEvents = bigBallsApiService.syncMatchEventsByDate(today.toString());
            // 새벽 0시~6시 시간대라면 어제 늦은 밤 시작해 방금 끝난 경기 이벤트도 함께 안전 수집
            if (LocalTime.now().getHour() < 6) {
                updatedEvents += bigBallsApiService.syncMatchEventsByDate(today.minusDays(1).toString());
            }
            System.out.println("  - 이벤트 갱신: 총 " + updatedEvents + "건의 타임라인 이벤트 동기화 완료");
        } catch (Exception e) {
            System.err.println("  - 이벤트 갱신 중 오류: " + e.getMessage());
        }
        System.out.println("======================================================================");
    }

    /**
     * [작업 2] 일일 리그 순위표 및 개인 득점 순위 갱신
     * - 주기: 매일 새벽 5시 정기 실행 (0 0 5 * * *)
     * - 기준: 당일 모든 경기가 끝난 새벽 시간대에 하루 1회 일괄 갱신
     */
    @Scheduled(cron = "0 0 5 * * *")
    public void syncDailyStandings() {
        System.out.println("======================================================================");
        System.out.println("[BuildUp 스케줄러] 정기 순위표 및 득점 순위 일괄 갱신 시작");
        System.out.println("----------------------------------------------------------------------");

        // 1단계: 프리미어리그 최신 시즌 순위표 동기화
        try {
            int standingsCount = footballApiService.syncPremierLeagueStandings(null);
            System.out.println("  - 순위표 갱신: 총 " + standingsCount + "개 구단 성적 적재 완료");
        } catch (Exception e) {
            System.err.println("  - 순위표 갱신 중 오류: " + e.getMessage());
        }

        // 2단계: 프리미어리그 개인 득점 순위(상위 50명) 동기화
        try {
            int scorersCount = footballApiService.syncPremierLeagueScorers(50);
            System.out.println("  - 득점왕 갱신: 총 " + scorersCount + "명의 득점/도움 통계 적재 완료");
        } catch (Exception e) {
            System.err.println("  - 득점왕 갱신 중 오류: " + e.getMessage());
        }
        System.out.println("======================================================================");
    }

    private boolean initialized = false;

    /**
     * [작업 3] 서버(Tomcat) 구동 시 1회 자동 실행
     * - 새벽 5시에 컴퓨터가 꺼져 있어 스케줄을 놓치더라도, 서버가 켜질 때 최신 상태로 맞춰줍니다.
     * - API 호출: 순위표(1회) + 득점왕(1회) = 총 2회만 호출하므로 분당 10회 쿼터에 전혀 무리가 없습니다.
     * - 서버 부팅 속도에 지장을 주지 않도록 백그라운드 비동기로 3초 후 실행됩니다.
     */
    @EventListener(ContextRefreshedEvent.class)
    public void onApplicationReady(ContextRefreshedEvent event) {
        // 스프링 루트 컨텍스트에서 중복 없이 딱 1번만 실행
        if (event.getApplicationContext().getParent() == null && !initialized) {
            initialized = true;

            // 메인 톰캣 부팅 흐름을 방해하지 않도록 별도 백그라운드 스레드로 실행
            Thread initThread = new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        // 톰캣 기동 완료 후 3초 대기 (DB 커넥션 풀 및 스프링 빈 안정화 후 실행)
                        Thread.sleep(3000);
                        System.out.println("======================================================================");
                        System.out.println("[BuildUp 스케줄러] 서버 구동 감지 -> 초기 순위표 및 득점 순위 1회 동기화");
                        System.out.println("======================================================================");
                        syncDailyStandings();
                    } catch (Exception e) {
                        System.err.println("  [BuildUp 스케줄러] 초기 동기화 중 오류 발생: " + e.getMessage());
                    }
                }
            });

            // 스레드 이름 부여 후 시작
            initThread.setName("BuildUp-Init-Scheduler-Thread");
            initThread.start();
        }
    }
}
