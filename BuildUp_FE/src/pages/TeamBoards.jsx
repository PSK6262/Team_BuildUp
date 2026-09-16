import { communityTeams } from '../data/communityTeams.js'
import CommunityNavigation from './CommunityNavigation.jsx'
import '../css/Community.css'

export default function TeamBoards() {
  return <main className="community">
    <CommunityNavigation section="teams" />
    <div className="community__team-heading">
      <p className="community__eyebrow">TEAM COMMUNITY</p>
    </div>
    <h1>어느 팀 이야기가 궁금하세요?</h1>
    <p className="community__intro">20개 팀 중 하나를 선택하면 해당 팀의 게시판으로 이동합니다.</p>
    <nav className="community__team-grid" aria-label="팀별 게시판 선택">
      {communityTeams.map((team) => <a className="community__card community__card--free" key={team.slug} href={`/plug/community/teams/${team.slug}`}>
        <img className="community__emblem" src={team.emblemUrl} alt="" width="50" height="50" loading="lazy" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
        <strong>{team.name}</strong>
      </a>)}
    </nav>
  </main>
}
