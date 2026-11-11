#!/usr/bin/env bash
# Desmontaje de La Cartilla cuando termine el trabajo universitario.
#
#   bash scripts/teardown.sh              simulación: solo lista lo que haría
#   bash scripts/teardown.sh --ejecutar   pide escribir una frase y luego
#                                         confirmar cada paso uno por uno
#
# Antes de borrar nada exige que exista el paquete de entrega para Mariana
# (node scripts/package-handover.mjs). Nada se borra sin confirmación.
set -euo pipefail

PROJECT="learn-sodium"
DATABASES=("learn-sodium" "learn-sodium-preview")
BUCKETS=("learn-sodium-media" "learn-sodium-media-preview")
REPO="sodium-software/learn-sodium"
PHRASE="BORRAR LA CARTILLA"

MODE="simulacion"
[ "${1:-}" = "--ejecutar" ] && MODE="ejecutar"
cd "$(dirname "$0")/.."

step=0
# accion <descripción> <comando...>
accion() {
  step=$((step + 1))
  local description="$1"
  shift
  printf '\n[%d] %s\n    $ %s\n' "$step" "$description" "$*"
  if [ "$MODE" = "simulacion" ]; then
    echo "    (simulación: no se ejecuta)"
    return 0
  fi
  read -r -p "    ¿Ejecutar este paso? [s/N] " answer
  if [ "$answer" = "s" ] || [ "$answer" = "S" ]; then
    "$@" && echo "    hecho" || echo "    FALLÓ: revisa el mensaje y repite el paso a mano"
  else
    echo "    omitido"
  fi
}

empty_bucket() { # borra todos los objetos (R2 no deja borrar un bucket con contenido)
  local bucket="$1" env_flag=()
  [[ "$bucket" == *preview ]] && env_flag=(--env preview)
  local db="learn-sodium"
  [[ "$bucket" == *preview ]] && db="learn-sodium-preview"
  npx wrangler d1 execute "$db" --remote "${env_flag[@]}" --json --command "SELECT key FROM media" |
    python3 -c 'import json,sys; [print(r["key"]) for r in json.load(sys.stdin)[0]["results"]]' |
    while read -r key; do npx wrangler r2 object delete "${bucket}/${key}" --remote; done
  npx wrangler r2 bucket delete "$bucket"
}

echo "Desmontaje de La Cartilla — modo: ${MODE}"

# Requisito: el paquete de entrega existe.
latest="$(ls -1t entrega/la-cartilla-entrega-*.zip 2>/dev/null | head -1 || true)"
if [ -z "$latest" ]; then
  echo "No hay paquete de entrega en entrega/. Primero: node scripts/package-handover.mjs"
  [ "$MODE" = "ejecutar" ] && exit 1
else
  echo "Paquete de entrega: ${latest} ($(du -h "$latest" | cut -f1))"
fi

if [ "$MODE" = "ejecutar" ]; then
  echo
  echo "Esto borra de forma definitiva la web, su base de datos y sus archivos."
  read -r -p "Escribe «${PHRASE}» para continuar: " typed
  [ "$typed" = "$PHRASE" ] || { echo "Frase incorrecta. No se hizo nada."; exit 1; }
fi

# Sin dominio propio desde el 2026-11-11 (se quitó learn.sodium.software y nunca hubo CNAME).
accion "Borrar el proyecto de Pages ${PROJECT} (web y todas sus versiones)" \
  npx wrangler pages project delete "$PROJECT" --yes
# R2 antes que D1: la lista de archivos a vaciar sale de la base de datos.
for bucket in "${BUCKETS[@]}"; do
  accion "Vaciar y borrar el almacenamiento R2 ${bucket}" empty_bucket "$bucket"
done
for database in "${DATABASES[@]}"; do
  accion "Borrar la base de datos D1 ${database}" npx wrangler d1 delete "$database" --skip-confirmation
done
accion "Archivar el repositorio ${REPO} en GitHub (queda de solo lectura; no se borra)" \
  gh repo archive "$REPO" --yes

echo
echo "${step} acciones listadas. Modo: ${MODE}."
