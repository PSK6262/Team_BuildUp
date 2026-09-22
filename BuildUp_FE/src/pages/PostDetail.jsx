import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { communityTeams } from '../data/communityTeams.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import '../css/Community.css'

// StrictMode가 개발 환경에서 같은 상세 조회를 두 번 실행해도 서버 요청은 한 번만 보냅니다.
const pendingPostRequests = new Map()
const COMMENT_MAX_LENGTH = 100
const POST_CONTENT_MAX_LENGTH = 1000
const MAX_ATTACHMENT_COUNT = 5
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
const MAX_ATTACHMENT_TOTAL_SIZE = 20 * 1024 * 1024
const IMAGE_ATTACHMENT_PATTERN = /\.(jpe?g|png|gif|webp)$/i
const FILE_ATTACHMENT_PATTERN = /\.(pdf|txt|docx|xlsx|zip)$/i

const commentLength = (value) => Array.from(value).length
const limitComment = (value) => Array.from(value).slice(0, COMMENT_MAX_LENGTH).join('')
const contentLength = (value) => Array.from(value).length
const limitContent = (value) => Array.from(value).slice(0, POST_CONTENT_MAX_LENGTH).join('')

function requestPost(postId) {
  const key = String(postId)
  const pending = pendingPostRequests.get(key)
  if (pending) return pending

  const request = (async () => {
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(postId)}`)
      const result = await response.json()
      if (!response.ok || !result.data) {
        throw new Error(result.message || '게시글을 불러오지 못했습니다.')
      }
      return result.data
    } finally {
      pendingPostRequests.delete(key)
    }
  })()
  pendingPostRequests.set(key, request)
  return request
}

export default function PostDetail({ postId }) {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
  const user = useSelector((state) => state.auth.user)
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [categories, setCategories] = useState([])
  const [teams, setTeams] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [comments, setComments] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentsError, setCommentsError] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [commentActionId, setCommentActionId] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [pendingImages, setPendingImages] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [attachmentLoading, setAttachmentLoading] = useState(false)
  const [attachmentError, setAttachmentError] = useState(
    new URLSearchParams(window.location.search).get('attachmentError') === '1'
      ? '게시글은 등록되었지만 일부 첨부파일 업로드에 실패했습니다. 다시 등록해주세요.'
      : '',
  )
  const requestedReturn = new URLSearchParams(window.location.search).get('from')
  // 외부 주소나 임의의 경로로 이동하지 않도록 실제 목록 경로만 허용합니다.
  const allowedPaths = ['/plug/community', '/plug/community/free', ...communityTeams.map((team) => `/plug/community/teams/${team.slug}`)]
  const backTo = allowedPaths.includes(requestedReturn) ? requestedReturn : '/plug/community'
  // 이전 서버가 반환한 pcommentId도 함께 읽어 대댓글 관계를 유지합니다.
  const getParentCommentId = (comment) => comment.pCommentId ?? comment.pcommentId

  // 게시글 번호로 실제 상세 데이터를 조회합니다.
  useEffect(() => {
    let active = true
    const fetchPost = async () => {
      try {
        const data = await requestPost(postId)
        if (active) setPost(data)
      } catch (exception) {
        if (active) setError(exception.message || '게시글을 불러오지 못했습니다.')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchPost()
    return () => { active = false }
  }, [postId])

  // 게시글에 등록된 이미지와 일반 첨부파일을 조회합니다.
  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const response = await fetch(`/api/communities/${encodeURIComponent(postId)}/attachments`)
        const isJson = response.headers.get('content-type')?.includes('application/json')
        const result = isJson ? await response.json() : null
        if (!response.ok || !Array.isArray(result?.data)) {
          throw new Error(result?.message || '첨부파일을 불러오지 못했습니다.')
        }
        setAttachments(result.data)
      } catch (exception) {
        setAttachmentError(exception.message || '첨부파일을 불러오지 못했습니다.')
      }
    }
    fetchAttachments()
  }, [postId])

  // 로그인한 사용자가 이 게시글을 추천했는지 확인합니다.
  useEffect(() => {
    if (!isLoggedIn) return

    const fetchLikeStatus = async () => {
      try {
        const token = localStorage.getItem('buildup_token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const response = await fetch(`/api/communities/${encodeURIComponent(postId)}/likes/me`, { headers })
        const isJson = response.headers.get('content-type')?.includes('application/json')
        const result = isJson ? await response.json() : null
        if (response.ok && result) setLiked(Boolean(result.data))
      } catch {
        // 추천 여부 조회가 실패해도 게시글 상세 화면은 계속 표시합니다.
      }
    }
    fetchLikeStatus()
  }, [isLoggedIn, postId])

  // 게시글의 일반 댓글과 대댓글을 함께 조회합니다.
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/communities/${encodeURIComponent(postId)}/comments`)
        const isJson = response.headers.get('content-type')?.includes('application/json')
        const result = isJson ? await response.json() : null
        if (!response.ok || !Array.isArray(result?.data)) {
          throw new Error(result?.message || '댓글을 불러오지 못했습니다.')
        }
        setComments(result.data)
      } catch (exception) {
        setCommentsError(exception.message || '댓글을 불러오지 못했습니다.')
      }
    }
    fetchComments()
  }, [postId])

  const startEditing = async () => {
    setActionError('')
    setActionLoading(true)
    try {
      const [categoryResponse, teamResponse] = await Promise.all([
        fetch('/api/communities/categories'),
        fetch('/api/teams'),
      ])
      const categoryResult = await categoryResponse.json()
      const teamResult = await teamResponse.json()
      if (!categoryResponse.ok || !teamResponse.ok) {
        throw new Error('수정에 필요한 정보를 불러오지 못했습니다.')
      }
      setCategories(Array.isArray(categoryResult.data) ? categoryResult.data : [])
      setTeams(Array.isArray(teamResult) ? teamResult : [])
      setCategoryId(String(post.categoryId))
      setTeamId(post.teamId == null ? '' : String(post.teamId))
      setTitle(post.title || '')
      setContent(post.content || '')
      setEditing(true)
    } catch (exception) {
      setActionError(exception.message || '수정에 필요한 정보를 불러오지 못했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  const updatePost = async (event) => {
    event.preventDefault()
    setActionError('')
    if (!categoryId || !title.trim() || !content.trim()) {
      setActionError('카테고리, 제목, 내용을 모두 입력해주세요.')
      return
    }
    if (contentLength(content.trim()) > POST_CONTENT_MAX_LENGTH) {
      setActionError(`내용은 ${POST_CONTENT_MAX_LENGTH}자까지 입력할 수 있습니다.`)
      return
    }

    setActionLoading(true)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch(`/api/communities/${encodeURIComponent(postId)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          categoryId: Number(categoryId),
          teamId: teamId ? Number(teamId) : null,
          title: title.trim(),
          content: content.trim(),
        }),
      })
      const result = await response.json()
      if (!response.ok || !result?.data) {
        throw new Error(result.message || '게시글 수정에 실패했습니다.')
      }
      setPost(result.data)
      setEditing(false)
    } catch (exception) {
      setActionError(exception.message || '게시글 수정에 실패했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  const deletePost = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return
    setActionError('')
    setActionLoading(true)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await fetch(`/api/communities/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
        headers,
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || '게시글 삭제에 실패했습니다.')
      }
      window.location.assign(backTo)
    } catch (exception) {
      setActionError(exception.message || '게시글 삭제에 실패했습니다.')
      setActionLoading(false)
    }
  }

  // 로그인 상태에 따라 게시글 추천을 등록하거나 취소합니다.
  const toggleLike = async () => {
    if (!isLoggedIn) {
      window.location.assign('/plug/login')
      return
    }

    setActionError('')
    setLikeLoading(true)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await fetch(`/api/communities/${encodeURIComponent(postId)}/likes`, {
        method: liked ? 'DELETE' : 'POST',
        headers,
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      const result = isJson ? await response.json() : null
      if (!response.ok || !result.data) {
        if (!isJson && response.status === 404) {
          throw new Error('추천 API가 서버에 반영되지 않았습니다. Tomcat 서버를 다시 게시한 뒤 재시작해주세요.')
        }
        throw new Error(result?.message || '추천 처리에 실패했습니다.')
      }
      setPost(result.data)
      setLiked(!liked)
    } catch (exception) {
      setActionError(exception.message || '추천 처리에 실패했습니다.')
    } finally {
      setLikeLoading(false)
    }
  }

  // 선택한 부모 댓글 번호가 있으면 대댓글로, 없으면 일반 댓글로 등록합니다.
  const createComment = async (event) => {
    event.preventDefault()
    if (!isLoggedIn) {
      window.location.assign('/plug/login')
      return
    }
    if (!commentContent.trim()) {
      setCommentsError('댓글 내용을 입력해주세요.')
      return
    }
    if (commentLength(commentContent.trim()) > COMMENT_MAX_LENGTH) {
      setCommentsError(`댓글은 ${COMMENT_MAX_LENGTH}자까지 입력할 수 있습니다.`)
      return
    }

    setCommentsError('')
    setCommentLoading(true)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch(`/api/communities/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: commentContent.trim(),
          pCommentId: replyTarget?.commentId || null,
        }),
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      const result = isJson ? await response.json() : null
      if (!response.ok || !result?.data) {
        if (!isJson && response.status === 404) {
          throw new Error('댓글 API가 서버에 반영되지 않았습니다. Tomcat 서버를 다시 게시한 뒤 재시작해주세요.')
        }
        throw new Error(result?.message || '댓글 등록에 실패했습니다.')
      }
      setComments((current) => [...current, result.data])
      setCommentContent('')
      setReplyTarget(null)
    } catch (exception) {
      setCommentsError(exception.message || '댓글 등록에 실패했습니다.')
    } finally {
      setCommentLoading(false)
    }
  }

  // 선택한 댓글의 현재 내용을 수정 입력창에 표시합니다.
  const startCommentEditing = (comment) => {
    setEditingCommentId(comment.commentId)
    setEditCommentContent(comment.content)
    setCommentsError('')
  }

  // 로그인한 작성자의 댓글 내용을 수정합니다.
  const updateComment = async (event, commentId) => {
    event.preventDefault()
    if (!editCommentContent.trim()) {
      setCommentsError('댓글 내용을 입력해주세요.')
      return
    }
    if (commentLength(editCommentContent.trim()) > COMMENT_MAX_LENGTH) {
      setCommentsError(`댓글은 ${COMMENT_MAX_LENGTH}자까지 입력할 수 있습니다.`)
      return
    }

    setCommentsError('')
    setCommentActionId(commentId)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch(`/api/communities/${encodeURIComponent(postId)}/comments/${commentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ content: editCommentContent.trim() }),
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      const result = isJson ? await response.json() : null
      if (!response.ok || !result?.data) {
        throw new Error(result?.message || '댓글 수정에 실패했습니다.')
      }
      setComments((current) => current.map((comment) =>
        Number(comment.commentId) === Number(commentId) ? result.data : comment))
      setEditingCommentId(null)
      setEditCommentContent('')
    } catch (exception) {
      setCommentsError(exception.message || '댓글 수정에 실패했습니다.')
    } finally {
      setCommentActionId(null)
    }
  }

  // 로그인한 작성자의 댓글을 숨김 처리합니다.
  const deleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
    setCommentsError('')
    setCommentActionId(commentId)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await fetch(`/api/communities/${encodeURIComponent(postId)}/comments/${commentId}`, {
        method: 'DELETE',
        headers,
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      const result = isJson ? await response.json() : null
      if (!response.ok) {
        throw new Error(result?.message || '댓글 삭제에 실패했습니다.')
      }
      setComments((current) => {
        const hasVisibleReplies = current.some((comment) =>
          Number(getParentCommentId(comment)) === Number(commentId) && comment.isBlind !== 'Y')
        if (!hasVisibleReplies) {
          return current.filter((comment) => Number(comment.commentId) !== Number(commentId))
        }
        return current.map((comment) => Number(comment.commentId) === Number(commentId)
          ? { ...comment, isBlind: 'Y', content: '' }
          : comment)
      })
      if (Number(editingCommentId) === Number(commentId)) {
        setEditingCommentId(null)
        setEditCommentContent('')
      }
      if (Number(replyTarget?.commentId) === Number(commentId)) {
        setReplyTarget(null)
      }
    } catch (exception) {
      setCommentsError(exception.message || '댓글 삭제에 실패했습니다.')
    } finally {
      setCommentActionId(null)
    }
  }

  // 게시글에 추가할 이미지와 일반 파일을 각각 검사합니다.
  const selectAttachments = (event, type) => {
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    const otherPending = type === 'image' ? pendingFiles : pendingImages
    const pattern = type === 'image' ? IMAGE_ATTACHMENT_PATTERN : FILE_ATTACHMENT_PATTERN
    if (attachments.length + otherPending.length + selected.length > MAX_ATTACHMENT_COUNT) {
      setAttachmentError(`첨부파일은 게시글당 최대 ${MAX_ATTACHMENT_COUNT}개까지 등록할 수 있습니다.`)
      return
    }
    if (selected.some((file) => file.size <= 0 || file.size > MAX_ATTACHMENT_SIZE)) {
      setAttachmentError('파일 하나의 크기는 10MB 이하여야 합니다.')
      return
    }
    const savedSize = attachments.reduce((sum, attachment) => sum + Number(attachment.fileSize || 0), 0)
    if (savedSize + [...selected, ...otherPending].reduce((sum, file) => sum + file.size, 0) > MAX_ATTACHMENT_TOTAL_SIZE) {
      setAttachmentError('게시글의 이미지와 첨부파일 전체 크기는 20MB 이하여야 합니다.')
      return
    }
    if (selected.some((file) => !pattern.test(file.name))) {
      setAttachmentError(type === 'image'
        ? 'JPG, PNG, GIF, WEBP 이미지만 등록할 수 있습니다.'
        : 'PDF, TXT, DOCX, XLSX, ZIP 파일만 첨부할 수 있습니다.')
      return
    }
    setAttachmentError('')
    if (type === 'image') setPendingImages(selected)
    else setPendingFiles(selected)
  }

  // 로그인한 작성자의 게시글에 선택한 첨부파일을 등록합니다.
  const uploadAttachments = async (selectedFiles, clearSelection) => {
    if (selectedFiles.length === 0) {
      setAttachmentError('등록할 첨부파일을 선택해주세요.')
      return
    }
    setAttachmentLoading(true)
    setAttachmentError('')
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const formData = new FormData()
      selectedFiles.forEach((file) => formData.append('files', file))
      const response = await fetch(`/api/communities/${encodeURIComponent(postId)}/attachments`, {
        method: 'POST',
        headers,
        body: formData,
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      const result = isJson ? await response.json() : null
      if (!response.ok || !Array.isArray(result?.data)) {
        throw new Error(result?.message || '첨부파일 등록에 실패했습니다.')
      }
      setAttachments(result.data)
      clearSelection([])
    } catch (exception) {
      setAttachmentError(exception.message || '첨부파일 등록에 실패했습니다.')
    } finally {
      setAttachmentLoading(false)
    }
  }

  // 로그인한 작성자의 게시글에서 첨부파일을 삭제합니다.
  const deleteAttachment = async (attachmentId) => {
    if (!window.confirm('첨부파일을 삭제하시겠습니까?')) return
    setAttachmentLoading(true)
    setAttachmentError('')
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await fetch(`/api/communities/${encodeURIComponent(postId)}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers,
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      const result = isJson ? await response.json() : null
      if (!response.ok) throw new Error(result?.message || '첨부파일 삭제에 실패했습니다.')
      setAttachments((current) => current.filter((attachment) => Number(attachment.attachmentId) !== Number(attachmentId)))
    } catch (exception) {
      setAttachmentError(exception.message || '첨부파일 삭제에 실패했습니다.')
    } finally {
      setAttachmentLoading(false)
    }
  }

  if (loading) return <main className="community">
    <CommunityNavigation />
    <p className="community__intro" role="status">게시글을 불러오는 중입니다.</p>
  </main>

  if (error || !post) return <main className="community">
    <CommunityNavigation />
    <h1>게시글을 찾을 수 없습니다.</h1>
    <p className="community__intro">{error || '주소를 확인하거나 목록에서 다른 글을 선택해 주세요.'}</p>
    <a className="community__main-link" href={backTo}>목록으로 돌아가기</a>
  </main>

  const isTeamPost = post.teamId != null
  const isOwner = isLoggedIn && Number(user?.userId) === Number(post.userId)
  const imageAttachments = attachments.filter((attachment) => attachment.image)
  const fileAttachments = attachments.filter((attachment) => !attachment.image)
  const rootComments = comments.filter((comment) => getParentCommentId(comment) == null)
  const visibleCommentCount = comments.filter((comment) => comment.isBlind !== 'Y').length

  // 일반 댓글과 대댓글에 동일한 작성자 수정·삭제 기능을 표시합니다.
  const renderComment = (comment, canReply) => {
    if (comment.isBlind === 'Y') {
      return <p className="community__deleted-comment">삭제된 댓글입니다.</p>
    }
    const isCommentOwner = isLoggedIn && Number(user?.userId) === Number(comment.userId)
    const isEditingComment = Number(editingCommentId) === Number(comment.commentId)
    const isCommentBusy = Number(commentActionId) === Number(comment.commentId)

    return <>
      <header><strong>{comment.nickname}</strong><time dateTime={comment.createdAt}>{comment.createdAt}</time></header>
      {isEditingComment ? <form className="community__comment-edit" onSubmit={(event) => updateComment(event, comment.commentId)}>
        <textarea rows="3" value={editCommentContent} onChange={(event) => setEditCommentContent(limitComment(event.target.value))} disabled={isCommentBusy} />
        <span className="community__character-count">{commentLength(editCommentContent)} / {COMMENT_MAX_LENGTH}</span>
        <div>
          <button type="button" onClick={() => { setEditingCommentId(null); setEditCommentContent('') }} disabled={isCommentBusy}>취소</button>
          <button type="submit" disabled={isCommentBusy}>{isCommentBusy ? '수정 중...' : '수정 완료'}</button>
        </div>
      </form> : <p>{comment.content}</p>}
      {!isEditingComment && <div className="community__comment-actions">
        {canReply && <button type="button" onClick={() => { setReplyTarget(comment); setCommentsError('') }}>답글</button>}
        {isCommentOwner && <>
          <button type="button" onClick={() => startCommentEditing(comment)} disabled={isCommentBusy}>수정</button>
          <button type="button" className="community__comment-delete" onClick={() => deleteComment(comment.commentId)} disabled={isCommentBusy}>삭제</button>
        </>}
      </div>}
    </>
  }

  // 상세 화면은 조회만, 수정 화면은 첨부파일 추가·삭제 기능까지 표시합니다.
  const renderAttachments = (manageAttachments) => <section className="community__attachments" aria-labelledby="community-attachments-title">
    <h2 id="community-attachments-title">첨부파일 <span>{attachments.length}</span></h2>
    {attachmentError && <p className="community__form-error" role="alert">{attachmentError}</p>}
    <div className="community__attachment-section">
      <h3>이미지 <span>{imageAttachments.length}</span></h3>
      {imageAttachments.length === 0
        ? <p className="community__attachment-empty">등록된 이미지가 없습니다.</p>
        : <ul className="community__image-grid">
          {imageAttachments.map((attachment) => <li key={attachment.attachmentId}>
            <img src={`/api/communities/attachments/${attachment.attachmentId}/content`} alt={attachment.originalName} />
            <div><strong>{attachment.originalName}</strong><small>{(Number(attachment.fileSize) / 1024).toFixed(1)}KB</small></div>
            <div className="community__attachment-actions">
              <a href={`/api/communities/attachments/${attachment.attachmentId}/download`}>다운로드</a>
              {manageAttachments && <button type="button" className="community__danger" onClick={() => deleteAttachment(attachment.attachmentId)} disabled={attachmentLoading}>삭제</button>}
            </div>
          </li>)}
        </ul>}
      {manageAttachments && attachments.length < MAX_ATTACHMENT_COUNT && <div className="community__attachment-upload">
        <strong>이미지 추가</strong>
        <input type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => selectAttachments(event, 'image')} disabled={attachmentLoading} />
        {pendingImages.length > 0 && <span>{pendingImages.length}개 이미지 선택</span>}
        <button type="button" onClick={() => uploadAttachments(pendingImages, setPendingImages)} disabled={attachmentLoading || pendingImages.length === 0}>{attachmentLoading ? '처리 중...' : '이미지 등록'}</button>
      </div>}
    </div>

    <div className="community__attachment-section">
      <h3>일반 첨부파일 <span>{fileAttachments.length}</span></h3>
      {fileAttachments.length === 0
        ? <p className="community__attachment-empty">등록된 일반 첨부파일이 없습니다.</p>
        : <ul className="community__attachment-list">
          {fileAttachments.map((attachment) => <li key={attachment.attachmentId}>
            <div><strong>{attachment.originalName}</strong><small>{(Number(attachment.fileSize) / 1024).toFixed(1)}KB</small></div>
            <a href={`/api/communities/attachments/${attachment.attachmentId}/download`}>다운로드</a>
            {manageAttachments && <button type="button" className="community__danger" onClick={() => deleteAttachment(attachment.attachmentId)} disabled={attachmentLoading}>삭제</button>}
          </li>)}
        </ul>}
      {manageAttachments && attachments.length < MAX_ATTACHMENT_COUNT && <div className="community__attachment-upload">
        <strong>파일 추가</strong>
        <input type="file" multiple accept=".pdf,.txt,.docx,.xlsx,.zip" onChange={(event) => selectAttachments(event, 'file')} disabled={attachmentLoading} />
        {pendingFiles.length > 0 && <span>{pendingFiles.length}개 파일 선택</span>}
        <button type="button" onClick={() => uploadAttachments(pendingFiles, setPendingFiles)} disabled={attachmentLoading || pendingFiles.length === 0}>{attachmentLoading ? '처리 중...' : '파일 등록'}</button>
      </div>}
    </div>
  </section>

  return <main className="community">
    <CommunityNavigation section={isTeamPost ? 'teams' : 'free'} teamName={post.teamName || ''} />
    {actionError && <p className="community__form-error" role="alert">{actionError}</p>}

    {editing ? <form className="community__write-form" onSubmit={updatePost}>
      <label>카테고리
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={actionLoading}>
          {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryType}</option>)}
        </select>
      </label>
      <label>구단
        <select value={teamId} onChange={(event) => setTeamId(event.target.value)} disabled={actionLoading}>
          <option value="">자유게시판</option>
          {teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.teamNameKor || team.teamName}</option>)}
        </select>
      </label>
      <label>제목
        <input type="text" maxLength="255" value={title} onChange={(event) => setTitle(event.target.value)} disabled={actionLoading} />
      </label>
      <label>내용
        <textarea rows="14" value={content} onChange={(event) => setContent(limitContent(event.target.value))} disabled={actionLoading} />
        <small className="community__character-count">{contentLength(content)} / {POST_CONTENT_MAX_LENGTH}</small>
      </label>
      {renderAttachments(true)}
      <div className="community__form-actions">
        <button type="button" onClick={() => { setEditing(false); setActionError(''); setAttachmentError(''); setPendingImages([]); setPendingFiles([]) }} disabled={actionLoading}>취소</button>
        <button type="submit" className="community__submit" disabled={actionLoading}>{actionLoading ? '수정 중...' : '수정 완료'}</button>
      </div>
    </form> : <article className="community__detail">
      <header>
        <span className={`community__badge ${isTeamPost ? 'community__badge--team' : ''}`}>{post.teamName || post.categoryType || '자유게시판'}</span>
        <h1>{post.title}</h1>
        <dl className="community__post-meta">
          <div><dt>작성자</dt><dd>{post.nickname}</dd></div>
          <div><dt>작성일</dt><dd><time dateTime={post.createdAt}>{post.createdAt?.replace('T', ' ').slice(0, 16)}</time></dd></div>
          <div><dt>조회수</dt><dd>{post.viewCount}</dd></div>
          <div><dt>추천수</dt><dd>{post.likeCount}</dd></div>
        </dl>
      </header>
      <div className="community__post-body">{post.content}</div>
      {renderAttachments(false)}
    </article>}

    <div className="community__detail-actions">
      <a className="community__main-link" href={backTo}>목록으로 돌아가기</a>
      <button
        type="button"
        className={liked ? 'community__like community__like--active' : 'community__like'}
        onClick={toggleLike}
        disabled={likeLoading}
        aria-pressed={liked}
      >
        {likeLoading ? '처리 중...' : liked ? '추천 취소' : isLoggedIn ? '추천' : '로그인 후 추천'}
      </button>
      {isOwner && !editing && <>
        <button type="button" onClick={startEditing} disabled={actionLoading}>수정</button>
        <button type="button" className="community__danger" onClick={deletePost} disabled={actionLoading}>삭제</button>
      </>}
    </div>
    {!isOwner && <p className="community__notice">수정과 삭제는 게시글 작성자만 사용할 수 있습니다.</p>}

    <section className="community__comments" aria-labelledby="community-comments-title">
      <h2 id="community-comments-title">댓글 <span>{visibleCommentCount}</span></h2>
      {commentsError && <p className="community__form-error" role="alert">{commentsError}</p>}

      <div className="community__comment-list">
        {rootComments.length === 0 && !commentsError && <p className="community__comment-empty">첫 댓글을 작성해보세요.</p>}
        {rootComments.map((comment) => <div className="community__comment-group" key={comment.commentId}>
          <article className="community__comment">
            {renderComment(comment, true)}
          </article>
          {comments.filter((reply) => Number(getParentCommentId(reply)) === Number(comment.commentId)).map((reply) =>
            <div className="community__reply-row" key={reply.commentId}>
              <span className="community__reply-marker" aria-hidden="true">ㄴ</span>
              <article className="community__comment community__comment--reply">
                <span className="community__reply-badge">답글</span>
                {renderComment(reply, false)}
              </article>
            </div>
          )}
        </div>)}
      </div>

      <form className="community__comment-form" onSubmit={createComment}>
        {replyTarget && <div className="community__reply-target">
          <span><strong>{replyTarget.nickname}</strong>님에게 답글 작성</span>
          <button type="button" onClick={() => setReplyTarget(null)}>답글 취소</button>
        </div>}
        <label htmlFor="community-comment">{replyTarget ? '대댓글 내용' : '댓글 내용'}</label>
        <textarea
          id="community-comment"
          rows="4"
          value={commentContent}
          onChange={(event) => setCommentContent(limitComment(event.target.value))}
          placeholder={isLoggedIn ? '내용을 입력해주세요.' : '로그인 후 댓글을 작성할 수 있습니다.'}
          disabled={commentLoading}
        />
        <span className="community__character-count">{commentLength(commentContent)} / {COMMENT_MAX_LENGTH}</span>
        <button type="submit" className="community__submit" disabled={commentLoading}>
          {commentLoading ? '등록 중...' : isLoggedIn ? replyTarget ? '대댓글 등록' : '댓글 등록' : '로그인'}
        </button>
      </form>
    </section>
  </main>
}
