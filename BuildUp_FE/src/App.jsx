import AllUseNav from './pages/AllUseNav.jsx'
import MainPage from './pages/mainpage.jsx'
import './App.css'

function App() {
  const pathname = window.location.pathname.replace(/\/$/, '')
  const isMainPage = !pathname || pathname === '' || pathname === '/plug' || pathname === '/plug/mainpage'

  return (
    <>
      <AllUseNav />
      {isMainPage && <MainPage />}
    </>
  )
}

export default App
