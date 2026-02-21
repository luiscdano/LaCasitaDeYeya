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
  - `src/index.js` (endpoints `/api/health` y `/api/reservations`)
- Guia de despliegue:
  - `infra/cloudflare/reservations-worker/README.md`
