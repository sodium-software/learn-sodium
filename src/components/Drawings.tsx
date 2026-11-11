/**
 * Dibujos originales de La Cartilla: trazo grueso de tinta y rellenos planos
 * de los cuatro plásticos, como un dibujo de niño pegado en la nevera.
 * Son decorativos (aria-hidden); el texto que los acompaña dice qué son.
 */

const INK = '#1b1d24'
const RED = '#d42a2f'
const BLUE = '#1f5fd0'
const GREEN = '#157a42'
const YELLOW = '#f4b400'

const stroke = { stroke: INK, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const

export type DrawingName =
  | 'song'
  | 'story'
  | 'podcast'
  | 'film'
  | 'activity'
  | 'info'
  | 'author'
  | 'cat'
  | 'sun'
  | 'boat'
  | 'apple'
  | 'tree'
  | 'fish'

const DRAWINGS: Record<DrawingName, React.ReactNode> = {
  song: (
    <>
      <path d="M48 70V24l40-8v46" {...stroke} />
      <ellipse cx="38" cy="72" rx="12" ry="9" fill={RED} stroke={INK} strokeWidth="5" />
      <ellipse cx="78" cy="64" rx="12" ry="9" fill={RED} stroke={INK} strokeWidth="5" />
      <path d="M48 36l40-8" {...stroke} />
    </>
  ),
  story: (
    <>
      <path d="M60 28c-12-8-30-8-42-4v52c12-4 30-4 42 4 12-8 30-8 42-4V24c-12-4-30-4-42 4z" fill={BLUE} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M60 28v52" {...stroke} />
      <path d="M28 40c8-2 16-2 22 0M28 52c8-2 16-2 22 0M70 40c8-2 16-2 22 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
    </>
  ),
  podcast: (
    <>
      <path d="M28 62V52a32 32 0 0 1 64 0v10" {...stroke} />
      <rect x="20" y="56" width="18" height="28" rx="7" fill={YELLOW} stroke={INK} strokeWidth="5" />
      <rect x="82" y="56" width="18" height="28" rx="7" fill={YELLOW} stroke={INK} strokeWidth="5" />
    </>
  ),
  film: (
    <>
      <rect x="18" y="34" width="84" height="54" rx="6" fill={INK} />
      <path d="M18 34l10-16 16 10 10-16 16 10 10-16 16 10 6 18" fill={YELLOW} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M52 50v22l20-11z" fill="#fff" />
    </>
  ),
  activity: (
    <>
      <path d="M22 30h22a9 9 0 1 1 16 0h22v22a9 9 0 1 0 0 16v22H22z" fill={GREEN} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M40 60l8 8 16-18" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  info: (
    <>
      <path d="M26 82l6-22 46-46 16 16-46 46z" fill={YELLOW} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M70 22l16 16M26 82l22-6" {...stroke} />
    </>
  ),
  author: (
    <>
      <path d="M60 14l12 26 28 3-21 19 6 28-25-14-25 14 6-28-21-19 28-3z" fill={RED} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    </>
  ),
  cat: (
    <>
      <path d="M22 84q0-40 32-44l8-20 10 18q14-2 24 4l12-18 4 24q14 12 10 36z" fill="#fff" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="66" cy="58" r="4" fill={INK} />
      <circle cx="92" cy="58" r="4" fill={INK} />
      <path d="M74 70q5 5 10 0" stroke={RED} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M22 80q-14-4-10-22" {...stroke} />
    </>
  ),
  sun: (
    <>
      <circle cx="60" cy="50" r="20" fill={YELLOW} stroke={INK} strokeWidth="5" />
      <path d="M60 12v10M60 78v10M22 50h10M88 50h10M33 23l7 7M80 70l7 7M33 77l7-7M80 30l7-7" {...stroke} />
    </>
  ),
  boat: (
    <>
      <path d="M18 62h84L86 82H34z" fill={BLUE} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M60 58V16l30 40z" fill={YELLOW} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M10 92q12-7 25 0t25 0 25 0 25 0" stroke={BLUE} strokeWidth="5" strokeLinecap="round" fill="none" />
    </>
  ),
  apple: (
    <>
      <path d="M60 32c-16-10-40 0-36 24 3 20 18 34 36 27 18 7 33-7 36-27 4-24-20-34-36-24z" fill={RED} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M60 32q2-14 14-18" {...stroke} />
      <path d="M62 24q12-10 22-2-10 8-22 2z" fill={GREEN} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </>
  ),
  tree: (
    <>
      <circle cx="60" cy="40" r="26" fill={GREEN} stroke={INK} strokeWidth="5" />
      <path d="M60 66v24M48 90h24" {...stroke} />
    </>
  ),
  fish: (
    <>
      <path d="M22 50q22-26 52-12l20-14v52L74 62q-30 14-52-12z" fill={BLUE} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="38" cy="46" r="4" fill="#fff" />
    </>
  ),
}

export function Drawing({ name, className }: { name: DrawingName; className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden="true" focusable="false">
      {DRAWINGS[name]}
    </svg>
  )
}
