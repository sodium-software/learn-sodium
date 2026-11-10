# Despliegue en Cloudflare Pages — learn.sodium.software

**Estado actual: desplegado y verificado en `https://learn-sodium.pages.dev`.**
Sólo falta un paso manual para que el subdominio `learn.sodium.software`
responda (ver §4), porque el token de API disponible no tiene permiso de
escritura en DNS.

---

## 1. Qué hay que tener

- Cuenta de Cloudflare con el zona `sodium.software` activa (zona
  `f2dca298e5367a3d738562f90b58bd09`, cuenta `27a1784f9b6d99639db1e2ac1288cb26`).
- Token de API de Cloudflare con permiso **Pages: Edit**. Para el paso de DNS
  hace falta además **DNS: Edit** sobre el zona `sodium.software`.
- Node 20 o superior y npm.

El token OAuth de `wrangler` (el que se usó en este despliegue) sirve para
Pages, pero **no** incluye el permiso `dns_records`: por eso el paso 4 es
manual.

```bash
export CLOUDFLARE_API_TOKEN="$(grep oauth_token ~/.config/.wrangler/config/default.toml \
  | sed 's/.*= "//; s/"//')"
```

> `wrangler login` (interactivo) también vale y es lo habitual en un
> escritorio con navegador. El token OAuth caduca a la hora; para renovarlo sin
> interacción: `bash scripts/refresh-token.sh`.

## 2. Publicar el proyecto

```bash
npm ci
npm run build          # comprueba tipos y genera dist/
npx wrangler pages deploy dist --project-name learn-sodium --branch main
```

El proyecto de Pages ya existe:

- nombre: `learn-sodium`
- id: `c96f61de-4ff0-4c8b-a952-829889b045d8`
- subdominio: `learn-sodium.pages.dev`
- rama de producción: `main`

Para crearlo de cero:

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

**Cómo comprobarlo:**

```bash
curl -sI https://learn-sodium.pages.dev/podcast/the-practice-room-ep1 | head -1
# HTTP/2 200  (no 404) y content-type: text/html
```

## 4. Paso pendiente: el registro DNS de `learn`

El dominio personalizado ya está **registrado en el proyecto de Pages**:

| | |
| --- | --- |
| Dominio | `learn.sodium.software` |
| Estado | `initializing` (a la espera del registro DNS) |
| Zona | `f2dca298e5367a3d738562f90b58bd09` |
| Certificados | Google (se emiten solos cuando el DNS resuelve) |

Falta el registro CNAME. **Se añade desde el panel** (30 segundos):

1. Dashboard de Cloudflare → **sodium.software** → **DNS** → **Records**.
2. **Add record**:
   - Type: `CNAME`
   - Name: `learn`
   - Target: `learn-sodium.pages.dev`
   - Proxy status: **Proxied** (nube naranja, activada)
   - TTL: `Auto`
3. Guardar.

No se toca ningún otro registro: los de `sodium.software`, `www` y el resto
quedan intactos.

En cuanto el registro existe, Cloudflare valida el dominio, emite el
certificado TLS y `learn.sodium.software` sirve el sitio. Se comprueba con:

```bash
curl -s "https://dns.google/resolve?name=learn.sodium.software&type=CNAME"
# Status 0 y Answer con learn-sodium.pages.dev

curl -sI https://learn.sodium.software/ | head -1
# HTTP/2 200
```

### Alternativa por API (si se tiene un token con DNS: Edit)

El repositorio incluye un script que hace el paso y comprueba el resultado:

```bash
CLOUDFLARE_API_TOKEN=xxxx bash scripts/add-dns.sh
```

El token se crea en https://dash.cloudflare.com/profile/api-tokens con el
permiso **Zone → DNS → Edit** sobre `sodium.software`. Ojo: el token OAuth de
`wrangler login` **no** incluye `dns_records`, y por eso este paso no se puede
automatizar con el token que se usó en el despliegue.

### Si el registro se creara a mano y hubiera que deshacerlo

```bash
curl -s -X DELETE \
  "https://api.cloudflare.com/client/v4/accounts/27a1784f9b6d99639db1e2ac1288cb26/pages/projects/learn-sodium/domains/learn.sodium.software" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

y borrar el registro CNAME `learn` del zona.

## 5. Conectar el repositorio (despliegue automático)

Hay dos caminos; cualquiera de los dos vale.

### A. Integración de Git de Cloudflare (sin secretos)

En Cloudflare: **Workers & Pages → learn-sodium → Settings → Builds &
deployments → Connect to Git**.

- Repositorio: `sodium-software/learn-sodium`
- Rama de producción: `main`
- Comando de build: `npm run build`
- Directorio de salida: `dist`
- Variables de entorno: ninguna

A partir de ahí, cada `push` a `main` despliega.

### B. GitHub Actions (ya incluido en el repositorio)

`.github/workflows/deploy.yml` compila y publica en cada push a `main`. Sólo
falta el secreto:

1. Crear un token de API de Cloudflare con permiso **Cloudflare Pages →
   Edit**: https://dash.cloudflare.com/profile/api-tokens
2. Guardarlo como secreto del repositorio:

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo sodium-software/learn-sodium
```

El workflow también ejecuta `typecheck`, `lint`, `test:media` y comprueba que
la raíz y una ruta interna responden 200 después de publicar.

## 6. Primer push

```bash
git remote add origin https://github.com/sodium-software/learn-sodium.git
git push -u origin main
```

(Ya está hecho: el repositorio tiene el commit inicial y el flujo de Actions
queda pendiente sólo del secreto del apartado 5.B.)

## 7. Comprobación final

```bash
# 1. La raíz responde
curl -sI https://learn.sodium.software/ | head -1

# 2. Una ruta interna recarga bien (200, no 404)
curl -sI https://learn.sodium.software/activities/act-quiz-roads | head -1

# 3. Los assets se sirven
curl -sI https://learn.sodium.software/media/audio/counting-the-miles.mp3 | head -1

# 4. El certificado TLS es válido
curl -sI https://learn.sodium.software/ | grep -i "strict-transport"

# 5. La suite funcional contra el sitio publicado
npm run build && npx vite preview --port 4173 &
npm run test:e2e -- https://learn.sodium.software
```

## 8. Notas

- `wrangler pages deploy` puede crear un `wrangler.jsonc` y parchar
  `vite.config.ts` la primera vez (integración con el plugin de Cloudflare
  para Vite). Para este proyecto no hace falta: el despliegue es estático y
  el enrutado SPA lo resuelve `public/_redirects`. Si vuelve a aparecer,
  basta con borrar `wrangler.jsonc` y restaurar `vite.config.ts`.
- `.wrangler/` está en `.gitignore`.
- Los proyectos existentes de Sodium (`sodium-web`, `sodium.software`) no se
  tocan en ningún momento.
