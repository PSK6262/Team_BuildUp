export default function CommunityLoading({ detail = false }) {
  return <div className={`community__loading${detail ? ' community__loading--detail' : ''}`} role="status" aria-label={detail ? '게시글을 불러오는 중입니다.' : '목록을 불러오는 중입니다.'}>
    <span className="community__sr-only">잠시만 기다려주세요.</span>
    {Array.from({ length: detail ? 5 : 3 }, (_, index) => <div className="community__loading-row" key={index} aria-hidden="true"><span /><span /></div>)}
  </div>
}
