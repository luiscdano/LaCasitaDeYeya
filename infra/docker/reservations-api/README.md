# Reservations API (Docker + Postgres)

API de reservas para correr en contenedores, en paralelo al Worker de Cloudflare.

## Endpoints

- `GET /api/health`
- `POST /api/reservations`

Payload esperado:

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

## Inicio rapido

1. Copiar variables:

```bash
cp infra/docker/reservations-api/.env.example infra/docker/reservations-api/.env
```

2. Subir stack:

```bash
docker compose \
  -f infra/docker-compose.reservations.yml \
  --env-file infra/docker/reservations-api/.env \
  up --build -d
```

3. Probar API:

```bash
curl -i http://localhost:8789/api/health
```

4. Ver logs:

```bash
docker compose -f infra/docker-compose.reservations.yml logs -f reservations-api
```

5. Bajar stack:

```bash
docker compose -f infra/docker-compose.reservations.yml down
```

## Variables clave

- `DATABASE_URL`: conexion a Postgres.
- `ALLOWED_ORIGINS`: origenes CORS permitidos.
- `EMAIL_NOTIFICATIONS_ENABLED`: `true` o `false`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`: servidor SMTP.
- `SMTP_USER`, `SMTP_PASS`: opcionales, pero deben ir juntos si se usan.
- `EMAIL_FROM`, `EMAIL_TO`: remitente/destino de correo.
- `WHATSAPP_NOTIFICATIONS_ENABLED`: `true` o `false`.
- `WABA_PHONE_NUMBER_ID`, `WABA_ACCESS_TOKEN`, `WABA_TO_NUMBER`: credenciales de WhatsApp Business API.
- `WABA_API_VERSION`: version Graph API para WhatsApp.

## Mailpit local

El `docker-compose` incluye `mailpit` para pruebas locales:

- SMTP: `localhost:1025`
- UI web: `http://localhost:8025`

Para usarlo:

- `EMAIL_NOTIFICATIONS_ENABLED=true`
- `SMTP_HOST=mailpit`
- `SMTP_PORT=1025`
- `SMTP_SECURE=false`
- `SMTP_USER=` (vacio)
- `SMTP_PASS=` (vacio)

## Nota operativa

En produccion, usar credenciales en secretos/variables seguras del proveedor. No subir `.env` real al repositorio.
