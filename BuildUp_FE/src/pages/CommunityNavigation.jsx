// 커뮤니티 화면마다 같은 위치에 현재 경로와 상위 화면 이동을 제공합니다.
export default function CommunityNavigation({ section = 'main', teamName = '' }) {
  return <div className="community__navigation">
    <nav className="community__breadcrumbs" aria-label="현재 위치">
      {section === 'main' ? <span aria-current="page">커뮤니티 메인</span> : <a href="/plug/community">커뮤니티 메인</a>}
      {section === 'teams' && <>
        <span aria-hidden="true">/</span>
        {teamName ? <a href="/plug/community/teams">팀별 커뮤니티</a> : <span aria-current="page">팀별 커뮤니티</span>}
      </>}
      {teamName && <><span aria-hidden="true">/</span><span aria-current="page">{teamName}</span></>}
      {section === 'free' && <><span aria-hidden="true">/</span><span aria-current="page">자유게시판</span></>}
    </nav>
    <nav className="community__navigation-actions" aria-label="커뮤니티 화면 이동">
      {(section !== 'teams' || teamName) && <a className="community__main-link" href="/plug/community/teams">{teamName ? '다른 팀 선택' : '팀별 커뮤니티'}</a>}
      {section !== 'main' && <a className="community__main-link" href="/plug/community">커뮤니티 메인 페이지로 이동</a>}
    </nav>
  </div>
}
