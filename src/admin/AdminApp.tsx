import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

import { Icon } from '../components/ui'
import { clsx } from '../lib/cn'
import { KINDS, KIND_LABELS, type Kind } from '../shared/schema'
import { ApiError, STATUS_LABEL, api, publicRoute, setCsrf, type ItemSummary } from './api'
import { ItemForm } from './ItemForm'

/** Panel de gestión de contenido: /admin */
export default function AdminApp() {
  const [session, setSession] = useState<{ email: string } | null | undefined>(undefined)

  useEffect(() => {
    document.title = 'Panel · La Cartilla'
    api<{ email: string | null; csrf: string | null }>('session')
      .then((data) => {
        if (!data.email || !data.csrf) return setSession(null)
        setCsrf(data.csrf)
        setSession({ email: data.email })
      })
      .catch(() => setSession(null))
  }, [])

  if (session === undefined) return <p className="frame py-16 text-ink-mute">Cargando…</p>
  if (session === null) {
    return (
      <Login
        onDone={(email, csrf) => {
          setCsrf(csrf)
          setSession({ email })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <aside className="border-b border-tint-deep bg-sheet px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <p className="font-display text-lg font-semibold text-ink">Panel</p>
        <p className="truncate text-xs text-ink-mute">{session.email}</p>
        <nav className="mt-4 flex flex-wrap gap-1 lg:flex-col" aria-label="Secciones del panel">
          <AdminLink to="/admin" end>
            Resumen
          </AdminLink>
          {KINDS.map((kind) => (
            <AdminLink key={kind} to={`/admin/${kind}`}>
              {KIND_LABELS[kind]}
            </AdminLink>
          ))}
          <AdminLink to="/admin/ajustes">Juego y dedicatoria</AdminLink>
          <AdminLink to="/admin/respaldo">Respaldo</AdminLink>
        </nav>
        <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost justify-start text-sm">
            <Icon name="ExternalLink" size={15} />
            Ver la web
          </a>
          <button
            type="button"
            className="btn btn-ghost justify-start text-sm"
            onClick={async () => {
              await api('logout', { method: 'POST' }).catch(() => undefined)
              setSession(null)
            }}
          >
            <Icon name="LogOut" size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 lg:px-10">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="ajustes" element={<SettingsForm />} />
          <Route path="respaldo" element={<Backup />} />
          <Route path=":kind" element={<ItemList />} />
          <Route path=":kind/nuevo" element={<ItemForm key="new" />} />
          <Route path=":kind/:id" element={<ItemForm />} />
        </Routes>
      </main>
    </div>
  )
}

function AdminLink({ to, end, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx('px-3 py-2 text-sm', isActive ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:bg-tint hover:text-ink')
      }
    >
      {children}
    </NavLink>
  )
}

// ── Acceso ──────────────────────────────────────────────────────────────────

function Login({ onDone }: { onDone: (email: string, csrf: string) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        className="panel w-full max-w-sm p-6"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          setBusy(true)
          setError('')
          try {
            const data = await api<{ email: string; csrf: string }>('login', {
              method: 'POST',
              json: { email: form.get('email'), password: form.get('password') },
            })
            onDone(data.email, data.csrf)
          } catch (err) {
            setError((err as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        <h1 className="font-display text-2xl font-semibold text-ink">Panel de La Cartilla</h1>
        <p className="mt-1 text-sm text-ink-mute">Acceso solo para la autora.</p>
        <label className="label mt-6 block" htmlFor="email">
          Correo
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field mt-1.5" />
        <label className="label mt-4 block" htmlFor="password">
          Contraseña
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field mt-1.5" />
        {error ? (
          <p role="alert" className="mt-4 text-sm text-wrong">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>
          Entrar
        </button>
      </form>
    </main>
  )
}

// ── Resumen ─────────────────────────────────────────────────────────────────

function useItems() {
  const [items, setItems] = useState<ItemSummary[] | null>(null)
  const [error, setError] = useState('')
  const reload = useCallback(() => {
    api<ItemSummary[]>('items')
      .then(setItems)
      .catch((err: Error) => setError(err.message))
  }, [])
  useEffect(reload, [reload])
  return { items, error, reload, setItems }
}

function Overview() {
  const { items, reload } = useItems()
  const [confirm, setConfirm] = useState(false)
  const [note, setNote] = useState('')
  const examples = items?.filter((item) => item.example).length ?? 0

  return (
    <div>
      <h1 className="text-head text-ink">Resumen</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {KINDS.map((kind) => {
          const own = items?.filter((item) => item.kind === kind) ?? []
          return (
            <Link key={kind} to={`/admin/${kind}`} className="panel p-4 hover:border-ink-mute">
              <p className="font-display text-lg font-semibold text-ink">{KIND_LABELS[kind]}</p>
              <p className="mt-1 text-sm text-ink-mute">
                {own.filter((item) => item.status !== 'draft').length} publicadas · {own.length} en total
              </p>
            </Link>
          )
        })}
      </div>

      <section className="mt-10 panel-quiet p-5">
        <h2 className="font-display text-xl font-semibold text-ink">Piezas de ejemplo</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Hay {examples} piezas marcadas como «Ejemplo». Cuando tengas tu propio material, bórralas todas de una vez.
        </p>
        {examples > 0 ? (
          confirm ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-ink">¿Borrar las {examples} piezas de ejemplo? No se puede deshacer.</span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  const result = await api<{ deleted: number }>('examples', { method: 'DELETE' })
                  setNote(`Se borraron ${result.deleted} piezas de ejemplo.`)
                  setConfirm(false)
                  reload()
                }}
              >
                Sí, borrar
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary mt-4" onClick={() => setConfirm(true)}>
              <Icon name="Trash2" size={15} />
              Borrar todos los ejemplos
            </button>
          )
        ) : null}
        {note ? (
          <p role="status" className="mt-3 text-sm text-accent">
            {note}
          </p>
        ) : null}
      </section>
    </div>
  )
}

// ── Lista por tipo ──────────────────────────────────────────────────────────

function ItemList() {
  const { kind } = useParams<{ kind: Kind }>()
  const { items, error, reload, setItems } = useItems()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  if (!kind || !KINDS.includes(kind)) return <p>Sección desconocida.</p>
  const own = items?.filter((item) => item.kind === kind) ?? []

  const run = async (task: () => Promise<unknown>) => {
    setActionError('')
    try {
      await task()
    } catch (err) {
      setActionError(err instanceof ApiError && err.details.length ? `${err.message}: ${err.details.join('; ')}` : (err as Error).message)
    }
    reload()
  }

  const move = (index: number, to: number) => {
    const next = [...own]
    const [item] = next.splice(index, 1)
    next.splice(to, 0, item)
    setItems((all) => [...(all ?? []).filter((entry) => entry.kind !== kind), ...next])
    void run(() => api('reorder', { method: 'POST', json: { ids: next.map((entry) => entry.id) } }))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-head text-ink">{KIND_LABELS[kind]}</h1>
        {kind !== 'page' ? (
          <Link to={`/admin/${kind}/nuevo`} className="btn btn-primary">
            <Icon name="Plus" size={16} />
            Nueva
          </Link>
        ) : null}
      </div>
      {error || actionError ? (
        <p role="alert" className="mt-4 text-sm text-wrong">
          {error || actionError}
        </p>
      ) : null}
      {items === null ? <p className="mt-6 text-ink-mute">Cargando…</p> : null}
      {items && own.length === 0 ? <p className="mt-6 text-ink-mute">Todavía no hay nada aquí.</p> : null}

      <ol className="mt-6 divide-y divide-tint-deep border-y border-tint-deep">
        {own.map((item, index) => (
          <li key={item.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
            <div className="flex shrink-0 gap-1">
              <button type="button" className="btn btn-ghost min-h-9 px-2" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`Subir ${item.title}`}>
                <Icon name="ArrowUp" size={15} />
              </button>
              <button type="button" className="btn btn-ghost min-h-9 px-2" disabled={index === own.length - 1} onClick={() => move(index, index + 1)} aria-label={`Bajar ${item.title}`}>
                <Icon name="ArrowDown" size={15} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <Link to={`/admin/${kind}/${item.id}`} className="font-medium text-ink hover:text-accent">
                {item.title}
              </Link>
              <p className="mt-0.5 flex flex-wrap gap-2 text-xs text-ink-mute">
                <span className={item.status === 'draft' ? '' : 'text-accent'}>{STATUS_LABEL[item.status]}</span>
                {item.example ? <span>· Ejemplo</span> : null}
                <span>· {item.id}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/admin/${kind}/${item.id}`} className="btn btn-secondary min-h-9 text-sm">
                Editar
              </Link>
              {item.status === 'draft' ? (
                <button type="button" className="btn btn-secondary min-h-9 text-sm" onClick={() => void run(() => api(`items/${item.id}/publish`, { method: 'POST' }))}>
                  Publicar
                </button>
              ) : (
                <button type="button" className="btn btn-secondary min-h-9 text-sm" onClick={() => void run(() => api(`items/${item.id}/unpublish`, { method: 'POST' }))}>
                  Despublicar
                </button>
              )}
              <a href={`${publicRoute(kind, item.id)}?preview=1`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost min-h-9 text-sm" aria-label={`Vista previa de ${item.title}`}>
                <Icon name="Eye" size={15} />
              </a>
              {pendingDelete === item.id ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary min-h-9 text-sm"
                    onClick={() => {
                      setPendingDelete(null)
                      void run(() => api(`items/${item.id}`, { method: 'DELETE' }))
                    }}
                  >
                    Confirmar borrado
                  </button>
                  <button type="button" className="btn btn-ghost min-h-9 text-sm" onClick={() => setPendingDelete(null)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-ghost min-h-9 text-sm text-wrong" onClick={() => setPendingDelete(item.id)} aria-label={`Borrar ${item.title}`}>
                  <Icon name="Trash2" size={15} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Juego y dedicatoria ─────────────────────────────────────────────────────

function SettingsForm() {
  const [form, setForm] = useState<{ easterEgg: string; dedication: string } | null>(null)
  const [note, setNote] = useState('')
  useEffect(() => {
    api<{ easterEgg: string; dedication: string }>('settings').then(setForm, (err: Error) => setNote(err.message))
  }, [])
  if (!form) return <p className="text-ink-mute">{note || 'Cargando…'}</p>
  return (
    <form
      className="max-w-xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        try {
          await api('settings', { method: 'PUT', json: form })
          setNote('Guardado. Se aplica al recargar la web.')
        } catch (err) {
          setNote((err as Error).message)
        }
      }}
    >
      <h1 className="text-head text-ink">Juego y dedicatoria</h1>
      <p className="text-sm text-ink-soft">
        El juego se abre tocando cinco veces seguidas el nombre de la web, arriba a la izquierda. Puedes ocultarlo
        mientras dure la evaluación.
      </p>
      <fieldset>
        <legend className="label">Juego oculto</legend>
        <div className="mt-2 flex gap-6">
          {[
            ['on', 'Activado'],
            ['off', 'Desactivado'],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="easterEgg" value={value} checked={form.easterEgg === value} onChange={() => setForm({ ...form, easterEgg: value })} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label block" htmlFor="dedication">
          Dedicatoria (aparece al empezar el juego)
        </label>
        <textarea id="dedication" className="field mt-1.5" rows={4} maxLength={600} value={form.dedication} onChange={(event) => setForm({ ...form, dedication: event.target.value })} />
      </div>
      <button type="submit" className="btn btn-primary">
        Guardar
      </button>
      {note ? (
        <p role="status" className="text-sm text-ink-soft">
          {note}
        </p>
      ) : null}
    </form>
  )
}

// ── Respaldo ────────────────────────────────────────────────────────────────

interface BackupFile {
  format: string
  media: { key: string }[]
  [key: string]: unknown
}

function Backup() {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  async function exportZip() {
    setBusy(true)
    setNote('Preparando el respaldo…')
    try {
      const backup = await api<BackupFile>('export')
      const files: Record<string, Uint8Array> = { 'backup.json': strToU8(JSON.stringify(backup, null, 2)) }
      for (const { key } of backup.media) {
        const response = await fetch(`/files/${key}`, { credentials: 'same-origin' })
        if (response.ok) files[`files/${key}`] = new Uint8Array(await response.arrayBuffer())
      }
      const blob = new Blob([zipSync(files, { level: 0 }) as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `la-cartilla-respaldo-${new Date().toISOString().slice(0, 10)}.zip`
      link.click()
      URL.revokeObjectURL(link.href)
      setNote(`Respaldo descargado: ${backup.media.length} archivos.`)
    } catch (err) {
      setNote((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function importZip() {
    if (!file) return
    setBusy(true)
    setNote('Importando…')
    try {
      const entries = unzipSync(new Uint8Array(await file.arrayBuffer()))
      const json = entries['backup.json']
      if (!json) throw new Error('El archivo no contiene backup.json')
      const backup = JSON.parse(strFromU8(json)) as BackupFile
      for (const [path, bytes] of Object.entries(entries)) {
        if (!path.startsWith('files/') || path.endsWith('/')) continue
        const key = path.slice('files/'.length)
        await api('upload', { method: 'POST', headers: { 'X-Media-Key': key, 'X-File-Name': key }, body: bytes as Uint8Array<ArrayBuffer> })
      }
      const result = await api<{ imported: number }>('import', { method: 'POST', json: backup })
      setNote(`Importadas ${result.imported} piezas.`)
      setFile(null)
    } catch (err) {
      setNote(err instanceof ApiError && err.details.length ? `${err.message} ${err.details.slice(0, 5).join('; ')}` : (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-head text-ink">Respaldo</h1>
      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Exportar</h2>
        <p className="mt-1 text-sm text-ink-soft">Descarga un .zip con todo el contenido (borradores y publicado) y los archivos subidos.</p>
        <button type="button" className="btn btn-primary mt-3" onClick={() => void exportZip()} disabled={busy}>
          <Icon name="Download" size={16} />
          Descargar respaldo
        </button>
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Importar</h2>
        <p className="mt-1 text-sm text-ink-soft">Sustituye todo el contenido actual por el de un respaldo. Exporta antes uno nuevo por si acaso.</p>
        <input type="file" accept=".zip,application/zip" className="mt-3 block text-sm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} aria-label="Archivo de respaldo" />
        {file ? (
          <button type="button" className="btn btn-secondary mt-3" onClick={() => void importZip()} disabled={busy}>
            <Icon name="Upload" size={16} />
            Sustituir todo por «{file.name}»
          </button>
        ) : null}
      </section>
      {note ? (
        <p role="status" className="text-sm text-ink-soft">
          {note}
        </p>
      ) : null}
    </div>
  )
}
