export interface NavEntry {
  id: 'home' | 'introduccion' | 'song' | 'storytelling' | 'podcast' | 'short-film' | 'activities' | 'biodata' | 'settings'
  label: string
  to: string
  /** Las secciones para el adulto van agrupadas en «About». */
  adult?: boolean
}

/** Las secciones de la plataforma, en el orden del menú. */
export const navEntries: NavEntry[] = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'song', label: 'Songs', to: '/song' },
  { id: 'storytelling', label: 'Storytale', to: '/storytelling' },
  { id: 'podcast', label: 'Podcast', to: '/podcast' },
  { id: 'short-film', label: 'Short films', to: '/short-film' },
  { id: 'activities', label: 'Activities', to: '/activities' },
  { id: 'introduccion', label: 'Introduction', to: '/introduccion', adult: true },
  { id: 'biodata', label: 'Bio', to: '/biodata', adult: true },
  { id: 'settings', label: 'Settings', to: '/settings', adult: true },
]
