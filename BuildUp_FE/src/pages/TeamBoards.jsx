import { communityTeams } from '../data/communityTeams.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import '../css/Community.css'

export default function TeamBoards() {
  return <main className="community">
    <CommunityNavigation section="teams" />
    <div className="community__team-heading">
      <p className="community__eyebrow">TEAM COMMUNITY</p>
      <h1>같은 팀, 함께 나누는 이야기</h1>
      <p className="community__intro">응원하는 팀을 선택하고 경기부터 선수 이야기까지 함께 나눠보세요.</p>
    </div>
    <nav className="community__team-grid" aria-label="팀별 게시판 선택">
      {communityTeams.map((team) => <a className="community__card community__card--free" key={team.slug} href={`/plug/community/teams/${team.slug}`}>
        <img className="community__emblem" src={team.emblemUrl} alt="" width="50" height="50" loading="lazy" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
        <strong>{team.name}</strong>
      </a>)}
    </nav>
  </main>
}
