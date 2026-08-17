ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INT;

CREATE TABLE IF NOT EXISTS stock_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    global_min_stock INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stock_settings (id, global_min_stock)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
