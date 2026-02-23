const LOCATION_VALUES = new Set(['village', 'downtown', 'los-corales']);
const SOURCE_VALUES = new Set(['website', 'landing', 'admin', 'manual']);
const STATUS_VALUES = new Set(['pending', 'confirmed', 'cancelled']);
const NOTIFICATION_CHANNEL_VALUES = new Set(['email', 'whatsapp']);
const NOTIFICATION_STATUS_VALUES = new Set(['queued', 'sent', 'failed']);
const EMAIL_DELIVERY_MODE_VALUES = new Set(['mock', 'disabled', 'resend']);
const WHATSAPP_DELIVERY_MODE_VALUES = new Set(['mock', 'disabled', 'meta']);

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

const DEFAULT_NOTIFICATION_CHANNELS = ['email', 'whatsapp'];

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

function parseBoolean(raw, fallback = false) {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'boolean') return raw;
  const normalized = String(raw).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on', 'si', 's'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', 'n'].includes(normalized)) return false;
  return fallback;
}

function normalizeMode(raw, allowedModes, fallback) {
  const normalized = normalizeText(raw || '', 24).toLowerCase();
  if (!normalized || !allowedModes.has(normalized)) return fallback;
  return normalized;
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

function getNotificationConfig(env) {
  return {
    maxAttempts: Math.min(parsePositiveInteger(env.NOTIFICATION_MAX_ATTEMPTS, 3), 10),
    defaultDispatchLimit: Math.min(parsePositiveInteger(env.NOTIFICATION_DISPATCH_BATCH_LIMIT, 10), 50),
    autoDispatchOnCreate: parseBoolean(env.NOTIFICATIONS_AUTO_DISPATCH_ON_CREATE, false),
    autoDispatchOnStatusChange: parseBoolean(env.NOTIFICATIONS_AUTO_DISPATCH_ON_STATUS_CHANGE, false),
    emailMode: normalizeMode(env.EMAIL_DELIVERY_MODE, EMAIL_DELIVERY_MODE_VALUES, 'mock'),
    whatsappMode: normalizeMode(env.WHATSAPP_DELIVERY_MODE, WHATSAPP_DELIVERY_MODE_VALUES, 'mock'),
    emailFrom: normalizeText(env.EMAIL_FROM || '', 180),
    emailReplyTo: normalizeText(env.EMAIL_REPLY_TO || '', 180),
    resendApiKey: normalizeText(env.RESEND_API_KEY || '', 320),
    whatsappApiVersion: normalizeText(env.WABA_API_VERSION || 'v21.0', 20) || 'v21.0',
    whatsappPhoneNumberId: normalizeText(env.WABA_PHONE_NUMBER_ID || '', 64),
    whatsappAccessToken: normalizeText(env.WABA_ACCESS_TOKEN || '', 400),
    whatsappFallbackTo: normalizeText(env.WABA_TO_NUMBER || '', 32),
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

function channelMode(channel, notificationConfig) {
  if (channel === 'email') return notificationConfig.emailMode;
  if (channel === 'whatsapp') return notificationConfig.whatsappMode;
  return 'disabled';
}

function channelProvider(channel, notificationConfig) {
  const mode = channelMode(channel, notificationConfig);
  if (channel === 'email') {
    if (mode === 'resend') return 'resend';
    if (mode === 'mock') return 'mock';
    return 'disabled';
  }
  if (channel === 'whatsapp') {
    if (mode === 'meta') return 'meta';
    if (mode === 'mock') return 'mock';
    return 'disabled';
  }
  return 'unknown';
}

function parseChannelList(rawChannels, fallback = DEFAULT_NOTIFICATION_CHANNELS) {
  let values = [];

  if (Array.isArray(rawChannels)) {
    values = rawChannels;
  } else if (typeof rawChannels === 'string') {
    values = rawChannels.split(',');
  }

  if (values.length === 0) {
    return { ok: true, value: [...fallback] };
  }

  const normalized = [];
  for (const item of values) {
    const channel = normalizeText(item, 20).toLowerCase();
    if (!channel) continue;
    if (!NOTIFICATION_CHANNEL_VALUES.has(channel)) {
      return {
        ok: false,
        error: 'Canal de notificacion invalido. Usa email y/o whatsapp.',
        code: 'invalid_notification_channel',
      };
    }
    if (!normalized.includes(channel)) normalized.push(channel);
  }

  if (normalized.length === 0) {
    return {
      ok: false,
      error: 'Debes enviar al menos un canal valido de notificacion.',
      code: 'empty_notification_channels',
    };
  }

  return { ok: true, value: normalized };
}

function safeParseJsonObject(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function stringFromJson(value, fallback = '{}') {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return fallback;
  }
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

  const parsedChannels = parseChannelList(payload.channels, DEFAULT_NOTIFICATION_CHANNELS);
  if (!parsedChannels.ok) return parsedChannels;

  return {
    ok: true,
    value: {
      status,
      updatedBy: updatedBy || 'operador',
      note,
      channels: parsedChannels.value,
      enqueueNotifications: parseBoolean(payload.enqueue_notifications, true),
      dispatchNow: parseBoolean(payload.dispatch_now, false),
    },
  };
}

function validateManualNotifyPayload(payload, reservation) {
  const rawStatus = normalizeText(payload.status || reservation.status || 'pending', 16).toLowerCase();
  const note = normalizeText(payload.note || reservation.status_note || '', 350);
  const trigger = normalizeText(payload.trigger || 'manual_resend', 40) || 'manual_resend';
  const updatedBy = normalizeText(payload.updated_by || payload.updatedBy || 'operador', 80) || 'operador';

  if (!STATUS_VALUES.has(rawStatus)) {
    return {
      ok: false,
      error: 'Estado invalido para notificacion.',
      code: 'invalid_status',
    };
  }

  const parsedChannels = parseChannelList(payload.channels, DEFAULT_NOTIFICATION_CHANNELS);
  if (!parsedChannels.ok) return parsedChannels;

  return {
    ok: true,
    value: {
      status: rawStatus,
      note,
      trigger,
      updatedBy,
      channels: parsedChannels.value,
      dispatchNow: parseBoolean(payload.dispatch_now, false),
    },
  };
}

function parseNotificationListFilters(url) {
  const status = normalizeText(url.searchParams.get('status') || '', 16).toLowerCase();
  const channel = normalizeText(url.searchParams.get('channel') || '', 20).toLowerCase();
  const reservationId = toInteger(url.searchParams.get('reservation_id'), 0);
  const limit = Math.min(parsePositiveInteger(url.searchParams.get('limit'), 30), 100);
  const offset = Math.max(toInteger(url.searchParams.get('offset'), 0), 0);

  if (status && !NOTIFICATION_STATUS_VALUES.has(status)) {
    return { ok: false, error: 'Filtro status invalido para notificaciones.' };
  }
  if (channel && !NOTIFICATION_CHANNEL_VALUES.has(channel)) {
    return { ok: false, error: 'Filtro channel invalido para notificaciones.' };
  }
  if (reservationId < 0) {
    return { ok: false, error: 'reservation_id invalido.' };
  }

  return {
    ok: true,
    value: {
      status,
      channel,
      reservationId,
      limit,
      offset,
    },
  };
}

function parseNotificationDispatchPayload(payload, notificationConfig) {
  const limit = Math.min(
    parsePositiveInteger(payload?.limit, notificationConfig.defaultDispatchLimit),
    50,
  );
  const reservationId = toInteger(payload?.reservation_id, 0);
  const channel = normalizeText(payload?.channel || '', 20).toLowerCase();
  const force = parseBoolean(payload?.force, false);

  let ids = [];
  if (Array.isArray(payload?.ids)) {
    ids = payload.ids
      .map((id) => toInteger(id, 0))
      .filter((id) => id > 0)
      .slice(0, 100);
  }

  if (channel && !NOTIFICATION_CHANNEL_VALUES.has(channel)) {
    return {
      ok: false,
      error: 'Canal invalido para despacho.',
      code: 'invalid_notification_channel',
    };
  }

  if (reservationId < 0) {
    return {
      ok: false,
      error: 'reservation_id invalido.',
      code: 'invalid_reservation_id',
    };
  }

  return {
    ok: true,
    value: {
      limit,
      reservationId,
      channel,
      force,
      ids,
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

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS reservation_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER NOT NULL,
        channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
        recipient TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
        provider TEXT NOT NULL DEFAULT 'mock',
        provider_message_id TEXT NOT NULL DEFAULT '',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        next_attempt_at TEXT NOT NULL DEFAULT (datetime('now')),
        sent_at TEXT,
        last_error TEXT NOT NULL DEFAULT '',
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
      )`,
    ).run();

    const outboxInfo = await env.DB.prepare('PRAGMA table_info(reservation_notifications)').all();
    const outboxColumns = new Set((outboxInfo?.results || []).map((column) => column.name));

    await addColumnIfMissing(
      env,
      outboxColumns,
      'provider',
      "ALTER TABLE reservation_notifications ADD COLUMN provider TEXT NOT NULL DEFAULT 'mock'",
    );
    await addColumnIfMissing(
      env,
      outboxColumns,
      'provider_message_id',
      "ALTER TABLE reservation_notifications ADD COLUMN provider_message_id TEXT NOT NULL DEFAULT ''",
    );
    await addColumnIfMissing(
      env,
      outboxColumns,
      'attempts',
      "ALTER TABLE reservation_notifications ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0",
    );
    await addColumnIfMissing(
      env,
      outboxColumns,
      'max_attempts',
      "ALTER TABLE reservation_notifications ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 3",
    );
    await addColumnIfMissing(
      env,
      outboxColumns,
      'next_attempt_at',
      'ALTER TABLE reservation_notifications ADD COLUMN next_attempt_at TEXT',
    );
    await addColumnIfMissing(
      env,
      outboxColumns,
      'sent_at',
      "ALTER TABLE reservation_notifications ADD COLUMN sent_at TEXT",
    );
    await addColumnIfMissing(
      env,
      outboxColumns,
      'last_error',
      "ALTER TABLE reservation_notifications ADD COLUMN last_error TEXT NOT NULL DEFAULT ''",
    );
    await addColumnIfMissing(
      env,
      outboxColumns,
      'metadata_json',
      "ALTER TABLE reservation_notifications ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'",
    );
    await addColumnIfMissing(
      env,
      outboxColumns,
      'updated_at',
      'ALTER TABLE reservation_notifications ADD COLUMN updated_at TEXT',
    );

    await env.DB.prepare(
      `UPDATE reservation_notifications
       SET status = 'queued'
       WHERE status IS NULL OR TRIM(status) = ''`,
    ).run();

    await env.DB.prepare(
      `UPDATE reservation_notifications
       SET next_attempt_at = COALESCE(next_attempt_at, created_at, datetime('now'))
       WHERE next_attempt_at IS NULL`,
    ).run();

    await env.DB.prepare(
      `UPDATE reservation_notifications
       SET updated_at = COALESCE(updated_at, created_at, datetime('now'))
       WHERE updated_at IS NULL`,
    ).run();

    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_reservation_notifications_status_next_attempt
       ON reservation_notifications (status, next_attempt_at)`,
    ).run();

    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_reservation_notifications_reservation_created
       ON reservation_notifications (reservation_id, created_at)`,
    ).run();

    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_reservation_notifications_channel_status
       ON reservation_notifications (channel, status, created_at)`,
    ).run();

    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_reservation_notifications_created_at
       ON reservation_notifications (created_at)`,
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

function rowToNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    reservation_id: row.reservation_id,
    channel: row.channel,
    recipient: row.recipient,
    subject: row.subject || '',
    body: row.body || '',
    status: row.status,
    provider: row.provider || 'mock',
    provider_message_id: row.provider_message_id || '',
    attempts: toInteger(row.attempts, 0),
    max_attempts: toInteger(row.max_attempts, 3),
    next_attempt_at: row.next_attempt_at || null,
    sent_at: row.sent_at || null,
    last_error: row.last_error || '',
    metadata: safeParseJsonObject(row.metadata_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
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

async function getNotificationById(env, notificationId) {
  const row = await env.DB.prepare(
    `SELECT
      id,
      reservation_id,
      channel,
      recipient,
      subject,
      body,
      status,
      provider,
      provider_message_id,
      attempts,
      max_attempts,
      next_attempt_at,
      sent_at,
      last_error,
      metadata_json,
      created_at,
      updated_at
    FROM reservation_notifications
    WHERE id = ?`,
  )
    .bind(notificationId)
    .first();

  return rowToNotification(row);
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

function parseReservationListFilters(url) {
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

async function listInternalNotifications(env, filters) {
  const clauses = [];
  const bindings = [];

  if (filters.status) {
    clauses.push('status = ?');
    bindings.push(filters.status);
  }
  if (filters.channel) {
    clauses.push('channel = ?');
    bindings.push(filters.channel);
  }
  if (filters.reservationId > 0) {
    clauses.push('reservation_id = ?');
    bindings.push(filters.reservationId);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const total = await queryCount(
    env,
    `SELECT COUNT(1) AS total
     FROM reservation_notifications
     ${whereSql}`,
    bindings,
  );

  const listResult = await env.DB.prepare(
    `SELECT
      id,
      reservation_id,
      channel,
      recipient,
      subject,
      body,
      status,
      provider,
      provider_message_id,
      attempts,
      max_attempts,
      next_attempt_at,
      sent_at,
      last_error,
      metadata_json,
      created_at,
      updated_at
    FROM reservation_notifications
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`,
  )
    .bind(...bindings, filters.limit, filters.offset)
    .all();

  return {
    total,
    notifications: (listResult?.results || []).map(rowToNotification),
  };
}

async function enqueueReservationNotifications(env, reservation, notificationConfig, options = {}) {
  const status = STATUS_VALUES.has(options.status) ? options.status : reservation.status || 'pending';
  const note = normalizeText(options.note || '', 350);
  const trigger = normalizeText(options.trigger || 'manual', 40) || 'manual';
  const updatedBy = normalizeText(options.updatedBy || '', 80);
  const maxAttempts = Math.max(1, Math.min(toInteger(options.maxAttempts, notificationConfig.maxAttempts), 10));

  const parsedChannels = parseChannelList(options.channels, DEFAULT_NOTIFICATION_CHANNELS);
  if (!parsedChannels.ok) {
    return {
      ok: false,
      code: parsedChannels.code,
      error: parsedChannels.error,
      queued: 0,
      notifications: [],
    };
  }

  const channels = parsedChannels.value;
  const templates = buildNotificationTemplates(reservation, status, note);
  const queuedRows = [];

  for (const channel of channels) {
    const recipient = channel === 'email' ? reservation.email : reservation.phone;
    if (!recipient) continue;

    const subject = channel === 'email' ? templates.email.subject : '';
    const body = channel === 'email' ? templates.email.body : templates.whatsapp.body;

    const metadata = {
      trigger,
      reservation_status: status,
      updated_by: updatedBy || '',
      note,
    };

    const result = await env.DB.prepare(
      `INSERT INTO reservation_notifications (
        reservation_id,
        channel,
        recipient,
        subject,
        body,
        status,
        provider,
        attempts,
        max_attempts,
        next_attempt_at,
        metadata_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 'queued', ?, 0, ?, datetime('now'), ?, datetime('now'), datetime('now'))`,
    )
      .bind(
        reservation.id,
        channel,
        recipient,
        subject,
        body,
        channelProvider(channel, notificationConfig),
        maxAttempts,
        stringFromJson(metadata),
      )
      .run();

    queuedRows.push({
      id: result?.meta?.last_row_id ?? null,
      channel,
      recipient,
      status: 'queued',
    });
  }

  return {
    ok: true,
    queued: queuedRows.length,
    notifications: queuedRows,
  };
}

async function sendEmailNotification(notification, notificationConfig) {
  const mode = notificationConfig.emailMode;

  if (mode === 'disabled') {
    return {
      ok: false,
      retryable: false,
      error: 'email_delivery_disabled',
      provider: 'disabled',
      messageId: '',
    };
  }

  if (mode === 'mock') {
    return {
      ok: true,
      retryable: false,
      provider: 'mock',
      messageId: `mock-email-${notification.id}-${Date.now()}`,
    };
  }

  if (mode === 'resend') {
    if (!notificationConfig.resendApiKey || !notificationConfig.emailFrom) {
      return {
        ok: false,
        retryable: false,
        error: 'resend_not_configured',
        provider: 'resend',
        messageId: '',
      };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notificationConfig.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: notificationConfig.emailFrom,
        to: [notification.recipient],
        subject: notification.subject || 'Notificacion de reserva',
        text: notification.body,
        ...(notificationConfig.emailReplyTo ? { reply_to: notificationConfig.emailReplyTo } : {}),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = normalizeText(
        payload?.message || payload?.error?.message || `Resend API error (${response.status})`,
        300,
      );
      const retryable = response.status === 429 || response.status >= 500;
      return {
        ok: false,
        retryable,
        error: detail || 'resend_send_failed',
        provider: 'resend',
        messageId: '',
      };
    }

    return {
      ok: true,
      retryable: false,
      provider: 'resend',
      messageId: normalizeText(payload?.id || '', 120),
    };
  }

  return {
    ok: false,
    retryable: false,
    error: 'unsupported_email_mode',
    provider: 'unknown',
    messageId: '',
  };
}

async function sendWhatsAppNotification(notification, notificationConfig) {
  const mode = notificationConfig.whatsappMode;

  if (mode === 'disabled') {
    return {
      ok: false,
      retryable: false,
      error: 'whatsapp_delivery_disabled',
      provider: 'disabled',
      messageId: '',
    };
  }

  if (mode === 'mock') {
    return {
      ok: true,
      retryable: false,
      provider: 'mock',
      messageId: `mock-whatsapp-${notification.id}-${Date.now()}`,
    };
  }

  if (mode === 'meta') {
    const to = notification.recipient || notificationConfig.whatsappFallbackTo;
    if (!notificationConfig.whatsappAccessToken || !notificationConfig.whatsappPhoneNumberId || !to) {
      return {
        ok: false,
        retryable: false,
        error: 'waba_not_configured',
        provider: 'meta',
        messageId: '',
      };
    }

    const endpoint = `https://graph.facebook.com/${notificationConfig.whatsappApiVersion}/${notificationConfig.whatsappPhoneNumberId}/messages`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notificationConfig.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: notification.body,
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = normalizeText(
        payload?.error?.message || `WhatsApp API error (${response.status})`,
        300,
      );
      const retryable = response.status === 429 || response.status >= 500;
      return {
        ok: false,
        retryable,
        error: detail || 'waba_send_failed',
        provider: 'meta',
        messageId: '',
      };
    }

    const messageId = normalizeText(payload?.messages?.[0]?.id || '', 180);
    return {
      ok: true,
      retryable: false,
      provider: 'meta',
      messageId,
    };
  }

  return {
    ok: false,
    retryable: false,
    error: 'unsupported_whatsapp_mode',
    provider: 'unknown',
    messageId: '',
  };
}

