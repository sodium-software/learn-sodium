import { createContext, useContext } from 'react'

import type {
  ActivityResult,
  MediaProgress,
  PersistedState,
  UserPreferences,
} from '../types'

/** Lo que la aplicación expone sobre el progreso de la persona. */
export interface ProgressContextValue {
  state: PersistedState
  preferences: UserPreferences
  updatePreferences: (patch: Partial<UserPreferences>) => void
  recordActivity: (activityId: string, result: ActivityResult) => void
  /** Marca o desmarca como hecha (actividades externas, marcado manual). */
  toggleDone: (activityId: string) => void
  updateMedia: (mediaId: string, patch: Partial<MediaProgress>) => void
  toggleMastered: (term: string) => void
  addMinutes: (minutes: number) => void
  /** Días consecutivos con al menos un minuto de actividad. */
  streak: number
  /** Minutos acumulados hoy. */
  minutesToday: number
  /** Progreso global 0-100 sobre todas las actividades definidas. */
  overallProgress: number
  resetAll: () => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)

/** Acceso al estado de progreso. Debe usarse dentro de <ProgressProvider>. */
export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error('useProgress debe usarse dentro de <ProgressProvider>')
  }
  return context
}
