import useBoardState from './useBoardState.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import { freeBoardPosts } from '../data/freeBoardPosts.js'
import '../css/Community.css'

const PAGE_SIZE = 10

export default function FreeBoard() {
  const [input, setInput] = useBoardState('input', '')
  const [keyword, setKeyword] = useBoardState('keyword', '')
  const [page, setPage] = useBoardState('page', 1)
  const filtered = freeBoardPosts.filter((post) => post.title.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()))
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const posts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function search(event) {
    event.preventDefault()
    setKeyword(input.trim())
    setPage(1)
  }

  return (
    <main className="community">
      <CommunityNavigation section="free" />
      <p className="community__eyebrow">FREE BOARD</p>
      <h1>자유게시판</h1>
      <p className="community__intro">축구부터 일상까지, 함께 나누고 싶은 이야기를 들려주세요.</p>
      <p className="community__notice">현재는 화면 확인용 예시 게시글입니다. 제목을 누르면 상세 내용을 볼 수 있습니다. 글쓰기는 준비 중입니다.</p>

      <div className="community__toolbar">
        <p role="status">{keyword ? '검색 결과' : '전체 글'} <strong>{filtered.length}</strong>개</p>
        <form className="community__search" onSubmit={search} role="search">
          <label className="community__sr-only" htmlFor="post-search">게시글 제목 검색</label>
          <input id="post-search" type="search" placeholder="제목으로 검색해 보세요" value={input} onChange={(event) => setInput(event.target.value)} />
          <button type="submit">검색</button>
          {keyword && <button type="button" onClick={() => { setInput(''); setKeyword(''); setPage(1) }}>초기화</button>}
        </form>
      </div>

      <div className="community__table-wrap">
        <table className="community__table">
          <caption className="community__sr-only">자유게시판 게시글 목록</caption>
          <thead><tr><th scope="col">번호</th><th scope="col">제목</th><th scope="col">작성자</th><th scope="col">작성일</th><th scope="col">조회수</th></tr></thead>
          <tbody>
            {posts.map((post) => <tr key={post.postId}>
              <td>{post.postId}</td><td className="community__title"><a className="community__post-link" href={`/plug/community/posts/${post.postId}?from=${encodeURIComponent(window.location.pathname)}`}>{post.title}</a></td><td>{post.nickname}</td>
              <td><time dateTime={post.createdAt}>{post.createdAt.slice(0, 10).replaceAll('-', '.')}</time></td><td>{post.viewCount}</td>
            </tr>)}
            {posts.length === 0 && <tr><td colSpan={5} className="community__empty">검색 결과가 없습니다. 다른 제목으로 검색해 보세요.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="community__write-status">글쓰기 기능은 준비 중입니다.</p>
      <div className="community__footer">
        <nav className="community__pagination" aria-label="게시글 페이지">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) =>
            <button type="button" key={number} aria-label={`${number}페이지`} aria-current={page === number ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>)}
          <button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)}>다음</button>
        </nav>
      </div>
    </main>
  )
}
