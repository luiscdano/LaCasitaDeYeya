# La Casita de Yeya

Sitio reiniciado desde cero con arquitectura seccionada por carpetas.

## Enlace principal
- `https://luiscdano.github.io/LaCasitaDeYeya/`

## Estructura
- `index.html` (inicio)
- `shared/` (recursos globales)
  - `css/main.css`
  - `js/main.js`
  - `img/`
  - `data/instagram-feed.json`
  - `data/instagram/` (miniaturas locales del feed)
- `scripts/`
  - `update_instagram_feed.sh`
  - `qa_cross_browser_screenshots.sh`
- `docs/`
  - `STACK_ROADMAP.md`
  - `CLIENTA_CHECKLIST_CANALES.md`
  - `BROWSER_COMPATIBILITY.md`
  - `RESERVATIONS_PANEL_OPERATIONS.md`
- `apps/`
  - `admin-panel/` (React + Material UI)
- `infra/`
  - `cloudflare/reservations-worker/`
  - `docker-compose.reservations.yml`
  - `docker/reservations-api/`
- `localidad/`
  - `index.html`
  - `village/index.html`
  - `downtown/index.html`
  - `los-corales/index.html`
- `menu/`
  - `index.html`
  - `img/`
- `sobre/`
  - `index.html`
  - `descripcion-general/index.html`
  - `nuestra-huella/index.html`
- `abastecimiento/`
  - `index.html`
- `reserva/`
  - `index.html`
  - `panel/index.html` (panel interno operativo en JS)
  - `panel-react/index.html` (panel interno React + MUI compilado)

## Navegación principal
- Localidad
  - Village
  - Downtown
  - Los Corales
- Menú
- Sobre
  - Descripción General
  - Nuestra Huella
- Abastecimiento
- Reserva

## Idioma (ES / EN)
- Idioma por defecto: español (`es`).
- Selector de idioma en topbar (icono de globo) para cambiar entre `Español` e `Inglés`.
- Persistencia por navegador con `localStorage` (`lacasita_language`).
- Base i18n:
  - `shared/js/i18n.js` (diccionario, traducción de texto/atributos y switcher global).
  - `shared/js/main.js` y `shared/js/reservations-admin.js` con mensajes dinámicos compatibles i18n.
- Importante: `i18n.js` se carga antes de `main.js` en todas las páginas.

## Desarrollo local
```bash
python3 -m http.server 8080
```
Abrir:
- `http://localhost:8080/index.html`

## API de reservas (Docker)
- Stack local/servidor en:
  - `infra/docker-compose.reservations.yml`
  - `infra/docker/reservations-api/`
- Guia:
  - `infra/docker/reservations-api/README.md`

## Feed de Instagram
- Home incluye sección `Síguenos en Instagram` cargada desde `shared/data/instagram-feed.json`.
- El feed publica los últimos `10` posts y descarga miniaturas locales en `shared/data/instagram/` para evitar bloqueos de imagen.
- Para refrescar manualmente el feed:
```bash
./scripts/update_instagram_feed.sh
```
- Sincronización automática:
  - Workflow en `.github/workflows/lacasita-instagram-sync.yml` (cada 6 horas + manual).

## Optimizacion de imagenes
- Se agregaron variantes `.webp` para assets visuales principales de `menu/`, `shared/` y `localidad/`.
- Los HTML/CSS ya consumen `.webp` para reducir tiempo de carga en clientes moviles.
- Los originales (`.png` / `.jpg`) se mantienen como respaldo de edicion.

## API de reservas (Cloudflare)
- Base de API serverless en:
  - `infra/cloudflare/reservations-worker/`
- Incluye:
  - `wrangler.toml` (config Worker + D1)
  - `schema.sql` (esquema de base de datos)
  - `src/index.js` (endpoints publicos + internos)
  - endpoint publico de solicitudes de eventos/bufete: `POST /api/catering-requests` (modulo `abastecimiento`)
  - validaciones server-side + anti-spam/rate-limit base para preproduccion
  - flujo interno con estados (`pending/confirmed/cancelled`) y plantillas de confirmacion (correo/WhatsApp)
  - outbox `reservation_notifications` con reintentos (`queued/sent/failed`) y despacho en modo `mock` por defecto
  - alertas operativas de nuevos ingresos (reserva + abastecimiento) hacia canales internos configurados (`EMAIL_TO`, `WABA_TO_NUMBER`)
  - hardening API (headers de seguridad, `X-Request-Id`, control opcional de origen interno)
  - observabilidad operativa (`/api/internal/metrics/summary` + logs estructurados)
- Guia de despliegue:
  - `infra/cloudflare/reservations-worker/README.md`

## Panel interno de reservas
- Estado actual:
  - panel operativo en JS (`reserva/panel/`)
  - panel operativo en React + Material UI (`reserva/panel-react/`)
  - commit de implementación React + MUI: `08b41dc`
- Ruta:
  - `reserva/panel/index.html`
  - `reserva/panel-react/index.html`
  - en GitHub Pages: `https://luiscdano.github.io/LaCasitaDeYeya/reserva/panel-react/`
- Uso rapido:
  1. Abrir panel interno.
  2. Colocar `API base` del Worker.
  3. Colocar `INTERNAL_API_KEY`.
  4. Click en `Conectar`.
- Operaciones:
  - listar/filtrar reservas
  - cambiar estado (`pending`, `confirmed`, `cancelled`)
  - encolar y despachar notificaciones
  - reintentar notificaciones fallidas
  - consultar metricas operativas
- Panel React + Material UI (nuevo):
  - fuente: `apps/admin-panel/`
  - build estático publicado: `reserva/panel-react/`
  - guía operativa: `docs/RESERVATIONS_PANEL_OPERATIONS.md`
- Si necesitas definir/rotar llave interna:
```bash
cd infra/cloudflare/reservations-worker
npx wrangler secret put INTERNAL_API_KEY
```

## React + Material UI (Admin)
- Desarrollo:
```bash
cd apps/admin-panel
npm install
npm run dev
```
- Build módulo:
```bash
cd apps/admin-panel
npm run build
```
- Build para sitio estático actual:
```bash
cd apps/admin-panel
npm run build -- --outDir ../../reserva/panel-react --emptyOutDir
```
