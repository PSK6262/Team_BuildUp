# Team_BuildUp

## 가상 대결 랭킹 DB 적용

기존 DB에서는 서버 배포 전에 아래 SQL을 한 번 실행합니다. AI 생성 팀과 실제 구단은 CUSTOM_TEAMS에 속하지 않으므로 상대 FK를 NULL로 저장합니다. 신규 DB는 수정된 BuildUp_init.sql을 사용합니다.

```sql
ALTER TABLE AI_MATCHES MODIFY (AWAY_TEAM_ID NULL);
```

로그인 회원의 서버 시뮬레이션 결과만 AI_MATCHES에 저장합니다. 기존에 저장되지 않았던 대결은 소급 집계하지 않습니다. 랭킹은 승리수, 승률, 회원 ID 순 상위 10명입니다. 비회원은 연습 경기로 처리합니다.
