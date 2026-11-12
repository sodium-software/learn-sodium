/** Imágenes con la letra, el guion o el cuento, a todo el ancho y en orden. Al tocarlas se abren grandes. */
export function TextPictures({ pictures, title }: { pictures?: { image: string; alt: string }[]; title: string }) {
  if (!pictures?.length) return null
  return (
    <div className="mt-6 space-y-6">
      {pictures.map((picture, index) => (
        <a key={picture.image} href={picture.image} target="_blank" rel="noopener" className="block overflow-hidden rounded-[var(--radius-xs)] bg-sheet">
          <img
            src={picture.image}
            alt={picture.alt || `${title}, page ${index + 1}`}
            loading="lazy"
            className="mx-auto block h-auto max-h-[90vh] w-auto max-w-full"
          />
        </a>
      ))}
    </div>
  )
}
