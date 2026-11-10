import type { LucideProps } from 'lucide-react'

import { icons } from './icon-set'

export type IconName = keyof typeof icons

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Component = icons[name]
  return <Component {...props} />
}
