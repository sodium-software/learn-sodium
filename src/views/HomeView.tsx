import { Link } from 'react-router-dom'

import { useProgress } from '../lib/progress-context'
import { clsx } from '../lib/cn'
import { SECTION_NAMES } from '../components/sections'
import { Icon } from '../components/ui'
import { WordGame } from '../components/WordGame'
import { activityDefinitions, allContent, asset, episodes, films, songs, stories } from '../content'

const IMG = {
  river: asset('/media/zine/cano-cristales-jacuzzis-naturales-de-colores-01.jpg'),
  amazon: asset('/media/zine/amazon-river-colombia-26748354339.jpg'),
  chiva: asset('/media/zine/bus-chiva-tradicional-02.jpg'),
  paramo: asset('/media/zine/frailejones.jpg'),
  press: asset('/media/zine/printing-in-a-letterpress.webm'),
  pressPoster: asset('/media/zine/printing-in-a-letterpress-poster.jpg'),
}

/** Una tira impresa: lo que realmente dice cada historia, recortado del guion. */
interface Slip {
  head: string
  lines: string[]
  to: string
}

function slips(): Slip[] {
  const out: Slip[] = []
  const song = songs[0]
  if (song) out.push({ head: `Song · ${song.title}`, lines: song.lyrics.slice(0, 6).map((l) => l.text), to: `/song/${song.id}` })
  const episode = episodes[0]
  if (episode)
    out.push({
      head: `Podcast · ${episode.title}`,
      lines: episode.segments.slice(0, 4).map((s) => `${s.speaker ? `${s.speaker}: ` : ''}${s.text}`),
      to: `/podcast/${episode.id}`,
    })
  const film = films[0]
  if (film) out.push({ head: `Short film · ${film.title}`, lines: film.scenes.slice(0, 5).map((s) => s.line), to: `/short-film/${film.id}` })
  const story = stories[0]
  if (story)
    out.push({ head: `Storytale · ${story.title}`, lines: story.chapters[0]?.paragraphs.slice(0, 1) ?? [story.summary], to: `/storytelling/${story.id}` })
  const quiz = activityDefinitions.find((a) => a.questions?.length)
  if (quiz?.questions?.[0])
    out.push({
      head: `Activity · ${quiz.title}`,
      lines: [quiz.questions[0].prompt, ...quiz.questions[0].options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o.text}`)],
      to: `/activities/${quiz.id}`,
    })
  return out.slice(0, 6)
}

const SLIP_HEIGHTS = ['h-[38svh]', 'h-[30svh]', 'h-[44svh]', 'h-[34svh]', 'h-[40svh]', 'h-[28svh]']
const STAIRS = ['lg:col-start-1', 'lg:col-start-3', 'lg:col-start-5', 'lg:col-start-7']

/**
 * Inicio: un cartel callejero hecho con el fanzine. Campo plano y titular a
 * todo volumen, un recorte de foto pegado en la costura, las tiras impresas
 * del guion saliendo de la imprenta, la escalera de cómo se usa, la lista de
 * piezas y el texto sobre la guía. El nombre del estudiante solo vive en su
 * navegador.
 */
export function HomeView() {
  const { preferences, state } = useProgress()
  const name = preferences.displayName.trim()
  const done = state.completedActivityIds.length
  const printed = slips()

  return (
    <div>
      {/* ── Portada: campo rojo, banda de tóner, recorte en la costura ─── */}
      <section className="relative overflow-hidden bg-ink text-sheet" aria-labelledby="portada">
        <div className="relative bg-red pb-16 pt-[12vh] lg:min-h-[66svh] lg:pt-[14vh]">
          <div className="frame relative z-10">
            <h1 id="portada" className="text-[clamp(4.75rem,1rem+12vw,12rem)] leading-[0.84]">
              Stories
              <br />
              in English
            </h1>
          </div>
          <figure className="pointer-events-none absolute -top-10 right-[6vw] z-20 hidden w-[30vw] max-w-[440px] rotate-2 lg:block">
            <div className="xerox shutter aspect-[3/4] rounded-t-full [--xerox:var(--color-yellow)]">
              <img src={IMG.river} alt="Caño Cristales, the river of five colours, in Colombia" width={1400} height={2104} />
            </div>
          </figure>
        </div>
        <div className="frame relative z-10 flex flex-wrap items-center justify-between gap-6 py-8">
          <p className="max-w-[44ch] text-xl">
            {name ? <strong>Hi, {name}! </strong> : null}A zine of four stories for B1 learners in Colombian schools: a
            song, a podcast, a short film and a storytale.
          </p>
          <Link to="/song" className="btn min-h-16 bg-yellow px-8 text-xl text-ink hover:bg-sheet">
            Start with the song
            <Icon name="ArrowRight" size={22} />
          </Link>
        </div>
        <figure className="pointer-events-none mx-auto w-[62%] rotate-2 pb-10 lg:hidden">
          <div className="xerox aspect-[3/4] rounded-t-full [--xerox:var(--color-yellow)]">
            <img src={IMG.river} alt="" width={1400} height={2104} />
          </div>
        </figure>
      </section>

      {/* ── Mosaico de frases ─────────────────────────────────────────── */}
      <section className="p-2" aria-labelledby="mosaico">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-12 lg:grid-rows-[38svh_38svh]">
          <div className="col-span-2 flex min-h-[46svh] items-end bg-ink p-5 text-sheet lg:col-span-8 lg:row-span-2 lg:min-h-0">
            <h2 id="mosaico" className="text-[clamp(3.5rem,1rem+8vw,8.25rem)] leading-[0.86]">
              Tell it
              <br />
              in English
            </h2>
          </div>
          <div className="flex aspect-square items-end overflow-hidden bg-yellow p-5 lg:col-span-4 lg:aspect-auto">
            <p className="font-display text-[clamp(4rem,2rem+8vw,8.25rem)] leading-[0.8]">B1</p>
          </div>
          <div className="xerox aspect-square [--xerox:var(--color-blue)] lg:col-span-4 lg:aspect-auto">
            <img src={IMG.amazon} alt="Sunset over the Amazon river in Colombia" width={1400} height={700} loading="lazy" />
          </div>
          <div className="col-span-2 bg-paper px-5 py-10 lg:col-span-12 lg:grid lg:grid-cols-12 lg:px-10 lg:py-14">
            <p className="text-lg leading-[1.45] lg:col-span-6 lg:col-start-7 lg:text-[1.4rem] lg:leading-[1.38]">
              Four short stories, each told in a different way. One is about nature, one is about belonging, and all of
              them are told in English at B1 level. You can watch them, listen to them and read them line by line.
              Every story comes with its script and four activities for grammar, speaking, writing, reading, listening
              and vocabulary. No account, no sign-up: just open a story and start.
            </p>
          </div>
        </div>
      </section>

      {/* ── La imprenta: las tiras del guion ───────────────────────────── */}
      {printed.length > 0 ? (
        <section className="relative mt-24 h-[96svh] min-h-[640px] overflow-hidden bg-ink" aria-labelledby="guiones">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale"
            src={IMG.press}
            poster={IMG.pressPoster}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="frame relative z-10 pt-[10svh]">
            <div className="max-w-[34ch] bg-ink/80 p-6 text-sheet lg:ml-[14vw]">
              <h2 id="guiones" className="text-[clamp(2.5rem,1.6rem+3vw,4.5rem)]">
                Every word, printed
              </h2>
              <p className="mt-4 text-xl lg:text-[1.65rem] lg:leading-snug">
                Each story has its full script: the lyrics, what the hosts say, every scene and every page.
              </p>
            </div>
          </div>
          <ul className="frame absolute inset-x-0 bottom-0 z-10 flex items-end gap-3">
            {printed.map((slip, i) => (
              <li
                key={slip.head}
                className={clsx(
                  'min-w-0 flex-1',
                  i >= 2 && 'hidden sm:block',
                  i >= 3 && 'sm:hidden lg:block',
                  SLIP_HEIGHTS[i % SLIP_HEIGHTS.length],
                  i % 3 === 1 && 'rotate-1',
                  i % 3 === 2 && '-rotate-1',
                )}
              >
                <Link to={slip.to} className="slip block h-full overflow-hidden bg-sheet p-4 text-base leading-snug text-ink hover:bg-yellow-pale">
                  <strong className="block">{slip.head}</strong>
                  <span aria-hidden="true" className="my-2 block overflow-hidden whitespace-nowrap text-ink-mute">
                    · · · · · · · · · · · · · · · · · · · · · · · ·
                  </span>
                  {slip.lines.map((line, j) => (
                    <span key={j} className="mt-1 block">
                      {line}
                    </span>
                  ))}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Escalera: cómo se usa ─────────────────────────────────────── */}
      <section className="frame relative mt-40 pb-10 lg:min-h-[80svh]" aria-labelledby="paso-1">
        <ol className="grid grid-cols-1 gap-14 lg:grid-cols-12">
          {[
            ['First, watch the story.', 'Every story is a video, a song or a flipbook. Start there and enjoy it.'],
            ['Then read the script.', 'The words appear line by line, with a translation when you need it.'],
            ['Try the four activities.', 'Grammar, speaking, writing, reading, listening and vocabulary.'],
            ['Now tell your own.', 'Use the new words to tell a story about your town, your people or your planet.'],
          ].map(([line, note], i) => (
            <li key={line} className={clsx('lg:col-span-6', STAIRS[i])}>
              <h2 id={`paso-${i + 1}`} className={clsx('text-[clamp(2.25rem,1.4rem+3.6vw,4.75rem)] leading-none', i === 3 && 'text-red')}>
                {line}
              </h2>
              <p className="mt-3 max-w-[34ch] text-[17px] text-ink-soft">{note}</p>
            </li>
          ))}
        </ol>
        <figure className="pointer-events-none mt-12 w-[70%] -rotate-2 lg:absolute lg:bottom-0 lg:left-[3vw] lg:mt-0 lg:w-[24vw]">
          <div className="xerox aspect-[4/3] [--xerox:var(--color-green)]">
            <img src={IMG.chiva} alt="A painted chiva bus from Colombia" width={1400} height={1050} loading="lazy" />
          </div>
        </figure>
      </section>

      {/* ── Cartel: la lista de piezas, a un solo tamaño ───────────────── */}
      <section className="mt-28 bg-yellow py-20" aria-labelledby="lista">
        <div className="frame">
          <h2 id="lista" className="sticky top-16 z-10 bg-yellow py-2 text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)] text-red-deep">
            What is inside
          </h2>
          {allContent.length === 0 ? (
            <p className="mt-6 text-2xl">The stories are on their way.</p>
          ) : (
            <ul className="mt-6">
              {allContent.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.route}
                    className="grid min-h-12 grid-cols-[1fr_auto] items-baseline gap-x-6 py-2 text-[clamp(1.25rem,0.9rem+1.4vw,1.875rem)] leading-[1.5] hover:text-blue-deep md:grid-cols-[33%_33%_1fr_auto]"
                  >
                    <span className="font-bold">{item.title}</span>
                    <span className="hidden md:block">{SECTION_NAMES[item.kind]}</span>
                    <span className="hidden md:block">Level {item.level}</span>
                    <span className="tnum text-right">{item.minutes} min</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Actividades: la cosa viva ─────────────────────────────────── */}
      <section className="bg-green py-24 text-white" aria-labelledby="actividades-portada">
        <div className="frame grid grid-cols-1 items-start gap-x-6 gap-y-10 lg:grid-cols-12">
          <div className="lg:col-span-6 lg:row-start-1">
            <h2 id="actividades-portada" className="text-display">
              Practise here
            </h2>
            <p className="mt-6 max-w-[42ch] text-lead">
              {activityDefinitions.length} activities, four for each story. Try one right now: read the clue and build
              the word.
            </p>
          </div>
          <div className="text-ink lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1">
            <WordGame />
          </div>
          <div className="lg:col-span-6 lg:row-start-2">
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/activities" className="btn bg-sheet px-7 text-lg text-ink hover:bg-yellow-pale">
                See all the activities
                <Icon name="ArrowRight" size={20} />
              </Link>
              {done > 0 ? <p className="font-bold">You have done {done}.</p> : null}
            </div>
            <figure className="pointer-events-none mt-10 hidden w-4/5 rotate-1 lg:block">
              <div className="xerox aspect-[16/10] [--xerox:var(--color-yellow)]">
                <img src={IMG.paramo} alt="Frailejones in the páramo, a mountain ecosystem in Colombia" width={1400} height={788} loading="lazy" />
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* ── Sobre la guía: texto grande con marcador ───────────────────── */}
      <section className="frame py-28" aria-labelledby="sobre">
        <h2 id="sobre" className="text-head">
          About this guide
        </h2>
        <p className="mt-8 text-[clamp(1.25rem,1rem+1vw,2rem)] leading-[1.22] text-ink-soft lg:columns-2 lg:gap-8 lg:text-justify lg:hyphens-auto">
          <span className="text-ink">La Cartilla</span> is a didactic web guide made by{' '}
          <mark className="hl [--hl:var(--color-yellow)]">trainee teachers</mark> for the Communicative English Project.
          It is for <mark className="hl [--hl:var(--color-yellow-pale)]">teenagers</mark> who learn English at{' '}
          <mark className="hl [--hl:var(--color-yellow)]">B1 level</mark> in public and private{' '}
          <mark className="hl [--hl:var(--color-yellow-pale)]">Colombian schools</mark>. Stories give new words a place,
          a face and a reason, so every piece here is a story, told as a song, a podcast, a short film or a storytale.
          One of them looks at <mark className="hl [--hl:var(--color-yellow)]">nature</mark> and another at{' '}
          <mark className="hl [--hl:var(--color-yellow-pale)]">inclusion and belonging</mark>. The site has no accounts,
          no analytics and no ads; your progress stays on your device.{' '}
          <Link to="/biodata" className="hl-strong">
            Meet the authors →
          </Link>
        </p>
      </section>
    </div>
  )
}
