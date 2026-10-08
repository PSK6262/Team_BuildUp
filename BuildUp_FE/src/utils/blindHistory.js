/**
 * [블라인드 제재 이력 관리 유틸리티 - BuildUp_FE/src/utils/blindHistory.js]
 * 
 * 커뮤니티 게시글/댓글의 블라인드(제재) 및 해제 이력을 추적/기록합니다.
 * AI(Gemini AI 자동 감지)에 의한 제재인지, 관리자(누구의 직권 조치)의 소행인지를
 * 명확히 구분하여 영속 보관(localStorage)하고 조회할 수 있도록 지원합니다.
 */

const STORAGE_KEY = 'buildup_blind_history';

/**
 * 날짜 포맷팅 헬퍼 (YYYY-MM-DD HH:mm:ss)
 */
export function formatCurrentDateTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

/**
 * 초기 시연 및 검증용 기본 제재 이력 시드 데이터
 */
const DEFAULT_SEED_LOGS = [
  {
    id: 'seed-blind-log-1',
    targetType: 'POST',
    targetId: 9901,
    targetTitle: '어제 심판 판정 진짜 눈 뜨고 못 봐주겠네 욕설 도배',
    targetAuthor: '과격팬123',
    action: 'BLIND',
    actorType: 'AI',
    actorName: 'Gemini 1.5 Flash (AI 자동 감지)',
    reason: '인신공격 및 비속어 문맥 자동 검출 (유해 지수 92%)',
    timestamp: '2026-10-08 09:12:45',
  },
  {
    id: 'seed-blind-log-2',
    targetType: 'COMMENT',
    targetId: 8802,
    targetTitle: '저 선수 다리 분질러버려야 정신차리지',
    targetAuthor: '분노조절중',
    action: 'BLIND',
    actorType: 'AI',
    actorName: 'Gemini 1.5 Flash (AI 자동 감지)',
    reason: '폭력성 유발 및 혐오 표현 자동 검출 (유해 지수 96%)',
    timestamp: '2026-10-08 09:25:10',
  },
  {
    id: 'seed-blind-log-3',
    targetType: 'POST',
    targetId: 9903,
    targetTitle: '타 구단 비하 및 분쟁 유도 허위사실 유포',
    targetAuthor: '루머유포자',
    action: 'BLIND',
    actorType: 'ADMIN',
    actorName: '관리자: admin (김관리)',
    reason: '커뮤니티 운영 수칙 제4조(비방/루머) 위반 직권 제재',
    timestamp: '2026-10-08 09:48:30',
  },
];

/**
 * 전체 블라인드 이력 목록 조회
 * @returns {Array} 블라인드 로그 목록
 */
export function getBlindHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_LOGS));
      return DEFAULT_SEED_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SEED_LOGS;
  } catch (e) {
    console.warn('블라인드 이력 로드 실패, 기본값 반환:', e);
    return DEFAULT_SEED_LOGS;
  }
}

/**
 * 블라인드 이력 localStorage 영속 저장
 */
export function saveBlindHistory(logs) {
  try {
    // 최대 100건까지만 보관하여 용량 관리
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) {
    console.warn('블라인드 이력 저장 실패:', e);
    return logs;
  }
}

/**
 * 신규 블라인드/해제 이력 기록
 * 
 * @param {Object} params
 * @param {'POST'|'COMMENT'} params.targetType 게시글 또는 댓글
 * @param {number|string} params.targetId 대상 ID
 * @param {string} [params.targetTitle] 게시글 제목 또는 댓글 내용 미리보기
 * @param {string} [params.targetAuthor] 작성자 닉네임
 * @param {'BLIND'|'UNBLIND'} params.action 조치 유형 (블라인드 / 해제)
 * @param {'AI'|'ADMIN'} params.actorType 조치 주체 (AI / 관리자)
 * @param {string} params.actorName 조치자 명칭 ('Gemini 1.5 Flash' 또는 '관리자: admin')
 * @param {string} [params.reason] 제재 사유
 * @returns {Array} 업데이트된 최신 이력 목록
 */
export function addBlindLog({
  targetType,
  targetId,
  targetTitle = '',
  targetAuthor = '',
  action = 'BLIND',
  actorType = 'ADMIN',
  actorName = '관리자',
  reason = '',
}) {
  const currentLogs = getBlindHistory();
  const newEntry = {
    id: `blind-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    targetType,
    targetId: Number(targetId) || targetId,
    targetTitle: targetTitle ? targetTitle.substring(0, 50) : `#${targetId}`,
    targetAuthor: targetAuthor || '알 수 없음',
    action, // 'BLIND' | 'UNBLIND'
    actorType, // 'AI' | 'ADMIN'
    actorName, // 'Gemini 1.5 Flash' 또는 '관리자: 누구'
    reason: reason || (actorType === 'AI' ? 'AI 유해성 문맥 감지 (비속어/욕설)' : '운영 관리자 직권 제재'),
    timestamp: formatCurrentDateTime(),
  };

  const updatedLogs = [newEntry, ...currentLogs];
  return saveBlindHistory(updatedLogs);
}

/**
 * 특정 대상(게시글/댓글)의 가장 최신 제재 이력 조회
 * @param {Array} logs
 * @param {'POST'|'COMMENT'} targetType
 * @param {number|string} targetId
 * @returns {Object|null}
 */
export function findLatestBlindLog(logs, targetType, targetId) {
  if (!Array.isArray(logs) || !targetId) return null;
  const numId = Number(targetId);
  return logs.find(
    (l) => l.targetType === targetType && (Number(l.targetId) === numId || l.targetId === targetId)
  ) || null;
}

/**
 * 이력 전체 초기화
 */
export function clearBlindHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
}
