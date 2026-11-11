/**
 * Configuración de la plataforma: nombre, textos de portada e identidad visual.
 *
 * `identity` elige una de las dos identidades propuestas (sus colores y
 * tipografías están en src/index.css). Para comparar sin tocar código basta
 * con abrir cualquier página con `?identidad=cuaderno` o `?identidad=recreo`:
 * la elección se mantiene mientras dure la pestaña.
 */

export type Identity = 'cuaderno' | 'recreo'

export const IDENTITIES: Record<Identity, { label: string; description: string }> = {
  cuaderno: {
    label: 'Cuaderno',
    description: 'Papel claro, tinta azul petróleo y esquinas rectas: un cuaderno de clase ordenado.',
  },
  recreo: {
    label: 'Recreo',
    description: 'Crema, índigo y rojo tomate, letra redondeada y esquinas suaves: patio de colegio.',
  },
}

export interface SiteConfig {
  platformName: string
  shortName: string
  /** Lema bajo el nombre. */
  tagline: string
  /** Portada: titular y texto de apoyo. */
  heroTitle: string
  heroText: string
  identity: Identity
}

export const siteConfig: SiteConfig = {
  platformName: 'La Cartilla',
  shortName: 'Cartilla',
  tagline: 'Inglés para niños',
  heroTitle: 'Aprende inglés cantando, leyendo y jugando',
  heroText:
    'Canciones, cuentos, podcasts y cortometrajes en inglés, con actividades para practicar a tu ritmo.',
  identity: 'cuaderno',
}

const STORAGE_KEY = 'la-cartilla:identidad'

export function currentIdentity(): Identity {
  const isIdentity = (value: unknown): value is Identity => value === 'cuaderno' || value === 'recreo'
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('identidad')
    if (isIdentity(fromUrl)) window.sessionStorage.setItem(STORAGE_KEY, fromUrl)
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    if (isIdentity(stored)) return stored
  } catch {
    /* almacenamiento bloqueado */
  }
  return siteConfig.identity
}

export function applyIdentity(): void {
  document.documentElement.dataset.identity = currentIdentity()
}
