"use client"

import { useState } from "react"

// Simple test page without MUI or Mapbox
export default function SimplePage() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Universe MapMaker</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <div style={{ marginTop: "20px" }}>
        <p>App is working! This is a simplified version for deployment testing.</p>
      </div>
    </div>
  )
}