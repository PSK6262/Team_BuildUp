import { usePendingRequests } from './usePendingRequests.js';
import { useState, useCallback, useMemo } from 'react';
import { useDeferredLoad } from './useDeferredLoad.js';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice.js';
import * as adminApi from '../api/adminApi.js';
import {
  getBlindHistory,
  addBlindLog,
  clearBlindHistory as clearStorageBlindHistory,
} from '../utils/blindHistory.js';

/**
 * [관리자 커뮤니티 제재 커스텀 훅 - BuildUp_FE/src/hooks/useAdminCommunity.js]
 * 
 * 커뮤니티 게시글/댓글 목록 조회, 검색/필터링, 블라인드 제재, 강제 삭제,
 * AI vs 관리자 제재 이력 추적(localStorage 연동) 및 본문 상세 확인 모달 로직을 전담합니다.
 */
export function useAdminCommunity({ showAlert, confirm }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);

  // 현재 로그인한 관리자 명칭 계산 (예: '관리자: admin' 또는 '관리자: 최고운영자')
  const currentAdminName = useMemo(() => {
    if (!currentUser) return '관리자: 최고운영자';
    const name = currentUser.nickname || currentUser.loginId || currentUser.userName || '운영자';
    return `관리자: ${name}`;
  }, [currentUser]);

  const [communitySubTab, setCommunitySubTab] = useState('posts'); // 'posts' | 'comments'
  const [posts, setPosts] = useState([]);
  const [postStatusFilter, setPostStatusFilter] = useState(''); // '' | 'NORMAL' | 'BLIND' | 'DELETED'
  const [postKeyword, setPostKeyword] = useState('');

  const [comments, setComments] = useState([]);
  const [commentStatusFilter, setCommentStatusFilter] = useState(''); // '' | 'NORMAL' | 'BLIND' | 'DELETED'
  const [commentKeyword, setCommentKeyword] = useState('');

  const [loading, trackRequest] = usePendingRequests();
  const [viewPostModal, setViewPostModal] = useState(null); // { title, content, nickname, isBlind, isDeleted, unblurred, blindLog }

  // 블라인드 제재 이력 상태 (AI 소행인지, 관리자: 누구의 소행인지 추적)
  const [blindLogs, setBlindLogs] = useState(() => getBlindHistory());
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 대상별 최신 블라인드 로그 매핑 맵 (조회 성능 최적화: key -> `${targetType}_${targetId}`)
  const latestBlindMap = useMemo(() => {
    const map = new Map();
    // logs는 최신순으로 정렬되어 있으므로 처음 매칭되는 항목이 최신
    for (const log of blindLogs) {
      const key = `${log.targetType}_${log.targetId}`;
      if (!map.has(key)) {
        map.set(key, log);
      }
    }
    return map;
  }, [blindLogs]);

  // 1. 게시글 목록 조회
  const fetchPosts = useCallback(async (overrideStatus, overrideKeyword) => {
    trackRequest(true);
    try {
      const statusToUse = overrideStatus !== undefined ? overrideStatus : postStatusFilter;
      const keywordToUse = overrideKeyword !== undefined ? overrideKeyword : postKeyword;

      const res = await adminApi.getAdminPosts({
        status: statusToUse,
        keyword: keywordToUse,
      });

      if (res.status === 401 || res.status === 403) {
        dispatch(logout());
        showAlert?.('로그인 세션(토큰)이 만료되었습니다. 다시 로그인해주세요.', 'error');
        return;
      }

      const json = await res.json();
      if (json.code === 'FORBIDDEN' || json.code === 'ERR_003' || json.code === 'UNAUTHORIZED') {
        dispatch(logout());
        showAlert?.('로그인 세션(토큰)이 만료되었습니다. 다시 로그인해주세요.', 'error');
        return;
      }

      if (json.code === 'SUC_001' && json.data) {
        setPosts(json.data);
      }
    } catch (e) {
      console.warn('게시글 목록 조회 실패', e);
    } finally {
      trackRequest(false);
    }
  }, [postStatusFilter, postKeyword, dispatch, showAlert, trackRequest]);

  // 2. 댓글 목록 조회
  const fetchComments = useCallback(async (overrideStatus, overrideKeyword) => {
    trackRequest(true);
    try {
      const statusToUse = overrideStatus !== undefined ? overrideStatus : commentStatusFilter;
      const keywordToUse = overrideKeyword !== undefined ? overrideKeyword : commentKeyword;

      let isBlind = '';
      let isDeleted = '';
      if (statusToUse === 'BLIND') isBlind = 'Y';
      if (statusToUse === 'DELETED') isDeleted = 'Y';
      if (statusToUse === 'NORMAL') {
        isBlind = 'N';
        isDeleted = 'N';
      }

      const res = await adminApi.getAdminComments({
        isBlind,
        isDeleted,
        keyword: keywordToUse,
      });

      if (res.status === 401 || res.status === 403) {
        dispatch(logout());
        showAlert?.('로그인 세션(토큰)이 만료되었습니다. 다시 로그인해주세요.', 'error');
        return;
      }

      const json = await res.json();
      if (json.code === 'FORBIDDEN' || json.code === 'ERR_003' || json.code === 'UNAUTHORIZED') {
        dispatch(logout());
        showAlert?.('로그인 세션(토큰)이 만료되었습니다. 다시 로그인해주세요.', 'error');
        return;
      }

      if (json.code === 'SUC_001' && json.data) {
        setComments(json.data);
      }
    } catch (e) {
      console.warn('댓글 목록 조회 실패', e);
    } finally {
      trackRequest(false);
    }
  }, [commentStatusFilter, commentKeyword, dispatch, showAlert, trackRequest]);

  // 마운트 시 데이터 조회
  useDeferredLoad(useCallback(() => {
    if (communitySubTab === 'posts') {
      fetchPosts();
    } else {
      fetchComments();
    }
  }, [communitySubTab, fetchPosts, fetchComments]));

  // 게시글 블라인드 토글 (관리자 직권 이력 기록)
  const handleTogglePostBlind = async (postId, currentBlind) => {
    const nextBlind = currentBlind === 'Y' ? 'N' : 'Y';
    const targetPost = posts.find((p) => p.postId === postId);

    try {
      const res = await adminApi.updatePostBlind(postId, nextBlind);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        // 블라인드 제재 이력 적재 (관리자 소행 명시)
        const updatedLogs = addBlindLog({
          targetType: 'POST',
          targetId: postId,
          targetTitle: targetPost?.title || `#${postId} 게시글`,
          targetAuthor: targetPost?.nickname || '알 수 없음',
          action: nextBlind === 'Y' ? 'BLIND' : 'UNBLIND',
          actorType: 'ADMIN',
          actorName: currentAdminName,
          reason: nextBlind === 'Y' ? '운영 관리자 직권 블라인드 제재' : '운영 관리자 직권 제재 해제 및 복구',
        });
        setBlindLogs(updatedLogs);

        showAlert?.(
          nextBlind === 'Y'
            ? `게시글이 블라인드 처리되었습니다. (${currentAdminName})`
            : `게시글 블라인드가 해제되었습니다. (${currentAdminName})`
        );
        fetchPosts();
      } else {
        showAlert?.('블라인드 상태 변경 실패', 'error');
      }
    } catch {
      showAlert?.('요청 중 통신 오류가 발생했습니다.', 'error');
    }
  };

  // 게시글 강제 삭제
  const handleDeletePost = async (postId, title) => {
    if (!await confirm(`'${title}' 게시글을 삭제하시겠습니까?`, '게시글 삭제')) return;
    try {
      const res = await adminApi.deleteAdminPost(postId);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.('게시글이 삭제 처리되었습니다.');
        fetchPosts();
      } else {
        showAlert?.(json.message || '게시글 삭제에 실패했습니다.', 'error');
      }
    } catch {
      showAlert?.('게시글 삭제 중 통신 오류가 발생했습니다.', 'error');
    }
  };

  // 댓글 블라인드 토글 (관리자 직권 이력 기록)
  const handleToggleCommentBlind = async (commentId, currentBlind) => {
    const nextBlind = currentBlind === 'Y' ? 'N' : 'Y';
    const targetComment = comments.find((c) => c.commentId === commentId);

    try {
      const res = await adminApi.updateCommentBlind(commentId, nextBlind);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        // 블라인드 제재 이력 적재 (관리자 소행 명시)
        const updatedLogs = addBlindLog({
          targetType: 'COMMENT',
          targetId: commentId,
          targetTitle: targetComment?.content || `#${commentId} 댓글`,
          targetAuthor: targetComment?.nickname || '알 수 없음',
          action: nextBlind === 'Y' ? 'BLIND' : 'UNBLIND',
          actorType: 'ADMIN',
          actorName: currentAdminName,
          reason: nextBlind === 'Y' ? '운영 관리자 직권 블라인드 제재' : '운영 관리자 직권 제재 해제 및 복구',
        });
        setBlindLogs(updatedLogs);

        showAlert?.(
          nextBlind === 'Y'
            ? `댓글이 블라인드 처리되었습니다. (${currentAdminName})`
            : `댓글 블라인드가 해제되었습니다. (${currentAdminName})`
        );
        fetchComments();
      } else {
        showAlert?.('블라인드 상태 변경 실패', 'error');
      }
    } catch {
      showAlert?.('요청 중 통신 오류가 발생했습니다.', 'error');
    }
  };

  // AI 모더레이션 즉시 일괄 검사 실행 (AI 소행 이력 자동 기록)
  const [moderationLoading, setModerationLoading] = useState(false);
  const handleRunAiModeration = async (limit = 30) => {
    try {
      setModerationLoading(true);
      const res = await adminApi.triggerAiModeration(limit);
      const json = await res.json();

      if (json.code === 'SUC_001') {
        const msg = json.data?.message || 'AI 유해성 검사가 완료되었습니다.';
        const details = json.data?.details;

        // AI가 감지하여 블라인드 처리한 항목들을 AI 이력으로 등록
        if (Array.isArray(details) && details.length > 0) {
          let latestList = getBlindHistory();
          details.forEach((item) => {
            const isPost = item.type === 'POST';
            const matchedPost = isPost ? posts.find((p) => p.postId === item.id) : null;
            const matchedComment = !isPost ? comments.find((c) => c.commentId === item.id) : null;

            latestList = addBlindLog({
              targetType: isPost ? 'POST' : 'COMMENT',
              targetId: item.id,
              targetTitle: isPost
                ? matchedPost?.title || `#${item.id} 게시글`
                : matchedComment?.content || `#${item.id} 댓글`,
              targetAuthor: isPost
                ? matchedPost?.nickname || '알 수 없음'
                : matchedComment?.nickname || '알 수 없음',
              action: 'BLIND',
              actorType: 'AI',
              actorName: 'Gemini 1.5 Flash (AI 자동 감지)',
              reason: item.reason || 'AI 유해성 문맥 감지 (비속어/욕설)',
            });
          });
          setBlindLogs(latestList);
        }

        showAlert?.(`🤖 ${msg}`);
        fetchPosts();
        fetchComments();
      } else {
        showAlert?.(json.message || 'AI 모더레이션 실행 실패', 'error');
      }
    } catch {
      showAlert?.('AI 모더레이션 요청 중 오류가 발생했습니다.', 'error');
    } finally {
      setModerationLoading(false);
    }
  };

  // 제재 이력 전체 초기화
  const handleClearHistory = () => {
    const cleared = clearStorageBlindHistory();
    setBlindLogs(cleared);
    showAlert?.('블라인드 제재 이력이 초기화되었습니다.');
  };

  return {
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
    moderationLoading,
    viewPostModal,
    setViewPostModal,
    fetchPosts,
    fetchComments,
    handleTogglePostBlind,
    handleDeletePost,
    handleToggleCommentBlind,
    handleRunAiModeration,

    // 블라인드 제재 이력 (AI 소행 vs 관리자 누구의 소행)
    blindLogs,
    latestBlindMap,
    showHistoryModal,
    setShowHistoryModal,
    handleClearHistory,
    currentAdminName,
  };
}
