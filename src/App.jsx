import { useEffect, useState } from 'react'
import { applyFavicon, useBranding } from './components/branding'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  const [signedIn, setSignedIn] = useState(false)
  const [signedOut, setSignedOut] = useState(false) // show the "You're signed out" page after signing out
  const brand = useBranding()
  useEffect(() => { applyFavicon(brand) }, [brand])
  return signedIn ? <Dashboard onLogout={() => { setSignedIn(false); setSignedOut(true) }} /> : <Login key={signedOut ? 'out' : 'in'} startView={signedOut ? 'signedout' : 'signin'} onLogin={() => { setSignedOut(false); setSignedIn(true) }} />
}
