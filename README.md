# La Casita de Yeya

Sitio web oficial con arquitectura modular en HTML/CSS/JS, panel interno de reservas (JS y React), y backend serverless en Cloudflare Worker + D1.

## Estado Actual (actualizado: 2026-03-05)

- Dominio oficial activo: `https://lacasitadeyeya.com.do/`
- Dominio configurado en repositorio: `CNAME` apuntando a `lacasitadeyeya.com.do`
- Sitemap publicado y enviado en Search Console: `https://lacasitadeyeya.com.do/sitemap.xml`
- `robots.txt` publicado con exclusiones para paneles internos
- Favicon/PWA ya integrado en modulos publicos e internos
- SEO base aplicado en paginas publicas (`canonical`, Open Graph, Twitter Card)
- Schema `Restaurant` (JSON-LD) aplicado en home
- Contacto visible y clicable en footer y fichas de sucursal (correo + WhatsApp B.)
- Topbar y footer en tono amarillo pastel (CSS global compartido)
- API de reservas en Cloudflare Worker operativa (publica + interna)
- Panel interno operativo en dos versiones:
  - `reserva/panel/` (JS)
  - `reserva/panel-react/` (React + Material UI)

## Enlaces Principales

- Sitio publico: `https://lacasitadeyeya.com.do/`
- Localidad: `https://lacasitadeyeya.com.do/localidad/`
- Menu: `https://lacasitadeyeya.com.do/menu/`
- Sobre: `https://lacasitadeyeya.com.do/sobre/`
- Abastecimiento: `https://lacasitadeyeya.com.do/abastecimiento/`
- Reserva: `https://lacasitadeyeya.com.do/reserva/`
- Panel interno React (no indexable): `https://lacasitadeyeya.com.do/reserva/panel-react/`

## Estructura del Proyecto

- `index.html` (inicio)
- `shared/` (assets globales)
  - `css/main.css`
  - `js/main.js`
  - `js/i18n.js`
  - `js/reservations-admin.js`
  - `img/`
  - `data/instagram-feed.json`
  - `data/instagram/`
- `localidad/`
  - `index.html`
  - `village/index.html`
  - `downtown/index.html`
  - `los-corales/index.html`
- `menu/index.html`
- `sobre/`
  - `index.html`
  - `descripcion-general/index.html`
  - `nuestra-huella/index.html`
- `abastecimiento/index.html`
- `reserva/`
  - `index.html`
  - `panel/index.html` (interno JS)
  - `panel-react/index.html` (interno React build)
- `apps/admin-panel/` (fuente React + MUI del panel)
- `infra/`
  - `cloudflare/reservations-worker/`
  - `docker-compose.reservations.yml`
  - `docker/reservations-api/`
- `scripts/`
  - `update_instagram_feed.sh`
  - `qa_cross_browser_screenshots.sh`
- `docs/` (roadmap, QA, checklist, operaciones)

## Navegacion Principal

- Localidad
  - Village
  - Downtown
  - Los Corales
- Menu
- Sobre
  - Descripcion General
  - Nuestra Huella
- Abastecimiento
- Reserva

## Idioma (ES / EN)

- Idioma por defecto: `es`
- Selector ES/EN en topbar
- Persistencia en `localStorage` (`lacasita_language`)
- Base i18n centralizada en `shared/js/i18n.js`

## Desarrollo Local

```bash
python3 -m http.server 8080
```

Abrir:

- `http://localhost:8080/index.html`

## API de Reservas (Cloudflare Worker + D1)

Base serverless:

- `infra/cloudflare/reservations-worker/`

Incluye:

- `wrangler.toml`
- `schema.sql`
- `src/index.js`

Endpoints publicos:

- `GET /api/health`
- `GET /api/weather/current`
- `POST /api/reservations`
- `POST /api/catering-requests`

Endpoints internos (con `INTERNAL_API_KEY`):

- `GET /api/internal/reservations`
- `PATCH /api/internal/reservations/:id/status`
- `GET /api/internal/notifications`
- `POST /api/internal/notifications/dispatch`
- `GET /api/internal/metrics/summary`

### Ajuste de dominio aplicado

Se actualizaron origenes permitidos para incluir dominio oficial `.com.do`:

- `ALLOWED_ORIGINS`
- `INTERNAL_ALLOWED_ORIGINS`

Archivo:

- `infra/cloudflare/reservations-worker/wrangler.toml`

Tambien se alineo el default local del compose:

- `infra/docker-compose.reservations.yml`

## Panel Interno de Reservas

Version JS:

- `reserva/panel/index.html`

Version React + MUI:

- Fuente: `apps/admin-panel/`
- Build publicado: `reserva/panel-react/`

Uso rapido:

1. Abrir panel interno.
2. Colocar `API base`.
3. Colocar `INTERNAL_API_KEY`.
4. Click en `Conectar`.

## SEO Tecnico y Descubrimiento

Implementado:

