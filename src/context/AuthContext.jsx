import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { clearLocalState } from '../lib/storage.js'

const AuthContext = createContext(null)

async function fetchSession() {
  const response = await fetch('/api/auth/session', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
  return response.json()
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body ?? {}),
  })
  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('checking')
  const [role, setRole] = useState(null)
  const [usingDevPassword, setUsingDevPassword] = useState(false)

  const applySession = useCallback((data) => {
    setRole(data?.role ?? null)
    setUsingDevPassword(Boolean(data?.usingDevPassword))
    setStatus(data?.authenticated ? 'authenticated' : 'anonymous')
  }, [])

  const refresh = useCallback(
    () =>
      fetchSession()
        .then(applySession)
        // Server unreachable — treat as signed out rather than letting the user in.
        .catch(() => applySession(null)),
    [applySession],
  )

  useEffect(() => {
    let cancelled = false
    fetchSession()
      .then((data) => {
        if (!cancelled) applySession(data)
      })
      .catch(() => {
        if (!cancelled) applySession(null)
      })
    return () => {
      cancelled = true
    }
  }, [applySession])

  const login = useCallback(async (password) => {
    const { ok, status: code, data } = await postJson('/api/auth/login', { password })
    if (ok) {
      setRole(data.role ?? 'staff')
      setStatus('authenticated')
      return { ok: true }
    }
    if (code === 429) {
      return {
        ok: false,
        message: `시도가 너무 많습니다. ${data.retryAfterSec ?? 60}초 후 다시 시도해 주세요.`,
      }
    }
    return { ok: false, message: '비밀번호가 올바르지 않습니다.' }
  }, [])

  const logout = useCallback(async () => {
    await postJson('/api/auth/logout')
    clearLocalState()
    setRole(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(
    () => ({ status, role, usingDevPassword, login, logout, refresh }),
    [status, role, usingDevPassword, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- non-component hook API
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
