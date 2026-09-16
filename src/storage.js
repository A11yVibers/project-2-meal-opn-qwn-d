import { useEffect, useState } from 'react'

const PREFIX = 'meal-planner.v1.'

export function loadState(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveState(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode, quota) — app keeps working in memory */
  }
}

export function usePersistentState(key, fallback) {
  const [state, setState] = useState(() => loadState(key, fallback))
  useEffect(() => {
    saveState(key, state)
  }, [key, state])
  return [state, setState]
}
