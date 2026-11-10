#!/usr/bin/env bash
# Descarga portadas reales (dominio público / CC) desde las colecciones abiertas
# y registra los créditos para la página de créditos.
set -uo pipefail

SKILL=/home/hotpot/.agents/skills/design-taste-frontend
OUT=public/media/covers
mkdir -p "$OUT"

# slug|consulta|licencia
QUERIES=(
  "counting-the-miles|landscape seen from train window"
  "paper-boats|paper boat water"
  "morning-market|fruit market stall produce"
  "the-long-way-round|winding country road"
  "cartographers-apprentice|antique world map atlas"
  "letters-from-the-salt-road|desert salt flat road"
  "the-night-the-river-froze|frozen river ice winter"
  "the-practice-room|studio microphone radio"
  "el-sonido-del-cafe|coffee plantation farm"
  "focus-and-noise|headphones person reading"
  "cosas-del-metro|subway train interior"
  "the-last-tram|tram street night"
  "paper-and-ink|typewriter letter paper desk"
  "night-shift-observatory|observatory dome telescope night"
  "hero-workspace|desk notebook warm light study"
)

REFS=()
for entry in "${QUERIES[@]}"; do
  slug="${entry%%|*}"
  rest="${entry#*|}"
  query="${rest%%|*}"
  echo "→ $slug  ($query)"
  json=$(timeout 180 node "$SKILL/scripts/assets.mjs" "$query" --limit 4 --min-width 900 --json 2>/dev/null)
  ref=$(printf '%s' "$json" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
except Exception:
    sys.exit(0)
best=None
for src in d.get('sources',[]):
    for it in src.get('items',[]):
        lic=(it.get('license') or '').lower()
        w=it.get('width') or 0
        score=(0 if lic in ('cc0','pd') else 1, -w)
        if best is None or score<best[0]:
            best=(score,it.get('ref'))
print(best[1] if best else '')
")
  if [ -n "$ref" ]; then
    REFS+=("$ref")
    echo "   ref=$ref"
  else
    echo "   SIN RESULTADO"
  fi
done

if [ ${#REFS[@]} -gt 0 ]; then
  echo "Descargando ${#REFS[@]} imágenes…"
  timeout 400 node "$SKILL/scripts/assets.mjs" --get "$(IFS=,; echo "${REFS[*]}")" --to "$OUT" --width 1600 2>&1 | tail -25
fi

echo "--- créditos ---"
node "$SKILL/scripts/assets.mjs" --credits --to "$OUT" 2>&1 | tail -40
