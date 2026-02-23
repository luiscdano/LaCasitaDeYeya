const LOCATION_VALUES = new Set(['village', 'downtown', 'los-corales']);
const SOURCE_VALUES = new Set(['website', 'landing', 'admin', 'manual']);

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.slice(0, maxLength);
}

function parsePositiveInteger(raw, fallback) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function toInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidReservationDate(value) {
  if (!isValidDate(value)) return false;
  const selected = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(selected.getTime())) return false;

  const min = new Date(`${getTodayIsoDate()}T00:00:00Z`);
  const max = new Date(min.getTime());
  max.setUTCDate(max.getUTCDate() + 365);
  return selected >= min && selected <= max;
}

function parseAllowedOrigins(env) {
  const raw = String(env.ALLOWED_ORIGINS || '').trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function getSecurityConfig(env) {
  return {
    rateLimitWindowSeconds: parsePositiveInteger(env.RATE_LIMIT_WINDOW_SECONDS, 600),
    rateLimitMaxPerIp: parsePositiveInteger(env.RATE_LIMIT_MAX_PER_IP, 4),
    rateLimitMaxPerEmailDay: parsePositiveInteger(env.RATE_LIMIT_MAX_PER_EMAIL_DAY, 8),
    duplicateWindowSeconds: parsePositiveInteger(env.DUPLICATE_WINDOW_SECONDS, 900),
  };
}

function getClientIp(request) {
  return (
    normalizeText(request.headers.get('CF-Connecting-IP') || '', 64) ||
    normalizeText(request.headers.get('X-Forwarded-For') || '', 64).split(',')[0].trim()
  );
}

function getUserAgent(request) {
  return normalizeText(request.headers.get('User-Agent') || '', 255);
}

function getCorsHeaders(request, env) {
  const requestOrigin = request.headers.get('Origin');
  const allowedOrigins = parseAllowedOrigins(env);
  const allowAll = allowedOrigins.has('*');
  const allowOrigin = allowAll
    ? '*'
    : requestOrigin && allowedOrigins.has(requestOrigin)
      ? requestOrigin
      : '';

  return {
    ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(request, env, body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request, env),
      ...extraHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function validatePayload(payload) {
  const fullName = normalizeText(payload.full_name, 120);
  const phone = normalizeText(payload.phone, 40);
  const email = normalizeText(payload.email, 120).toLowerCase();
  const location = normalizeText(payload.location, 32).toLowerCase();
  const reservationDate = normalizeText(payload.reservation_date, 10);
  const reservationTime = normalizeText(payload.reservation_time, 5);
  const guests = toInteger(payload.guests, 0);
  const comments = normalizeText(payload.comments || '', 1000);
  const sourceRaw = normalizeText(payload.source || 'website', 32).toLowerCase();
  const source = SOURCE_VALUES.has(sourceRaw) ? sourceRaw : 'website';

  if (!fullName || fullName.length < 3) {
    return { ok: false, error: 'Nombre completo invalido.', code: 'invalid_full_name' };
  }
  if (!phone || !isValidPhone(phone)) {
    return { ok: false, error: 'Telefono invalido. Usa un numero valido.', code: 'invalid_phone' };
  }
  if (!email || !isValidEmail(email)) {
    return { ok: false, error: 'Correo electronico invalido.', code: 'invalid_email' };
  }
  if (!LOCATION_VALUES.has(location)) {
    return { ok: false, error: 'Localidad invalida.', code: 'invalid_location' };
  }
  if (!isValidReservationDate(reservationDate)) {
    return {
      ok: false,
      error: 'Fecha invalida. Debe estar entre hoy y los proximos 12 meses.',
      code: 'invalid_reservation_date',
    };
  }
  if (!isValidTime(reservationTime)) {
    return { ok: false, error: 'Hora invalida.', code: 'invalid_reservation_time' };
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 30) {
    return { ok: false, error: 'Cantidad de personas invalida.', code: 'invalid_guests' };
  }

  return {
    ok: true,
    value: {
      fullName,
      phone,
      email,
      location,
      reservationDate,
      reservationTime,
      guests,
      comments,
      source,
    },
  };
}

async function queryCount(env, sql, bindings) {
  const row = await env.DB.prepare(sql)
    .bind(...bindings)
    .first();
  return toInteger(row?.total, 0);
}

async function checkAntiSpam(env, reservation, metadata, securityConfig) {
  const { clientIp } = metadata;

  if (clientIp) {
    const ipCount = await queryCount(
      env,
      `SELECT COUNT(1) AS total
       FROM reservations
       WHERE client_ip = ?
         AND created_at >= datetime('now', ?)`,
      [clientIp, `-${securityConfig.rateLimitWindowSeconds} seconds`],
    );

    if (ipCount >= securityConfig.rateLimitMaxPerIp) {
      return {
        status: 429,
        body: {
          ok: false,
          code: 'rate_limited_ip',
          error: 'Has enviado varias solicitudes en poco tiempo. Intenta nuevamente en unos minutos.',
          retry_after_seconds: securityConfig.rateLimitWindowSeconds,
        },
        headers: {
          'Retry-After': String(securityConfig.rateLimitWindowSeconds),
        },
      };
    }
  }

  const emailCount = await queryCount(
    env,
    `SELECT COUNT(1) AS total
     FROM reservations
     WHERE email = ?
       AND created_at >= datetime('now', '-1 day')`,
    [reservation.email],
  );

  if (emailCount >= securityConfig.rateLimitMaxPerEmailDay) {
    return {
      status: 429,
      body: {
        ok: false,
        code: 'rate_limited_email',
        error: 'Este correo ya genero varias solicitudes hoy. Intenta de nuevo mas tarde.',
        retry_after_seconds: 3600,
      },
      headers: {
        'Retry-After': '3600',
      },
    };
  }

  const duplicateCount = await queryCount(
    env,
    `SELECT COUNT(1) AS total
     FROM reservations
     WHERE email = ?
       AND location = ?
       AND reservation_date = ?
       AND reservation_time = ?
       AND created_at >= datetime('now', ?)`,
    [
      reservation.email,
      reservation.location,
      reservation.reservationDate,
      reservation.reservationTime,
      `-${securityConfig.duplicateWindowSeconds} seconds`,
    ],
  );

  if (duplicateCount > 0) {
    return {
      status: 409,
      body: {
        ok: false,
        code: 'duplicate_reservation',
        error: 'Ya recibimos una solicitud similar recientemente. Si necesitas cambios, intenta en unos minutos.',
      },
      headers: {},
    };
  }

  return null;
}

async function insertReservation(env, reservation, metadata) {
  if (!env.DB) {
    throw new Error('D1 no configurado. Verifica el binding DB en wrangler.toml.');
  }

  const result = await env.DB.prepare(
    `INSERT INTO reservations (
      full_name,
      phone,
      email,
      location,
      reservation_date,
      reservation_time,
      guests,
      comments,
      source,
      user_agent,
      client_ip
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      reservation.fullName,
      reservation.phone,
      reservation.email,
      reservation.location,
      reservation.reservationDate,
      reservation.reservationTime,
      reservation.guests,
      reservation.comments,
      reservation.source,
      metadata.userAgent,
      metadata.clientIp,
    )
    .run();

  return result?.meta?.last_row_id ?? null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
    }

    if (path === '/api/health') {
      try {
        if (!env.DB) throw new Error('db_binding_missing');
        await env.DB.prepare('SELECT 1 AS ok').first();
        return jsonResponse(
          request,
          env,
          {
            ok: true,
            service: 'reservations-api',
            database: 'up',
            timestamp: new Date().toISOString(),
          },
          200,
        );
      } catch (error) {
        return jsonResponse(
          request,
          env,
          {
            ok: false,
            code: 'db_unavailable',
            error: 'Servicio de reservas temporalmente no disponible.',
          },
          503,
        );
      }
    }

    if (path !== '/api/reservations') {
      return jsonResponse(request, env, { ok: false, code: 'not_found', error: 'Ruta no encontrada.' }, 404);
    }

    if (request.method !== 'POST') {
      return jsonResponse(
        request,
        env,
        { ok: false, code: 'method_not_allowed', error: 'Metodo no permitido.' },
        405,
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse(request, env, { ok: false, code: 'invalid_json', error: 'JSON invalido.' }, 400);
    }

    const honeypot = normalizeText(payload?.empresa || payload?.website || payload?.company || '', 80);
    if (honeypot) {
      return jsonResponse(request, env, { ok: true, accepted: true }, 202);
    }

    const validation = validatePayload(payload || {});
    if (!validation.ok) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: validation.code || 'validation_error', error: validation.error },
        422,
      );
    }

    const securityConfig = getSecurityConfig(env);
    const metadata = {
      userAgent: getUserAgent(request),
      clientIp: getClientIp(request),
    };

    try {
      const antiSpamDecision = await checkAntiSpam(env, validation.value, metadata, securityConfig);
      if (antiSpamDecision) {
        return jsonResponse(
          request,
          env,
          antiSpamDecision.body,
          antiSpamDecision.status,
          antiSpamDecision.headers,
        );
      }

      const reservationId = await insertReservation(env, validation.value, metadata);
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          reservation_id: reservationId,
          message: 'Solicitud enviada. Te contactaremos para confirmar disponibilidad.',
        },
        201,
      );
    } catch (error) {
      return jsonResponse(
        request,
        env,
        {
          ok: false,
          code: 'internal_error',
          error: 'No se pudo registrar la reserva.',
          detail: error?.message || 'internal_error',
        },
        500,
      );
    }
  },
};
