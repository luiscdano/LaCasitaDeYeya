# Panel Interno de Reservas

Ruta interna (JS actual):

- `reserva/panel/index.html`

Ruta interna (React + Material UI):

- `reserva/panel-react/index.html`
- Fuente: `apps/admin-panel/`

## Uso rapido

1. Abrir panel interno.
2. Colocar `API base` del Worker.
3. Colocar `Internal API Key`.
4. Click en `Conectar`.

El panel carga:

- metricas de reservas/notificaciones
- listado de reservas
- outbox de notificaciones

## Operaciones disponibles

Reservas:

- cambiar estado a `pending`, `confirmed`, `cancelled`
- encolar notificacion manual por reserva

Outbox:

- filtrar por estado/canal/reserva
- despachar cola por lotes
- reintentar notificaciones fallidas

## Seguridad operativa

- La llave interna se guarda en `sessionStorage` (solo en la sesión actual del navegador).
- Al pulsar `Desconectar` se limpia la sesión.
- La API interna valida:
  - `INTERNAL_API_KEY`
  - `INTERNAL_ALLOWED_ORIGINS` (si el request trae header `Origin`)

## Observabilidad

- Request ID visible en panel (última llamada).
- Métricas desde `GET /api/internal/metrics/summary`.
- Logs estructurados en Cloudflare Worker.

## Build del panel React

```bash
cd apps/admin-panel
npm install
npm run build -- --outDir ../../reserva/panel-react
```
