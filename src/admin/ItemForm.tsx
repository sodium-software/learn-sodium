import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { Icon } from '../components/ui'
import { KIND_LABELS, SCHEMAS, isVisible, type Data, type Field, type Kind } from '../shared/schema'
import { ApiError, STATUS_LABEL, api, publicRoute, uploadFile, type ItemSummary } from './api'

/**
 * Formulario de una pieza, generado desde el esquema compartido.
 * Las listas de texto (etiquetas, líneas, párrafos) se editan como texto y el
 * servidor las convierte en listas al guardar.
 */

type FormData = Record<string, unknown>

function toForm(fields: Field[], data: Data): FormData {
  const form: FormData = {}
  for (const field of fields) {
    const value = data[field.name]
    if (field.type === 'list') {
      form[field.name] = Array.isArray(value) ? value.map((item) => toForm(field.fields ?? [], item as Data)) : []
    } else if (field.type === 'tags') {
      form[field.name] = Array.isArray(value) ? value.join(', ') : ''
    } else if (field.type === 'lines') {
      form[field.name] = Array.isArray(value) ? value.join('\n') : ''
    } else if (field.type === 'paragraphs') {
      form[field.name] = Array.isArray(value) ? value.join('\n\n') : ''
    } else {
      form[field.name] = value === undefined || value === null ? '' : String(value)
    }
  }
  return form
}

