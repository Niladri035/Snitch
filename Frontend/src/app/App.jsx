import React, { useEffect, useState } from 'react'
import './App.css'
import { RouterProvider } from 'react-router'
import { router } from './app.routes.jsx'
import SnitchLoader from '../components/SnitchLoader.jsx'
import { useDispatch } from 'react-redux'
import { setUser } from '../features/auth/state/auth.slice'
import api from '../services/api.js'

function App() {
  const dispatch = useDispatch()

  // Use sessionStorage so the loader only plays ONCE per session.
  // This prevents page refreshes (like OAuth redirects) from forcing the user to watch the loader again.
  const [loaderDone, setLoaderDone] = useState(() => {
    return sessionStorage.getItem('snitch_loader_played') === 'true'
  })

  useEffect(() => {
    // 1. Silently seed database on app mount
    fetch('/api/products/seed-mock-products')
      .then(res => res.json())
      .then(data => console.log('Database autoseed:', data.message))
      .catch(err => console.warn('Database autoseed error:', err))

    // 2. Fetch logged-in user profile on load to repopulate Redux auth state
    api.get('/auth/me')
      .then(res => {
        if (res.data && res.data.user) {
          dispatch(setUser(res.data.user))
        }
      })
      .catch(err => {
        console.log('No active session / Google user not logged in:', err.message)
      })
  }, [dispatch])

  const handleLoaderComplete = () => {
    sessionStorage.setItem('snitch_loader_played', 'true')
    setLoaderDone(true)
  }

  return (
    <>
      {/* ── Loader: fixed, z-index 9999, covers everything ── */}
      {!loaderDone && (
        <SnitchLoader onComplete={handleLoaderComplete} />
      )}

      {/* ── Main app: hidden via visibility+pointer-events while loading ── */}
      <div
        style={{
          visibility: loaderDone ? 'visible' : 'hidden',
          opacity: loaderDone ? 1 : 0,
          transition: loaderDone ? 'opacity 0.6s ease 0.05s' : 'none',
          pointerEvents: loaderDone ? 'auto' : 'none',
        }}
      >
        <RouterProvider router={router} />
      </div>
    </>
  )
}

export default App
