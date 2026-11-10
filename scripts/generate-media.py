#!/usr/bin/env python3
"""
Genera los recursos multimedia de demostración a partir de `content/*.json`.

No hay enlaces falsos: cada archivo que la aplicación reproduce se crea aquí,
en local, y es real. Se usan voces neuronales de Piper (es_ES-davefx-medium
para español, en_US-lessac-medium para inglés) y ffmpeg para la música de
fondo y la codificación.

Salidas:
  public/media/audio/*.mp3     canciones y podcasts
  public/media/audio/*.m4a     fragmentos sueltos de escucha
  public/media/video/*.mp4     cortiempres
  src/content/timings.json     marcas de tiempo por línea (para sincronizar letra
                               y transcripción con el audio)
"""

from __future__ import annotations

import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
OUT_AUDIO = ROOT / "public" / "media" / "audio"
OUT_VIDEO = ROOT / "public" / "media" / "video"
TIMINGS = ROOT / "src" / "content" / "timings.json"

PIPER = Path("/tmp/opencode/piper_voices")
VOICES = {
    "en": PIPER / "en_US-lessac-medium.onnx",
    "en-gb": PIPER / "en_GB-alba-medium.onnx",
    "es": PIPER / "es_ES-davefx-medium.onnx",
    "es-mx": PIPER / "es_MX-claude-high.onnx",
}

SAMPLE_RATE = 22050


# ── Utilidades ──────────────────────────────────────────────────────────────

def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, capture_output=True, **kwargs)


def have_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def have_piper() -> bool:
    try:
        import piper  # noqa: F401
        return True
    except Exception:
        return False


_PIPER_VOICE = None


def piper_synth(text: str, voice_key: str, out_wav: Path) -> float:
    """Sintetiza `text` y devuelve su duración en segundos."""
    global _PIPER_VOICE
    import numpy as np
    import piper

    model = VOICES[voice_key]
    if _PIPER_VOICE is None or _PIPER_VOICE[0] != model:
        _PIPER_VOICE = (model, piper.PiperVoice.load(str(model)))

    voice = _PIPER_VOICE[1]
    chunks = list(voice.synthesize(text))
    if not chunks:
        silence(0.4, out_wav)
        return 0.4

    # Todos los fragmentos comparten frecuencia de muestreo; se concatenan.
    rate = chunks[0].sample_rate
    samples = np.concatenate([chunk.audio_float_array for chunk in chunks])
    pcm = np.clip(samples * 32767.0, -32768, 32767).astype(np.int16)

    with wave.open(str(out_wav), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(rate)
        wav_file.writeframes(pcm.tobytes())

    return len(pcm) / float(rate)


def encode_to_mp3(src: Path, dest: Path, bitrate: str = "96k") -> None:
    run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
        "-codec:a", "libmp3lame", "-b:a", bitrate, "-ar", "44100",
        "-ac", "1", str(dest),
    ])


def silence(seconds: float, dest: Path) -> None:
    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", f"anullsrc=r={SAMPLE_RATE}:cl=mono",
        "-t", f"{max(seconds, 0.05):.3f}", str(dest),
    ])


def concat_wavs(parts: list[Path], dest: Path) -> None:
    """Une archivos wav sin recomprimir, usando el demuxer concat."""
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as tmp:
        for part in parts:
            tmp.write(f"file '{part.resolve()}'\n")
        list_path = Path(tmp.name)
    try:
        run([
            "ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
            "-i", str(list_path), "-c:a", "pcm_s16le", "-ar", str(SAMPLE_RATE),
            "-ac", "1", str(dest),
        ])
    finally:
        list_path.unlink(missing_ok=True)


def mix_tracks(voice: Path, bed: Path | None, dest: Path, bed_gain: float = 0.16) -> None:
    """Mezcla la voz con la base instrumental (más suave)."""
    if bed is None:
        run([
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(voice),
            "-codec:a", "libmp3lame", "-b:a", "96k", "-ar", "44100", "-ac", "1",
            str(dest),
        ])
        return

    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(voice),
        "-i", str(bed),
        "-filter_complex",
        f"[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a0];"
        f"[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,"
        f"volume={bed_gain}[a1];"
        f"[a0][a1]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0[a]",
        "-map", "[a]", "-codec:a", "libmp3lame", "-b:a", "128k", "-ar", "44100",
        "-ac", "1", str(dest),
    ])


# ── Base instrumental ───────────────────────────────────────────────────────

# Cada "bed" es una secuencia de acordes con su fundamental en Hz.
BEDS: dict[str, list[float]] = {
    # Una progresión suave, apropiada para una canción de carretera.
    "route": [220.00, 261.63, 329.63, 246.94],
    # Do mayor: limpio, infantil.
    "water": [261.63, 329.63, 392.00, 293.66],
    # menor con movimiento: bullicioso pero con base.
    "market": [220.00, 261.63, 196.00, 246.94],
    # menor relativo, más serio.
    "longway": [196.00, 233.08, 293.66, 220.00],
}


