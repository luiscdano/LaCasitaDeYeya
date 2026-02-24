# Stack Roadmap (Corto, Mediano y Largo Plazo)

## Estado actual

- Ya existe un modulo base `React + Material UI` para panel interno:
  - fuente: `apps/admin-panel/`
  - build estatico actual: `reserva/panel-react/`

## Corto plazo (0-6 semanas)

Objetivo: estabilidad operativa con despliegue rapido y bajo costo.

- `Cloudflare`:
  - DNS + CDN + SSL + WAF.
  - Worker para `POST /api/reservations`.
  - D1 para guardar reservas.
  - Turnstile para reducir spam.
- Frontend:
  - Mantener HTML/CSS/JS actual.
  - Formulario de reservas ya preparado para enviar JSON a `/api/reservations`.
- Complementos recomendados:
  - Resend o SendGrid para notificaciones por correo.
  - Uptime monitor (UptimeRobot/Better Stack).

## Mediano plazo (1-3 meses)

Objetivo: acelerar desarrollo de nuevas funciones sin rehacer todo el sitio.

- `React`:
  - Crear un modulo separado para reservas y panel interno.
  - Mantener paginas informativas como estan mientras migran por fases.
- `Material UI`:
  - Usarlo en panel interno/admin (no obligatorio en todo el sitio publico).
  - Ventaja: componentes listos para tablas, filtros, estados y formularios complejos.
- `Docker`:
  - Estandarizar entorno local (frontend, API, DB, migraciones).
  - Facilitar onboarding y QA.
- Complementos recomendados:
  - Zod (validaciones compartidas frontend/backend).
  - Sentry (errores en produccion).

## Largo plazo (3-12 meses)

Objetivo: escalar sin friccion en trafico, equipo y funcionalidades.

- Plataforma:
  - Mantener Cloudflare en borde (cache, seguridad, routing).
  - Evolucionar D1 a Postgres administrado si el volumen lo exige.
- `Docker` en produccion:
  - Servicios API especializados (reservas, CRM, notificaciones, reportes).
  - CI/CD con tests, migraciones y despliegues controlados.
- Frontend:
  - Expandir React por dominios funcionales (reservas, lealtad, inventario liviano).
  - Mantener experiencia publica rapida y minimalista para conversion.

## Decision recomendada

- Si la prioridad es salir rapido: `Cloudflare Worker + D1` ahora.
- Si la prioridad es velocidad de producto en funciones nuevas: sumar `React` por modulos en la fase media.
- Si la prioridad es operacion con multiples servicios/equipos: `Docker` se vuelve obligatorio en mediano-largo plazo.
