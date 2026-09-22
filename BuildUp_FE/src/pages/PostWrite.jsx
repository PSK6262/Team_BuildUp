import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTeams, fetchCategories } from '../store/teamSlice.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import '../css/Community.css'

const MAX_ATTACHMENT_COUNT = 5
const POST_TITLE_MAX_LENGTH = 50
const POST_CONTENT_MAX_LENGTH = 1000
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
const MAX_ATTACHMENT_TOTAL_SIZE = 20 * 1024 * 1024
const IMAGE_ATTACHMENT_PATTERN = /\.(jpe?g|png|gif|webp)$/i
const FILE_ATTACHMENT_PATTERN = /\.(pdf|txt|docx|xlsx|zip)$/i
const titleLength = (value) => Array.from(value).length
const limitTitle = (value) => Array.from(value).slice(0, POST_TITLE_MAX_LENGTH).join('')
const contentLength = (value) => Array.from(value).length
const limitContent = (value) => Array.from(value).slice(0, POST_CONTENT_MAX_LENGTH).join('')

export default function PostWrite() {
  const dispatch = useDispatch()
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
  const user = useSelector((state) => state.auth.user)
  const { teams, categories, teamsLoaded, categoriesLoaded, teamsError, categoriesError } = useSelector((state) => state.team)

  const initialBoard = new URLSearchParams(window.location.search).get('board') === 'team' ? 'team' : 'free'
  const [board, setBoard] = useState(initialBoard)
  const [categoryId, setCategoryId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageAttachments, setImageAttachments] = useState([])
  const [fileAttachments, setFileAttachments] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const attachments = [...imageAttachments, ...fileAttachments]

  const loading = !teamsLoaded || !categoriesLoaded

  // 글 작성에 필요한 카테고리와 실제 DB 구단 목록을 Redux Thunk로 로드합니다.
  useEffect(() => {
    dispatch(fetchTeams())
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(String(categories[0].categoryId))
    }
  }, [categories, categoryId])

  useEffect(() => {
    if (teamsError || categoriesError) {
      setError(categoriesError || teamsError || '글쓰기 정보를 불러오지 못했습니다.')
    }
  }, [teamsError, categoriesError])

  // 이미지와 일반 첨부파일을 각각 검사하여 선택 목록에 저장합니다.
  const selectAttachments = (event, type) => {
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    const otherFiles = type === 'image' ? fileAttachments : imageAttachments
    const pattern = type === 'image' ? IMAGE_ATTACHMENT_PATTERN : FILE_ATTACHMENT_PATTERN
    if (selected.length + otherFiles.length > MAX_ATTACHMENT_COUNT) {
      setError(`이미지와 첨부파일을 합쳐 최대 ${MAX_ATTACHMENT_COUNT}개까지 선택할 수 있습니다.`)
      return
    }
    if (selected.some((file) => file.size <= 0 || file.size > MAX_ATTACHMENT_SIZE)) {
      setError('파일 하나의 크기는 10MB 이하여야 합니다.')
      return
    }
    if ([...selected, ...otherFiles].reduce((sum, file) => sum + file.size, 0) > MAX_ATTACHMENT_TOTAL_SIZE) {
      setError('첨부파일 전체 크기는 20MB 이하여야 합니다.')
      return
    }
    if (selected.some((file) => !pattern.test(file.name))) {
      setError(type === 'image'
        ? 'JPG, PNG, GIF, WEBP 이미지만 등록할 수 있습니다.'
        : 'PDF, TXT, DOCX, XLSX, ZIP 파일만 첨부할 수 있습니다.')
      return
    }
    setError('')
    if (type === 'image') setImageAttachments(selected)
    else setFileAttachments(selected)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!categoryId) return setError('카테고리를 선택해주세요.')
    if (board === 'team' && !teamId) return setError('팀별 게시글의 구단을 선택해주세요.')
    if (!title.trim()) return setError('제목을 입력해주세요.')
    if (titleLength(title.trim()) > POST_TITLE_MAX_LENGTH) return setError(`제목은 ${POST_TITLE_MAX_LENGTH}자까지 입력할 수 있습니다.`)
    if (!content.trim()) return setError('내용을 입력해주세요.')
    if (contentLength(content.trim()) > POST_CONTENT_MAX_LENGTH) return setError(`내용은 ${POST_CONTENT_MAX_LENGTH}자까지 입력할 수 있습니다.`)

    setSubmitting(true)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const response = await fetch('/api/communities', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          categoryId: Number(categoryId),
          teamId: board === 'team' ? Number(teamId) : null,
          title: title.trim(),
          content: content.trim(),
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || '게시글 등록에 실패했습니다.')
      }

      const createdPostId = result.data?.postId
      if (!createdPostId) throw new Error('등록된 게시글 번호를 확인하지 못했습니다.')

      let attachmentFailed = false
      if (attachments.length > 0) {
        const formData = new FormData()
        attachments.forEach((file) => formData.append('files', file))
        const uploadHeaders = token ? { Authorization: `Bearer ${token}` } : {}
        const uploadResponse = await fetch(`/api/communities/${createdPostId}/attachments`, {
          method: 'POST',
          headers: uploadHeaders,
          body: formData,
        })
        const isJson = uploadResponse.headers.get('content-type')?.includes('application/json')
        const uploadResult = isJson ? await uploadResponse.json() : null
        if (!uploadResponse.ok) {
          attachmentFailed = true
          window.alert(uploadResult?.message || '게시글은 등록되었지만 첨부파일 업로드에 실패했습니다. 상세 화면에서 다시 등록해주세요.')
        }
      }

      const query = new URLSearchParams({ from: '/plug/community' })
      if (attachmentFailed) query.set('attachmentError', '1')
      window.location.assign(`/plug/community/posts/${createdPostId}?${query.toString()}`)
    } catch (exception) {
      setError(exception.message || '게시글 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoggedIn) return <main className="community">
    <CommunityNavigation />
    <p className="community__eyebrow">POST WRITE</p>
    <h1>로그인이 필요합니다.</h1>
    <p className="community__intro">게시글을 작성하려면 먼저 로그인해주세요.</p>
    <a className="community__main-link" href="/plug/login">로그인 페이지로 이동</a>
  </main>

  return <main className="community">
    <CommunityNavigation />
    <p className="community__eyebrow">POST WRITE</p>
    <h1>게시글 작성</h1>
    <p className="community__intro">작성자: {user?.nickname || user?.loginId}</p>

    {error && <p className="community__form-error" role="alert">{error}</p>}
    <form className="community__write-form" onSubmit={handleSubmit}>
      <fieldset disabled={loading || submitting}>
        <legend>게시판 선택</legend>
        <label><input type="radio" name="board" value="free" checked={board === 'free'} onChange={() => { setBoard('free'); setTeamId('') }} /> 자유게시판</label>
        <label><input type="radio" name="board" value="team" checked={board === 'team'} onChange={() => setBoard('team')} /> 팀별 게시판</label>
      </fieldset>

      <label>카테고리
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={loading || submitting || categories.length === 0}>
          {categories.length === 0 && <option value="">등록된 카테고리가 없습니다.</option>}
          {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryType}</option>)}
        </select>
      </label>

      {board === 'team' && <label>구단
        <select value={teamId} onChange={(event) => setTeamId(event.target.value)} disabled={loading || submitting}>
          <option value="">구단을 선택해주세요.</option>
          {teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.teamNameKor || team.teamName}</option>)}
        </select>
      </label>}

      <label>제목
        <input type="text" value={title} onChange={(event) => setTitle(limitTitle(event.target.value))} disabled={loading || submitting} />
        <small className="community__character-count">{titleLength(title)} / {POST_TITLE_MAX_LENGTH}</small>
      </label>

      <label>내용
        <textarea rows="14" value={content} onChange={(event) => setContent(limitContent(event.target.value))} disabled={loading || submitting} />
        <small className="community__character-count">{contentLength(content)} / {POST_CONTENT_MAX_LENGTH}</small>
      </label>

      <label>이미지
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(event) => selectAttachments(event, 'image')}
          disabled={loading || submitting}
        />
        <small>본문 아래 이미지 영역에 미리보기로 표시됩니다.</small>
      </label>
      {imageAttachments.length > 0 && <ul className="community__selected-files">
        {imageAttachments.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}>
          <span>{file.name} ({(file.size / 1024).toFixed(1)}KB)</span>
          <button type="button" onClick={() => setImageAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={submitting}>제거</button>
        </li>)}
      </ul>}

      <label>일반 첨부파일
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.xlsx,.zip"
          onChange={(event) => selectAttachments(event, 'file')}
          disabled={loading || submitting}
        />
        <small>다운로드 목록에 표시됩니다. 이미지와 합쳐 최대 5개, 파일당 10MB, 전체 20MB까지 등록할 수 있습니다.</small>
      </label>
      {fileAttachments.length > 0 && <ul className="community__selected-files">
        {fileAttachments.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}>
          <span>{file.name} ({(file.size / 1024).toFixed(1)}KB)</span>
          <button type="button" onClick={() => setFileAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={submitting}>제거</button>
        </li>)}
      </ul>}

      <div className="community__form-actions">
        <a className="community__main-link" href="/plug/community">취소</a>
        <button type="submit" className="community__submit" disabled={loading || submitting || categories.length === 0}>
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
  </main>
}
