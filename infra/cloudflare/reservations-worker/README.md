# Reservations Worker (Cloudflare + D1)

API para registrar reservas desde `reserva/index.html` con flujo interno de estados y cola de notificaciones.

## Endpoints

Publicos:

- `GET /api/health`
- `POST /api/reservations`

Internos (protegidos con `INTERNAL_API_KEY`):

- `GET /api/internal/reservations`
- `GET /api/internal/reservations/:id`
- `PATCH /api/internal/reservations/:id/status`
- `POST /api/internal/reservations/:id/notify` (reenvio manual)
- `GET /api/internal/notifications` (outbox)
- `POST /api/internal/notifications/dispatch` (procesar cola)
- `POST /api/internal/notifications/:id/retry` (reintentar)

Body esperado para `POST /api/reservations` (`application/json`):

```json
{
  "full_name": "Nombre Apellido",
  "phone": "+1 809 000 0000",
  "email": "correo@dominio.com",
  "location": "los-corales",
  "reservation_date": "2026-02-20",
  "reservation_time": "19:30",
  "guests": 4,
  "comments": "Mesa exterior",
  "source": "website"
}
```

## Setup rapido

1. Instalar Wrangler:

```bash
npm install -g wrangler
```

2. Crear la base D1:

```bash
wrangler d1 create lacasita_reservations
```

3. Copiar el `database_id` generado y actualizar:

- `infra/cloudflare/reservations-worker/wrangler.toml`

4. Aplicar esquema:

```bash
wrangler d1 execute lacasita_reservations --file=infra/cloudflare/reservations-worker/schema.sql
```

5. Probar local:

```bash
cd infra/cloudflare/reservations-worker
wrangler dev
```

6. Desplegar:

```bash
cd infra/cloudflare/reservations-worker
wrangler deploy
```

7. Configurar llave interna (obligatorio para endpoints internos):

```bash
cd infra/cloudflare/reservations-worker
wrangler secret put INTERNAL_API_KEY
```

## Origenes permitidos

Configurar `ALLOWED_ORIGINS` en `wrangler.toml` (lista separada por comas).

## Anti-spam y limites

El Worker incluye protecciones base:

- Rate limit por IP en ventana corta.
- Rate limit por correo por dia.
- Bloqueo de solicitudes duplicadas recientes (mismo correo/localidad/fecha/hora).
- Honeypot server-side (`empresa`, `website`, `company`).

Variables configurables en `wrangler.toml`:

- `RATE_LIMIT_WINDOW_SECONDS` (default: `600`)
- `RATE_LIMIT_MAX_PER_IP` (default: `4`)
- `RATE_LIMIT_MAX_PER_EMAIL_DAY` (default: `8`)
- `DUPLICATE_WINDOW_SECONDS` (default: `900`)

## Flujo operativo interno

Estados soportados:

- `pending`
- `confirmed`
- `cancelled`

Actualizar estado (encola notificaciones por defecto):

```bash
curl -X PATCH "https://<worker>/api/internal/reservations/123/status" \
  -H "Authorization: Bearer <INTERNAL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed","updated_by":"host","note":"Mesa lista 15 min antes"}'
```

Reenviar notificacion manualmente:

```bash
curl -X POST "https://<worker>/api/internal/reservations/123/notify" \
  -H "Authorization: Bearer <INTERNAL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"channels":["email","whatsapp"],"dispatch_now":true}'
```

Procesar cola outbox:

```bash
curl -X POST "https://<worker>/api/internal/notifications/dispatch" \
  -H "Authorization: Bearer <INTERNAL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"limit":20}'
```

## Modo preparado (sin credenciales)

Por defecto el Worker opera en `mock`:

- `EMAIL_DELIVERY_MODE=mock`
- `WHATSAPP_DELIVERY_MODE=mock`

En este modo:

- Las notificaciones se encolan en `reservation_notifications`.
- El despacho marca `sent` sin tocar proveedores externos.
- Puedes probar el flujo end-to-end sin correo ni WhatsApp Business reales.

## Activar envio real luego

Correo con Resend:

1. `EMAIL_DELIVERY_MODE=resend`
2. `EMAIL_FROM=reservas@tu-dominio.com`
3. `wrangler secret put RESEND_API_KEY`

WhatsApp Business API (Meta):

1. `WHATSAPP_DELIVERY_MODE=meta`
2. `WABA_PHONE_NUMBER_ID=<id>`
3. `WABA_API_VERSION=v21.0` (o la version actual)
4. `wrangler secret put WABA_ACCESS_TOKEN`

Opcional para pruebas controladas:

- `WABA_TO_NUMBER=<numero_destino>`
