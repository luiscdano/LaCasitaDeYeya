import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

const schemaSql = `
CREATE TABLE IF NOT EXISTS reservations (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('village', 'downtown', 'los-corales')),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INTEGER NOT NULL CHECK (guests >= 1 AND guests <= 30),
  comments TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'website',
  user_agent TEXT NOT NULL DEFAULT '',
  client_ip TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations (reservation_date, reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_location_date ON reservations (location, reservation_date);
`;

export async function ensureSchema() {
  await pool.query(schemaSql);
}

export async function insertReservation(reservation, metadata) {
  const query = `
    INSERT INTO reservations (
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
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING id, created_at
  `;

  const values = [
    reservation.full_name,
    reservation.phone,
    reservation.email,
    reservation.location,
    reservation.reservation_date,
    reservation.reservation_time,
    reservation.guests,
    reservation.comments || '',
    reservation.source || 'website',
    metadata.userAgent,
    metadata.clientIp,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}
