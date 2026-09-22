import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTeams, fetchCategories } from '../store/teamSlice.js'
import useBoardState from './useBoardState.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import '../css/Community.css'

const PAGE_SIZE = 10

export default function Community({ selectedTeam = null }) {
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

        const response = await fetch(`/api/communities?${params.toString()}`, { signal: controller.signal })
        const result = await response.json()
        if (!response.ok || !result.data) {
          throw new Error(result.message || '게시글 목록을 불러오지 못했습니다.')
        }
        setPosts(Array.isArray(result.data.items) ? result.data.items : [])
        setTotalCount(result.data.totalCount || 0)
        setTotalPages(result.data.totalPages || 0)
      } catch (exception) {
        if (exception.name !== 'AbortError') {
          setError(exception.message || '게시글 목록을 불러오지 못했습니다.')
        }
      } finally {
        if (!controller.signal.aborted) setPostsLoading(false)
      }
    }
    loadPosts()
    return () => controller.abort()
  }, [board, categories, keyword, optionsLoading, page, selectedDbTeam, selectedTeam, sort, teamId])

  const pageCount = Math.max(1, totalPages)

  return (
    <main className="community">
      <CommunityNavigation section={selectedTeam ? 'teams' : 'main'} teamName={selectedTeamName} />
      <p className="community__eyebrow">PLUGIN COMMUNITY</p>
      <h1>{selectedTeam ? `${selectedTeamName} 게시판` : '커뮤니티'}</h1>
      <p className="community__intro">응원하는 팀 이야기부터 소소한 일상까지, 함께 나눠요.</p>
      <form className="community__search community__main-search" role="search" onSubmit={(event) => {
        event.preventDefault(); setKeyword(input.trim()); setPage(1)
      }}>
        <label className="community__sr-only" htmlFor="community-search">게시글 제목 검색</label>
        <input id="community-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder={selectedTeam ? `${selectedTeamName} 게시글 제목 검색` : '전체 게시글 제목 검색'} />
        <button type="submit">검색</button>
      </form>
      <div className="community__filters">
        {!selectedTeam && <div className="community__board-buttons" role="group" aria-label="게시판 필터">
          {[['all', '전체'], ['free', '자유'], ['team', '팀별']].map(([value, label]) =>
            <button key={value} type="button" aria-pressed={board === value} onClick={() => { setBoard(value); if (value === 'free') setTeamId(''); setPage(1) }}>{label}</button>)}
        </div>}
        <div className="community__selects">
          {!selectedTeam && <label>팀 <select value={teamId} disabled={board === 'free'} onChange={(event) => { setTeamId(event.target.value); setPage(1) }}>
            <option value="">전체 팀</option>
            {teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.teamNameKor || team.teamName}</option>)}
          </select></label>}
          <label>정렬 <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}>
            <option value="latest">최신순</option><option value="likes">추천순</option><option value="views">조회순</option>
          </select></label>
        </div>
      </div>
      <div className="community__toolbar">
        <p role="status">{postsLoading ? '불러오는 중' : keyword ? `“${keyword}” 검색 결과` : selectedTeam ? `${selectedTeamName} 게시글` : '통합 게시글'} <strong>{totalCount}</strong>개</p>
        <div className="community__toolbar-actions">
          <button type="button" disabled={!keyword && !input && board === 'all' && !teamId && sort === 'latest'} onClick={() => { setInput(''); setKeyword(''); setBoard('all'); setTeamId(''); setSort('latest'); setPage(1) }}>검색·필터 초기화</button>
          <a className="community__main-link" href={`/plug/community/write?board=${selectedTeam ? 'team' : 'free'}`}>글쓰기</a>
        </div>
      </div>
      {(error || teamMatchMissing) && <p className="community__form-error" role="alert">{error || '선택한 구단을 DB에서 찾을 수 없습니다.'}</p>}
      <div className="community__table-wrap">
        <table className="community__table community__integrated-table">
          <caption className="community__sr-only">자유 및 팀별 게시글 통합 목록</caption>
          <thead><tr><th scope="col" className="community__number">번호</th><th scope="col">분류·팀</th><th scope="col">제목</th><th scope="col">조회수</th><th scope="col">추천수</th></tr></thead>
          <tbody>
            {posts.map((post) => <tr key={post.postId}>
              <td className="community__number">{post.postId}</td>
              <td><span className={`community__badge ${post.teamId != null ? 'community__badge--team' : ''}`}>{post.teamName || post.categoryType}</span></td>
              <td className="community__title">
                {post.isBlind === 'Y' && (
                  <span className="community__badge community__badge--blind" style={{ marginRight: 6 }}>
                    블라인드
                  </span>
                )}
                <a className="community__post-link" href={`/plug/community/posts/${post.postId}?from=${encodeURIComponent(window.location.pathname)}`}>
                  {post.title}
                </a>
              </td>
              <td>{post.viewCount}</td>
              <td>{post.likeCount}</td>
            </tr>)}
            {!postsLoading && !posts.length && <tr><td colSpan={5} className="community__empty">등록된 게시글이 없습니다.</td></tr>}
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
      {!selectedTeam && <section className="community__showcase" aria-labelledby="showcase-title">
        <div className="community__showcase-heading"><h2 id="showcase-title">내 팀 자랑 인기글</h2><span className="community__tag">준비 중</span></div>
        <p className="community__intro">나만의 전술, 나만의 베스트 11. 멋진 팀들을 이곳에서 만나보세요.</p>
        <div className="community__cards">
          {[1, 2, 3].map((number) => <article className="community__card community__placeholder" key={number}>
            <span className="community__pitch" aria-hidden="true">⚽</span>
            <h3>어떤 팀이 올라올까요?</h3><p>내 팀 자랑 기능이 열리면 인기 게시글을 소개할 예정입니다.</p>
          </article>)}
        </div>
      </section>}
    </main>
  )
}