export function ItemForm() {
  const { kind, id } = useParams<{ kind: Kind; id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fields = kind ? SCHEMAS[kind] : undefined
  const [form, setForm] = useState<FormData | null>(id ? null : fields ? toForm(fields, defaults(kind as Kind)) : null)
  const [status, setStatus] = useState<ItemSummary['status'] | null>(null)
  const [example, setExample] = useState(false)
  // Al crear se navega a la ruta de la pieza nueva: el aviso viaja en el estado de la navegación.
  const saved = (location.state as { saved?: string } | null)?.saved
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string; details?: string[] } | null>(
    saved ? { tone: 'ok', text: saved } : null,
  )
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id || !fields) return
    let active = true
    api<{ data: Data; status: ItemSummary['status']; example: boolean }>(`items/${id}`)
      .then((item) => {
        if (!active) return
        setForm(toForm(fields, item.data))
        setStatus(item.status)
        setExample(item.example)
      })
      .catch((error: Error) => active && setMessage({ tone: 'error', text: error.message }))
    return () => {
      active = false
    }
  }, [id, fields])

  if (!kind || !fields) return <p>Unknown type.</p>
  if (!form) return <p className="text-ink-mute">{message?.text ?? 'Loading…'}</p>

  async function save(publish: boolean) {
    setBusy(true)
    setMessage(null)
    try {
      let itemId = id
      if (itemId) {
        await api(`items/${itemId}`, { method: 'PUT', json: { data: form } })
      } else {
        itemId = (await api<{ id: string }>('items', { method: 'POST', json: { kind, data: form } })).id
      }
      if (publish) await api(`items/${itemId}/publish`, { method: 'POST' })
      setStatus(publish ? 'published' : status === null ? 'draft' : status === 'draft' ? 'draft' : 'changed')
      const text = publish ? 'Saved and published.' : 'Draft saved.'
      setMessage({ tone: 'ok', text })
      if (!id) navigate(`/admin/${kind}/${itemId}`, { replace: true, state: { saved: text } })
    } catch (error) {
      const details = error instanceof ApiError ? error.details : undefined
      setMessage({ tone: 'error', text: (error as Error).message, details })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Link to={`/admin/${kind}`} className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-accent">
        <Icon name="ChevronLeft" size={15} />
        {KIND_LABELS[kind]}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-head text-ink">{id ? String(form.title || 'Untitled') : 'New piece'}</h1>
        {status ? <span className="bg-tint px-2 py-0.5 text-xs text-ink-soft">{STATUS_LABEL[status]}</span> : null}
        {example ? <span className="bg-tint px-2 py-0.5 text-xs text-ink-soft">Example</span> : null}
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          void save(false)
        }}
      >
        <Fields fields={fields} value={form} onChange={setForm} />

        {message ? (
          <div role={message.tone === 'error' ? 'alert' : 'status'} className={message.tone === 'error' ? 'border-l-4 border-wrong bg-wrong-pale p-4 text-sm text-ink' : 'border-l-4 border-accent bg-accent-pale p-4 text-sm text-ink'}>
            <p className="font-medium">{message.text}</p>
            {message.details?.length ? (
              <ul className="mt-2 list-disc pl-5">
                {message.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-3 border-t border-tint-deep bg-paper px-4 py-4">
          <button type="submit" className="btn btn-secondary" disabled={busy}>
            <Icon name="Save" size={16} />
            Save draft
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save(true)}>
            <Icon name="Upload" size={16} />
            Save and publish
          </button>
          {id ? (
            <a href={`${publicRoute(kind, id)}?preview=1`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <Icon name="Eye" size={16} />
              Preview
            </a>
          ) : null}
        </div>
      </form>
    </div>
  )
}

function defaults(kind: Kind): Data {
  const base: Data = { level: 'A1', license: 'propio' }
  if (kind === 'activity') return { ...base, type: 'external', tool: 'wordwall', skill: 'vocabulary', minutes: 10 }
  return base
}

function Fields({ fields, value, onChange }: { fields: Field[]; value: FormData; onChange: (next: FormData) => void }) {
  return (
    <>
      {fields
        .filter((field) => isVisible(field, value))
        .map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={value[field.name]}
            onChange={(next) => onChange({ ...value, [field.name]: next })}
          />
        ))}
    </>
  )
}

function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (next: unknown) => void }) {
  const id = useId()
  const label = (
    <label htmlFor={id} className="label block">
      {field.label}
      {field.required ? <span className="text-wrong"> *</span> : null}
    </label>
  )
  const help = field.help ? <p className="mt-1 text-xs text-ink-mute">{field.help}</p> : null
  const text = typeof value === 'string' ? value : ''

  switch (field.type) {
    case 'textarea':
    case 'lines':
    case 'paragraphs':
      return (
        <div>
          {label}
          <textarea
            id={id}
            className="field mt-1.5"
            rows={field.type === 'paragraphs' ? 8 : 4}
            value={text}
            maxLength={field.type === 'textarea' ? field.max : undefined}
            onChange={(event) => onChange(event.target.value)}
          />
          {help}
        </div>
      )
    case 'select':
      return (
        <div>
          {label}
          <select id={id} className="field mt-1.5" value={text} onChange={(event) => onChange(event.target.value)}>
            <option value="">Choose…</option>
            {field.options?.map(([option, optionLabel]) => (
              <option key={option} value={option}>
                {optionLabel}
              </option>
            ))}
          </select>
          {help}
        </div>
      )
    case 'number':
      return (
        <div>
          {label}
          <input id={id} type="number" inputMode="decimal" step="any" min={field.min} max={field.max} className="field mt-1.5 max-w-[12rem]" value={text} onChange={(event) => onChange(event.target.value)} />
          {help}
        </div>
      )
    case 'tags':
      if (field.picker === 'pieces') return <PiecePicker field={field} value={text} onChange={onChange} />
      break
    case 'media':
      return <MediaInput field={field} id={id} label={label} value={text} onChange={onChange} />
    case 'list':
      return <ListInput field={field} value={Array.isArray(value) ? (value as FormData[]) : []} onChange={onChange} />
  }
  // Texto de una línea: text, url y tags sin casillas.
  return (
    <div>
      {label}
      <input
        id={id}
        type={field.type === 'url' ? 'url' : 'text'}
        className="field mt-1.5"
        value={text}
        maxLength={field.type === 'text' ? field.max : undefined}
        placeholder={field.type === 'url' ? 'https://' : field.type === 'tags' ? 'separate with commas' : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {help}
    </div>
  )
}

const PIECE_KINDS = ['song', 'story', 'podcast', 'film']

/** Casillas con las piezas (canciones, historias, podcasts y cortos) para enlazar una actividad. */
function PiecePicker({ field, value, onChange }: { field: Field; value: string; onChange: (next: unknown) => void }) {
  const [pieces, setPieces] = useState<ItemSummary[] | null>(null)
  useEffect(() => {
    api<ItemSummary[]>('items')
      .then((items) => setPieces(items.filter((item) => PIECE_KINDS.includes(item.kind))))
      .catch(() => setPieces([]))
  }, [])
  const chosen = value.split(',').map((id) => id.trim()).filter(Boolean)
  const toggle = (id: string) =>
    onChange((chosen.includes(id) ? chosen.filter((entry) => entry !== id) : [...chosen, id]).join(', '))
  return (
    <fieldset>
      <legend className="label">{field.label}</legend>
      {field.help ? <p className="mt-1 text-xs text-ink-mute">{field.help}</p> : null}
      {pieces === null ? (
        <p className="mt-2 text-sm text-ink-mute">Loading…</p>
      ) : (
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {pieces.map((piece) => (
            <label key={piece.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] bg-sheet px-3">
              <input type="checkbox" checked={chosen.includes(piece.id)} onChange={() => toggle(piece.id)} />
              <span>
                {piece.title} <span className="text-sm text-ink-mute">· {KIND_LABELS[piece.kind as Kind]}</span>
              </span>
            </label>
          ))}
          {chosen
            .filter((id) => !pieces.some((piece) => piece.id === id))
            .map((id) => (
              <label key={id} className="flex min-h-12 cursor-pointer items-center gap-3 px-3 text-ink-mute">
                <input type="checkbox" checked onChange={() => toggle(id)} />
                {id} (not found)
              </label>
            ))}
        </div>
      )}
    </fieldset>
  )
}

const ACCEPT: Record<string, string> = {
  image: 'image/jpeg,image/png,image/webp',
  audio: 'audio/mpeg,audio/mp4,audio/ogg,audio/wav,.m4a,.mp3',
  video: 'video/mp4,video/webm',
}

function MediaInput({ field, id, label, value, onChange }: { field: Field; id: string; label: React.ReactNode; value: string; onChange: (next: unknown) => void }) {
  const [state, setState] = useState<{ busy: boolean; error: string }>({ busy: false, error: '' })
  return (
    <div>
      {label}
      <div className="mt-1.5 flex flex-wrap items-center gap-4 border border-tint-deep bg-sheet p-3">
        {value ? (
          field.accept === 'image' ? (
            <img src={value} alt="" className="h-16 w-24 object-cover" />
          ) : field.accept === 'audio' ? (
            <audio src={value} controls preload="none" className="max-w-full" />
          ) : (
            <video src={value} controls preload="none" className="h-24 max-w-full" />
          )
        ) : (
          <span className="text-sm text-ink-mute">No file</span>
        )}
        <input
          id={id}
          type="file"
          accept={ACCEPT[field.accept ?? 'image']}
          className="text-sm"
          disabled={state.busy}
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            setState({ busy: true, error: '' })
            try {
              onChange(await uploadFile(file, field.accept))
              setState({ busy: false, error: '' })
            } catch (error) {
              setState({ busy: false, error: (error as Error).message })
            }
            event.target.value = ''
          }}
        />
        {value ? (
          <button type="button" className="btn btn-ghost text-sm" onClick={() => onChange('')}>
            Remove
          </button>
        ) : null}
      </div>
      {state.busy ? <p className="mt-1 text-xs text-ink-mute" role="status">Uploading…</p> : null}
      {state.error ? <p className="mt-1 text-xs text-wrong" role="alert">{state.error}</p> : null}
    </div>
  )
}

