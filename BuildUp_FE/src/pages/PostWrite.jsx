import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTeams, fetchCategories } from '../store/teamSlice.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import { getAppSearchParams } from '../utils/searchParams.js'
import { navigate } from '../utils/navigation.js'
import '../css/Community.css'

function WriteSelect({ label, value, options, onChange, disabled, searchable = false }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef(null)
  const trigger = useRef(null)
  const selected = options.find((option) => String(option.value) === String(value))
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
  useEffect(() => {
    if (!open) return
    const closeOutside = (event) => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])
  useEffect(() => { if (disabled) setOpen(false) }, [disabled])
  return <div className="community__write-select" ref={root} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus() }
    if (open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && event.target.tagName !== 'INPUT') {
      event.preventDefault()
      const buttons = [...root.current.querySelectorAll('.community__write-option:not(:disabled)')]
      const index = buttons.indexOf(document.activeElement)
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
      buttons[next]?.focus()
    }
  }}>
    <span className="community__write-select-label">{label}</span>
    <button ref={trigger} type="button" className="community__write-select-trigger" aria-label={`${label}: ${selected?.label || '선택해주세요'}`} aria-expanded={open} disabled={disabled}
      onClick={() => { setOpen(!open); setQuery('') }}>
      <span>{selected?.label || '선택해주세요'}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} /></svg>
    </button>
    {open && <div className="community__write-select-menu" role="group" aria-label={`${label} 선택`}>
      {searchable && <input type="search" aria-label="구단 검색" placeholder="구단 이름 검색" value={query} onChange={(event) => setQuery(event.target.value)} />}
      <div className="community__write-select-options">
        {filtered.map((option) => <button key={option.value} type="button" className={`community__write-option${option.favorite ? ' community__favorite-team' : ''}`} disabled={option.disabled} aria-pressed={String(value) === String(option.value)}
          onClick={() => { onChange(String(option.value)); setOpen(false); trigger.current?.focus() }}>
          <span>{option.label}{option.favorite && <small className="community__favorite-label">애정팀</small>}</span>{String(value) === String(option.value) && <span aria-hidden="true">✓</span>}
        </button>)}
        {!filtered.length && <p>일치하는 구단이 없습니다.</p>}
      </div>
    </div>}
  </div>
}

const MAX_ATTACHMENT_COUNT = 5
const POST_TITLE_MAX_LENGTH = 50
const POST_CONTENT_MAX_LENGTH = 1000
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
const MAX_ATTACHMENT_TOTAL_SIZE = 20 * 1024 * 1024
const IMAGE_ATTACHMENT_PATTERN = /\.(jpe?g|png|gif|webp|heic|heif)$/i
const FILE_ATTACHMENT_PATTERN = /\.(pdf|txt|docx|xlsx|zip)$/i
const SHOWCASE_DRAFT_KEY = 'plugin:community:showcase-draft'
const titleLength = (value) => Array.from(value).length
const limitTitle = (value) => Array.from(value).slice(0, POST_TITLE_MAX_LENGTH).join('')
const contentLength = (value) => Array.from(value).length
const limitContent = (value) => Array.from(value).slice(0, POST_CONTENT_MAX_LENGTH).join('')
const isNewsCategory = (category) => ['뉴스', 'NEWS'].includes(category?.categoryType?.trim().toUpperCase())

