-- Juma Accessory: Database Schema
-- Recomendado para dialectos como PostgreSQL o MySQL

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    auth_id UUID UNIQUE, -- ID generado por Supabase Auth
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    initial_stock INT NOT NULL DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    image TEXT, -- Base64 o URL
    source_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    client_id INT, -- Puede ser NULL si es un pedido de invitado
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, REALIZADO
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK(quantity > 0),
    unit_sale_price DECIMAL(10, 2) NOT NULL,
    unit_purchase_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Tablas Opcionales de Configuración Visual (Admin Inicio)
CREATE TABLE hero_banner (
    id INT PRIMARY KEY DEFAULT 1,
    tag VARCHAR(100),
    title VARCHAR(255),
    subtitle VARCHAR(255),
    image TEXT
);

CREATE TABLE featured_panels (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255),
    cta VARCHAR(100),
    image TEXT,
    class_name VARCHAR(50) -- card-left, card-top, etc.
);
