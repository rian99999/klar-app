import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  PRODUCT_CATEGORY_GROUPS,
  createDefaultProductCategoryVisibility,
  productCategoryVisibilityKey,
} from '../data/constants.js'
import { useAuth } from './AuthContext.jsx'
import { createId } from '../lib/ids.js'
import {
  hasUserRecords,
  loadRemoteState,
  loadState,
  normalizeState,
  saveState,
} from '../lib/storage.js'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const [state, setState] = useState(() => loadState())
  const [serverLoaded, setServerLoaded] = useState(false)
  // 'idle' | 'saving' | 'saved' | 'offline' — surfaced in the app header so the
  // user can tell whether their edits reached the server.
  const [syncStatus, setSyncStatus] = useState('idle')
  const initialLocalStateRef = useRef(state)
  const { refresh: refreshAuth } = useAuth()

  useEffect(() => {
    let cancelled = false
    loadRemoteState()
      .then((remoteState) => {
        if (cancelled) return
        const localState = initialLocalStateRef.current
        setState(
          !hasUserRecords(remoteState) && hasUserRecords(localState)
            ? localState
            : remoteState,
        )
      })
      .catch((error) => {
        if (error?.status === 401) {
          refreshAuth()
          return
        }
        console.warn('[klar-sync] Server load failed. Using local cache.', error)
        if (!cancelled) setSyncStatus('offline')
      })
      .finally(() => {
        if (!cancelled) setServerLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [refreshAuth])

  useEffect(() => {
    if (!serverLoaded) return
    let cancelled = false
    // Coalesce bursts of edits into one PUT, and keep the status transition out
    // of the render pass.
    const timer = window.setTimeout(() => {
      if (cancelled) return
      setSyncStatus('saving')
      saveState(state)
        .then(() => {
          if (!cancelled) setSyncStatus('saved')
        })
        .catch((error) => {
          if (error?.status === 401) {
            refreshAuth()
            return
          }
          console.warn('[klar-sync] Server save failed. Local cache was kept.', error)
          if (!cancelled) setSyncStatus('offline')
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [serverLoaded, state, refreshAuth])

  const touchCustomer = useCallback((customerId) => {
    const now = new Date().toISOString()
    setState((s) => ({
      ...s,
      customers: s.customers.map((c) =>
        c.id === customerId ? { ...c, updatedAt: now } : c,
      ),
    }))
  }, [])

  const actions = useMemo(
    () => ({
      upsertCustomer(payload) {
        const now = new Date().toISOString()
        let resultId = null
        setState((s) => {
          const existing =
            payload.id != null ? s.customers.find((c) => c.id === payload.id) : null
          if (existing) {
            resultId = existing.id
            return {
              ...s,
              customers: s.customers.map((c) =>
                c.id === payload.id
                  ? {
                      ...c,
                      name: payload.name ?? c.name,
                      phone: payload.phone ?? c.phone,
                      email: payload.email ?? c.email,
                      memo: payload.memo ?? c.memo,
                      updatedAt: now,
                    }
                  : c,
              ),
            }
          }
          const id = payload.id ?? createId()
          resultId = id
          return {
            ...s,
            customers: [
              ...s.customers,
              {
                id,
                name: payload.name ?? '',
                phone: payload.phone ?? '',
                email: payload.email ?? '',
                memo: payload.memo ?? '',
                createdAt: now,
                updatedAt: now,
              },
            ],
          }
        })
        return resultId
      },

      /** 백업 파일 복원용 — 전체 데이터를 통째로 교체합니다. */
      replaceAllData(nextState) {
        setState(normalizeState(nextState))
      },

      deleteCustomer(customerId) {
        setState((s) => ({
          ...s,
          customers: s.customers.filter((c) => c.id !== customerId),
          appointments: s.appointments.filter((a) => a.customerId !== customerId),
          personalColorSessions: s.personalColorSessions.filter(
            (p) => p.customerId !== customerId,
          ),
          makeupConsultSessions: s.makeupConsultSessions.filter(
            (m) => m.customerId !== customerId,
          ),
        }))
      },

      upsertAppointment(row) {
        const now = new Date().toISOString()
        setState((s) => {
          const id = row.id ?? createId()
          const exists = s.appointments.some((a) => a.id === id)
          const next = exists
            ? s.appointments.map((a) =>
                a.id === id
                  ? {
                      ...a,
                      date: row.date,
                      time: row.time ?? '',
                      customerId: row.customerId,
                      course: row.course,
                      note: row.note ?? '',
                      updatedAt: now,
                    }
                  : a,
              )
            : [
                ...s.appointments,
                {
                  id,
                  date: row.date,
                  time: row.time ?? '',
                  customerId: row.customerId,
                  course: row.course,
                  note: row.note ?? '',
                  createdAt: now,
                  updatedAt: now,
                },
              ]
          return { ...s, appointments: next }
        })
        if (row.customerId) touchCustomer(row.customerId)
      },

      deleteAppointment(id) {
        setState((s) => ({
          ...s,
          appointments: s.appointments.filter((a) => a.id !== id),
        }))
      },

      upsertPersonalSession(row) {
        const now = new Date().toISOString()
        let resultId = null
        setState((s) => {
          const id = row.id ?? createId()
          resultId = id
          const exists = s.personalColorSessions.some((p) => p.id === id)
          const item = {
            id,
            customerId: row.customerId,
            dateISO: row.dateISO,
            tone: row.tone,
            primaryTypeKey: row.primaryTypeKey,
            secondaryTypeKey: row.secondaryTypeKey ?? null,
            memo: row.memo ?? '',
            createdAt: exists
              ? s.personalColorSessions.find((p) => p.id === id).createdAt
              : now,
            updatedAt: now,
          }
          const next = exists
            ? s.personalColorSessions.map((p) => (p.id === id ? item : p))
            : [...s.personalColorSessions, item]
          return { ...s, personalColorSessions: next }
        })
        touchCustomer(row.customerId)
        return resultId
      },

      deletePersonalSession(id, customerId) {
        setState((s) => ({
          ...s,
          personalColorSessions: s.personalColorSessions.filter((p) => p.id !== id),
        }))
        touchCustomer(customerId)
      },

      upsertMakeupSession(row) {
        const now = new Date().toISOString()
        let resultId = null
        setState((s) => {
          const id = row.id ?? createId()
          resultId = id
          const exists = s.makeupConsultSessions.some((m) => m.id === id)
          const item = {
            id,
            customerId: row.customerId,
            dateISO: row.dateISO,
            memo: row.memo ?? '',
            products: Array.isArray(row.products) ? row.products : [],
            createdAt: exists
              ? s.makeupConsultSessions.find((m) => m.id === id).createdAt
              : now,
            updatedAt: now,
          }
          const next = exists
            ? s.makeupConsultSessions.map((m) => (m.id === id ? item : m))
            : [...s.makeupConsultSessions, item]
          return { ...s, makeupConsultSessions: next }
        })
        touchCustomer(row.customerId)
        return resultId
      },

      deleteMakeupSession(id, customerId) {
        setState((s) => ({
          ...s,
          makeupConsultSessions: s.makeupConsultSessions.filter((m) => m.id !== id),
        }))
        touchCustomer(customerId)
      },

      upsertToneRecommendProduct(row) {
        const now = new Date().toISOString()
        setState((s) => {
          const id = row.id ?? createId()
          const exists = s.toneRecommendProducts.some((p) => p.id === id)
          const toneKeys = Array.isArray(row.toneKeys)
            ? row.toneKeys
            : row.toneKey
              ? [row.toneKey]
              : []
          const item = {
            id,
            toneKey: toneKeys[0] ?? row.toneKey ?? '',
            toneKeys,
            categoryId: row.categoryId ?? '',
            categoryGroup: row.categoryGroup ?? '',
            categoryDetail: row.categoryDetail ?? '',
            brand: row.brand ?? '',
            productName: row.productName ?? '',
            shade: row.shade ?? '',
            imageUrl: row.imageUrl ?? '',
            purchaseLink: row.purchaseLink ?? '',
            memo: row.memo ?? '',
            updatedAt: now,
          }
          const next = exists
            ? s.toneRecommendProducts.map((p) =>
                p.id === id ? { ...p, ...item } : p,
              )
            : [
                ...s.toneRecommendProducts,
                {
                  ...item,
                  createdAt: now,
                },
              ]
          return { ...s, toneRecommendProducts: next }
        })
      },

      deleteToneRecommendProduct(id) {
        setState((s) => ({
          ...s,
          toneRecommendProducts: s.toneRecommendProducts.filter((p) => p.id !== id),
        }))
      },

      setProductCategoryVisibility(key, visible) {
        setState((s) => ({
          ...s,
          productCategoryVisibility: {
            ...createDefaultProductCategoryVisibility(),
            ...s.productCategoryVisibility,
            [key]: Boolean(visible),
          },
        }))
      },

      setProductCategoryGroupVisibility(groupKey, visible) {
        const group = PRODUCT_CATEGORY_GROUPS.find((item) => item.key === groupKey)
        if (!group) return
        setState((s) => {
          const next = {
            ...createDefaultProductCategoryVisibility(),
            ...s.productCategoryVisibility,
            [productCategoryVisibilityKey(groupKey)]: Boolean(visible),
          }
          group.details.forEach((detail) => {
            next[productCategoryVisibilityKey(groupKey, detail.key)] = Boolean(visible)
          })
          return {
            ...s,
            productCategoryVisibility: next,
          }
        })
      },

      setAllProductCategoryVisibility(visible) {
        const next = createDefaultProductCategoryVisibility()
        Object.keys(next).forEach((key) => {
          next[key] = Boolean(visible)
        })
        setState((s) => ({
          ...s,
          productCategoryVisibility: next,
        }))
      },
    }),
    [touchCustomer],
  )

  const value = useMemo(
    () => ({ state, actions, ready: serverLoaded, syncStatus }),
    [state, actions, serverLoaded, syncStatus],
  )

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  )
}

// Fast refresh: hook export is intentional for this module.
// eslint-disable-next-line react-refresh/only-export-components -- non-component hook API
export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
