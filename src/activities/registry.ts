/**
 * Registro de herramientas pedagógicas.
 *
 * Cada tipo de actividad interna tiene su componente. Las actividades vienen
 * del contenido publicado (ver src/content); las externas no tienen
 * componente: se abren en la plataforma donde viven.
 */

import type { ComponentType } from 'react'

import { activityDefinitions } from '../content'
import type { ActivityKind, ActivityResult } from '../types'
import type { ActivityToolProps } from './shared'
import { FillInBlanks } from './tools/FillInBlanks'
import { ListeningPractice } from './tools/ListeningPractice'
import { QuizTool } from './tools/QuizTool'
import { ReadingComprehension } from './tools/ReadingComprehension'
import { VocabularyBuilder } from './tools/VocabularyBuilder'
import { WordMatching } from './tools/WordMatching'

export { activityDefinitions }

export interface ActivityTool {
  id: string
  kind: ActivityKind
  component: ComponentType<ActivityToolProps>
  typeLabel: string
}

type InternalKind = Exclude<ActivityKind, 'external'>

const tools: Record<InternalKind, Omit<ActivityTool, 'id'>> = {
  vocabulary: { kind: 'vocabulary', component: VocabularyBuilder, typeLabel: 'Cards' },
  quiz: { kind: 'quiz', component: QuizTool, typeLabel: 'Quiz' },
  matching: { kind: 'matching', component: WordMatching, typeLabel: 'Matching' },
  'fill-blanks': { kind: 'fill-blanks', component: FillInBlanks, typeLabel: 'Fill in' },
  listening: { kind: 'listening', component: ListeningPractice, typeLabel: 'Listening' },
  reading: { kind: 'reading', component: ReadingComprehension, typeLabel: 'Reading' },
}

/** Herramientas de las actividades internas. Se rellena con `syncActivityTools` al cargar el contenido. */
export const activityTools: ActivityTool[] = []

export function syncActivityTools(): void {
  activityTools.splice(
    0,
    activityTools.length,
    ...activityDefinitions
      .filter((definition) => definition.kind !== 'external' && tools[definition.kind as InternalKind])
      .map((definition) => ({ ...tools[definition.kind as InternalKind], id: definition.id })),
  )
}

export function findActivity(id: string) {
  return activityDefinitions.find((definition) => definition.id === id)
}

export function findTool(id: string): ActivityTool | undefined {
  return activityTools.find((tool) => tool.id === id)
}

export function activityKindOf(id: string): ActivityKind | undefined {
  return findActivity(id)?.kind
}

export type { ActivityResult }
