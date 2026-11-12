import { Link } from 'react-router-dom'

import { Icon } from '../components/ui'

/** Vista de error: ruta desconocida. */
export function NotFoundView() {
  return (
    <div className="frame py-24">
      <h1 className="text-display font-display leading-[0.98] text-ink">
        This page doesn't exist
      </h1>
      <p className="mt-5 max-w-xl text-lead text-ink-soft">
        The link may have a mistake, or this page moved to another
        section (error 404).
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/" className="btn btn-primary">
          Back to home
          <Icon name="ArrowRight" size={16} />
        </Link>
        <Link to="/activities" className="btn btn-secondary">
          See the activities
        </Link>
      </div>
    </div>
  )
}
