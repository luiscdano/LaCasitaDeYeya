import express from 'express';
import { config } from './config.js';
import { ensureSchema, insertReservation, pool } from './db.js';
import { sendReservationNotifications } from './notifiers.js';
import { validateReservationPayload } from './validators.js';

function normalizeText(value, maxLength = 255) {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ');
  return normalized.slice(0, maxLength);
}

function getClientIp(request) {
  const forwardedFor = normalizeText(request.get('x-forwarded-for') || '', 128);
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return normalizeText(request.socket?.remoteAddress || '', 128);
}

function getAllowedOrigin(requestOrigin) {
  if (!requestOrigin) return '';
  if (config.allowedOrigins.includes('*')) return '*';
  return config.allowedOrigins.includes(requestOrigin) ? requestOrigin : '';
}

function applyCorsHeaders(request, response) {
  const requestOrigin = request.get('origin') || '';
  const allowedOrigin = getAllowedOrigin(requestOrigin);
  if (allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Max-Age', '86400');
  response.setHeader('Vary', 'Origin');
}

function toClientNotificationResult(result) {
  return {
    sent: Boolean(result?.sent),
    reason: result?.reason || null,
  };
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

app.use((request, response, next) => {
  applyCorsHeaders(request, response);
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  next();
});

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    ok: true,
    service: 'reservations-api',
    runtime: 'docker',
  });
});

app.post('/api/reservations', async (request, response) => {
  const validation = validateReservationPayload(request.body || {});
  if (!validation.ok) {
    response.status(422).json({ ok: false, error: validation.error });
    return;
  }

  const reservation = validation.data;
  const metadata = {
    userAgent: normalizeText(request.get('user-agent') || '', 255),
    clientIp: getClientIp(request),
  };

  try {
    const created = await insertReservation(reservation, metadata);
    const notifications = await sendReservationNotifications(reservation, created.id);

    response.status(201).json({
      ok: true,
      reservation_id: created.id,
      created_at: created.created_at,
      notifications: {
        email: toClientNotificationResult(notifications.email),
        whatsapp: toClientNotificationResult(notifications.whatsapp),
      },
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: 'No se pudo registrar la reserva.',
      detail: error?.message || 'internal_error',
    });
  }
});

app.use((_request, response) => {
  response.status(404).json({ ok: false, error: 'Ruta no encontrada.' });
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && Object.prototype.hasOwnProperty.call(error, 'body')) {
    response.status(400).json({ ok: false, error: 'JSON invalido.' });
    return;
  }

  response.status(500).json({
    ok: false,
    error: 'Error interno.',
    detail: error?.message || 'internal_error',
  });
});

let server = null;

async function shutdown(signal) {
  console.log(`[reservations-api] shutdown signal: ${signal}`);
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  } catch (error) {
    console.error('[reservations-api] server close error:', error?.message || error);
  }

  try {
    await pool.end();
  } catch (error) {
    console.error('[reservations-api] pool close error:', error?.message || error);
  }

  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

async function startServer() {
  await ensureSchema();

  server = app.listen(config.port, () => {
    console.log(`[reservations-api] listening on :${config.port}`);
  });
}

startServer().catch((error) => {
  console.error('[reservations-api] startup failed:', error?.message || error);
  process.exit(1);
});
