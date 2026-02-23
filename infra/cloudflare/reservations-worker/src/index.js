const LOCATION_VALUES = new Set(['village', 'downtown', 'los-corales']);
const SOURCE_VALUES = new Set(['website', 'landing', 'admin', 'manual']);
const STATUS_VALUES = new Set(['pending', 'confirmed', 'cancelled']);

const LOCATION_LABELS = {
  village: 'Village',
  downtown: 'Downtown',
  'los-corales': 'Los Corales',
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
};

let schemaReadyPromise = null;

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
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Api-Key',
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

function formatDateLabel(isoDate) {
  if (!isValidDate(isoDate)) return isoDate;
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function locationLabel(location) {
  return LOCATION_LABELS[location] || location;
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function validatePublicReservationPayload(payload) {
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

function validateStatusUpdatePayload(payload) {
  const status = normalizeText(payload.status || '', 16).toLowerCase();
  const updatedBy = normalizeText(payload.updated_by || payload.updatedBy || 'operador', 80);
  const note = normalizeText(payload.note || payload.internal_note || '', 350);

  if (!STATUS_VALUES.has(status)) {
    return {
      ok: false,
      error: 'Estado invalido. Usa pending, confirmed o cancelled.',
      code: 'invalid_status',
    };
  }

  return {
    ok: true,
    value: {
      status,
      updatedBy: updatedBy || 'operador',
      note,
    },
  };
}

function getInternalToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  if (/^Bearer\s+/i.test(authHeader)) {
    return normalizeText(authHeader.replace(/^Bearer\s+/i, ''), 256);
  }
  return normalizeText(request.headers.get('X-Internal-Api-Key') || '', 256);
}

function getInternalAuthState(request, env) {
  const expected = normalizeText(env.INTERNAL_API_KEY || '', 256);
  if (!expected) return { ok: false, reason: 'not_configured' };

  const provided = getInternalToken(request);
  if (!provided || provided !== expected) return { ok: false, reason: 'invalid' };

  return { ok: true };
}

async function queryCount(env, sql, bindings) {
  const row = await env.DB.prepare(sql)
    .bind(...bindings)
    .first();
  return toInteger(row?.total, 0);
}

async function addColumnIfMissing(env, knownColumns, columnName, sql) {
  if (knownColumns.has(columnName)) return;
  try {
    await env.DB.prepare(sql).run();
  } catch (error) {
    const message = String(error?.message || '');
    if (!message.includes('duplicate column name')) {
      throw error;
    }
  }
  knownColumns.add(columnName);
}

async function ensureOperationalSchema(env) {
  if (schemaReadyPromise) return schemaReadyPromise;

  schemaReadyPromise = (async () => {
    if (!env.DB) throw new Error('db_binding_missing');

    const tableInfo = await env.DB.prepare('PRAGMA table_info(reservations)').all();
    const columns = new Set((tableInfo?.results || []).map((column) => column.name));

    await addColumnIfMissing(
      env,
      columns,
      'status',
      "ALTER TABLE reservations ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'",
    );
    await addColumnIfMissing(
      env,
      columns,
      'status_note',
      "ALTER TABLE reservations ADD COLUMN status_note TEXT NOT NULL DEFAULT ''",
    );
    await addColumnIfMissing(
      env,
      columns,
      'status_updated_at',
      "ALTER TABLE reservations ADD COLUMN status_updated_at TEXT",
    );
    await addColumnIfMissing(
      env,
      columns,
      'status_updated_by',
      "ALTER TABLE reservations ADD COLUMN status_updated_by TEXT NOT NULL DEFAULT ''",
    );

    await env.DB.prepare(
      `UPDATE reservations
       SET status = 'pending'
       WHERE status IS NULL OR TRIM(status) = ''`,
    ).run();

    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_reservations_status_date
       ON reservations (status, reservation_date, reservation_time)`,
    ).run();

    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_reservations_status_updated_at
       ON reservations (status_updated_at)`,
    ).run();
  })().catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });

  return schemaReadyPromise;
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
      client_ip,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      'pending',
    )
    .run();

  return result?.meta?.last_row_id ?? null;
}

function rowToReservation(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email,
    location: row.location,
    reservation_date: row.reservation_date,
    reservation_time: row.reservation_time,
    guests: row.guests,
    comments: row.comments || '',
    source: row.source || 'website',
    status: row.status || 'pending',
    status_note: row.status_note || '',
    status_updated_at: row.status_updated_at || null,
    status_updated_by: row.status_updated_by || '',
    created_at: row.created_at,
  };
}

async function getReservationById(env, reservationId) {
  const row = await env.DB.prepare(
    `SELECT
      id,
      full_name,
      phone,
      email,
      location,
      reservation_date,
      reservation_time,
      guests,
      comments,
      source,
      COALESCE(status, 'pending') AS status,
      COALESCE(status_note, '') AS status_note,
      status_updated_at,
      COALESCE(status_updated_by, '') AS status_updated_by,
      created_at
    FROM reservations
    WHERE id = ?`,
  )
    .bind(reservationId)
    .first();

  return rowToReservation(row);
}

