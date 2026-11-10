/**
 * Capa de persistencia — localStorage.
 *
 * Un único espacio de nombres, versión de esquema y escritura atómica.
 * Nada de librerías: la lógica es pequeña y conviene tenerla a la vista.
 */

import type { PersistedState, UserPreferences } from '../types'

const STORAGE_KEY = 'la-cartilla:state:v1'
const SCHEMA_VERSION = 1

export const defaultPreferences: UserPreferences = {
  displayName: 'Julián',
  dailyGoalMinutes: 20,
  sidebarCollapsed: false,
  showTranslations: true,
  theme: 'light',
}

export const defaultState: PersistedState = {
  version: SCHEMA_VERSION,
  preferences: defaultPreferences,
  activityResults: {},
  mediaProgress: {},
  masteredTerms: [],
  completedActivityIds: [],
  dailyMinutes: {},
  lastVisit: new Date().toISOString(),
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Lee el estado guardado y lo mezcla con los valores por defecto.
 * Un estado corrupto o de una versión anterior nunca rompe la aplicación:
 * se descarta y se empieza limpio.
 */
export function loadState(): PersistedState {
  if (typeof window === 'undefined') return defaultState

  const visitedAt = new Date().toISOString()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState, lastVisit: visitedAt }

    const parsed: unknown = JSON.parse(raw)
    if (!isPlainObject(parsed)) return { ...defaultState, lastVisit: visitedAt }
    if (parsed.version !== SCHEMA_VERSION) return { ...defaultState, lastVisit: visitedAt }

    return {
      ...defaultState,
      ...parsed,
      lastVisit: new Date().toISOString(),
      preferences: {
        ...defaultPreferences,
        ...(isPlainObject(parsed.preferences) ? parsed.preferences : {}),
      },
      activityResults: isPlainObject(parsed.activityResults)
        ? (parsed.activityResults as PersistedState['activityResults'])
        : {},
      mediaProgress: isPlainObject(parsed.mediaProgress)
        ? (parsed.mediaProgress as PersistedState['mediaProgress'])
        : {},
      masteredTerms: Array.isArray(parsed.masteredTerms) ? parsed.masteredTerms : [],
      completedActivityIds: Array.isArray(parsed.completedActivityIds)
        ? parsed.completedActivityIds
        : [],
      dailyMinutes: isPlainObject(parsed.dailyMinutes)
        ? (parsed.dailyMinutes as PersistedState['dailyMinutes'])
        : {},
    }
  } catch {
    return { ...defaultState, lastVisit: new Date().toISOString() }
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Cuota llena o almacenamiento bloqueado: la aplicación sigue funcionando
    // en memoria, simplemente no se persiste esta escritura.
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* sin efecto */
  }
}

/** Clave de día en formato YYYY-MM-DD, en la zona horaria local. */
export function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Clave de día desplazada N días respecto a hoy (para la racha). */
export function dayOffsetKey(offset: number, from: Date = new Date()): string {
  const date = new Date(from)
  date.setDate(date.getDate() + offset)
  return todayKey(date)
}
