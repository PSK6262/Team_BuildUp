import AllUseNav from './pages/AllUseNav.jsx'
import MainPage from './pages/mainpage.jsx'
import Team from './pages/team.jsx'
import './App.css'

function App() {
  const pathname = window.location.pathname.replace(/\/$/, '')
  const isMainPage = !pathname || pathname === '' || pathname === '/plug' || pathname === '/plug/mainpage'
  const teamMatch = pathname.match(/^\/plug\/team\/(\d+)$/)

  return (
    <>
      <AllUseNav />
      {isMainPage && <MainPage />}
      {teamMatch && <Team teamId={teamMatch[1]} />}
    </>
  )
}

export default App
