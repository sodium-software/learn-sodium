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
  tagline: 'Stories in English · B1',
  heroText: 'A zine of four stories for B1 learners: a song, a podcast, a short film and a storytale, each with its script and activities.',
}