def build_bed(name: str, duration: float, dest: Path) -> Path:
    """Construye una base armónica simple con ffmpeg (senos + envolvente)."""
    chord = BEDS.get(name, BEDS["route"])
    seg = 4.0
    parts: list[Path] = []
    tmpdir = Path(tempfile.mkdtemp())
    total_segments = max(1, int(duration / seg) + 1)
    for i in range(total_segments):
        root = chord[i % len(chord)]
        # Cada acorde: fundamental + quinta, con vibrato lento.
        expr = (
            f"0.5*sin(2*PI*{root:.2f}*t)"
            f"+0.25*sin(2*PI*{root * 1.5:.2f}*t)"
            f"+0.12*sin(2*PI*{root * 2:.2f}*t)"
        )
        part = tmpdir / f"bed_{i}.wav"
        run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "lavfi", "-i", f"aevalsrc='{expr}':s={SAMPLE_RATE}:d={seg}",
            "-af", "tremolo=f=0.4:d=0.3,afade=t=in:st=0:d=0.6,"
                   f"afade=t=out:st={seg - 0.8}:d=0.8",
            "-ac", "1", str(part),
        ])
        parts.append(part)

    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as tmp:
        for part in parts:
            tmp.write(f"file '{part.resolve()}'\n")
        list_path = Path(tmp.name)
    try:
        run([
            "ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
            "-i", str(list_path), "-t", f"{duration:.3f}",
            "-c:a", "pcm_s16le", "-ar", str(SAMPLE_RATE), "-ac", "1", str(dest),
        ])
    finally:
        list_path.unlink(missing_ok=True)
        shutil.rmtree(tmpdir, ignore_errors=True)
    return dest


# ── Generadores ─────────────────────────────────────────────────────────────

def gen_song(song: dict, timings: dict) -> None:
    title = song["title"]
    print(f"  · canción: {title}")

    lines = song["lyrics"]
    parts: list[Path] = []
    marks: list[dict] = []
    cursor = 0.0
    tmpdir = Path(tempfile.mkdtemp())

    for line in lines:
        wav = tmpdir / f"line_{len(parts)}.wav"
        dur = piper_synth(line["text"], "en", wav)
        gap = 0.42
        sil = tmpdir / f"gap_{len(parts)}.wav"
        silence(gap, sil)
        parts.extend([wav, sil])
        marks.append({
            "start": round(cursor, 3),
            "end": round(cursor + dur, 3),
            "text": line["text"],
        })
        cursor += dur + gap

    voice = tmpdir / "voice.wav"
    concat_wavs(parts, voice)
    total = cursor + 0.6

    bed = build_bed(song["bed"], total, tmpdir / "bed.wav")
    dest = OUT_AUDIO / f"{song['id']}.mp3"
    mix_tracks(voice, bed, dest)

    timings[f"songs:{song['id']}"] = marks
    timings[f"duration:songs:{song['id']}"] = round(total, 2)
    shutil.rmtree(tmpdir, ignore_errors=True)


def gen_podcast(episode: dict, timings: dict) -> None:
    print(f"  · podcast: {episode['title']}")

    segments = episode["segments"]
    # Dos locutores: Nina y Andrés usan una voz; Lucía y la encuadernadora usan otra.
    voice_a = "en"
    voice_b = "en-gb"
    parts: list[Path] = []
    marks: list[dict] = []
    cursor = 0.0
    tmpdir = Path(tempfile.mkdtemp())

    for i, seg in enumerate(segments):
        speaker = seg["speaker"]
        voice = voice_a if speaker in ("Nina", "Andrés") else voice_b
        wav = tmpdir / f"seg_{i}.wav"
        dur = piper_synth(seg["text"], voice, wav)
        gap = 0.55
        sil = tmpdir / f"gap_{i}.wav"
        silence(gap, sil)
        parts.extend([wav, sil])
        marks.append({
            "start": round(cursor, 3),
            "end": round(cursor + dur, 3),
            "speaker": speaker,
            "text": seg["text"],
        })
        cursor += dur + gap

    voice_path = tmpdir / "voice.wav"
    concat_wavs(parts, voice_path)
    total = cursor + 0.5

    dest = OUT_AUDIO / f"{episode['id']}.mp3"
    encode_to_mp3(voice_path, dest, "112k")

    timings[f"podcasts:{episode['id']}"] = marks
    timings[f"duration:podcasts:{episode['id']}"] = round(total, 2)
    shutil.rmtree(tmpdir, ignore_errors=True)


