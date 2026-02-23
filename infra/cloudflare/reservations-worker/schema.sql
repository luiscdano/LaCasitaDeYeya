CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('village', 'downtown', 'los-corales')),
  reservation_date TEXT NOT NULL,
  reservation_time TEXT NOT NULL,
  guests INTEGER NOT NULL CHECK (guests >= 1 AND guests <= 30),
  comments TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  status_note TEXT NOT NULL DEFAULT '',
  status_updated_at TEXT,
  status_updated_by TEXT NOT NULL DEFAULT '',
  user_agent TEXT DEFAULT '',
  client_ip TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_date_time
  ON reservations (reservation_date, reservation_time);

CREATE INDEX IF NOT EXISTS idx_reservations_location_date
  ON reservations (location, reservation_date);

CREATE INDEX IF NOT EXISTS idx_reservations_created_at
  ON reservations (created_at);

CREATE INDEX IF NOT EXISTS idx_reservations_client_ip_created_at
  ON reservations (client_ip, created_at);

CREATE INDEX IF NOT EXISTS idx_reservations_email_created_at
  ON reservations (email, created_at);

CREATE INDEX IF NOT EXISTS idx_reservations_duplicate_guard
  ON reservations (email, location, reservation_date, reservation_time, created_at);
