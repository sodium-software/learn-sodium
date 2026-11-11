import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { dayOffsetKey, defaultState, loadState, saveState, todayKey } from './storage'
import {
  ProgressContext,
  type ProgressContextValue,
} from './progress-context'
import type {
  ActivityResult,
  MediaProgress,
  PersistedState,
  UserPreferences,
} from '../types'


export function ProgressProvider({
  children,
  activityCount,
}: {
  children: ReactNode
  activityCount: number
}) {
  const [state, setState] = useState<PersistedState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setState((prev) => ({ ...prev, preferences: { ...prev.preferences, ...patch } }))
  }, [])

  const recordActivity = useCallback((activityId: string, result: ActivityResult) => {
    setState((prev) => {
      const completedActivityIds = prev.completedActivityIds.includes(activityId)
        ? prev.completedActivityIds
        : [...prev.completedActivityIds, activityId]

      return {
        ...prev,
        activityResults: { ...prev.activityResults, [activityId]: result },
        completedActivityIds,
      }
    })
  }, [])

  const toggleDone = useCallback((activityId: string) => {
    setState((prev) => ({
      ...prev,
      completedActivityIds: prev.completedActivityIds.includes(activityId)
        ? prev.completedActivityIds.filter((id) => id !== activityId)
        : [...prev.completedActivityIds, activityId],
    }))
  }, [])

  const updateMedia = useCallback((mediaId: string, patch: Partial<MediaProgress>) => {
    setState((prev) => ({
      ...prev,
      mediaProgress: {
        ...prev.mediaProgress,
        [mediaId]: {
          highlightedIds: prev.mediaProgress[mediaId]?.highlightedIds ?? [],
          completed: prev.mediaProgress[mediaId]?.completed ?? false,
          ...patch,
        },
      },
    }))
  }, [])

  const toggleMastered = useCallback((term: string) => {
    setState((prev) => ({
      ...prev,
      masteredTerms: prev.masteredTerms.includes(term)
        ? prev.masteredTerms.filter((t) => t !== term)
        : [...prev.masteredTerms, term],
    }))
  }, [])

  const addMinutes = useCallback((minutes: number) => {
    if (minutes <= 0) return
    setState((prev) => {
      const key = todayKey()
      const current = prev.dailyMinutes[key] ?? 0
      return { ...prev, dailyMinutes: { ...prev.dailyMinutes, [key]: current + minutes } }
    })
  }, [])

  const streak = useMemo(() => {
    let count = 0
    // Hoy cuenta si ya hubo actividad; si no, se empieza desde ayer.
    let offset = state.dailyMinutes[todayKey()] ? 0 : -1
    while (offset > -400) {
      const key = dayOffsetKey(offset)
      if (!state.dailyMinutes[key]) break
      count += 1
      offset -= 1
    }
    return count
  }, [state.dailyMinutes])

  const minutesToday = state.dailyMinutes[todayKey()] ?? 0

  const overallProgress = useMemo(() => {
    if (activityCount === 0) return 0
    return Math.round((state.completedActivityIds.length / activityCount) * 100)
  }, [state.completedActivityIds.length, activityCount])

  const resetAll = useCallback(() => {
    setState({ ...defaultState, preferences: { ...defaultState.preferences } })
  }, [])

  const value = useMemo<ProgressContextValue>(
    () => ({
      state,
      preferences: state.preferences,
      updatePreferences,
      recordActivity,
      toggleDone,
      updateMedia,
      toggleMastered,
      addMinutes,
      streak,
      minutesToday,
      overallProgress,
      resetAll,
    }),
    [
      state,
      updatePreferences,
      recordActivity,
      toggleDone,
      updateMedia,
      toggleMastered,
      addMinutes,
      streak,
      minutesToday,
      overallProgress,
      resetAll,
    ],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

