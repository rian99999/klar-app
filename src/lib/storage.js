import {
  DEFAULT_RECOMMENDATION_CATEGORY_NAMES,
  createDefaultProductCategoryVisibility,
} from '../data/constants.js'
import { createId } from './ids.js'

const STORAGE_KEY = 'klar-app-data-v1'
const API_STATE_URL = '/api/state'

export function defaultState() {
  const recommendationCategories = DEFAULT_RECOMMENDATION_CATEGORY_NAMES.map(
    (name) => ({ id: createId(), name }),
  )
  return {
    schemaVersion: 1,
    customers: [],
    appointments: [],
    personalColorSessions: [],
    makeupConsultSessions: [],
    recommendationCategories,
    productCategoryVisibility: createDefaultProductCategoryVisibility(),
    toneRecommendProducts: [],
  }
}

export function normalizeState(raw) {
  const base = defaultState()
  if (!raw || typeof raw !== 'object') return base
  return {
    ...base,
    ...raw,
    customers: Array.isArray(raw.customers) ? raw.customers : [],
    appointments: Array.isArray(raw.appointments) ? raw.appointments : [],
    personalColorSessions: Array.isArray(raw.personalColorSessions)
      ? raw.personalColorSessions
      : [],
    makeupConsultSessions: Array.isArray(raw.makeupConsultSessions)
      ? raw.makeupConsultSessions
      : [],
    recommendationCategories:
      Array.isArray(raw.recommendationCategories) &&
      raw.recommendationCategories.length > 0
        ? raw.recommendationCategories
        : base.recommendationCategories,
    productCategoryVisibility: {
      ...base.productCategoryVisibility,
      ...(raw.productCategoryVisibility &&
      typeof raw.productCategoryVisibility === 'object'
        ? raw.productCategoryVisibility
        : {}),
    },
    toneRecommendProducts: Array.isArray(raw.toneRecommendProducts)
      ? raw.toneRecommendProducts
      : [],
  }
}

export function hasUserRecords(state) {
  const normalized = normalizeState(state)
  return [
    normalized.customers,
    normalized.appointments,
    normalized.personalColorSessions,
    normalized.makeupConsultSessions,
    normalized.toneRecommendProducts,
  ].some((items) => items.length > 0)
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return normalizeState(JSON.parse(raw))
  } catch {
    return defaultState()
  }
}

function saveLocalState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)))
  } catch {
    // ignore quota
  }
}

export async function loadRemoteState() {
  const response = await fetch(API_STATE_URL, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Failed to load server state: ${response.status}`)
  }
  const state = normalizeState(await response.json())
  saveLocalState(state)
  return state
}

export async function saveState(state) {
  const nextState = normalizeState(state)
  saveLocalState(nextState)

  const response = await fetch(API_STATE_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nextState),
  })
  if (!response.ok) {
    throw new Error(`Failed to save server state: ${response.status}`)
  }
}

export { STORAGE_KEY }
