import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import * as adminApi from '../api/adminApi.js';

/**
 * [관리자 커뮤니티 제재 커스텀 훅 - BuildUp_FE/src/hooks/useAdminCommunity.js]
 * 
 * 커뮤니티 게시글/댓글 목록 조회, 검색/필터링, 블라인드 제재, 강제 삭제 및 본문 상세 확인 모달 로직을 전담합니다.
 */
export function useAdminCommunity({ showAlert }) {
  const dispatch = useDispatch();

  const [communitySubTab, setCommunitySubTab] = useState('posts'); // 'posts' | 'comments'
  const [posts, setPosts] = useState([]);
  const [postStatusFilter, setPostStatusFilter] = useState(''); // '' | 'NORMAL' | 'BLIND' | 'DELETED'
  const [postKeyword, setPostKeyword] = useState('');

  const [comments, setComments] = useState([]);
  const [commentStatusFilter, setCommentStatusFilter] = useState(''); // '' | 'NORMAL' | 'BLIND' | 'DELETED'
  const [commentKeyword, setCommentKeyword] = useState('');

  const [loading, setLoading] = useState(false);
  const [viewPostModal, setViewPostModal] = useState(null); // { title, content, nickname, isBlind, isDeleted, unblurred }

  // 1. 게시글 목록 조회
  const fetchPosts = useCallback(async (overrideStatus, overrideKeyword) => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [postStatusFilter, postKeyword, dispatch, showAlert]);

  // 2. 댓글 목록 조회
  const fetchComments = useCallback(async (overrideStatus, overrideKeyword) => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [commentStatusFilter, commentKeyword, dispatch, showAlert]);

  // 마운트 시 데이터 조회
  useEffect(() => {
    if (communitySubTab === 'posts') {
      fetchPosts();
    } else {
      fetchComments();
    }
  }, [communitySubTab, fetchPosts, fetchComments]);

  // 게시글 블라인드 토글
  const handleTogglePostBlind = async (postId, currentBlind) => {
    const nextBlind = currentBlind === 'Y' ? 'N' : 'Y';
    try {
      const res = await adminApi.updatePostBlind(postId, nextBlind);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.(`게시글이 ${nextBlind === 'Y' ? '블라인드 처리' : '블라인드 해제'}되었습니다.`);
        fetchPosts();
      } else {
        showAlert?.('블라인드 상태 변경 실패', 'error');
      }
    } catch (e) {
      showAlert?.('요청 중 통신 오류가 발생했습니다.', 'error');
    }
  };

  // 게시글 강제 삭제
  const handleDeletePost = async (postId, title) => {
    if (!window.confirm(`'${title}' 게시글을 삭제하시겠습니까?`)) return;
    try {
      const res = await adminApi.deleteAdminPost(postId);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.('게시글이 삭제 처리되었습니다.');
        fetchPosts();
      } else {
        showAlert?.(json.message || '게시글 삭제에 실패했습니다.', 'error');
      }
    } catch (e) {
      showAlert?.('게시글 삭제 중 통신 오류가 발생했습니다.', 'error');
    }
  };

  // 댓글 블라인드 토글
  const handleToggleCommentBlind = async (commentId, currentBlind) => {
    const nextBlind = currentBlind === 'Y' ? 'N' : 'Y';
    try {
      const res = await adminApi.updateCommentBlind(commentId, nextBlind);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.(`댓글이 ${nextBlind === 'Y' ? '블라인드 처리' : '블라인드 해제'}되었습니다.`);
        fetchComments();
      } else {
        showAlert?.('블라인드 상태 변경 실패', 'error');
      }
    } catch (e) {
      showAlert?.('요청 중 통신 오류가 발생했습니다.', 'error');
    }
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
    viewPostModal,
    setViewPostModal,
    fetchPosts,
    fetchComments,
    handleTogglePostBlind,
    handleDeletePost,
    handleToggleCommentBlind,
  };
}
