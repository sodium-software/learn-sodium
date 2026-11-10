# Despliegue en Cloudflare Pages — learn.sodium.software

## 1. Qué hay que tener

- Cuenta de Cloudflare con el zona `sodium.software` activa (ya lo está: zona
  `f2dca298e5367a3d738562f90b58bd09`, cuenta `27a1784f9b6d99639db1e2ac1288cb26`).
- Token de API de Cloudflare con permiso de **Pages: Edit** y **DNS: Edit**
  sobre el zona `sodium.software`.
- Node 20 o superior y npm.

El token usado en esta máquina es el OAuth de `wrangler`. Se exporta así:

```bash
export CLOUDFLARE_API_TOKEN="$(grep oauth_token ~/.config/.wrangler/config/default.toml \
  | sed 's/.*= "//; s/"//')"
```

> `wrangler login` (interactivo) también vale y es lo habitual en un
> escritorio con navegador.

## 2. Publicar el proyecto

```bash
npm ci
npm run build          # comprueba tipos y genera dist/
npx wrangler pages deploy dist --project-name learn-sodium --branch main
```

La primera vez, `wrangler` crea el proyecto `learn-sodium` si no existe:

```bash
npx wrangler pages project create learn-sodium --production-branch main
```

## 3. Enrutado SPA (ya resuelto en el repositorio)

`public/_redirects` contiene la regla que hace que las rutas internas
funcionen al recargar:

```
/*    /index.html   200
```

Vite copia `public/` a `dist/` sin cambios, así que `dist/_redirects` viaja
tal cual al despliegue. Sin esta línea, abrir directamente
`/podcast/the-practice-room-ep1` devolvería 404.

**Cómo comprobarlo** (tras el despliegue):

```bash
curl -sI https://learn.sodium.software/podcast/the-practice-room-ep1 | head -1
# debe responder 200 (no 404) y servir el index.html
```

## 4. Dominio personalizado — learn.sodium.software

El subdominio se añade al proyecto de Pages desde la API de Cloudflare:

```bash
export CLOUDFLARE_API_TOKEN="..."

curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/27a1784f9b6d99639db1e2ac1288cb26/pages/projects/learn-sodium/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"learn.sodium.software"}'
```

Cloudflare crea el registro DNS correspondiente (`learn` → `<proyecto>.pages.dev`,
protegido con proxy) **si el zona pertenece a la misma cuenta**. Si la API
devuelve un error de permisos al escribir DNS, hay dos alternativas:

### Alternativa A — API de DNS (necesita permiso `DNS: Edit`)

```bash
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/f2dca298e5367a3d738562f90b58bd09/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "learn",
    "content": "learn-sodium.pages.dev",
    "proxied": true,
    "ttl": 1
  }'
```

### Alternativa B — desde el panel

1. Dashboard de Cloudflare → **sodium.software** → **DNS** → **Records**.
2. Añadir registro: tipo `CNAME`, nombre `learn`, destino
   `learn-sodium.pages.dev`, proxy **activado** (nube naranja), TTL
   *Automático*.
3. No tocar ningún otro registro: los de `sodium.software`, `www` y el resto
   no se modifican.

Una vez añadido el dominio personalizado desde la API o el panel, Cloudflare
emite automáticamente el certificado TLS para `learn.sodium.software`. El
estado del certificado se ve en:

```bash
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/27a1784f9b6d99639db1e2ac1288cb26/pages/projects/learn-sodium/domains" \
  | python3 -m json.tool
```

## 5. Conectar el repositorio (build automático)

En Cloudflare: **Workers & Pages → learn-sodium → Settings → Builds &
deployments → Connect to Git**.

- Repositorio: `sodium-software/learn-sodium`
- Rama de producción: `main`
- Comando de build: `npm run build`
- Directorio de salida: `dist`
- Variables de entorno: ninguna

A partir de ahí, cada `push` a `main` despliega. El primer push se hace con:

```bash
git remote add origin https://github.com/sodium-software/learn-sodium.git
git push -u origin main
```

## 6. Comprobación final

```bash
# 1. La raíz responde
curl -sI https://learn.sodium.software/ | head -1

# 2. Una ruta interna recarga bien (SLA 200, no 404)
curl -sI https://learn.sodium.software/activities/act-quiz-roads | head -1

# 3. Los assets se sirven
curl -sI https://learn.sodium.software/media/audio/counting-the-miles.mp3 | head -1

# 4. El certificado es válido
curl -sI https://learn.sodium.software/ | grep -i "strict-transport"
```

## 7. Deshacer

Nada de lo anterior toca `sodium.software` ni `www.sodium.software`: sólo se
añade el subdominio `learn`. Para revertirlo:

```bash
curl -s -X DELETE \
  "https://api.cloudflare.com/client/v4/accounts/27a1784f9b6d99639db1e2ac1288cb26/pages/projects/learn-sodium/domains/learn.sodium.software" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

y, si se creó a mano, borrar el registro CNAME `learn` del zona.
