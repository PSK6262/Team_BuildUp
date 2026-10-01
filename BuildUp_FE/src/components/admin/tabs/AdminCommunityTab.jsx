import React, { useState } from 'react';
import { useAdminCommunity } from '../../../hooks/useAdminCommunity.js';
import AdminSelect from '../AdminSelect.jsx';

/**
 * [관리자 커뮤니티 블라인드 제재 탭 - BuildUp_FE/src/components/admin/tabs/AdminCommunityTab.jsx]
 * 
 * 커뮤니티 게시글 및 댓글의 모더레이션(블라인드 제재, 강제 삭제, 원문 열람)을 전담하는 컴포넌트입니다.
 */
export default function AdminCommunityTab({ showAlert }) {
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
  } = useAdminCommunity({ showAlert });

  const [visiblePosts, setVisiblePosts] = useState(10);
  const [visibleComments, setVisibleComments] = useState(10);

  return (
    <div>
      {/* AI 모더레이션 연동 안내 배너 */}
      <div className="ai-moderation-banner">
        <div className="ai-moderation-banner__text">
          <h4>🤖 AI 유해 게시글 / 욕설 문맥 자동 감지 시스템</h4>
          <p>
            Gemini AI가 최근 등록 및 수정된 게시글과 댓글의 문맥을 일괄 분석하여 비속어, 혐오 표현을 자동 블라인드 제재합니다.<br />
            <span style={{ fontSize: 12, opacity: 0.85 }}>※ 서버 스케줄러를 통해 5분마다 자동 실행되며, 아래 버튼으로 지금 즉시 수동 실행할 수 있습니다.</span>
          </p>
        </div>
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
                  <th>상태</th>
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
                          href={`/plug/community/posts/${p.postId}`}
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
                        {p.isDeleted === 'Y' ? (
                          <span className="badge badge--gray">🗑️ 삭제됨</span>
                        ) : p.isBlind === 'Y' ? (
                          <span className="badge badge--red">🚨 제재됨 (Y)</span>
                        ) : (
                          <span className="badge badge--green">정상 (N)</span>
                        )}
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
                  <th>상태</th>
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
                        <a href={`/plug/community/posts/${c.postId}`} target="_blank" rel="noreferrer">
                          #{c.postId}
                        </a>
                      </td>
                      <td data-label="댓글 본문" style={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.content}
                      </td>
                      <td data-label="작성자" style={{ whiteSpace: 'nowrap' }}>{c.nickname}</td>
                      <td data-label="상태" style={{ whiteSpace: 'nowrap' }}>
                        {c.isDeleted === 'Y' ? (
                          <span className="badge badge--gray">🗑️ 작성자 삭제</span>
                        ) : c.isBlind === 'Y' ? (
                          <span className="badge badge--red">🚨 제재됨 (Y)</span>
                        ) : (
                          <span className="badge badge--green">정상 (N)</span>
                        )}
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

      {/* 게시글 본문 상세 확인 모달 */}
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
                    관리자 확인을 위해 블러를 해제하시겠습니까?
                  </p>
                  <button
                    type="button"
                    className="btn-action btn-action--warning"
                    onClick={() => setViewPostModal({ ...viewPostModal, unblurred: true })}
                  >
                    블러 해제하고 내용 보기
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
    </div>
  );
}
