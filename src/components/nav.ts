import type { IconName } from './icons'

export interface NavEntry {
  id: 'home' | 'song' | 'storytelling' | 'podcast' | 'short-film' | 'activities'
  label: string
  to: string
  icon: IconName
  hint: string
}

/** Las seis secciones de la plataforma, en orden de uso. */
export const navEntries: NavEntry[] = [
  { id: 'home', label: 'Inicio', to: '/', icon: 'Home', hint: 'Tu cuaderno' },
  { id: 'song', label: 'Canciones', to: '/song', icon: 'AudioLines', hint: 'Aprende con música' },
  {
    id: 'storytelling',
    label: 'Historias',
    to: '/storytelling',
    icon: 'BookOpen',
    hint: 'Lectura por capítulos',
  },
  { id: 'podcast', label: 'Podcast', to: '/podcast', icon: 'Mic', hint: 'Escucha y comprende' },
  {
    id: 'short-film',
    label: 'Cortometrajes',
    to: '/short-film',
    icon: 'Clapperboard',
    hint: 'Cine para aprender',
  },
  {
    id: 'activities',
    label: 'Actividades',
    to: '/activities',
    icon: 'Target',
    hint: 'Practica y comprueba',
  },
]
