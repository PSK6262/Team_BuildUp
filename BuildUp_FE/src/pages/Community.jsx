import useBoardState from './useBoardState.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import { communityTeams } from '../data/communityTeams.js'
import { communityPosts as posts } from '../data/communityPosts.js'
import '../css/Community.css'

// 팀 목록과 글은 화면 확인용 예시이며, 실제 팀 목록은 추후 API로 받습니다.
const sampleTeams = communityTeams.map((team) => team.name)
const PAGE_SIZE = 10

export default function Community({ selectedTeam = '' }) {
  const [input, setInput] = useBoardState('input', '')
  const [keyword, setKeyword] = useBoardState('keyword', '')
  const [board, setBoard] = useBoardState('board', 'all')
  const [team, setTeam] = useBoardState('team', '')
  const [sort, setSort] = useBoardState('sort', 'latest')
  const [page, setPage] = useBoardState('page', 1)
  const filtered = posts.filter((post) =>
    (!selectedTeam || post.team === selectedTeam) &&
    (board === 'all' || post.board === board) && (!team || post.team === team) &&
    post.title.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()),
  ).sort((a, b) => {
    if (sort === 'likes') return b.likeCount - a.likeCount || b.postId - a.postId
    if (sort === 'views') return b.viewCount - a.viewCount || b.postId - a.postId
    return b.createdAt.localeCompare(a.createdAt) || b.postId - a.postId
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <main className="community">
      <CommunityNavigation section={selectedTeam ? 'teams' : 'main'} teamName={selectedTeam} />
      <p className="community__eyebrow">PLUGIN COMMUNITY</p>
      <h1>{selectedTeam ? `${selectedTeam} 게시판` : '커뮤니티'}</h1>
      <p className="community__intro">응원하는 팀 이야기부터 소소한 일상까지, 함께 나눠요.</p>
      <form className="community__search community__main-search" role="search" onSubmit={(event) => {
        event.preventDefault(); setKeyword(input.trim()); setPage(1)
      }}>
        <label className="community__sr-only" htmlFor="community-search">게시글 제목 검색</label>
        <input id="community-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder={selectedTeam ? `${selectedTeam} 게시글 제목 검색` : '전체 게시글 제목 검색'} />
        <button type="submit">검색</button>
      </form>
      <div className="community__filters">
        {!selectedTeam && <div className="community__board-buttons" role="group" aria-label="게시판 필터">
          {[['all', '전체'], ['free', '자유']].map(([value, label]) =>
            <button key={value} type="button" aria-pressed={board === value} onClick={() => { setBoard(value); setTeam(''); setPage(1) }}>{label}</button>)}
        </div>}
        <div className="community__selects">
          {!selectedTeam && <label>팀 <select value={team} disabled={board === 'free'} onChange={(event) => { setTeam(event.target.value); setPage(1) }}>
            <option value="">전체 팀</option>
            {sampleTeams.map((name) => <option key={name} value={name}>{name}</option>)}
          </select></label>}
          <label>정렬 <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}>
            <option value="latest">최신순</option><option value="likes">추천순</option><option value="views">조회순</option>
          </select></label>
        </div>
      </div>
      <div className="community__toolbar">
        <p role="status">{keyword ? `“${keyword}” 검색 결과` : selectedTeam ? `${selectedTeam} 게시글` : '통합 게시글'} <strong>{filtered.length}</strong>개</p>
        <button type="button" disabled={!keyword && !input && board === 'all' && !team && sort === 'latest'} onClick={() => { setInput(''); setKeyword(''); setBoard('all'); setTeam(''); setSort('latest'); setPage(1) }}>검색·필터 초기화</button>
      </div>
      <div className="community__table-wrap">
        <table className="community__table community__integrated-table">
          <caption className="community__sr-only">자유 및 팀별 게시글 통합 목록</caption>
          <thead><tr><th scope="col" className="community__number">번호</th><th scope="col">분류·팀</th><th scope="col">제목</th><th scope="col">조회수</th><th scope="col">추천수</th></tr></thead>
          <tbody>
            {visible.map((post) => <tr key={post.postId}>
              <td className="community__number">{post.postId}</td>
              <td><span className={`community__badge ${post.board === 'team' ? 'community__badge--team' : ''}`}>{post.team || '자유'}</span></td>
              <td className="community__title"><a className="community__post-link" href={`/plug/community/posts/${post.postId}?from=${encodeURIComponent(window.location.pathname)}`}>{post.title}</a></td><td>{post.viewCount}</td><td>{post.likeCount}</td>
            </tr>)}
            {!visible.length && <tr><td colSpan={5} className="community__empty">조건에 맞는 게시글이 없습니다. 검색어나 필터를 바꿔보세요.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="community__footer">
        <nav className="community__pagination" aria-label="통합 게시글 페이지">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number} aria-label={`${number}페이지`} aria-current={page === number ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>)}
          <button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)}>다음</button>
        </nav>
      </div>
      <p className="community__notice">2026/27 시즌 20개 팀으로 구성한 화면입니다. 게시글은 예시이며 실제 데이터는 추후 연결됩니다.</p>
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
