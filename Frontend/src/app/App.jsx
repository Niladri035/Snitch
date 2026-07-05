import React, { useEffect, useState } from 'react'
import './App.css'
import { RouterProvider } from 'react-router'
import { router } from './app.routes.jsx'
import SnitchLoader from '../components/SnitchLoader.jsx'

function App() {
  const [loaderDone, setLoaderDone] = useState(false)

  useEffect(() => {
    // Silently seed database on app mount
    fetch('/api/products/seed-mock-products')
      .then(res => res.json())
      .then(data => console.log('Database autoseed:', data.message))
      .catch(err => console.warn('Database autoseed error:', err))
  }, [])

  return (
    <>
      {/* ── Loader: fixed, z-index 9999, covers everything ── */}
      {!loaderDone && (
        <SnitchLoader onComplete={() => setLoaderDone(true)} />
      )}

      {/* ── Main app: hidden via visibility+pointer-events while loading ── */}
      {/* Using visibility:hidden instead of opacity:0 prevents fixed/sticky
          children from rendering above the loader in the stacking context */}
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
