/**
 * Configuración de la plataforma — el único lugar donde se personaliza la marca.
 *
 * Cambia aquí el nombre de la plataforma, el nombre de la persona, el mensaje de
 * bienvenida y los colores. Todo lo demás (vistas, actividades, navegación) lee
 * de este objeto.
 */

export interface SiteConfig {
  /** Nombre de la plataforma. */
  platformName: string
  /** Nombre corto para el lateral y la pestaña del navegador. */
  shortName: string
  /** Nombre de la persona que aprende. */
  learnerName: string
  /** Nombre de la persona que greeting. */
  welcomeMessage: string
  /** Frase que acompaña al saludo. */
  welcomeSubtitle: string
  /** Paleta: una sola tinta y dos papeles. */
  colors: {
    paper: string
    sheet: string
    ink: string
    accent: string
  }
  /** Tono de voz de la interfaz. */
  tagline: string
  /** Objetivo pedagógico de la plataforma. */
  purpose: string
}

export const siteConfig: SiteConfig = {
  platformName: 'La Cartilla',
  shortName: 'Cartilla',
  learnerName: 'Julián',
  welcomeMessage: 'Qué gusto verte',
  welcomeSubtitle:
    'Tu cuaderno de trabajo: canciones, historias, podcasts y cortometrajes para aprender en inglés.',
  tagline: 'Aprende inglés con material que se puede escuchar, leer y practicar',
  purpose:
    'Reunir recursos pedagógicos en un mismo cuaderno: material real, actividades que se corrigen solas y un registro de lo que ya avanzaste.',
  colors: {
    paper: '#f5f3ec',
    sheet: '#fbfaf6',
    ink: '#123c40',
    accent: '#0e4f52',
  },
}
