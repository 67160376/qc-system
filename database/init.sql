CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'QC', 'PRODUCTION')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_code VARCHAR(50) NOT NULL UNIQUE,
  product_name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspections (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('Incoming', 'In-process', 'Final')),
  lot_number VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  passed_quantity INTEGER NOT NULL DEFAULT 0,
  failed_quantity INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  inspector_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ncrs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')) DEFAULT 'OPEN',
  related_inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, role, created_at)
VALUES
  ('admin', '$2a$10$ps/u8XTmiWaade/lQLGuy.mPMxGgqZu0LYE7SxHmx83iU3I9DWgzO', 'ADMIN', NOW()),
  ('qc_user', '$2a$10$SBUu0HTJEAKR8oHvjfeaMunArBr8Y8mH0fQ2brEr1SI4AELe7iLUa', 'QC', NOW()),
  ('production_user', '$2a$10$ZbcgHBCaMUN2zX8WMQFkkO/ocwAFC4zkMaxhRcnmpeNu6MC7iSlc2', 'PRODUCTION', NOW())
ON CONFLICT (username) DO UPDATE
SET password = EXCLUDED.password,
    role = EXCLUDED.role;

INSERT INTO products (product_code, product_name, description)
VALUES
  ('PRD-001', 'Engine Oil', 'High performance engine lubricant for industrial use.'),
  ('PRD-002', 'Hydraulic Oil', 'Hydraulic system oil designed for heavy-duty operations.'),
  ('PRD-003', 'Industrial Lubricant', 'General-purpose industrial lubricant for manufacturing lines.')
ON CONFLICT (product_code) DO NOTHING;

INSERT INTO alerts (message, level, acknowledged)
VALUES
  ('Temperature exceeds control limit during final testing.', 'critical', false),
  ('Incoming material batch requires secondary review.', 'warning', false),
  ('Daily QC summary completed successfully.', 'info', true)
ON CONFLICT DO NOTHING;
