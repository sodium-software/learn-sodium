import type { IconName } from './icons'

export interface NavEntry {
  id: 'home' | 'introduccion' | 'song' | 'storytelling' | 'podcast' | 'short-film' | 'activities' | 'biodata'
  label: string
  to: string
  icon: IconName
  hint: string
}

/** Las secciones de la plataforma, en el orden del menú. */
export const navEntries: NavEntry[] = [
  { id: 'home', label: 'Inicio', to: '/', icon: 'Home', hint: 'Portada' },
  { id: 'introduccion', label: 'Introducción', to: '/introduccion', icon: 'Info', hint: 'Sobre el proyecto' },
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
  { id: 'biodata', label: 'Biodata', to: '/biodata', icon: 'UserRound', hint: 'Quién lo hizo' },
]
