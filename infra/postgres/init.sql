CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    current_cost DECIMAL(10, 2),
    sale_price DECIMAL(10, 2),
    stock INT DEFAULT 0,
    min_stock INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_history (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    old_cost DECIMAL(10, 2),
    new_cost DECIMAL(10, 2),
    quantity INT,
    invoice_id INT,
    purchase_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    number VARCHAR(20),
    series VARCHAR(5),
    issue_date DATE,
    supplier VARCHAR(255),
    file_name VARCHAR(255),
    total_amount DECIMAL(12, 2),
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- product_id NULL = default rule (global). product_id set = overrides the global rule.
CREATE TABLE IF NOT EXISTS pricing_rules (
    id SERIAL PRIMARY KEY,
    product_id INT UNIQUE REFERENCES products(id),
    margin_percentage DECIMAL(5, 2) NOT NULL,
    tax_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_rule
    ON pricing_rules ((product_id IS NULL))
    WHERE product_id IS NULL;

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_queries (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    response TEXT,
    sources TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Allows the default minimum stock to be configured without changing products
-- that already have their own minimum.
CREATE TABLE IF NOT EXISTS stock_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    global_min_stock INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stock_settings (id, global_min_stock)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Keeps existing databases compatible when this file is run again.
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INT;


-- Application users. The first admin is created with backend/create_admin.py.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE CHECK (username = lower(username)),
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'member')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
