#!/usr/bin/env bash
# Añade el registro CNAME de learn.sodium.software al zona sodium.software.
#
# Necesita un token de API de Cloudflare con permiso DNS: Edit sobre el zona
# sodium.software. El token OAuth de `wrangler login` NO incluye ese permiso.
#
# Uso:
#   CLOUDFLARE_API_TOKEN=xxxx bash scripts/add-dns.sh
#
# El dominio personalizado ya está registrado en el proyecto de Pages
# (learn-sodium). Al existir el registro, Cloudflare valida el dominio y emite
# el certificado TLS automáticamente.
set -euo pipefail

ZONE_ID="f2dca298e5367a3d738562f90b58bd09"
ACCOUNT_ID="27a1784f9b6d99639db1e2ac1288cb26"
TARGET="learn-sodium.pages.dev"
NAME="learn"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "Falta CLOUDFLARE_API_TOKEN." >&2
  echo "Crea uno en https://dash.cloudflare.com/profile/api-tokens con permiso" >&2
  echo "«Zone → DNS → Edit» sobre sodium.software, y ejecútalo de nuevo." >&2
  exit 1
fi

echo "→ Creando CNAME ${NAME}.sodium.software → ${TARGET}"
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"CNAME\",
    \"name\": \"${NAME}\",
    \"content\": \"${TARGET}\",
    \"proxied\": true,
    \"ttl\": 1
  }" | python3 -m json.tool

echo
echo "→ Estado del dominio en el proyecto de Pages:"
curl -s -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/learn-sodium/domains" \
  | python3 -c "
import json, sys
for d in json.load(sys.stdin).get('result', []):
    print(f\"   {d.get('name')}  ·  estado: {d.get('status')}  ·  validación: {d.get('validation_data', {}).get('status')}\")
"

echo
echo "→ Comprobación de la resolución:"
sleep 5
curl -s "https://dns.google/resolve?name=${NAME}.sodium.software&type=CNAME" \
  | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('   estado DNS:', d.get('Status'), '(0 = resuelve)')
for a in d.get('Answer', []):
    print('   ', a.get('data'))
"
echo
echo "Cuando el certificado esté emitido, https://learn.sodium.software funciona."