function nextRetryDelaySeconds(nextAttemptNumber) {
  const power = Math.max(0, nextAttemptNumber - 1);
  return Math.min(60 * 2 ** power, 3600);
}

async function markNotificationSent(env, notificationId, provider, messageId) {
  await env.DB.prepare(
    `UPDATE reservation_notifications
     SET status = 'sent',
         provider = ?,
         provider_message_id = ?,
         attempts = attempts + 1,
         sent_at = datetime('now'),
         last_error = '',
         updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(provider, messageId || '', notificationId)
    .run();
}

async function markNotificationFailed(env, notification, provider, errorMessage, retryable) {
  const nextAttemptNumber = toInteger(notification.attempts, 0) + 1;
  const maxAttempts = Math.max(1, toInteger(notification.max_attempts, 3));
  const safeError = normalizeText(errorMessage || 'notification_failed', 300) || 'notification_failed';

  if (retryable && nextAttemptNumber < maxAttempts) {
    const retryDelay = nextRetryDelaySeconds(nextAttemptNumber);
    await env.DB.prepare(
      `UPDATE reservation_notifications
       SET status = 'queued',
           provider = ?,
           attempts = ?,
           last_error = ?,
           next_attempt_at = datetime('now', ?),
           updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(provider, nextAttemptNumber, safeError, `+${retryDelay} seconds`, notification.id)
      .run();

    return { finalStatus: 'requeued', retryInSeconds: retryDelay, attempts: nextAttemptNumber };
  }

  await env.DB.prepare(
    `UPDATE reservation_notifications
     SET status = 'failed',
         provider = ?,
         attempts = ?,
         last_error = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(provider, nextAttemptNumber, safeError, notification.id)
    .run();

  return { finalStatus: 'failed', retryInSeconds: 0, attempts: nextAttemptNumber };
}

async function dispatchSingleNotification(env, notification, notificationConfig) {
  let sendResult;

  if (notification.channel === 'email') {
    sendResult = await sendEmailNotification(notification, notificationConfig);
  } else if (notification.channel === 'whatsapp') {
    sendResult = await sendWhatsAppNotification(notification, notificationConfig);
  } else {
    sendResult = {
      ok: false,
      retryable: false,
      error: 'unsupported_notification_channel',
      provider: 'unknown',
      messageId: '',
    };
  }

  if (sendResult.ok) {
    await markNotificationSent(env, notification.id, sendResult.provider, sendResult.messageId || '');
    return {
      id: notification.id,
      channel: notification.channel,
      status: 'sent',
      provider: sendResult.provider,
      provider_message_id: sendResult.messageId || '',
    };
  }

  const failResult = await markNotificationFailed(
    env,
    notification,
    sendResult.provider || channelProvider(notification.channel, notificationConfig),
    sendResult.error || 'dispatch_failed',
    Boolean(sendResult.retryable),
  );

  return {
    id: notification.id,
    channel: notification.channel,
    status: failResult.finalStatus,
    provider: sendResult.provider || channelProvider(notification.channel, notificationConfig),
    error: normalizeText(sendResult.error || 'dispatch_failed', 300),
    attempts: failResult.attempts,
    retry_in_seconds: failResult.retryInSeconds,
  };
}

async function selectQueuedNotificationsForDispatch(env, dispatchOptions) {
  const clauses = ['status = ?'];
  const bindings = ['queued'];

  if (!dispatchOptions.force) {
    clauses.push("next_attempt_at <= datetime('now')");
  }

  if (dispatchOptions.channel) {
    clauses.push('channel = ?');
    bindings.push(dispatchOptions.channel);
  }

  if (dispatchOptions.reservationId > 0) {
    clauses.push('reservation_id = ?');
    bindings.push(dispatchOptions.reservationId);
  }

  if (dispatchOptions.ids.length > 0) {
    const placeholders = dispatchOptions.ids.map(() => '?').join(', ');
    clauses.push(`id IN (${placeholders})`);
    bindings.push(...dispatchOptions.ids);
  }

  const whereSql = `WHERE ${clauses.join(' AND ')}`;
  const query = `SELECT
      id,
      reservation_id,
      channel,
      recipient,
      subject,
      body,
      status,
      provider,
      provider_message_id,
      attempts,
      max_attempts,
      next_attempt_at,
      sent_at,
      last_error,
      metadata_json,
      created_at,
      updated_at
    FROM reservation_notifications
    ${whereSql}
    ORDER BY created_at ASC
    LIMIT ?`;

  const rows = await env.DB.prepare(query)
    .bind(...bindings, dispatchOptions.limit)
    .all();

  return (rows?.results || []).map(rowToNotification);
}

async function dispatchQueuedNotifications(env, notificationConfig, dispatchOptions) {
  const notifications = await selectQueuedNotificationsForDispatch(env, dispatchOptions);

  const details = [];
  const summary = {
    selected: notifications.length,
    sent: 0,
    failed: 0,
    requeued: 0,
  };

  for (const notification of notifications) {
    const result = await dispatchSingleNotification(env, notification, notificationConfig);
    details.push(result);
    if (result.status === 'sent') summary.sent += 1;
    else if (result.status === 'requeued') summary.requeued += 1;
    else summary.failed += 1;
  }

  return {
    summary,
    notifications: details,
  };
}

async function retryNotification(env, notificationId) {
  const existing = await getNotificationById(env, notificationId);
  if (!existing) {
    return {
      status: 404,
      body: {
        ok: false,
        code: 'notification_not_found',
        error: 'Notificacion no encontrada.',
      },
    };
  }

  await env.DB.prepare(
    `UPDATE reservation_notifications
     SET status = 'queued',
         attempts = 0,
         last_error = '',
         next_attempt_at = datetime('now'),
         updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(notificationId)
    .run();

  const updated = await getNotificationById(env, notificationId);
  return {
    status: 200,
    body: {
      ok: true,
      notification: updated,
    },
  };
}

async function updateReservationStatus(env, notificationConfig, reservationId, payload) {
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

  const { status, updatedBy, note, enqueueNotifications, dispatchNow, channels } = validation.value;
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

  let queueResult = {
    ok: true,
    queued: 0,
    notifications: [],
  };

  let dispatchResult = null;

  if (enqueueNotifications) {
    queueResult = await enqueueReservationNotifications(env, updated, notificationConfig, {
      status,
      note,
      trigger: 'status_updated',
      updatedBy,
      channels,
    });

    if (queueResult.ok && queueResult.queued > 0 && (dispatchNow || notificationConfig.autoDispatchOnStatusChange)) {
      const dispatchPayload = {
        limit: queueResult.queued,
        reservationId,
        channel: '',
        force: true,
        ids: queueResult.notifications.map((item) => item.id).filter((id) => Number.isInteger(id) && id > 0),
      };
      dispatchResult = await dispatchQueuedNotifications(env, notificationConfig, dispatchPayload);
    }
  }

  return {
    status: 200,
    body: {
      ok: true,
      reservation: updated,
      templates,
      notifications: {
        queued: queueResult.queued,
        queued_items: queueResult.notifications,
        ...(dispatchResult
          ? {
              dispatch: {
                summary: dispatchResult.summary,
                notifications: dispatchResult.notifications,
              },
            }
          : {}),
      },
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
  const notificationConfig = getNotificationConfig(env);

  if (path === '/api/internal/reservations' && request.method === 'GET') {
    const parsedFilters = parseReservationListFilters(url);
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

  if (path === '/api/internal/notifications' && request.method === 'GET') {
    const parsedFilters = parseNotificationListFilters(url);
    if (!parsedFilters.ok) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: 'invalid_filters', error: parsedFilters.error },
        422,
      );
    }

    const listResult = await listInternalNotifications(env, parsedFilters.value);
    return jsonResponse(
      request,
      env,
      {
        ok: true,
        total: listResult.total,
        limit: parsedFilters.value.limit,
        offset: parsedFilters.value.offset,
        notifications: listResult.notifications,
      },
      200,
    );
  }

  if (path === '/api/internal/notifications/dispatch' && request.method === 'POST') {
    let payload = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const parsedPayload = parseNotificationDispatchPayload(payload, notificationConfig);
    if (!parsedPayload.ok) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: parsedPayload.code, error: parsedPayload.error },
        422,
      );
    }

    const dispatchResult = await dispatchQueuedNotifications(env, notificationConfig, parsedPayload.value);
    return jsonResponse(
      request,
      env,
      {
        ok: true,
        delivery_modes: {
          email: notificationConfig.emailMode,
          whatsapp: notificationConfig.whatsappMode,
        },
        summary: dispatchResult.summary,
        notifications: dispatchResult.notifications,
      },
      200,
    );
  }

  const retryMatch = path.match(/^\/api\/internal\/notifications\/(\d+)\/retry$/);
  if (retryMatch && request.method === 'POST') {
    const notificationId = toInteger(retryMatch[1], 0);
    if (notificationId <= 0) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: 'invalid_notification_id', error: 'ID de notificacion invalido.' },
        422,
      );
    }

    const retryResult = await retryNotification(env, notificationId);
    if (retryResult.status !== 200) {
      return jsonResponse(request, env, retryResult.body, retryResult.status);
    }

    let payload = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const dispatchNow = parseBoolean(payload.dispatch_now, false);
    if (!dispatchNow) {
      return jsonResponse(request, env, retryResult.body, retryResult.status);
    }

    const dispatchPayload = {
      limit: 1,
      reservationId: 0,
      channel: '',
      force: true,
      ids: [notificationId],
    };

    const dispatchResult = await dispatchQueuedNotifications(env, notificationConfig, dispatchPayload);
    return jsonResponse(
      request,
      env,
      {
        ...retryResult.body,
        dispatch: {
          summary: dispatchResult.summary,
          notifications: dispatchResult.notifications,
        },
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
    } catch {
      return jsonResponse(request, env, { ok: false, code: 'invalid_json', error: 'JSON invalido.' }, 400);
    }

    const updateResult = await updateReservationStatus(env, notificationConfig, reservationId, payload || {});
    return jsonResponse(request, env, updateResult.body, updateResult.status);
  }

  const notifyMatch = path.match(/^\/api\/internal\/reservations\/(\d+)\/notify$/);
  if (notifyMatch && request.method === 'POST') {
    const reservationId = toInteger(notifyMatch[1], 0);
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

    let payload = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const validation = validateManualNotifyPayload(payload, reservation);
    if (!validation.ok) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: validation.code, error: validation.error },
        422,
      );
    }

    const queueResult = await enqueueReservationNotifications(env, reservation, notificationConfig, {
      status: validation.value.status,
      note: validation.value.note,
      trigger: validation.value.trigger,
      updatedBy: validation.value.updatedBy,
      channels: validation.value.channels,
    });

    if (!queueResult.ok) {
      return jsonResponse(
        request,
        env,
        { ok: false, code: queueResult.code, error: queueResult.error },
        422,
      );
    }

    let dispatch = null;
    if (validation.value.dispatchNow && queueResult.queued > 0) {
      const dispatchPayload = {
        limit: queueResult.queued,
        reservationId,
        channel: '',
        force: true,
        ids: queueResult.notifications.map((item) => item.id).filter((id) => Number.isInteger(id) && id > 0),
      };
      dispatch = await dispatchQueuedNotifications(env, notificationConfig, dispatchPayload);
    }

    return jsonResponse(
      request,
      env,
      {
        ok: true,
        reservation_id: reservationId,
        queued: queueResult.queued,
        queued_items: queueResult.notifications,
        ...(dispatch
          ? {
              dispatch: {
                summary: dispatch.summary,
                notifications: dispatch.notifications,
              },
            }
          : {}),
      },
      200,
    );
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
        const notificationConfig = getNotificationConfig(env);
        return jsonResponse(
          request,
          env,
          {
            ok: true,
            service: 'reservations-api',
            database: 'up',
            internal_api_configured: Boolean(normalizeText(env.INTERNAL_API_KEY || '', 10)),
            notifications: {
              email_mode: notificationConfig.emailMode,
              whatsapp_mode: notificationConfig.whatsappMode,
              max_attempts: notificationConfig.maxAttempts,
            },
            timestamp: new Date().toISOString(),
          },
          200,
        );
      } catch {
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
    } catch {
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
      const notificationConfig = getNotificationConfig(env);
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
      const reservation = await getReservationById(env, reservationId);

      let queueResult = {
        ok: true,
        queued: 0,
        notifications: [],
      };

      let dispatchResult = null;

      if (reservation) {
        queueResult = await enqueueReservationNotifications(env, reservation, notificationConfig, {
          status: 'pending',
          note: '',
          trigger: 'reservation_created',
          updatedBy: 'system',
          channels: DEFAULT_NOTIFICATION_CHANNELS,
        });

        if (queueResult.ok && queueResult.queued > 0 && notificationConfig.autoDispatchOnCreate) {
          dispatchResult = await dispatchQueuedNotifications(env, notificationConfig, {
            limit: queueResult.queued,
            reservationId,
            channel: '',
            force: true,
            ids: queueResult.notifications
              .map((item) => item.id)
              .filter((id) => Number.isInteger(id) && id > 0),
          });
        }
      }

      return jsonResponse(
        request,
        env,
        {
          ok: true,
          reservation_id: reservationId,
          status: 'pending',
          message: 'Solicitud enviada. Te contactaremos para confirmar disponibilidad.',
          notifications: {
            queued: queueResult.queued,
            delivery_modes: {
              email: notificationConfig.emailMode,
              whatsapp: notificationConfig.whatsappMode,
            },
            ...(dispatchResult
              ? {
                  dispatch: {
                    summary: dispatchResult.summary,
                  },
                }
              : {}),
          },
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
