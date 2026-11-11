import type { DrawingName } from './Drawings'

/** Color de plástico de cada sección. `ink` es el texto que va encima. */
export const SECTION_COLORS = {
  song: { bg: 'bg-red', ink: 'text-white', drawing: 'song' },
  story: { bg: 'bg-blue', ink: 'text-white', drawing: 'story' },
  podcast: { bg: 'bg-yellow', ink: 'text-ink', drawing: 'podcast' },
  film: { bg: 'bg-ink', ink: 'text-white', drawing: 'film' },
  activity: { bg: 'bg-green', ink: 'text-white', drawing: 'activity' },
} as const satisfies Record<string, { bg: string; ink: string; drawing: DrawingName }>
