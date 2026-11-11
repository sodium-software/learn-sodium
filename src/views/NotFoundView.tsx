import { Link } from 'react-router-dom'

import { Icon } from '../components/ui'

/** Vista de error: ruta desconocida. */
export function NotFoundView() {
  return (
    <div className="frame py-24">
      <h1 className="text-display font-display font-extrabold leading-[0.98] text-ink">
        Esta página no existe
      </h1>
      <p className="mt-5 max-w-xl text-lead text-ink-soft">
        Puede que el enlace tenga un error, o que el material se haya movido a otra
        sección (error 404).
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/" className="btn btn-primary">
          Volver al inicio
          <Icon name="ArrowRight" size={16} />
        </Link>
        <Link to="/activities" className="btn btn-secondary">
          Ver las actividades
        </Link>
      </div>
    </div>
  )
}
