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
  tagline: 'English for kids',
  heroText: 'Songs, stories and games to learn your first words in English.',
}