- `robots.txt` con exclusiones de panel interno
- `sitemap.xml` publico en dominio oficial
- Meta `theme-color` y manifest PWA
- `meta robots noindex,nofollow` en paneles internos
- `rel="canonical"` por pagina publica
- Metadatos Open Graph/Twitter por pagina publica
- `application/ld+json` (schema.org tipo `Restaurant`) en home

Pendiente recomendado:

- ampliar JSON-LD por sucursal (`LocalBusiness` por ubicacion) cuando la clienta valide datos finales

## PWA, Favicon e Iconos

Implementado:

- `site.webmanifest`
- `apple-touch-icon`
- Favicons PNG (`32x32`, `192x192`, `512x512`)
- `apple-mobile-web-app-title`

Nota operativa:

- Algunos dispositivos/navegadores tardan en refrescar iconos por cache local.
- Para cobertura historica maxima de escritorio, es recomendable agregar tambien `favicon.ico` en raiz.

## Contacto Visible del Sitio

Implementado:

- Footer publico con contacto clicable:
  - `mailto:luiscdano@gmail.com`
  - `https://wa.me/18495845645`
- Tarjetas de contacto en sucursales con enlaces clicables a correo y WhatsApp B.

Cuando la clienta confirme el correo corporativo final, reemplazar este valor en:

- `index.html`
- `localidad/index.html`
- `localidad/village/index.html`
- `localidad/downtown/index.html`
- `localidad/los-corales/index.html`
- `menu/index.html`
- `sobre/index.html`
- `sobre/descripcion-general/index.html`
- `sobre/nuestra-huella/index.html`
- `abastecimiento/index.html`
- `reserva/index.html`
- `shared/js/i18n.js`

## Feed de Instagram

- Fuente local: `shared/data/instagram-feed.json`
- Miniaturas locales: `shared/data/instagram/`
- Sync manual:

```bash
./scripts/update_instagram_feed.sh
```

- Sync automatico (GitHub Actions): `.github/workflows/lacasita-instagram-sync.yml`

## QA Cross Browser

Script:

```bash
./scripts/qa_cross_browser_screenshots.sh
```

Salida:

- `docs/qa/screenshots-YYYYMMDD-HHMMSS/`

## Auditoria Interna (2026-03-05)

### Fortalezas

- Arquitectura modular clara por secciones del negocio.
- Base visual unificada por `shared/css/main.css`.
- i18n centralizado ES/EN funcional.
- API robusta con validaciones, rate-limit y flujo interno de notificaciones.
- Panel interno en JS y React listo para operacion.
- Integracion PWA/favicon ya desplegada.
- Robots + sitemap ya activos para indexacion.

### Debilidades / Riesgos

- Faltan canonicals, OG/Twitter y schema JSON-LD para SEO de marca.
- Referencias de dominio antiguas en configuraciones secundarias (parcialmente corregido en este ajuste).
- Repositorio local con alto peso en assets QA y multimedia sin politica formal de archivado.
- Imagenes JPG muy pesadas en algunas localidades (impacto en rendimiento real de mobile data).
- No existe pipeline CI para validacion tecnica integral (solo sync de Instagram).

### Acciones Prioritarias (Add / Modify / Remove)

Add:

- Schema `Organization` y `LocalBusiness` por sucursal.
- Monitor de uptime + alertas de caida (home + API).
- `favicon.ico` de compatibilidad legacy.

Modify:

- Mantener dominio unico `.com.do` como base de toda configuracion y documentacion.
- Reducir peso de imagenes grandes (JPG > 2 MB) con version web optimizada.
- Establecer checklist de release: DNS, SSL, sitemap, Search Console, panel interno.
- Al definir el color final de clienta, ajustar en un punto:
  - `shared/css/main.css` variables `--client-chrome-bg-start` y `--client-chrome-bg-end`.

Remove (controlado, con respaldo):

- Capturas QA antiguas en `docs/qa` no necesarias para operacion diaria.
- Builds y dependencias locales que no deban persistir en entorno productivo.

## Consideraciones Clave por Tener Dominio Propio

- Mantener activos registros DNS que verifican Search Console.
- Validar resolucion de `@` y `www` hacia el mismo destino.
- Forzar version canonica HTTPS (evitar duplicidad con HTTP o host alterno).
- Revisar periodicamente SSL/TLS para evitar errores en Safari o iOS.
- No mover ni eliminar `CNAME`, `robots.txt` y `sitemap.xml` sin actualizar estrategia SEO.

## Comandos Operativos Relevantes

Configurar secretos del Worker:

```bash
cd infra/cloudflare/reservations-worker
npx wrangler secret put INTERNAL_API_KEY
npx wrangler secret put WEATHER_API_KEY
```

Build del panel React hacia sitio estatico:

```bash
cd apps/admin-panel
npm run build -- --outDir ../../reserva/panel-react --emptyOutDir
```

## Documentacion Relacionada

- `docs/STACK_ROADMAP.md`
- `docs/BROWSER_COMPATIBILITY.md`
- `docs/RESERVATIONS_PANEL_OPERATIONS.md`
- `docs/CLIENTA_CHECKLIST_CANALES.md`
- `infra/cloudflare/reservations-worker/README.md`
