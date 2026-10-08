import React, { useState } from 'react';
import { useAdminCommunity } from '../../../hooks/useAdminCommunity.js';
import AdminSelect from '../AdminSelect.jsx';
import { useCommunityConfirm } from '../../CommunityConfirm.jsx';

/**
 * [관리자 커뮤니티 블라인드 제재 탭 - BuildUp_FE/src/components/admin/tabs/AdminCommunityTab.jsx]
 * 
 * 커뮤니티 게시글 및 댓글의 모더레이션(블라인드 제재, 강제 삭제, 원문 열람)을 전담하며,
 * 제재 주체가 AI(Gemini AI)의 소행인지, 관리자(누구)의 소행인지 명확히 추적/표시합니다.
 */
export default function AdminCommunityTab({ showAlert }) {
  const { confirm, confirmation } = useCommunityConfirm();
  const {
    communitySubTab,
    setCommunitySubTab,
    posts,
    postStatusFilter,
    setPostStatusFilter,
    postKeyword,
    setPostKeyword,
    comments,
    commentStatusFilter,
    setCommentStatusFilter,
    commentKeyword,
    setCommentKeyword,
    loading,
    viewPostModal,
    setViewPostModal,
    fetchPosts,
    fetchComments,
    handleTogglePostBlind,
    handleDeletePost,
    handleToggleCommentBlind,
    moderationLoading,
    handleRunAiModeration,

    // 블라인드 제재 이력 관련
    blindLogs,
    latestBlindMap,
    showHistoryModal,
    setShowHistoryModal,
    handleClearHistory,
    currentAdminName,
  } = useAdminCommunity({ showAlert, confirm });

  const [visiblePosts, setVisiblePosts] = useState(10);
  const [visibleComments, setVisibleComments] = useState(10);

  // 이력 모달 내부 필터 상태
  const [historyActorFilter, setHistoryActorFilter] = useState(''); // '' | 'AI' | 'ADMIN'
  const [historyKeyword, setHistoryKeyword] = useState('');

  // 필터링된 제재 이력
  const filteredBlindLogs = (blindLogs || []).filter((log) => {
    if (historyActorFilter && log.actorType !== historyActorFilter) return false;
    if (historyKeyword.trim()) {
      const kw = historyKeyword.trim().toLowerCase();
      const matchTitle = (log.targetTitle || '').toLowerCase().includes(kw);
      const matchAuthor = (log.targetAuthor || '').toLowerCase().includes(kw);
      const matchActor = (log.actorName || '').toLowerCase().includes(kw);
      const matchReason = (log.reason || '').toLowerCase().includes(kw);
      const matchId = String(log.targetId).includes(kw);
      if (!matchTitle && !matchAuthor && !matchActor && !matchReason && !matchId) return false;
    }
    return true;
  });

  // 상태 배지 렌더링 헬퍼 (AI 소행 vs 관리자 누구의 소행인지 구분 렌더링)
  const renderStatusBadge = (type, id, isBlind, isDeleted) => {
    if (isDeleted === 'Y') {
      return <span className="badge badge--gray">🗑️ 삭제됨</span>;
    }
    if (isBlind !== 'Y') {
      return <span className="badge badge--green">정상 (N)</span>;
    }

    const log = latestBlindMap.get(`${type}_${id}`);
    if (log?.actorType === 'AI') {
      return (
        <span
          className="badge badge--danger"
          style={{
            background: 'rgba(239, 68, 68, 0.16)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            fontWeight: 700,
            cursor: 'help',
          }}
          title={`[AI 자동 감지] 사유: ${log.reason} (${log.timestamp})`}
        >
          🤖 AI 제재
        </span>
      );
    }

    if (log?.actorType === 'ADMIN') {
      return (
        <span
          className="badge badge--warning"
          style={{
            background: 'rgba(245, 158, 11, 0.16)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            fontWeight: 700,
            cursor: 'help',
          }}
          title={`[수동 제재] ${log.actorName} - ${log.reason} (${log.timestamp})`}
        >
          👤 {log.actorName}
        </span>
      );
    }

    return <span className="badge badge--red">🚨 제재됨 (Y)</span>;
  };

  return (
    <div>
      {confirmation}

      {/* AI 모더레이션 연동 안내 배너 및 제재 이력 버튼 */}
      <div className="ai-moderation-banner">
        <div className="ai-moderation-banner__text">
          <h4>🤖 AI 유해 게시글 / 욕설 문맥 자동 감지 시스템</h4>
          <p>
            Gemini AI가 최근 등록 및 수정된 게시글과 댓글의 문맥을 일괄 분석하여 비속어, 혐오 표현을 자동 블라인드 제재합니다.<br />
            <span style={{ fontSize: 12, opacity: 0.85 }}>※ 서버 스케줄러를 통해 5분마다 자동 실행되며, 아래 버튼으로 지금 즉시 수동 실행할 수 있습니다.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-action btn-action--outline"
            onClick={() => setShowHistoryModal(true)}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
            title="AI 및 관리자 수동 블라인드 제재 전체 이력 확인"
          >
            <span>📋</span>
            <span>제재 이력 로그 ({blindLogs.length})</span>
          </button>
          <button
            type="button"
            className="btn-action btn-action--primary"
            disabled={moderationLoading}
            onClick={() => handleRunAiModeration(30)}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {moderationLoading ? (
              <>
                <span className="admin-spinner">🔄</span>
                <span>AI 분석 중...</span>
              </>
            ) : (
              '⚡ AI 유해성 일괄 검사 실행'
            )}
          </button>
        </div>
      </div>

      <section className="admin-section">
        <div className="admin-section__header">
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className={`btn-action ${communitySubTab === 'posts' ? 'btn-action--primary' : 'btn-action--outline'}`}
              onClick={() => {
                setCommunitySubTab('posts');
                setVisiblePosts(10);
              }}
            >
              게시글 관리
            </button>
            <button
              type="button"
              className={`btn-action ${communitySubTab === 'comments' ? 'btn-action--primary' : 'btn-action--outline'}`}
              onClick={() => {
                setCommunitySubTab('comments');
                setVisibleComments(10);
              }}
            >
              댓글 관리
            </button>
          </div>

          {communitySubTab === 'posts' ? (
            <div className="admin-filters">
              <AdminSelect
                className="admin-select"
                value={postStatusFilter}
                onChange={(e) => {
                  const next = e.target.value;
                  setPostStatusFilter(next);
                  setVisiblePosts(10);
                  fetchPosts(next, postKeyword);
                }}
              >
                <option value="">전체</option>
                <option value="NORMAL">정상</option>
                <option value="BLIND">블라인드</option>
                <option value="DELETED">삭제</option>
              </AdminSelect>
              <input
                type="text"
                className="admin-input"
                placeholder="제목 또는 닉네임 검색"
                value={postKeyword}
                onChange={(e) => setPostKeyword(e.target.value)}
              />
              <button
                type="button"
                className="btn-action btn-action--primary"
                onClick={() => {
                  setVisiblePosts(10);
                  fetchPosts();
                }}
              >
                검색
              </button>
            </div>
          ) : (
            <div className="admin-filters">
              <AdminSelect
                className="admin-select"
                value={commentStatusFilter}
                onChange={(e) => {
                  const next = e.target.value;
                  setCommentStatusFilter(next);
                  setVisibleComments(10);
                  fetchComments(next, commentKeyword);
                }}
              >
                <option value="">전체</option>
                <option value="NORMAL">정상</option>
                <option value="BLIND">블라인드</option>
                <option value="DELETED">삭제</option>
              </AdminSelect>
              <input
                type="text"
                className="admin-input"
                placeholder="내용 또는 닉네임 검색"
                value={commentKeyword}
                onChange={(e) => setCommentKeyword(e.target.value)}
              />
              <button
                type="button"
                className="btn-action btn-action--primary"
                onClick={() => {
                  setVisibleComments(10);
                  fetchComments();
                }}
              >
                검색
              </button>
            </div>
          )}
        </div>

        {/* 1. 게시글 목록 서브 탭 */}
        {communitySubTab === 'posts' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>분류</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>추천/조회</th>
                  <th>상태 (제재 주체)</th>
                  <th>작성일시</th>
                  <th>관리 액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 게시글 데이터를 동기화하는 중입니다...</td></tr>
                ) : posts.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>게시글이 없습니다.</td></tr>
                ) : (
                  posts.slice(0, visiblePosts).map((p) => (
                    <tr key={p.postId}>
                      <td data-label="번호">{p.postId}</td>
                      <td data-label="분류">
                        <span className="badge badge--gray">
                          {p.teamName || p.categoryType || '자유'}
                        </span>
                      </td>
                      <td data-label="제목" style={{ fontWeight: 600, maxWidth: 300 }}>
                        <a
                          href={`#/plug/community/posts/${p.postId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-post-title-link"
                          title={p.title}
                        >
                          {p.title}
                        </a>
                      </td>
                      <td data-label="작성자" style={{ whiteSpace: 'nowrap' }}>{p.nickname}</td>
                      <td data-label="추천 / 조회" style={{ whiteSpace: 'nowrap' }}>{p.likeCount} / {p.viewCount}</td>
                      <td data-label="상태" style={{ whiteSpace: 'nowrap' }}>
                        {renderStatusBadge('POST', p.postId, p.isBlind, p.isDeleted)}
                      </td>
                      <td data-label="작성일시" style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>{p.createdAt}</td>
                      <td data-label="관리 액션" style={{ whiteSpace: 'nowrap', width: '1%' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                          {p.isDeleted === 'Y' ? (
                            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, padding: '4px 6px' }}>
                              삭제됨 (증거보존)
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={`btn-action ${p.isBlind === 'Y' ? 'btn-action--outline' : 'btn-action--danger'}`}
                                onClick={() => handleTogglePostBlind(p.postId, p.isBlind)}
                                title={p.isBlind === 'Y' ? '블라인드 해제' : `관리자 권한으로 블라인드 (${currentAdminName})`}
                              >
                                {p.isBlind === 'Y' ? '제재 해제' : '블라인드 처리'}
                              </button>
                              <button
                                type="button"
                                className="btn-action btn-action--danger"
                                onClick={() => handleDeletePost(p.postId, p.title)}
                              >
                                게시글 삭제
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="btn-action btn-action--outline"
                            onClick={() => setViewPostModal({
                              title: p.title,
                              content: p.content,
                              nickname: p.nickname,
                              isBlind: p.isBlind,
                              isDeleted: p.isDeleted,
                              unblurred: false,
                              blindLog: latestBlindMap.get(`POST_${p.postId}`),
                            })}
                          >
                            내용 보기
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {communitySubTab === 'posts' && posts.length > visiblePosts && (
          <div className="admin-load-more-wrap">
            <button
              type="button"
              className="admin-load-more-btn"
              onClick={() => setVisiblePosts((prev) => prev + 10)}
            >
              10개 더보기 ▾ ({Math.min(visiblePosts, posts.length)} / {posts.length})
            </button>
          </div>
        )}

        {/* 2. 댓글 목록 서브 탭 */}
        {communitySubTab === 'comments' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>댓글ID</th>
                  <th>원글ID</th>
                  <th>댓글 본문 내용</th>
                  <th>작성자</th>
                  <th>상태 (제재 주체)</th>
                  <th>작성일시</th>
                  <th>관리 액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 댓글 데이터를 동기화하는 중입니다...</td></tr>
                ) : comments.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>댓글이 없습니다.</td></tr>
                ) : (
                  comments.slice(0, visibleComments).map((c) => (
                    <tr key={c.commentId}>
                      <td data-label="댓글ID">{c.commentId}</td>
                      <td data-label="원글ID">
                        <a href={`#/plug/community/posts/${c.postId}`} target="_blank" rel="noreferrer">
                          #{c.postId}
                        </a>
                      </td>
                      <td data-label="댓글 본문" style={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.content}
                      </td>
                      <td data-label="작성자" style={{ whiteSpace: 'nowrap' }}>{c.nickname}</td>
                      <td data-label="상태" style={{ whiteSpace: 'nowrap' }}>
                        {renderStatusBadge('COMMENT', c.commentId, c.isBlind, c.isDeleted)}
                      </td>
                      <td data-label="작성일시" style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>{c.createdAt}</td>
                      <td data-label="관리 액션" style={{ whiteSpace: 'nowrap', width: '1%' }}>
                        {c.isDeleted === 'Y' ? (
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, padding: '4px 6px' }}>
                            삭제됨 (증거보존)
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={`btn-action ${c.isBlind === 'Y' ? 'btn-action--outline' : 'btn-action--danger'}`}
                            onClick={() => handleToggleCommentBlind(c.commentId, c.isBlind)}
                            title={c.isBlind === 'Y' ? '블라인드 해제' : `관리자 권한으로 블라인드 (${currentAdminName})`}
                          >
                            {c.isBlind === 'Y' ? '제재 해제' : '블라인드 처리'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {communitySubTab === 'comments' && comments.length > visibleComments && (
          <div className="admin-load-more-wrap">
            <button
              type="button"
              className="admin-load-more-btn"
              onClick={() => setVisibleComments((prev) => prev + 10)}
            >
              10개 더보기 ▾ ({Math.min(visibleComments, comments.length)} / {comments.length})
            </button>
          </div>
        )}
      </section>

      {/* 게시글 본문 상세 확인 모달 (제재 주체 명시) */}
      {viewPostModal && (
        <div className="admin-modal-backdrop" onClick={() => setViewPostModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>게시글 본문 상세 확인</h3>
              <button type="button" className="admin-modal__close" onClick={() => setViewPostModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <h4 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{viewPostModal.title}</h4>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0' }}>
                작성자: {viewPostModal.nickname}
                {viewPostModal.isDeleted === 'Y' && (
                  <span className="badge badge--gray" style={{ marginLeft: 8 }}>🗑️ 작성자 삭제 (증거보존 모드)</span>
                )}
                {viewPostModal.isBlind === 'Y' && (
                  <span className="badge badge--red" style={{ marginLeft: 8 }}>🚨 제재된 게시글 (블라인드)</span>
                )}
              </p>

              {/* 제재 주체 (AI vs 관리자 누구) 상세 알림 카드 */}
              {viewPostModal.isBlind === 'Y' && (
                <div style={{
                  background: viewPostModal.blindLog?.actorType === 'AI' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${viewPostModal.blindLog?.actorType === 'AI' ? 'rgba(239, 68, 68, 0.28)' : 'rgba(245, 158, 11, 0.28)'}`,
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  lineHeight: 1.55,
                  marginBottom: 14,
                }}>
                  <div style={{
                    fontWeight: 700,
                    marginBottom: 4,
                    color: viewPostModal.blindLog?.actorType === 'AI' ? '#dc2626' : '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span>{viewPostModal.blindLog?.actorType === 'AI' ? '🤖' : '👤'}</span>
                    <span>
                      제재 주체: {viewPostModal.blindLog?.actorName || '시스템/관리자'}
                      {viewPostModal.blindLog?.actorType === 'AI' ? ' (AI 자동 제재)' : ' (관리자 수동 직권 제재)'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>
                    • 제재 사유: {viewPostModal.blindLog?.reason || '운영 정책 위반 관리자 제재'}<br />
                    • 제재 일시: {viewPostModal.blindLog?.timestamp || '이력 정보 없음'}
                  </div>
                </div>
              )}

              {viewPostModal.isDeleted === 'Y' && (
                <div style={{
                  background: '#f1f5f9',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  color: '#475569',
                  marginBottom: 12,
                }}>
                  ℹ️ 사용자가 직접 삭제한 게시글입니다. 법적/운영 증거 보존용으로 원문이 안전하게 보관되어 있습니다.
                </div>
              )}

              {viewPostModal.isBlind === 'Y' && !viewPostModal.unblurred ? (
                <div style={{
                  position: 'relative',
                  background: '#fef2f2',
                  padding: 24,
                  borderRadius: 10,
                  border: '1px solid #fecdd3',
                  textAlign: 'center',
                }}>
                  <p style={{ color: '#991b1b', fontWeight: 700, margin: '0 0 6px 0' }}>
                    ⚠️ 민감한 단어(욕설/비속어)가 포함되어 블라인드(블러) 처리된 본문입니다.
                  </p>
                  <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px 0' }}>
                    관리자 확인을 위해 블라인드를 해제하시겠습니까?
                  </p>
                  <button
                    type="button"
                    className="btn-action btn-action--warning"
                    onClick={() => setViewPostModal({ ...viewPostModal, unblurred: true })}
                  >
                    블라인드 해제하고 내용 보기
                  </button>
                  <div style={{
                    filter: 'blur(5px)',
                    opacity: 0.4,
                    marginTop: 16,
                    maxHeight: 90,
                    overflow: 'hidden',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}>
                    {viewPostModal.content}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#f8fafc',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflowY: 'auto',
                  lineHeight: 1.6,
                }}>
                  {viewPostModal.content}
                </div>
              )}
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--primary" onClick={() => setViewPostModal(null)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 블라인드 제재 이력 로그 전용 모달 (AI의 소행인지 vs 관리자 누구의 소행인지) */}
      {showHistoryModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 840, width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <h3 style={{ margin: 0 }}>블라인드 제재 및 해제 이력 로그</h3>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setShowHistoryModal(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* 모달 상단 컨트롤러: 필터 탭 & 검색 & 초기화 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className={`btn-action ${historyActorFilter === '' ? 'btn-action--primary' : 'btn-action--outline'}`}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => setHistoryActorFilter('')}
                  >
                    전체 ({blindLogs.length})
                  </button>
                  <button
                    type="button"
                    className={`btn-action ${historyActorFilter === 'AI' ? 'btn-action--primary' : 'btn-action--outline'}`}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => setHistoryActorFilter('AI')}
                  >
                    🤖 AI 제재 ({blindLogs.filter((l) => l.actorType === 'AI').length})
                  </button>
                  <button
                    type="button"
                    className={`btn-action ${historyActorFilter === 'ADMIN' ? 'btn-action--primary' : 'btn-action--outline'}`}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => setHistoryActorFilter('ADMIN')}
                  >
                    👤 관리자 제재 ({blindLogs.filter((l) => l.actorType === 'ADMIN').length})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ height: 34, fontSize: 12.5, minWidth: 160 }}
                    placeholder="제목/작성자/사유 검색"
                    value={historyKeyword}
                    onChange={(e) => setHistoryKeyword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-action btn-action--outline"
                    style={{ fontSize: 12, padding: '6px 10px', color: '#ef4444', borderColor: '#fca5a5' }}
                    onClick={handleClearHistory}
                    title="로그 이력 전체 초기화"
                  >
                    🗑️ 초기화
                  </button>
                </div>
              </div>

              {/* 이력 테이블 */}
              <div className="admin-table-wrapper" style={{ margin: 0 }}>
                <table className="admin-table" style={{ fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 140 }}>일시</th>
                      <th style={{ width: 65 }}>구분</th>
                      <th>대상 내용 / ID</th>
                      <th style={{ width: 85 }}>원작성자</th>
                      <th style={{ width: 75 }}>조치</th>
                      <th style={{ width: 170 }}>제재 주체 (Actor)</th>
                      <th>제재 사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlindLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
                          일치하는 제재 이력 로그가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredBlindLogs.map((log) => (
                        <tr key={log.id}>
                          <td data-label="일시" style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                            {log.timestamp}
                          </td>
                          <td data-label="구분">
                            <span className="badge badge--gray" style={{ fontSize: 11 }}>
                              {log.targetType === 'POST' ? '게시글' : '댓글'}
                            </span>
                          </td>
                          <td data-label="대상" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 600 }}>#{log.targetId}</span> {log.targetTitle}
                          </td>
                          <td data-label="작성자" style={{ whiteSpace: 'nowrap' }}>
                            {log.targetAuthor}
                          </td>
                          <td data-label="조치" style={{ whiteSpace: 'nowrap' }}>
                            {log.action === 'BLIND' ? (
                              <span className="badge badge--red" style={{ fontSize: 11 }}>제재(BLIND)</span>
                            ) : (
                              <span className="badge badge--green" style={{ fontSize: 11 }}>해제(CLEAR)</span>
                            )}
                          </td>
                          <td data-label="제재 주체" style={{ whiteSpace: 'nowrap' }}>
                            {log.actorType === 'AI' ? (
                              <span
                                className="badge"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.14)',
                                  color: '#dc2626',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  fontWeight: 700,
                                  fontSize: 11.5,
                                }}
                              >
                                🤖 {log.actorName}
                              </span>
                            ) : (
                              <span
                                className="badge"
                                style={{
                                  background: 'rgba(245, 158, 11, 0.14)',
                                  color: '#d97706',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  fontWeight: 700,
                                  fontSize: 11.5,
                                }}
                              >
                                👤 {log.actorName}
                              </span>
                            )}
                          </td>
                          <td data-label="사유" style={{ color: '#475569', fontSize: 12 }}>
                            {log.reason}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-modal__footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                ※ 블라인드 조치 시 AI 자동 판별과 관리자 수동 제재가 실시간으로 기록됩니다.
              </span>
              <button
                type="button"
                className="btn-action btn-action--primary"
                onClick={() => setShowHistoryModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