function buildNotificationTemplates(reservation, status, note = '') {
  const location = locationLabel(reservation.location);
  const statusText = statusLabel(status);
  const dateLabel = formatDateLabel(reservation.reservation_date);
  const guestsLabel = reservation.guests === 1 ? '1 persona' : `${reservation.guests} personas`;
  const safeNote = normalizeText(note || '', 350);

  const baseDetails = [
    `Localidad: ${location}`,
    `Fecha: ${dateLabel}`,
    `Hora: ${reservation.reservation_time}`,
    `Personas: ${guestsLabel}`,
  ];

  const messageByStatus = {
    pending: 'Hemos recibido tu solicitud de reserva. En breve te confirmaremos disponibilidad.',
    confirmed: 'Tu reserva ha sido confirmada. Te esperamos en Los Corales.',
    cancelled: 'Tu reserva fue cancelada. Si deseas reagendar, estaremos encantados de ayudarte.',
  };

  const emailSubjectByStatus = {
    pending: `Reserva recibida - ${location}`,
    confirmed: `Reserva confirmada - ${location}`,
    cancelled: `Actualizacion de reserva - ${location}`,
  };

  const emailBody = [
    `Hola ${reservation.full_name},`,
    '',
    messageByStatus[status] || messageByStatus.pending,
    '',
    ...baseDetails,
    safeNote ? `Nota del restaurante: ${safeNote}` : '',
    '',
    `Estado actual: ${statusText}`,
    '',
    'Gracias por elegir Los Corales.',
  ]
    .filter(Boolean)
    .join('\n');

  const whatsappBody = [
    `Hola ${reservation.full_name},`,
    messageByStatus[status] || messageByStatus.pending,
    `Localidad: ${location}`,
    `Fecha: ${dateLabel} ${reservation.reservation_time}`,
    `Personas: ${guestsLabel}`,
    safeNote ? `Nota: ${safeNote}` : '',
    `Estado: ${statusText}`,
    'Equipo Los Corales',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    email: {
      subject: emailSubjectByStatus[status] || emailSubjectByStatus.pending,
      body: emailBody,
    },
    whatsapp: {
      body: whatsappBody,
    },
  };
}

function parseListFilters(url) {
  const status = normalizeText(url.searchParams.get('status') || '', 16).toLowerCase();
  const location = normalizeText(url.searchParams.get('location') || '', 32).toLowerCase();
  const dateFrom = normalizeText(url.searchParams.get('date_from') || '', 10);
  const dateTo = normalizeText(url.searchParams.get('date_to') || '', 10);
  const limit = Math.min(parsePositiveInteger(url.searchParams.get('limit'), 30), 100);
  const offset = Math.max(toInteger(url.searchParams.get('offset'), 0), 0);

  if (status && !STATUS_VALUES.has(status)) {
    return { ok: false, error: 'Filtro de estado invalido.' };
  }
  if (location && !LOCATION_VALUES.has(location)) {
    return { ok: false, error: 'Filtro de localidad invalido.' };
  }
  if (dateFrom && !isValidDate(dateFrom)) {
    return { ok: false, error: 'date_from invalida.' };
  }
  if (dateTo && !isValidDate(dateTo)) {
    return { ok: false, error: 'date_to invalida.' };
  }

  return {
    ok: true,
    value: {
      status,
      location,
      dateFrom,
      dateTo,
      limit,
      offset,
    },
  };
}

