import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTeams, fetchCategories } from '../store/teamSlice.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import '../css/Community.css'

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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!categoryId) return setError('카테고리를 선택해주세요.')
    if (board === 'team' && !teamId) return setError('팀별 게시글의 구단을 선택해주세요.')
    if (!title.trim()) return setError('제목을 입력해주세요.')
    if (!content.trim()) return setError('내용을 입력해주세요.')

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
      window.location.assign(createdPostId
        ? `/plug/community/posts/${createdPostId}?from=${encodeURIComponent('/plug/community')}`
        : '/plug/community')
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
        <input type="text" maxLength="255" value={title} onChange={(event) => setTitle(event.target.value)} disabled={loading || submitting} />
      </label>

      <label>내용
        <textarea rows="14" value={content} onChange={(event) => setContent(event.target.value)} disabled={loading || submitting} />
      </label>

      <div className="community__form-actions">
        <a className="community__main-link" href="/plug/community">취소</a>
        <button type="submit" className="community__submit" disabled={loading || submitting || categories.length === 0}>
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
  </main>
}
