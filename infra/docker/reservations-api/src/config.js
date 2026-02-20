function parseBoolean(value, fallback = false) {
  if (value == null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function parseOrigins(raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '8789', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  email: {
    enabled: parseBoolean(process.env.EMAIL_NOTIFICATIONS_ENABLED, false),
    from: process.env.EMAIL_FROM || '',
    to: process.env.EMAIL_TO || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    smtpSecure: parseBoolean(process.env.SMTP_SECURE, false),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
  },
  whatsapp: {
    enabled: parseBoolean(process.env.WHATSAPP_NOTIFICATIONS_ENABLED, false),
    apiVersion: process.env.WABA_API_VERSION || 'v21.0',
    phoneNumberId: process.env.WABA_PHONE_NUMBER_ID || '',
    accessToken: process.env.WABA_ACCESS_TOKEN || '',
    toNumber: process.env.WABA_TO_NUMBER || '',
  },
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required for reservations-api');
}
