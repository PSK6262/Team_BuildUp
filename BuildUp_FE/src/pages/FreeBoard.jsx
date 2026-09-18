import { useEffect, useState } from 'react'
import useBoardState from './useBoardState.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import '../css/Community.css'

const PAGE_SIZE = 10

export default function FreeBoard() {
  const [input, setInput] = useBoardState('input', '')
  const [keyword, setKeyword] = useBoardState('keyword', '')
  const [page, setPage] = useBoardState('page', 1)
  const [categoryIds, setCategoryIds] = useState([])
  const [posts, setPosts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 실제 DB 카테고리 번호를 조회하여 자유게시판 검색 조건으로 사용합니다.
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/communities/categories')
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || '카테고리를 불러오지 못했습니다.')
        const ids = Array.isArray(result.data) ? result.data.map((category) => category.categoryId) : []
        setCategoryIds(ids)
        if (ids.length === 0) setLoading(false)
      } catch (exception) {
        setError(exception.message || '카테고리를 불러오지 못했습니다.')
        setLoading(false)
      }
    }
    loadCategories()
  }, [])

  // 검색어와 페이지 조건으로 자유게시판 목록을 조회합니다.
  useEffect(() => {
    if (categoryIds.length === 0) return
    const controller = new AbortController()
    const loadPosts = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        categoryIds.forEach((categoryId) => params.append('categoryIds', categoryId))
        params.set('board', 'free')
        params.set('keyword', keyword)
        params.set('sort', 'latest')
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
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadPosts()
    return () => controller.abort()
  }, [categoryIds, keyword, page])

  const pageCount = Math.max(1, totalPages)

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

      <div className="community__toolbar">
        <p role="status">{loading ? '불러오는 중' : keyword ? '검색 결과' : '전체 글'} <strong>{totalCount}</strong>개</p>
        <form className="community__search" onSubmit={search} role="search">
          <label className="community__sr-only" htmlFor="post-search">게시글 제목 검색</label>
          <input id="post-search" type="search" placeholder="제목으로 검색해 보세요" value={input} onChange={(event) => setInput(event.target.value)} />
          <button type="submit">검색</button>
          {keyword && <button type="button" onClick={() => { setInput(''); setKeyword(''); setPage(1) }}>초기화</button>}
        </form>
      </div>

      {error && <p className="community__form-error" role="alert">{error}</p>}
      <div className="community__table-wrap">
        <table className="community__table">
          <caption className="community__sr-only">자유게시판 게시글 목록</caption>
          <thead><tr><th scope="col">번호</th><th scope="col">제목</th><th scope="col">작성자</th><th scope="col">작성일</th><th scope="col">조회수</th></tr></thead>
          <tbody>
            {posts.map((post) => <tr key={post.postId}>
              <td>{post.postId}</td><td className="community__title"><a className="community__post-link" href={`/plug/community/posts/${post.postId}?from=${encodeURIComponent(window.location.pathname)}`}>{post.title}</a></td><td>{post.nickname}</td>
              <td><time dateTime={post.createdAt}>{post.createdAt?.slice(0, 10).replaceAll('-', '.')}</time></td><td>{post.viewCount}</td>
            </tr>)}
            {!loading && posts.length === 0 && <tr><td colSpan={5} className="community__empty">등록된 게시글이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="community__write-status"><a className="community__main-link" href="/plug/community/write?board=free">글쓰기</a></p>
      <div className="community__footer">
        <nav className="community__pagination" aria-label="게시글 페이지">
          <button type="button" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>이전</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) =>
            <button type="button" key={number} aria-label={`${number}페이지`} aria-current={page === number ? 'page' : undefined} disabled={loading} onClick={() => setPage(number)}>{number}</button>)}
          <button type="button" disabled={page === pageCount || loading} onClick={() => setPage(page + 1)}>다음</button>
        </nav>
      </div>
    </main>
  )
}
