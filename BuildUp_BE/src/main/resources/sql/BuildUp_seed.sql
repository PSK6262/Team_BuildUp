-- ====================================================================
-- 프로젝트 'BuildUp' 마스터 코드 및 기초 시드 데이터
-- ====================================================================

-- 1. USER_ROLES (회원 권한 등급 마스터)
INSERT INTO USER_ROLES (ROLE_CODE, ROLE_NAME) VALUES (1, '일반회원');
INSERT INTO USER_ROLES (ROLE_CODE, ROLE_NAME) VALUES (9, '관리자');

-- 2. CATEGORY (게시글 분류 카테고리)
INSERT INTO CATEGORY (CATEGORY_ID, CATEGORY_TYPE) VALUES (1, '자유');
INSERT INTO CATEGORY (CATEGORY_ID, CATEGORY_TYPE) VALUES (2, '질문');
INSERT INTO CATEGORY (CATEGORY_ID, CATEGORY_TYPE) VALUES (3, '경기');
INSERT INTO CATEGORY (CATEGORY_ID, CATEGORY_TYPE) VALUES (9, '뉴스');


-- 3. STAFF_ROLES (EPL 공식 기준 스태프 직책 마스터)
INSERT INTO STAFF_ROLES (STAFF_ROLE_ID, ROLE_NAME) VALUES (1, '감독');
INSERT INTO STAFF_ROLES (STAFF_ROLE_ID, ROLE_NAME) VALUES (2, '수석 코치');
INSERT INTO STAFF_ROLES (STAFF_ROLE_ID, ROLE_NAME) VALUES (3, '1군 코치');
INSERT INTO STAFF_ROLES (STAFF_ROLE_ID, ROLE_NAME) VALUES (4, '골키퍼 코치');
INSERT INTO STAFF_ROLES (STAFF_ROLE_ID, ROLE_NAME) VALUES (5, '피지컬 코치');
INSERT INTO STAFF_ROLES (STAFF_ROLE_ID, ROLE_NAME) VALUES (6, '전력분석관');

-- 4. EVENT_TYPE (축구 경기 인게임 이벤트 유형 마스터)
INSERT INTO EVENT_TYPE (EVENT_TYPE_CODE, EVENT_TYPE_NAME, EVENT_ICON_URL) VALUES (1, '골', '/resources/images/events/goal.png');
INSERT INTO EVENT_TYPE (EVENT_TYPE_CODE, EVENT_TYPE_NAME, EVENT_ICON_URL) VALUES (2, '페널티킥 골', '/resources/images/events/penalty.png');
INSERT INTO EVENT_TYPE (EVENT_TYPE_CODE, EVENT_TYPE_NAME, EVENT_ICON_URL) VALUES (3, '자책골', '/resources/images/events/own_goal.png');
INSERT INTO EVENT_TYPE (EVENT_TYPE_CODE, EVENT_TYPE_NAME, EVENT_ICON_URL) VALUES (4, '경고 (옐로카드)', '/resources/images/events/yellow_card.png');
INSERT INTO EVENT_TYPE (EVENT_TYPE_CODE, EVENT_TYPE_NAME, EVENT_ICON_URL) VALUES (5, '경고 누적 퇴장', '/resources/images/events/second_yellow.png');
INSERT INTO EVENT_TYPE (EVENT_TYPE_CODE, EVENT_TYPE_NAME, EVENT_ICON_URL) VALUES (6, '퇴장 (레드카드)', '/resources/images/events/red_card.png');
INSERT INTO EVENT_TYPE (EVENT_TYPE_CODE, EVENT_TYPE_NAME, EVENT_ICON_URL) VALUES (7, '교체', '/resources/images/events/substitution.png');
INSERT INTO EVENT_TYPE (EVENT_TYPE_CODE, EVENT_TYPE_NAME, EVENT_ICON_URL) VALUES (8, '페널티킥 실축', '/resources/images/events/missed_penalty.png');

COMMIT;
