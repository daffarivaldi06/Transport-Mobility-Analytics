CREATE TABLE IF NOT EXISTS traffic_records (
  id SERIAL PRIMARY KEY,
  recorded_at TIMESTAMPTZ NOT NULL,
  location VARCHAR(120) NOT NULL,
  vehicle_type VARCHAR(40) NOT NULL,
  vehicle_count INTEGER NOT NULL DEFAULT 0,
  average_speed NUMERIC(8, 2) NOT NULL DEFAULT 0,
  delay_minutes NUMERIC(8, 2) NOT NULL DEFAULT 0,
  congestion_level NUMERIC(5, 2) NOT NULL DEFAULT 0,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traffic_records_recorded_at ON traffic_records (recorded_at);
CREATE INDEX IF NOT EXISTS idx_traffic_records_location ON traffic_records (location);
CREATE INDEX IF NOT EXISTS idx_traffic_records_vehicle_type ON traffic_records (vehicle_type);

INSERT INTO traffic_records
  (recorded_at, location, vehicle_type, vehicle_count, average_speed, delay_minutes, congestion_level, latitude, longitude)
VALUES
  ('2026-05-17 07:00:00+02', 'Jakarta Sudirman', 'car', 1180, 22.5, 18.2, 82, -6.214620, 106.845130),
  ('2026-05-17 07:00:00+02', 'Jakarta Sudirman', 'bus', 180, 18.1, 14.8, 78, -6.214620, 106.845130),
  ('2026-05-17 08:00:00+02', 'Jakarta Sudirman', 'motorcycle', 2150, 28.7, 11.3, 74, -6.214620, 106.845130),
  ('2026-05-17 09:00:00+02', 'Jakarta Sudirman', 'truck', 260, 16.8, 22.1, 88, -6.214620, 106.845130),
  ('2026-05-17 07:00:00+02', 'Bandung Dago', 'car', 720, 31.5, 8.4, 56, -6.883500, 107.609810),
  ('2026-05-17 08:00:00+02', 'Bandung Dago', 'motorcycle', 980, 34.2, 6.8, 49, -6.883500, 107.609810),
  ('2026-05-17 09:00:00+02', 'Bandung Dago', 'bus', 120, 27.4, 9.7, 58, -6.883500, 107.609810),
  ('2026-05-17 07:00:00+02', 'Surabaya Basuki Rahmat', 'car', 850, 26.9, 12.5, 67, -7.265757, 112.734146),
  ('2026-05-17 08:00:00+02', 'Surabaya Basuki Rahmat', 'truck', 210, 19.4, 17.9, 76, -7.265757, 112.734146),
  ('2026-05-17 09:00:00+02', 'Surabaya Basuki Rahmat', 'motorcycle', 1460, 30.1, 10.5, 63, -7.265757, 112.734146);
