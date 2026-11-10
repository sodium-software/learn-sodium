import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { AppRoutes } from './App'
import { ProgressProvider } from './lib/progress'
import { activityDefinitions } from './activities/registry'
import './index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('No se encontró el contenedor #root')
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <ProgressProvider activityCount={activityDefinitions.length}>
        <AppRoutes />
      </ProgressProvider>
    </BrowserRouter>
  </StrictMode>,
)
