/** Configuración de la plataforma: nombre y textos de portada. */

export interface SiteConfig {
  platformName: string
  shortName: string
  /** Lema bajo el nombre. */
  tagline: string
  /** Portada: texto de apoyo bajo el nombre. */
  heroText: string
}

export const siteConfig: SiteConfig = {
  platformName: 'La Cartilla',
  shortName: 'Cartilla',
  tagline: 'Inglés para niños',
  heroText: 'Canciones, cuentos y juegos para aprender tus primeras palabras en inglés.',
}