export default function PostWrite() {
  const dispatch = useDispatch()
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
  const user = useSelector((state) => state.auth.user)
  const isFavoriteTeam = (team) => user?.favoriteTeamId != null && String(team.teamId) === String(user.favoriteTeamId)
  const { teams, categories, teamsLoaded, categoriesLoaded, teamsError, categoriesError } = useSelector((state) => state.team)

  const postWriteSearchParams = getAppSearchParams()
  const requestedBoard = postWriteSearchParams.get('board')
  const initialBoard = ['team', 'showcase'].includes(requestedBoard) ? requestedBoard : 'free'
  const requestedCustomTeamId = postWriteSearchParams.get('customTeamId')
  const [board, setBoard] = useState(initialBoard)
  const [selectedCategoryId, setCategoryId] = useState('')
  const categoryId = selectedCategoryId || String(categories.find((category) => !isNewsCategory(category))?.categoryId ?? '')
  const [teamId, setTeamId] = useState('')
  const [showcaseDraft] = useState(() => {
    if (initialBoard !== 'showcase') return null
    try {
      const draft = JSON.parse(sessionStorage.getItem(SHOWCASE_DRAFT_KEY))
      return draft && (!requestedCustomTeamId || Number(draft.customTeamId) === Number(requestedCustomTeamId)) ? draft : null
    } catch { return null }
  })
  const [title, setTitle] = useState(() => {
    if (!showcaseDraft) return ''
    const name = showcaseDraft.teamName || '나만의 팀'
    return limitTitle(name + (name.trim().endsWith('스쿼드') ? '를 소개합니다' : ' 스쿼드를 소개합니다'))
  })
  const [content, setContent] = useState(() => {
    if (!showcaseDraft) return ''
    const lineup = Array.isArray(showcaseDraft.players) ? showcaseDraft.players.map((player) => player.position + ' · ' + player.name).join('\n') : ''
    return limitContent('포메이션: ' + (showcaseDraft.formation || '미지정') + '\n\n' + lineup + '\n\n선수 배치 이유와 전술을 소개해주세요.')
  })
  const [imageAttachments, setImageAttachments] = useState([])
  const [fileAttachments, setFileAttachments] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setError] = useState('')
  const error = submitError || categoriesError || teamsError
  const [customTeam, setCustomTeam] = useState(null)
  const submitRequestRef = useRef(false)
  const attachments = [...imageAttachments, ...fileAttachments]

  const loading = !teamsLoaded || !categoriesLoaded

  // 글 작성에 필요한 카테고리와 실제 DB 구단 목록을 Redux Thunk로 로드합니다.
  useEffect(() => {
    dispatch(fetchTeams())
    dispatch(fetchCategories())
  }, [dispatch])

  // 자랑글 작성 시 로그인 사용자가 저장한 나만의 팀을 불러옵니다.
  useEffect(() => {
    if (board !== 'showcase' || !isLoggedIn) return
    let active = true
    const loadCustomTeam = async () => {
      try {
        const token = localStorage.getItem('buildup_token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const response = await fetch('/api/customs', { credentials: 'include', headers })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.customTeamId) throw new Error(result?.message || '저장된 나만의 팀이 없습니다.')
        if (requestedCustomTeamId && Number(requestedCustomTeamId) !== Number(result.customTeamId)) {
          throw new Error('공유할 나만의 팀을 확인할 수 없습니다.')
        }
        if (active) setCustomTeam(result)
      } catch (exception) {
        if (active) {
          setCustomTeam(null)
          setError(exception.message || '나만의 팀을 불러오지 못했습니다.')
        }
      }
    }
    loadCustomTeam()
    return () => { active = false }
  }, [board, isLoggedIn, requestedCustomTeamId])

  // 이미지와 일반 첨부파일을 각각 검사하여 선택 목록에 저장합니다.
  const selectAttachments = (event, type) => {
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    const otherFiles = type === 'image' ? fileAttachments : imageAttachments
    const pattern = type === 'image' ? IMAGE_ATTACHMENT_PATTERN : FILE_ATTACHMENT_PATTERN
    const automaticImageCount = board === 'showcase' && showcaseDraft?.imageDataUrl ? 1 : 0
    if (selected.length + otherFiles.length + automaticImageCount > MAX_ATTACHMENT_COUNT) {
      setError(`스쿼드 이미지를 포함해 첨부파일은 최대 ${MAX_ATTACHMENT_COUNT}개까지 선택할 수 있습니다.`)
      return
    }
    if (selected.some((file) => file.size <= 0 || file.size > 30 * 1024 * 1024)) {
      setError('파일 하나의 크기는 30MB 이하여야 합니다.')
      return
    }
    if ([...selected, ...otherFiles].reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024) {
      setError('첨부파일 전체 크기는 50MB 이하여야 합니다.')
      return
    }
    const isImageFile = (file) => (file.type && file.type.startsWith('image/')) || pattern.test(file.name)
    if (type === 'image' && selected.some((file) => !isImageFile(file))) {
      setError('이미지 파일만 등록할 수 있습니다. (JPG, PNG, GIF, WEBP, HEIC 등)')
      return
    }
    if (type === 'file' && selected.some((file) => !pattern.test(file.name))) {
      setError('PDF, TXT, DOCX, XLSX, ZIP 파일만 첨부할 수 있습니다.')
      return
    }
    setError('')
    if (type === 'image') setImageAttachments(selected)
    else setFileAttachments(selected)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitRequestRef.current) return
    setError('')

    if (!categoryId) return setError('카테고리를 선택해주세요.')
    if (board === 'team' && !teamId) return setError('팀별 게시글의 구단을 선택해주세요.')
    if (board === 'showcase' && !customTeam?.customTeamId) return setError('먼저 나만의 팀에서 스쿼드를 저장해주세요.')
    if (board === 'showcase' && !showcaseDraft?.imageDataUrl) return setError('공유할 스쿼드 이미지를 확인하지 못했습니다. 나만의 팀에서 다시 공유해주세요.')
    if (!title.trim()) return setError('제목을 입력해주세요.')
    if (titleLength(title.trim()) > POST_TITLE_MAX_LENGTH) return setError(`제목은 ${POST_TITLE_MAX_LENGTH}자까지 입력할 수 있습니다.`)
    if (!content.trim()) return setError('내용을 입력해주세요.')
    if (contentLength(content.trim()) > POST_CONTENT_MAX_LENGTH) return setError(`내용은 ${POST_CONTENT_MAX_LENGTH}자까지 입력할 수 있습니다.`)

    submitRequestRef.current = true
    setSubmitting(true)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const response = await fetch('/api/communities', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          boardType: board,
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
      const uploadHeaders = token ? { Authorization: `Bearer ${token}` } : {}

      // 자랑글 대표 이미지를 먼저 등록하고 실패하면 생성된 게시글도 숨김 처리합니다.
      if (board === 'showcase' && showcaseDraft?.imageDataUrl) {
        try {
          const imageResponse = await fetch(showcaseDraft.imageDataUrl)
          if (!imageResponse.ok) throw new Error('스쿼드 이미지를 읽지 못했습니다.')
          const squadImageBlob = await imageResponse.blob()
          const showcaseFormData = new FormData()
          showcaseFormData.append('files', new File([squadImageBlob], `plugin-squad-${createdPostId}.png`, { type: 'image/png' }))
          showcaseFormData.append('showcaseImage', 'true')
          const showcaseResponse = await fetch(`/api/communities/${createdPostId}/attachments`, {
            method: 'POST',
            headers: uploadHeaders,
            body: showcaseFormData,
          })
          const isJson = showcaseResponse.headers.get('content-type')?.includes('application/json')
          const showcaseResult = isJson ? await showcaseResponse.json() : null
          if (!showcaseResponse.ok) throw new Error(showcaseResult?.message || '스쿼드 이미지 등록에 실패했습니다.')
          sessionStorage.removeItem(SHOWCASE_DRAFT_KEY)
        } catch (showcaseException) {
          let cleanupSucceeded = false
          try {
            const cleanupResponse = await fetch(`/api/communities/${createdPostId}`, {
              method: 'DELETE',
              headers: uploadHeaders,
            })
            cleanupSucceeded = cleanupResponse.ok
          } catch {
            cleanupSucceeded = false
          }
          if (!cleanupSucceeded) {
            throw new Error(`${showcaseException.message} 생성된 게시글 정리에도 실패했습니다. 게시글 목록에서 삭제해주세요.`)
          }
          throw new Error(`${showcaseException.message} 게시글 등록을 취소했습니다.`)
        }
      }

      if (attachments.length > 0) {
        // 게시글 저장 후 업로드 실패는 글 재등록 대신 상세 화면에서 복구합니다.
        try {
          const formData = new FormData()
          attachments.forEach((file, idx) => {
            let uploadFile = file
            if (!file.name || !file.name.includes('.')) {
              const ext = file.type?.includes('png') ? '.png' : file.type?.includes('gif') ? '.gif' : file.type?.includes('webp') ? '.webp' : '.jpg'
              uploadFile = new File([file], `mobile-upload-${Date.now()}-${idx}${ext}`, { type: file.type || 'image/jpeg' })
            }
            formData.append('files', uploadFile)
          })
          const uploadResponse = await fetch(`/api/communities/${createdPostId}/attachments`, {
            method: 'POST',
            headers: uploadHeaders,
            body: formData,
          })
          const isJson = uploadResponse.headers.get('content-type')?.includes('application/json')
          const uploadResult = isJson ? await uploadResponse.json() : null
          if (!uploadResponse.ok) {
            throw new Error(uploadResult?.message || '첨부파일 업로드에 실패했습니다.')
          }
        } catch {
          attachmentFailed = true
        }
      }

      const query = new URLSearchParams({ from: '/plug/community' })
      if (attachmentFailed) query.set('attachmentError', '1')
      navigate(`/plug/community/posts/${createdPostId}?${query.toString()}`)
    } catch (exception) {
      setError(exception.message || '게시글 등록에 실패했습니다.')
    } finally {
      submitRequestRef.current = false
      setSubmitting(false)
    }
  }

  if (!isLoggedIn) return <main className="community">
    <CommunityNavigation />
    <p className="community__eyebrow">POST WRITE</p>
    <h1>로그인이 필요합니다.</h1>
    <p className="community__intro">게시글을 작성하려면 먼저 로그인해주세요.</p>
    <a className="community__main-link" href="#/plug/login">로그인 페이지로 이동</a>
  </main>

  return <main className="community">
    <CommunityNavigation />
    <p className="community__eyebrow">POST WRITE</p>
    <h1>게시글 작성</h1>
    <p className="community__intro">작성자: {user?.nickname || user?.loginId}</p>

    <div className="community__write-layout">
    <div className="community__write-column">
    {error && <p className="community__form-error" role="alert">{error}</p>}
    <form className="community__write-form" onSubmit={handleSubmit}>
      {initialBoard === 'showcase' ? <p className="community__notice">게시판 · <strong>나만의 팀 자랑</strong><br />공유한 스쿼드는 자랑 게시판에 등록됩니다.</p> : <fieldset disabled={loading || submitting}>
        <legend>게시판 선택</legend>
        {[
          { value: 'free', title: '자유게시판', description: '모든 팬과 나누는 축구 이야기', icon: <path d="M21 11a8 8 0 0 1-8 8H7l-4 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8ZM7 8h8M7 12h5" /> },
          { value: 'team', title: '팀별 게시판', description: '같은 팀을 응원하는 팬들과 함께', icon: <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6" /> },
          { value: 'showcase', title: '나만의 팀 자랑', description: '직접 만든 스쿼드와 전술 공유', icon: <><path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v6M8 21h8" /></> },
        ].map((option) => <label className="community__board-choice" key={option.value}>
          <input type="radio" name="board" value={option.value} checked={board === option.value} onChange={() => { setBoard(option.value); if (option.value !== 'team') setTeamId('') }} />
          <span className="community__board-card">
            <span className="community__board-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{option.icon}</svg></span>
            <span className="community__board-copy"><strong>{option.title}</strong><small>{option.description}</small></span>
            <span className="community__board-check" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg></span>
          </span>
        </label>)}
      </fieldset>}

      {board === 'showcase' && <section className="community__shared-team" aria-label="공유할 나만의 팀">
        <div>
          <strong>{customTeam?.teamName || '나만의 팀을 불러오는 중입니다.'}</strong>
          {customTeam && <span>포메이션 {customTeam.formation} · 선수 {customTeam.squads?.length || 0}명</span>}
          {showcaseDraft?.imageDataUrl && <small>이 포메이션 이미지는 게시글 등록 시 자동으로 첨부됩니다.</small>}
        </div>
        {showcaseDraft?.imageDataUrl && <img src={showcaseDraft.imageDataUrl} alt={`${showcaseDraft.teamName || '나만의 팀'} 포메이션 미리보기`} />}
      </section>}

      {board !== 'showcase' && <WriteSelect label="카테고리" value={categoryId} onChange={setCategoryId} disabled={loading || submitting || categories.length === 0}
        options={categories.length ? categories.map((category) => ({ value: category.categoryId, label: `${category.categoryType}${isNewsCategory(category) ? ' (작성 준비 중)' : ''}`, disabled: isNewsCategory(category) })) : [{ value: '', label: '등록된 카테고리가 없습니다.' }]} />}

      {board === 'team' && <WriteSelect label="구단" value={teamId} onChange={setTeamId} disabled={loading || submitting} searchable
        options={[{ value: '', label: '구단을 선택해주세요.' }, ...[...teams].sort((a, b) => Number(isFavoriteTeam(b)) - Number(isFavoriteTeam(a))).map((team) => ({ value: team.teamId, label: team.teamNameKor || team.teamName, favorite: isFavoriteTeam(team) }))]} />}

      <label>제목
        <input type="text" value={title} onChange={(event) => setTitle(limitTitle(event.target.value))} disabled={loading || submitting} />
        <small className="community__character-count">{titleLength(title)} / {POST_TITLE_MAX_LENGTH}</small>
      </label>

      <label>내용
        <textarea rows="14" value={content} onChange={(event) => setContent(limitContent(event.target.value))} disabled={loading || submitting} />
        <small className="community__character-count">{contentLength(content)} / {POST_CONTENT_MAX_LENGTH}</small>
      </label>

      <label className="community__file-picker">이미지
        <input
          type="file"
          multiple
          accept="image/*,image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
          onChange={(event) => selectAttachments(event, 'image')}
          disabled={loading || submitting}
        />
        <span className="community__file-trigger">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 6-6 4 4 3-3 5 5" /></svg>
          <span>이미지 첨부</span><small>{imageAttachments.length ? `${imageAttachments.length}개 선택됨` : 'JPG · PNG · GIF · WEBP'}</small>
        </span>
        <small>본문 아래 이미지 영역에 미리보기로 표시됩니다.</small>
      </label>
      {imageAttachments.length > 0 && <ul className="community__selected-files">
        {imageAttachments.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}>
          <span>{file.name} ({(file.size / 1024).toFixed(1)}KB)</span>
          <button type="button" onClick={() => setImageAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={submitting}>제거</button>
        </li>)}
      </ul>}

      <label className="community__file-picker">일반 첨부파일
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.xlsx,.zip"
          onChange={(event) => selectAttachments(event, 'file')}
          disabled={loading || submitting}
        />
        <span className="community__file-trigger">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 13 7-7a3 3 0 0 1 4 4l-9 9a5 5 0 0 1-7-7l9-9M6 15l8-8" /></svg>
          <span>파일 첨부</span><small>{fileAttachments.length ? `${fileAttachments.length}개 선택됨` : 'PDF · TXT · DOCX · XLSX · ZIP'}</small>
        </span>
        <small>다운로드 목록에 표시됩니다. 이미지와 합쳐 최대 5개, 파일당 10MB, 전체 20MB까지 등록할 수 있습니다.</small>
      </label>
      {fileAttachments.length > 0 && <ul className="community__selected-files">
        {fileAttachments.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}>
          <span>{file.name} ({(file.size / 1024).toFixed(1)}KB)</span>
          <button type="button" onClick={() => setFileAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={submitting}>제거</button>
        </li>)}
      </ul>}

      <div className="community__form-actions">
        <a className="community__main-link" href="#/plug/community">취소</a>
        <button type="submit" className="community__submit" disabled={loading || submitting || categories.length === 0}>
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
    </div>
    <aside className="community__write-ad" aria-label="광고 영역">
      <span className="community__ad-label">광고 · ADVERTISEMENT</span>
      <div className="community__vertical-ad">
        <picture>
          <source media="(max-width: 1000px)" srcSet={`${import.meta.env.BASE_URL}je-mobile.png`} width="2172" height="724" />
          <img src={`${import.meta.env.BASE_URL}je.png`} width="300" height="600" alt="제때약 — 내 약을 제때, 더 안전하게." />
        </picture>
      </div>
    </aside>
    </div>
  </main>
}
