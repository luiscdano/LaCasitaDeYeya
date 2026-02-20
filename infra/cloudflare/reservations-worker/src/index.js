const LOCATION_VALUES = new Set(['village', 'downtown', 'los-corales']);

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(value);
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request, env),
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
  const guests = Number.parseInt(String(payload.guests ?? ''), 10);
  const comments = normalizeText(payload.comments || '', 1000);
  const source = normalizeText(payload.source || 'website', 32);

  if (!fullName) return { ok: false, error: 'Nombre completo es obligatorio.' };
  if (!phone) return { ok: false, error: 'Telefono es obligatorio.' };
  if (!email || !isValidEmail(email)) return { ok: false, error: 'Correo electronico invalido.' };
  if (!LOCATION_VALUES.has(location)) return { ok: false, error: 'Localidad invalida.' };
  if (!isValidDate(reservationDate)) return { ok: false, error: 'Fecha invalida.' };
  if (!isValidTime(reservationTime)) return { ok: false, error: 'Hora invalida.' };
  if (!Number.isInteger(guests) || guests < 1 || guests > 30) {
    return { ok: false, error: 'Cantidad de personas invalida.' };
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

async function insertReservation(env, reservation, request) {
  if (!env.DB) {
    throw new Error('D1 no configurado. Verifica el binding DB en wrangler.toml.');
  }

  const userAgent = normalizeText(request.headers.get('User-Agent') || '', 255);
  const clientIp =
    normalizeText(request.headers.get('CF-Connecting-IP') || '', 64) ||
    normalizeText(request.headers.get('X-Forwarded-For') || '', 64);

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
      userAgent,
      clientIp,
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
      return jsonResponse(request, env, { ok: true, service: 'reservations-api' }, 200);
    }

    if (path !== '/api/reservations') {
      return jsonResponse(request, env, { ok: false, error: 'Ruta no encontrada.' }, 404);
    }

    if (request.method !== 'POST') {
      return jsonResponse(request, env, { ok: false, error: 'Metodo no permitido.' }, 405);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse(request, env, { ok: false, error: 'JSON invalido.' }, 400);
    }

    const validation = validatePayload(payload || {});
    if (!validation.ok) {
      return jsonResponse(request, env, { ok: false, error: validation.error }, 422);
    }

    try {
      const reservationId = await insertReservation(env, validation.value, request);
      return jsonResponse(request, env, { ok: true, reservation_id: reservationId }, 201);
    } catch (error) {
      return jsonResponse(
        request,
        env,
        {
          ok: false,
          error: 'No se pudo registrar la reserva.',
          detail: error?.message || 'internal_error',
        },
        500,
      );
    }
  },
};
