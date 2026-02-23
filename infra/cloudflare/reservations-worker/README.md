# Reservations Worker (Cloudflare + D1)

API para registrar reservas desde `reserva/index.html`.

## Endpoints

- `GET /api/health`
- `POST /api/reservations`
- `GET /api/internal/reservations` (protegido)
- `GET /api/internal/reservations/:id` (protegido)
- `PATCH /api/internal/reservations/:id/status` (protegido)

Body esperado (`application/json`):

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

Respuestas clave:

- `201` reserva creada
- `409` solicitud duplicada reciente
- `429` limite excedido (`retry_after_seconds`)

## Flujo operativo interno

Estados soportados:

- `pending`
- `confirmed`
- `cancelled`

Actualizar estado:

```bash
curl -X PATCH "https://<worker>/api/internal/reservations/123/status" \
  -H "Authorization: Bearer <INTERNAL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed","updated_by":"host","note":"Mesa lista 15 min antes"}'
```

La respuesta incluye plantillas listas para:

- correo (`templates.email.subject`, `templates.email.body`)
- WhatsApp (`templates.whatsapp.body`)
