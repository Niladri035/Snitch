import React, { useEffect } from 'react'
import './App.css'
import { RouterProvider } from 'react-router'
import { router } from './app.routes.jsx'

function App() {
  useEffect(() => {
    // Silently seed database on app mount
    fetch('/api/products/seed-mock-products')
      .then(res => res.json())
      .then(data => console.log("Database autoseed:", data.message))
      .catch(err => console.warn("Database autoseed error:", err))
  }, [])

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