async function listInternalReservations(env, filters) {
  const clauses = [];
  const bindings = [];

  if (filters.status) {
    clauses.push('COALESCE(status, ?) = ?');
    bindings.push('pending', filters.status);
  }
  if (filters.location) {
    clauses.push('location = ?');
    bindings.push(filters.location);
  }
  if (filters.dateFrom) {
    clauses.push('reservation_date >= ?');
    bindings.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    clauses.push('reservation_date <= ?');
    bindings.push(filters.dateTo);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const total = await queryCount(
    env,
    `SELECT COUNT(1) AS total
     FROM reservations
     ${whereSql}`,
    bindings,
  );

  const listResult = await env.DB.prepare(
    `SELECT
      id,
      full_name,
      phone,
      email,
      location,
      reservation_date,
      reservation_time,
      guests,
      comments,
      source,
      COALESCE(status, 'pending') AS status,
      COALESCE(status_note, '') AS status_note,
      status_updated_at,
      COALESCE(status_updated_by, '') AS status_updated_by,
      created_at
    FROM reservations
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`,
  )
    .bind(...bindings, filters.limit, filters.offset)
    .all();

  const reservations = (listResult?.results || []).map(rowToReservation);
  return { reservations, total };
}

async function updateReservationStatus(env, reservationId, payload) {
  const validation = validateStatusUpdatePayload(payload || {});
  if (!validation.ok) {
    return {
      status: 422,
      body: { ok: false, code: validation.code, error: validation.error },
    };
  }

  const existing = await getReservationById(env, reservationId);
  if (!existing) {
    return {
      status: 404,
      body: { ok: false, code: 'reservation_not_found', error: 'Reserva no encontrada.' },
    };
  }

  const { status, updatedBy, note } = validation.value;
  await env.DB.prepare(
    `UPDATE reservations
     SET status = ?,
         status_note = ?,
         status_updated_at = datetime('now'),
         status_updated_by = ?
     WHERE id = ?`,
  )
    .bind(status, note, updatedBy, reservationId)
    .run();

  const updated = await getReservationById(env, reservationId);
  const templates = buildNotificationTemplates(updated, status, note);

  return {
    status: 200,
    body: {
      ok: true,
      reservation: updated,
      templates,
    },
  };
}

async function handleInternalRoutes(request, env, path, url) {
  const authState = getInternalAuthState(request, env);
  if (!authState.ok && authState.reason === 'not_configured') {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        code: 'internal_api_not_configured',
        error: 'API interna no configurada. Define INTERNAL_API_KEY como secreto en Cloudflare.',
      },
      503,
    );
  }
  if (!authState.ok) {
    return jsonResponse(
      request,
      env,
      { ok: false, code: 'unauthorized', error: 'Credenciales internas invalidas.' },
      401,
      { 'WWW-Authenticate': 'Bearer realm="internal-reservations"' },
    );
  }

  await ensureOperationalSchema(env);

  if (path === '/api/internal/reservations' && request.method === 'GET') {
    const parsedFilters = parseListFilters(url);
    if (!parsedFilters.ok) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: 'invalid_filters', error: parsedFilters.error },
        422,
      );
    }

    const { reservations, total } = await listInternalReservations(env, parsedFilters.value);
    return jsonResponse(
      request,
      env,
      {
        ok: true,
        total,
        limit: parsedFilters.value.limit,
        offset: parsedFilters.value.offset,
        reservations,
      },
      200,
    );
  }

  const detailMatch = path.match(/^\/api\/internal\/reservations\/(\d+)$/);
  if (detailMatch && request.method === 'GET') {
    const reservationId = toInteger(detailMatch[1], 0);
    if (reservationId <= 0) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: 'invalid_reservation_id', error: 'ID de reserva invalido.' },
        422,
      );
    }

    const reservation = await getReservationById(env, reservationId);
    if (!reservation) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: 'reservation_not_found', error: 'Reserva no encontrada.' },
        404,
      );
    }

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        reservation,
        templates: {
          pending: buildNotificationTemplates(reservation, 'pending'),
          confirmed: buildNotificationTemplates(reservation, 'confirmed'),
          cancelled: buildNotificationTemplates(reservation, 'cancelled'),
        },
      },
      200,
    );
  }

  const statusMatch = path.match(/^\/api\/internal\/reservations\/(\d+)\/status$/);
  if (statusMatch && (request.method === 'PATCH' || request.method === 'POST')) {
    const reservationId = toInteger(statusMatch[1], 0);
    if (reservationId <= 0) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: 'invalid_reservation_id', error: 'ID de reserva invalido.' },
        422,
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse(request, env, { ok: false, code: 'invalid_json', error: 'JSON invalido.' }, 400);
    }

    const updateResult = await updateReservationStatus(env, reservationId, payload || {});
    return jsonResponse(request, env, updateResult.body, updateResult.status);
  }

  return jsonResponse(
    request,
    env,
    { ok: false, code: 'not_found', error: 'Ruta interna no encontrada.' },
    404,
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
    }

    if (path.startsWith('/api/internal/')) {
      try {
        return await handleInternalRoutes(request, env, path, url);
      } catch (error) {
        return jsonResponse(
          request,
          env,
          {
            ok: false,
            code: 'internal_error',
            error: 'No se pudo procesar la operacion interna.',
            detail: error?.message || 'internal_error',
          },
          500,
        );
      }
    }

    if (path === '/api/health') {
      try {
        await ensureOperationalSchema(env);
        await env.DB.prepare('SELECT 1 AS ok').first();
        return jsonResponse(
          request,
          env,
          {
            ok: true,
            service: 'reservations-api',
            database: 'up',
            internal_api_configured: Boolean(normalizeText(env.INTERNAL_API_KEY || '', 10)),
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

    const validation = validatePublicReservationPayload(payload || {});
    if (!validation.ok) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: validation.code || 'validation_error', error: validation.error },
        422,
      );
    }

    try {
      await ensureOperationalSchema(env);
      const securityConfig = getSecurityConfig(env);
      const metadata = {
        userAgent: getUserAgent(request),
        clientIp: getClientIp(request),
      };

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
          status: 'pending',
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