def gen_film(film: dict, timings: dict) -> None:
    """Crea un cortometraje: vídeo con escenas tipográficas + narración."""
    print(f"  · cortometraje: {film['title']}")

    scenes = film["scenes"]
    tmpdir = Path(tempfile.mkdtemp())
    parts: list[Path] = []
    marks: list[dict] = []
    cursor = 0.0

    # Imagen de fondo: un campo de color sólido con textura suave.
    bg = tmpdir / "bg.png"
    run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "lavfi", "-i",
        "color=c=#123c40:s=1280x720:d=1",
        "-vf", "noise=alls=6:allf=t+u,format=rgb24",
        "-frames:v", "1", str(bg),
    ])

    for i, scene in enumerate(scenes):
        wav = tmpdir / f"scene_{i}.wav"
        dur = piper_synth(scene["line"], "en-gb", wav)

        seg = tmpdir / f"seg_{i}.mp4"
        # El texto se dibuja con drawtext sobre la imagen de fondo.
        escaped = scene["line"].replace("\\", "\\\\").replace(":", "\\:")
        escaped = escaped.replace("'", "’").replace('"', "'")
        escaped = escaped.replace("%", "\\%")
        draw = (
            f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:"
            f"text='{escaped}':fontcolor=#f5f3ec:fontsize=44:"
            f"x=(w-text_w)/2:y=(h-text_h)/2-60:line_spacing=14"
        )
        run([
            "ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", str(bg),
            "-i", str(wav),
            "-vf", f"{draw},fade=t=in:st=0:d=0.4,fade=t=out:st={max(dur - 0.5, 0.5):.2f}:d=0.5",
            "-t", f"{dur:.3f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
            "-pix_fmt", "yuv420p", "-r", "24",
            "-c:a", "aac", "-b:a", "112k", "-ar", "44100", "-ac", "1",
            "-shortest", str(seg),
        ])
        parts.append(seg)
        marks.append({
            "start": round(cursor, 3),
            "end": round(cursor + dur, 3),
            "speaker": scene["speaker"],
            "line": scene["line"],
            "translation": scene["translation"],
        })
        cursor += dur

    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as tmp:
        for part in parts:
            tmp.write(f"file '{part.resolve()}'\n")
        list_path = Path(tmp.name)
    try:
        dest = OUT_VIDEO / f"{film['id']}.mp4"
        run([
            "ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
            "-i", str(list_path),
            "-c", "copy", "-movflags", "+faststart", str(dest),
        ])
    finally:
        list_path.unlink(missing_ok=True)

    timings[f"films:{film['id']}"] = marks
    timings[f"duration:films:{film['id']}"] = round(cursor, 2)
    shutil.rmtree(tmpdir, ignore_errors=True)


def gen_listening_clips(episodes: list[dict], films: list[dict]) -> None:
    """Recorta fragmentos sueltos para la práctica de escucha."""
    print("  · fragmentos de escucha")
    for episode in episodes:
        marks = TIMING_CACHE.get(f"podcasts:{episode['id']}", [])
        for i, seg in enumerate(marks[:2]):
            src = OUT_AUDIO / f"{episode['id']}.mp3"
            dest = OUT_AUDIO / f"clip-{episode['id']}-{i + 1}.m4a"
            run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-ss", f"{seg['start']}", "-i", str(src),
                "-t", f"{max(seg['end'] - seg['start'], 1):.2f}",
                "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(dest),
            ])
    for film in films:
        marks = TIMING_CACHE.get(f"films:{film['id']}", [])
        if not marks:
            continue
        seg = marks[0]
        src = OUT_VIDEO / f"{film['id']}.mp4"
        dest = OUT_AUDIO / f"clip-{film['id']}-1.m4a"
        run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-ss", f"{seg['start']}", "-i", str(src),
            "-t", f"{max(seg['end'] - seg['start'], 1):.2f}",
            "-vn", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(dest),
        ])


TIMING_CACHE: dict = {}


def main() -> int:
    if not have_ffmpeg():
        print("ERROR: ffmpeg no está disponible.", file=sys.stderr)
        return 1
    if not have_piper():
        print("ERROR: piper-tts no está instalado.", file=sys.stderr)
        return 1

    OUT_AUDIO.mkdir(parents=True, exist_ok=True)
    OUT_VIDEO.mkdir(parents=True, exist_ok=True)

    songs = json.loads((CONTENT / "songs.json").read_text(encoding="utf-8"))["songs"]
    stories = json.loads((CONTENT / "stories.json").read_text(encoding="utf-8"))["stories"]
    episodes = json.loads((CONTENT / "podcasts.json").read_text(encoding="utf-8"))["episodes"]
    films = json.loads((CONTENT / "films.json").read_text(encoding="utf-8"))["films"]

    timings: dict = {}

    print("Generando canciones…")
    for song in songs:
        gen_song(song, timings)

    print("Generando podcasts…")
    for episode in episodes:
        gen_podcast(episode, timings)

    print("Generando cortiempres…")
    for film in films:
        gen_film(film, timings)

    TIMING_CACHE.clear()
    TIMING_CACHE.update(timings)

    print("Recortando fragmentos de escucha…")
    gen_listening_clips(episodes, films)

    TIMINGS.parent.mkdir(parents=True, exist_ok=True)
    TIMINGS.write_text(json.dumps(timings, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\nListo:")
    for path in sorted(OUT_AUDIO.glob("*")):
        print(f"  {path.relative_to(ROOT)}  {path.stat().st_size / 1024:.0f} KB")
    for path in sorted(OUT_VIDEO.glob("*")):
        print(f"  {path.relative_to(ROOT)}  {path.stat().st_size / 1024:.0f} KB")
    print(f"  {TIMINGS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
