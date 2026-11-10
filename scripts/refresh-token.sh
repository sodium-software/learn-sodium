#!/usr/bin/env bash
# Renueva el token OAuth de wrangler cuando caduca (dura una hora).
#
# El token que guarda `wrangler login` caduca a la hora; `wrangler` no puede
# renovarlo solo en un entorno no interactivo. Este script hace el refresh
# contra el endpoint de Cloudflare y actualiza el fichero de credenciales.
#
# Uso: bash scripts/refresh-token.sh
set -euo pipefail

CONFIG="${HOME}/.config/.wrangler/config/default.toml"
CLIENT_ID="54d11594-84e4-41aa-b438-e81b8fa78ee7"

if [ ! -f "$CONFIG" ]; then
  echo "No se encuentra ${CONFIG}. Ejecuta 'wrangler login' primero." >&2
  exit 1
fi

python3 - "$CONFIG" "$CLIENT_ID" <<'PY'
import datetime
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

config_path = pathlib.Path(sys.argv[1])
client_id = sys.argv[2]
config = config_path.read_text(encoding="utf-8")

refresh = re.search(r'refresh_token\s*=\s*"([^"]+)"', config)
if not refresh:
    sys.exit('No hay refresh_token en la configuración de wrangler.')

data = urllib.parse.urlencode(
    {
        "grant_type": "refresh_token",
        "refresh_token": refresh.group(1),
        "client_id": client_id,
    }
).encode()

request = urllib.request.Request("https://dash.cloudflare.com/oauth2/token", data=data)
request.add_header("User-Agent", "wrangler/4 node/24 linux x64")
request.add_header("Content-Type", "application/x-www-form-urlencoded")
request.add_header("Accept", "application/json")

with urllib.request.urlopen(request, timeout=60) as response:
    body = json.load(response)

expiry = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
    seconds=body.get("expires_in", 3600)
)
stamp = expiry.strftime("%Y-%m-%dT%H:%M:%S.") + f"{expiry.microsecond // 1000:03d}Z"

config = re.sub(r'oauth_token\s*=\s*"[^"]+"', f'oauth_token = "{body["access_token"]}"', config)
config = re.sub(r'refresh_token\s*=\s*"[^"]+"', f'refresh_token = "{body["refresh_token"]}"', config)
config = re.sub(r'expiration_time\s*=\s*"[^"]+"', f'expiration_time = "{stamp}"', config)
if body.get("scope"):
    scopes = body["scope"].split()
    config = re.sub(
        r'scopes\s*=\s*\[[^\]]*\]',
        "scopes = [ " + ", ".join(f'"{s}"' for s in scopes) + " ]",
        config,
    )
config_path.write_text(config, encoding="utf-8")
print(f"Token renovado. Expira a las {stamp}.")
PY

echo
echo "Para usarlo en esta terminal:"
echo 'export CLOUDFLARE_API_TOKEN="$(grep oauth_token ~/.config/.wrangler/config/default.toml | sed \'s/.*= "//; s/"//\')"'
