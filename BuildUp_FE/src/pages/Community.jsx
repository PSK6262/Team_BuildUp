import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTeams, fetchCategories } from '../store/teamSlice.js'
import useBoardState from './useBoardState.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import '../css/Community.css'

const PAGE_SIZE = 10

// 목록에서는 제목을 30자까지 표시합니다.
function formatPostTitle(title, commentCount) {
  const characters = Array.from(title || '')
  const isTruncated = characters.length > 30
  const visibleTitle = isTruncated ? `${characters.slice(0, 30).join('')}...` : characters.join('')
  return <span className="community__title-with-comments"><span className="community__title-text">{visibleTitle}</span>{Number(commentCount) > 0 && <span className="community__comment-count" aria-label={`댓글 ${commentCount}개`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 4V6a2 2 0 0 1 2-2Z" /></svg>{commentCount}</span>}</span>
}

// 운영체제 기본 선택창 대신 커뮤니티 디자인과 동일한 드롭다운을 표시합니다.
function CommunitySelect({ label, value, options, onChange, disabled = false, wide = false }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const selectedOption = options.find((option) => String(option.value) === String(value)) || options[0]

  useEffect(() => {
    if (!open) return undefined

    const closeOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeWithEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [open])

  return (
    <div className={`community__custom-select${wide ? ' community__custom-select--wide' : ''}`} ref={containerRef}>
      <span className="community__custom-select-label">{label}</span>
      <button
        type="button"
        className="community__custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedOption?.label}</span>
        <span className="community__custom-select-arrow" aria-hidden="true">⌄</span>
      </button>
      {open && !disabled && (
        <ul className="community__custom-select-options" role="listbox" aria-label={label}>
          {options.map((option) => (
            <li key={option.value || 'all'}>
              <button
                type="button"
                role="option"
                className={option.favorite ? 'community__favorite-team' : undefined}
                aria-selected={String(option.value) === String(value)}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span>{option.label}{option.favorite && <small className="community__favorite-label">애정팀</small>}</span>
                {String(option.value) === String(value) && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Community({ selectedTeam = null }) {
  const favoriteTeamId = useSelector((state) => state.auth.user?.favoriteTeamId)
  const isFavoriteTeam = (team) => favoriteTeamId != null && String(team.teamId) === String(favoriteTeamId)
  const dispatch = useDispatch()
  const { teams, categories, teamsLoaded, categoriesLoaded } = useSelector((state) => state.team)
  const optionsLoading = !teamsLoaded || !categoriesLoaded

  const [input, setInput] = useBoardState('input', '')
  const [keyword, setKeyword] = useBoardState('keyword', '')
  const [board, setBoard] = useBoardState('board', 'all')
  const [teamId, setTeamId] = useBoardState('teamId', '')
  const [sort, setSort] = useBoardState('sort', 'latest')
  const [page, setPage] = useBoardState('page', 1)
  const [posts, setPosts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [postsLoading, setPostsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showcasePosts, setShowcasePosts] = useState([])
  const [showcaseLoading, setShowcaseLoading] = useState(false)
  const [showcaseError, setShowcaseError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  const selectedDbTeam = selectedTeam
    ? teams.find((team) => team.emblemUrl && team.emblemUrl === selectedTeam.emblemUrl)
    : null
  const selectedTeamName = selectedDbTeam?.teamNameKor || selectedDbTeam?.teamName || selectedTeam?.name || ''
  const teamMatchMissing = Boolean(selectedTeam && !optionsLoading && !selectedDbTeam)

  // 목록 검색에 필요한 실제 카테고리와 구단 정보를 Redux Thunk로 로드합니다.
  useEffect(() => {
    dispatch(fetchTeams())
    dispatch(fetchCategories())
  }, [dispatch])

  // 뒤로가기로 복원된 화면도 최신 조회수와 추천수를 다시 조회합니다.
  useEffect(() => {
    const refreshRestoredPage = (event) => {
      if (event.persisted) setRefreshVersion((version) => version + 1)
    }
    window.addEventListener('pageshow', refreshRestoredPage)
    return () => window.removeEventListener('pageshow', refreshRestoredPage)
  }, [])

  // 검색, 게시판, 구단, 정렬 및 페이지 조건으로 실제 게시글 목록을 조회합니다.
  useEffect(() => {
    if (categories.length === 0 || optionsLoading) return
    if (selectedTeam && !selectedDbTeam) {
      return
    }

    const controller = new AbortController()
    const loadPosts = async () => {
      setPostsLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        categories.forEach((category) => params.append('categoryIds', category.categoryId))
        params.set('board', selectedTeam ? 'team' : board)
        const requestedTeamId = selectedTeam ? selectedDbTeam.teamId : teamId
        if (requestedTeamId) params.set('teamId', requestedTeamId)
        params.set('keyword', keyword)
        params.set('sort', sort)
        params.set('page', page)
        params.set('size', PAGE_SIZE)

        const response = await fetch(`/api/communities?${params.toString()}`, { signal: controller.signal, cache: 'no-store' })
        const result = await response.json()
        if (!response.ok || !result.data) {
          throw new Error(result.message || '게시글 목록을 불러오지 못했습니다.')
        }
        setPosts(Array.isArray(result.data.items) ? result.data.items : [])
        setTotalCount(result.data.totalCount || 0)
        setTotalPages(result.data.totalPages || 0)
      } catch (exception) {
        if (exception.name !== 'AbortError') {
          setPosts([])
          setTotalCount(0)
          setTotalPages(0)
          setError(exception.message || '게시글 목록을 불러오지 못했습니다.')
        }
      } finally {
        if (!controller.signal.aborted) setPostsLoading(false)
      }
    }
    loadPosts()
    return () => controller.abort()
  }, [board, categories, keyword, optionsLoading, page, refreshVersion, selectedDbTeam, selectedTeam, sort, teamId])

  // 추천수가 높은 나만의 팀 자랑글 3개를 별도로 조회합니다.
  useEffect(() => {
    if (selectedTeam || categories.length === 0 || optionsLoading) return
    const controller = new AbortController()
    const loadShowcasePosts = async () => {
      setShowcaseLoading(true)
      setShowcaseError('')
      try {
        const params = new URLSearchParams({ board: 'showcase', keyword: '', sort: 'likes', page: '1', size: '3' })
        categories.forEach((category) => params.append('categoryIds', category.categoryId))
        const response = await fetch(`/api/communities?${params.toString()}`, { signal: controller.signal, cache: 'no-store' })
        const result = await response.json()
        if (!response.ok || !result.data) throw new Error(result.message || '자랑 인기글을 불러오지 못했습니다.')
        setShowcasePosts(Array.isArray(result.data.items) ? result.data.items : [])
      } catch (exception) {
        if (exception.name !== 'AbortError') setShowcaseError(exception.message || '자랑 인기글을 불러오지 못했습니다.')
      } finally {
        if (!controller.signal.aborted) setShowcaseLoading(false)
      }
    }
    loadShowcasePosts()
    return () => controller.abort()
  }, [categories, optionsLoading, refreshVersion, selectedTeam])

  const pageCount = Math.max(1, totalPages)

  return (
    <main className="community community--board community--landing">
      <header className="community__board-heading">
      <p className="community__eyebrow">PLUGIN COMMUNITY</p>
      <h1>{selectedTeam ? `${selectedTeamName} 게시판` : '커뮤니티'}</h1>
      <p className="community__intro">응원하는 팀 이야기부터 소소한 일상까지, 함께 나눠요.</p>
      </header>
      <CommunityNavigation section={selectedTeam ? 'teams' : 'main'} teamName={selectedTeamName} />
      <section className="community__controls" aria-label="게시글 검색과 필터">
      <form className="community__search community__main-search" role="search" onSubmit={(event) => {
        event.preventDefault(); setKeyword(input.trim()); setPage(1)
      }}>
        <label className="community__sr-only" htmlFor="community-search">게시글 제목 검색</label>
        <input id="community-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder={selectedTeam ? `${selectedTeamName} 게시글 제목 검색` : '전체 게시글 제목 검색'} />
        <button type="submit">검색</button>
      </form>
      <div className="community__filters">
        {!selectedTeam && <div className="community__board-buttons" role="group" aria-label="게시판 필터">
          {[['all', '전체'], ['free', '자유'], ['team', '팀별'], ['showcase', '자랑']].map(([value, label]) =>
            <button key={value} type="button" aria-pressed={board === value} onClick={() => { setBoard(value); if (value === 'free' || value === 'showcase') setTeamId(''); setPage(1) }}>{label}</button>)}
        </div>}
        <div className="community__selects">
          {!selectedTeam && <CommunitySelect
            label="팀"
            value={teamId}
            disabled={board === 'free' || board === 'showcase'}
            wide
            options={[{ value: '', label: '전체 팀' }, ...[...teams].sort((a, b) => Number(isFavoriteTeam(b)) - Number(isFavoriteTeam(a))).map((team) => ({ value: team.teamId, label: team.teamNameKor || team.teamName, favorite: isFavoriteTeam(team) }))]}
            onChange={(nextTeamId) => { setTeamId(nextTeamId); setPage(1) }}
          />}
          <CommunitySelect
            label="정렬"
            value={sort}
            options={[{ value: 'latest', label: '최신순' }, { value: 'likes', label: '추천순' }, { value: 'views', label: '조회순' }]}
            onChange={(nextSort) => { setSort(nextSort); setPage(1) }}
          />
          <button className="community__reset" type="button" disabled={!keyword && !input && board === 'all' && !teamId && sort === 'latest'} onClick={() => { setInput(''); setKeyword(''); setBoard('all'); setTeamId(''); setSort('latest'); setPage(1) }}>초기화</button>
        </div>
      </div>
      </section>
      <div className="community__toolbar">
        <p role="status">{postsLoading ? '불러오는 중' : keyword ? `“${keyword}” 검색 결과` : selectedTeam ? `${selectedTeamName} 게시글` : board === 'showcase' ? '나만의 팀 자랑글' : '통합 게시글'} <strong>{totalCount}</strong>개</p>
        <div className="community__toolbar-actions">
          <a className="community__main-link community__write-link" href={`#/plug/community/write?board=${selectedTeam ? 'team' : board === 'showcase' ? 'showcase' : 'free'}`}>글쓰기</a>
        </div>
      </div>
      {(error || teamMatchMissing) && <p className="community__form-error" role="alert">{error || '선택한 구단을 DB에서 찾을 수 없습니다.'}</p>}
      <div className="community__table-wrap">
        <table className="community__table community__integrated-table">
          <caption className="community__sr-only">자유, 팀별 및 나만의 팀 자랑 게시글 목록</caption>
          <thead><tr><th scope="col" className="community__number">번호</th><th scope="col">분류·팀</th><th scope="col">제목</th><th scope="col">작성자</th><th scope="col">조회수</th><th scope="col">추천수</th></tr></thead>
          <tbody>
            {posts.map((post) => <tr key={post.postId}>
              <td className="community__number">{post.postId}</td>
              <td><span className={`community__badge ${post.teamId != null || post.showcaseImageId != null ? 'community__badge--team' : ''}`}>{post.showcaseImageId != null ? '자랑' : post.teamName || post.categoryType}</span></td>
              <td className="community__title">
                {post.isBlind === 'Y' && (
                  <span className="community__badge community__badge--blind" style={{ marginRight: 6 }}>
                    블라인드
                  </span>
                )}
                <a className="community__post-link" title={post.title} href={`#/plug/community/posts/${post.postId}?from=${encodeURIComponent(window.location.hash.replace(/^#/, '').split('?')[0] || window.location.pathname)}`}>
                  {formatPostTitle(post.title, post.commentCount)}
                </a>
              </td>
              <td className="community__author"><span title={post.nickname || '알 수 없음'}>{post.nickname || '알 수 없음'}</span></td>
              <td>{post.viewCount}</td>
              <td>{post.likeCount}</td>
            </tr>)}
            {!postsLoading && !posts.length && <tr><td colSpan={6} className="community__empty">등록된 게시글이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="community__footer">
        <nav className="community__pagination" aria-label="통합 게시글 페이지">
          <button type="button" disabled={page === 1 || postsLoading} onClick={() => setPage(page - 1)}>이전</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number} aria-label={`${number}페이지`} aria-current={page === number ? 'page' : undefined} disabled={postsLoading} onClick={() => setPage(number)}>{number}</button>)}
          <button type="button" disabled={page === pageCount || postsLoading} onClick={() => setPage(page + 1)}>다음</button>
        </nav>
      </div>
      {/* 커뮤니티 목록 하단 광고 영역 */}
      <aside className="community__ad" aria-label="광고 영역">
        <span className="community__ad-label">광고 · ADVERTISEMENT</span>
        <div className="community__ad-space" style={{ overflow: 'hidden', padding: 0 }}>
          <picture style={{ width: '100%', height: '100%', display: 'block' }}>
            <source media="(max-width: 680px)" srcSet={`${import.meta.env.BASE_URL}je-mobile.png`} />
            <img
              src={`${import.meta.env.BASE_URL}je-mobile.png`}
              alt="제때약 — 내 약을 제때, 더 안전하게."
              style={{ width: '100%', height: 'auto', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px', display: 'block', margin: '0 auto' }}
            />
          </picture>
        </div>
      </aside>
      {!selectedTeam && board !== 'team' && board !== 'showcase' && <section className="community__showcase" aria-labelledby="showcase-title">
        <div className="community__showcase-heading">
          <h2 id="showcase-title">내 팀 자랑 인기글</h2>
          <button type="button" className="community__showcase-more" onClick={() => { setBoard('showcase'); setTeamId(''); setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>더보기</button>
        </div>
        <p className="community__intro">나만의 전술, 나만의 베스트 11. 멋진 팀들을 이곳에서 만나보세요.</p>
        {showcaseError && <p className="community__form-error" role="alert">{showcaseError}</p>}
        <div className="community__cards">
          {showcasePosts.map((post) => <a className="community__card community__showcase-card" href={`#/plug/community/posts/${post.postId}?from=${encodeURIComponent(window.location.hash.replace(/^#/, '').split('?')[0] || window.location.pathname)}`} key={post.postId}>
            {post.showcaseImageId
              ? <img className="community__showcase-thumbnail" src={`/api/communities/attachments/${post.showcaseImageId}/content`} alt="나만의 팀 포메이션" />
              : <span className="community__pitch" aria-hidden="true">⚽</span>}
            <small>작성자 {post.nickname}</small>
            <h3 title={post.title}>{formatPostTitle(post.title, post.commentCount)}</h3>
            <strong>추천 {post.likeCount || 0} · 조회 {post.viewCount || 0}</strong>
          </a>)}
          {!showcaseLoading && !showcasePosts.length && !showcaseError && <p className="community__showcase-empty">아직 등록된 나만의 팀 자랑글이 없습니다.</p>}
        </div>
      </section>}
    </main>
  )
}
