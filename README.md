# La Casita de Yeya

Sitio reiniciado desde cero con arquitectura seccionada por carpetas.

## Enlace principal
- `https://luiscdano.github.io/PersonalProjects/LaCasitaDeYeya/index.html`

## Estructura
- `index.html` (inicio)
- `shared/` (recursos globales)
  - `css/main.css`
  - `js/main.js`
  - `img/logo.png`
  - `data/instagram-feed.json`
  - `data/instagram/` (miniaturas locales del feed)
- `scripts/`
  - `update_instagram_feed.sh`
- `localidad/`
  - `index.html`
  - `img/`
  - `village/index.html`
  - `downtown/index.html`
  - `los-corales/index.html`
- `menu/`
  - `index.html`
  - `img/`
- `sobre/`
  - `index.html`
  - `img/`
  - `descripcion-general/index.html`
  - `nuestra-huella/index.html`
- `abastecimiento/`
  - `index.html`
  - `img/`
- `reserva/`
  - `index.html`
  - `img/`

## Navegación principal
- Localidad
  - Village
  - Downtown
  - Lo Corales
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

## Feed de Instagram
- Home incluye sección `Síguenos en Instagram` cargada desde `shared/data/instagram-feed.json`.
- El feed publica los últimos `10` posts y descarga miniaturas locales en `shared/data/instagram/` para evitar bloqueos de imagen.
- Para refrescar manualmente el feed:
```bash
./scripts/update_instagram_feed.sh
```
- Sincronización automática:
  - Workflow en `../.github/workflows/lacasita-instagram-sync.yml` (cada 6 horas + manual).
