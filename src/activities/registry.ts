/**
 * Registro de herramientas pedagógicas.
 *
 * Éste es el punto de extensión de la plataforma: para añadir una actividad
 * nueva basta con escribir su componente y añadir una línea a `tools` más su
 * entrada en `content/activities.json`. Ni la vista de actividades, ni el
 * enrutador, ni el resto de la aplicación necesitan cambios.
 */

import type { ComponentType } from 'react'

import activitiesJson from '../../content/activities.json'
import type { ActivityDefinition, ActivityKind, ActivityResult } from '../types'
import type { ActivityToolProps } from './shared'
import { FillInBlanks } from './tools/FillInBlanks'
import { ListeningPractice } from './tools/ListeningPractice'
import { QuizTool } from './tools/QuizTool'
import { ReadingComprehension } from './tools/ReadingComprehension'
import { VocabularyBuilder } from './tools/VocabularyBuilder'
import { WordMatching } from './tools/WordMatching'

export interface ActivityTool {
  /** Identificador único de la herramienta. */
  id: string
  /** Tipo de actividad: determina qué componente la ejecuta. */
  kind: ActivityKind
  /** Componente que implementa la actividad. */
  component: ComponentType<ActivityToolProps>
  /** Etiqueta corta del tipo, para agrupar en el catálogo. */
  typeLabel: string
}

/**
 * Componentes disponibles por tipo. Una actividad nueva puede reutilizar uno
 * de estos o traer el suyo y registrarlo aquí.
 */
const tools: Record<ActivityKind, ActivityTool> = {
  vocabulary: {
    id: 'vocabulary',
    kind: 'vocabulary',
    component: VocabularyBuilder,
    typeLabel: 'Tarjetas',
  },
  quiz: {
    id: 'quiz',
    kind: 'quiz',
    component: QuizTool,
    typeLabel: 'Quiz',
  },
  matching: {
    id: 'matching',
    kind: 'matching',
    component: WordMatching,
    typeLabel: 'Relacionar',
  },
  'fill-blanks': {
    id: 'fill-blanks',
    kind: 'fill-blanks',
    component: FillInBlanks,
    typeLabel: 'Completar',
  },
  listening: {
    id: 'listening',
    kind: 'listening',
    component: ListeningPractice,
    typeLabel: 'Escucha',
  },
  reading: {
    id: 'reading',
    kind: 'reading',
    component: ReadingComprehension,
    typeLabel: 'Lectura',
  },
}

/** Definiciones cargadas desde `content/activities.json`. */
export const activityDefinitions: ActivityDefinition[] =
  activitiesJson.activities as ActivityDefinition[]

export const activityTools: ActivityTool[] = activityDefinitions.map((definition) => {
  const tool = tools[definition.kind]
  if (!tool) {
    throw new Error(`No hay herramienta registrada para el tipo "${definition.kind}"`)
  }
  return { ...tool, id: definition.id }
})

export function findActivity(id: string): ActivityDefinition | undefined {
  return activityDefinitions.find((definition) => definition.id === id)
}

export function findTool(id: string): ActivityTool | undefined {
  return activityTools.find((tool) => tool.id === id)
}

/** Tipo de la actividad a partir de su id, para los enlaces cruzados. */
export function activityKindOf(id: string): ActivityKind | undefined {
  return findActivity(id)?.kind
}

export type { ActivityResult }
