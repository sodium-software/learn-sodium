import { Route, Routes } from 'react-router-dom'

import { AppShell } from './components/AppShell'
import { ActivitiesView } from './views/ActivitiesView'
import { ActivityRunnerView } from './views/ActivityRunnerView'
import { CatalogView, StoryCatalogView } from './views/CatalogView'
import { HomeView } from './views/HomeView'
import { NotFoundView } from './views/NotFoundView'
import { PodcastDetailView } from './views/PodcastDetailView'
import { SettingsView } from './views/SettingsView'
import { ShortFilmDetailView } from './views/ShortFilmDetailView'
import { SongDetailView } from './views/SongDetailView'
import { StoryDetailView } from './views/StoryDetailView'

/**
 * Mapa de rutas. Cada sección tiene su catálogo y sus páginas de detalle.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeView />} />
        <Route path="song" element={<CatalogView kind="song" title="Canciones" description="Cuatro piezas con letra sincronizada, vocabulario y fragmentos para volver." intro="Cada canción trae la letra completa con su traducción al español, y un reproductor que va marcando la línea que suena. Marca los fragmentos que quieras conservar: se guardan en tu navegador." />} />
        <Route path="song/:id" element={<SongDetailView />} />
        <Route path="storytelling" element={<StoryCatalogView />} />
        <Route path="storytelling/:id" element={<StoryDetailView />} />
        <Route path="podcast" element={<CatalogView kind="podcast" title="Podcast" description="Episodios con transcripción sincronizada y comprensión audible." intro="Cuatro episodios sobre cómo aprender, el café de altura y las palabras que aprendes en el metro. Cada uno tiene transcripción con marca de tiempo y preguntas de comprensión." />} />
        <Route path="podcast/:id" element={<PodcastDetailView />} />
        <Route path="short-film" element={<CatalogView kind="film" title="Cortometrajes" description="Piezas audiovisualescortas con sinopsis, escenas y preguntas." intro="Cortometrajes breves con la narración original en inglés y la traducción al español debajo de cada escena. Al terminar, unas preguntas para comprobar que lo has seguido." />} />
        <Route path="short-film/:id" element={<ShortFilmDetailView />} />
        <Route path="activities" element={<ActivitiesView />} />
        <Route path="activities/:id" element={<ActivityRunnerView />} />
        <Route path="settings" element={<SettingsView />} />
        <Route path="*" element={<NotFoundView />} />
      </Route>
    </Routes>
  )
}
