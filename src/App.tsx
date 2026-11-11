import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { AppShell } from './components/AppShell'
import { settings } from './content'
import { ActivitiesView } from './views/ActivitiesView'
import { ActivityRunnerView } from './views/ActivityRunnerView'
import { CatalogView, StoryCatalogView } from './views/CatalogView'
import { HomeView } from './views/HomeView'
import { NotFoundView } from './views/NotFoundView'
import { PageView } from './views/PageView'
import { PodcastDetailView } from './views/PodcastDetailView'
import { SettingsView } from './views/SettingsView'
import { ShortFilmDetailView } from './views/ShortFilmDetailView'
import { SongDetailView } from './views/SongDetailView'
import { StoryDetailView } from './views/StoryDetailView'

// El panel y el juego se cargan aparte: no pesan en la web pública.
const AdminApp = import.meta.env.VITE_STATIC === '1' ? () => null : lazy(() => import('./admin/AdminApp'))
const GameView = lazy(() => import('./game/GameView'))

const loading = <div className="frame py-16 text-ink-mute">Loading…</div>

export function AppRoutes() {
  return (
    <Routes>
      {import.meta.env.VITE_STATIC !== '1' ? (
        <Route
          path="admin/*"
          element={
            <Suspense fallback={loading}>
              <AdminApp />
            </Suspense>
          }
        />
      ) : null}
      {settings.easterEgg ? (
        <Route
          path="juego"
          element={
            <Suspense fallback={loading}>
              <GameView />
            </Suspense>
          }
        />
      ) : null}
      <Route element={<AppShell />}>
        <Route index element={<HomeView />} />
        <Route path="introduccion" element={<PageView id="introduccion" />} />
        <Route path="biodata" element={<PageView id="biodata" />} />
        <Route
          path="song"
          element={
            <CatalogView
              kind="song"
              title="Songs"
              description="Listen, follow the words and learn new ones."
              intro="Each song has the words with a translation, and a player that lights up the line you hear. You can save your favorite parts: they stay on this device."
            />
          }
        />
        <Route path="song/:id" element={<SongDetailView />} />
        <Route path="storytelling" element={<StoryCatalogView />} />
        <Route path="storytelling/:id" element={<StoryDetailView />} />
        <Route
          path="podcast"
          element={
            <CatalogView
              kind="podcast"
              title="Podcast"
              description="Short talks with the words on screen."
              intro="Each episode has the full text with times, and a few questions to check what you understood."
            />
          }
        />
        <Route path="podcast/:id" element={<PodcastDetailView />} />
        <Route
          path="short-film"
          element={
            <CatalogView
              kind="film"
              title="Short films"
              description="Video stories with scenes and questions."
              intro="Short films in English with a translation for each scene. At the end, a few questions to see what you understood."
            />
          }
        />
        <Route path="short-film/:id" element={<ShortFilmDetailView />} />
        <Route path="activities" element={<ActivitiesView />} />
        <Route path="activities/:id" element={<ActivityRunnerView />} />
        <Route path="settings" element={<SettingsView />} />
        <Route path="*" element={<NotFoundView />} />
      </Route>
    </Routes>
  )
}
