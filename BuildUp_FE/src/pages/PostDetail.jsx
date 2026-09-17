import { communityPosts } from '../data/communityPosts.js'
import { communityTeams } from '../data/communityTeams.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import '../css/Community.css'

export default function PostDetail({ postId }) {
  const post = communityPosts.find((item) => String(item.postId) === postId)
  const requestedReturn = new URLSearchParams(window.location.search).get('from')
  // 외부 주소나 임의의 경로로 이동하지 않도록 실제 목록 경로만 허용합니다.
  const allowedPaths = ['/plug/community', '/plug/community/free', ...communityTeams.map((team) => `/plug/community/teams/${team.slug}`)]
  const backTo = allowedPaths.includes(requestedReturn) ? requestedReturn : '/plug/community'

  if (!post) return <main className="community">
    <CommunityNavigation />
    <h1>게시글을 찾을 수 없습니다.</h1>
    <p className="community__intro">주소를 확인하거나 목록에서 다른 글을 선택해 주세요.</p>
    <a className="community__main-link" href={backTo}>목록으로 돌아가기</a>
  </main>

  return <main className="community">
    <CommunityNavigation section={post.board === 'team' ? 'teams' : 'free'} teamName={post.team} />
    <article className="community__detail">
      <header>
        <span className="community__badge">{post.team || '자유게시판'}</span>
        <h1>{post.title}</h1>
        <dl className="community__post-meta">
          <div><dt>작성자</dt><dd>{post.nickname}</dd></div>
          <div><dt>작성일</dt><dd><time dateTime={post.createdAt}>{post.createdAt.replace('T', ' ').slice(0, 16)}</time></dd></div>
          <div><dt>조회수</dt><dd>{post.viewCount}</dd></div>
          <div><dt>추천수</dt><dd>{post.likeCount}</dd></div>
        </dl>
      </header>
      <div className="community__post-body">{post.content}</div>
    </article>
    <div className="community__detail-actions"><a className="community__main-link" href={backTo}>목록으로 돌아가기</a></div>
    <p className="community__notice">예시 게시글입니다. 댓글·추천·수정·삭제와 실제 데이터 저장은 아직 연결하지 않았습니다.</p>
  </main>
}
