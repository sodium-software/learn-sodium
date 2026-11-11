import type { DrawingName } from './Drawings'

export interface NavEntry {
  id: 'home' | 'introduccion' | 'song' | 'storytelling' | 'podcast' | 'short-film' | 'activities' | 'biodata' | 'settings'
  label: string
  to: string
  /** Dibujo de la sección (solo las secciones de contenido). */
  drawing?: DrawingName
  /** Las secciones para el adulto van agrupadas en «Para adultos». */
  adult?: boolean
}

/** Las secciones de la plataforma, en el orden del menú. */
export const navEntries: NavEntry[] = [
  { id: 'home', label: 'Inicio', to: '/' },
  { id: 'song', label: 'Canciones', to: '/song', drawing: 'song' },
  { id: 'storytelling', label: 'Historias', to: '/storytelling', drawing: 'story' },
  { id: 'podcast', label: 'Podcast', to: '/podcast', drawing: 'podcast' },
  { id: 'short-film', label: 'Cortometrajes', to: '/short-film', drawing: 'film' },
  { id: 'activities', label: 'Actividades', to: '/activities', drawing: 'activity' },
  { id: 'introduccion', label: 'Introducción', to: '/introduccion', adult: true },
  { id: 'biodata', label: 'Biodata', to: '/biodata', adult: true },
  { id: 'settings', label: 'Ajustes', to: '/settings', adult: true },
]
