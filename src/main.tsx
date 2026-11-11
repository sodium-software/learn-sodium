import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'

import { AppRoutes } from './App'
import { ProgressProvider } from './lib/progress'
import { activityDefinitions, syncActivityTools } from './activities/registry'
import { loadContent } from './content/load'
import './index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('No se encontró el contenedor #root')
}

// La copia estática para abrir sin servidor (file://) usa rutas con #.
const Router = import.meta.env.VITE_STATIC === '1' ? HashRouter : BrowserRouter

void loadContent().then(() => {
  syncActivityTools()
  createRoot(container).render(
    <StrictMode>
      <Router>
        <ProgressProvider activityCount={activityDefinitions.length}>
          <AppRoutes />
        </ProgressProvider>
      </Router>
    </StrictMode>,
  )
})
