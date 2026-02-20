import nodemailer from 'nodemailer';
import { config } from './config.js';

let mailTransport = null;

function formatReservationText(reservation, reservationId) {
  return [
    `Nueva reserva #${reservationId}`,
    `Nombre: ${reservation.full_name}`,
    `Telefono: ${reservation.phone}`,
    `Correo: ${reservation.email}`,
    `Localidad: ${reservation.location}`,
    `Fecha: ${reservation.reservation_date}`,
    `Hora: ${reservation.reservation_time}`,
    `Personas: ${reservation.guests}`,
    `Comentarios: ${reservation.comments || 'N/A'}`,
  ].join('\n');
}

function getMailTransport() {
  if (mailTransport) return mailTransport;

  if (!config.email.smtpHost) {
    throw new Error('SMTP_HOST is required');
  }

  const hasUser = Boolean(config.email.smtpUser);
  const hasPass = Boolean(config.email.smtpPass);
  if (hasUser !== hasPass) {
    throw new Error('SMTP_USER and SMTP_PASS must be provided together');
  }

  mailTransport = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpSecure,
    ...(hasUser && hasPass
      ? {
          auth: {
            user: config.email.smtpUser,
            pass: config.email.smtpPass,
          },
        }
      : {}),
  });

  return mailTransport;
}

export async function sendEmailNotification(reservation, reservationId) {
  if (!config.email.enabled) return { sent: false, reason: 'disabled' };

  if (!config.email.from || !config.email.to) {
    throw new Error('EMAIL_FROM and EMAIL_TO are required when email notifications are enabled');
  }

  const transporter = getMailTransport();
  const text = formatReservationText(reservation, reservationId);

  await transporter.sendMail({
    from: config.email.from,
    to: config.email.to,
    subject: `Nueva reserva #${reservationId} - La Casita de Yeya`,
    text,
  });

  return { sent: true };
}

export async function sendWhatsAppNotification(reservation, reservationId) {
  if (!config.whatsapp.enabled) return { sent: false, reason: 'disabled' };

  const { phoneNumberId, accessToken, toNumber, apiVersion } = config.whatsapp;
  if (!phoneNumberId || !accessToken || !toNumber) {
    throw new Error('WABA_PHONE_NUMBER_ID, WABA_ACCESS_TOKEN and WABA_TO_NUMBER are required');
  }

  const bodyText = formatReservationText(reservation, reservationId);
  const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: bodyText,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.error?.message || `WhatsApp API error (${response.status})`;
    throw new Error(detail);
  }

  return { sent: true, payload };
}

export async function sendReservationNotifications(reservation, reservationId) {
  const results = {
    email: { sent: false, reason: 'skipped' },
    whatsapp: { sent: false, reason: 'skipped' },
  };

  try {
    results.email = await sendEmailNotification(reservation, reservationId);
  } catch (error) {
    results.email = { sent: false, reason: error.message || 'email_failed' };
  }

  try {
    results.whatsapp = await sendWhatsAppNotification(reservation, reservationId);
  } catch (error) {
    results.whatsapp = { sent: false, reason: error.message || 'whatsapp_failed' };
  }

  return results;
}