function ListInput({ field, value, onChange }: { field: Field; value: FormData[]; onChange: (next: unknown) => void }) {
  const move = (from: number, to: number) => {
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  return (
    <fieldset className="border border-tint-deep p-4">
      <legend className="label px-1">
        {field.label} <span className="text-ink-mute">({value.length})</span>
      </legend>
      {field.help ? <p className="mb-3 text-xs text-ink-mute">{field.help}</p> : null}
      <ol className="space-y-4">
        {value.map((item, index) => (
          <li key={index} className="border-l-2 border-tint-deep pl-4">
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <span className="mr-2 text-xs font-medium text-ink-mute">#{index + 1}</span>
              <button type="button" className="btn btn-ghost min-h-8 px-2" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`Move up ${index + 1}`}>
                <Icon name="ArrowUp" size={14} />
              </button>
              <button type="button" className="btn btn-ghost min-h-8 px-2" disabled={index === value.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move down ${index + 1}`}>
                <Icon name="ArrowDown" size={14} />
              </button>
              <button type="button" className="btn btn-ghost min-h-8 px-2 text-wrong" onClick={() => onChange(value.filter((_, i) => i !== index))} aria-label={`Remove ${index + 1}`}>
                <Icon name="Trash2" size={14} />
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Fields
                fields={field.fields ?? []}
                value={item}
                onChange={(next) => onChange(value.map((entry, i) => (i === index ? next : entry)))}
              />
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="btn btn-secondary mt-4"
        disabled={value.length >= (field.max ?? 100)}
        onClick={() => onChange([...value, toForm(field.fields ?? [], {})])}
      >
        <Icon name="Plus" size={15} />
        Add
      </button>
    </fieldset>
  )
}
