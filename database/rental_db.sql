-- House Rental Platform (Prototype) - MySQL schema
-- Run in phpMyAdmin or via MySQL client.
-- create database house_rental_platform  it becomes   " utf8mb4_unicode_ci"

USE house_rental_platform;

-- =========================
-- Users
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  role ENUM('renter','owner','admin') NOT NULL DEFAULT 'renter',
  password_hash VARCHAR(255) NOT NULL,
  is_banned TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Remember-me tokens (optional persistence for "Remember Me")
CREATE TABLE IF NOT EXISTS remember_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Device-aware sessions for concurrent multi-device login.
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_selector CHAR(32) NOT NULL UNIQUE,
  session_token_hash CHAR(64) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  is_persistent TINYINT(1) NOT NULL DEFAULT 1,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_sessions_user_id (user_id),
  INDEX idx_user_sessions_expires (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- Properties + Photos
-- =========================
CREATE TABLE IF NOT EXISTS properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  city VARCHAR(100) NOT NULL,
  subcity VARCHAR(100) NOT NULL,
  real_address TEXT NOT NULL,
  property_type ENUM('Residential','Shop for Rent','Event Hall') NOT NULL DEFAULT 'Residential',
  short_description VARCHAR(255) NULL,
  description TEXT NULL,
  rules TEXT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('pending','active','rejected','rented') NOT NULL DEFAULT 'pending',
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS property_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- Favorites
-- =========================
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (user_id, property_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- Chat (HTTP Polling)
-- =========================
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NULL,
  from_user_id INT NOT NULL,
  to_user_id INT NOT NULL,
  message TEXT NOT NULL,
  seen TINYINT(1) NOT NULL DEFAULT 0,
  seen_at DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================
-- Chapa Payments (Listing Fee)
-- =========================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  user_id INT NOT NULL,
  tx_ref VARCHAR(64) NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
  status ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- Admin Price Settings
-- =========================
CREATE TABLE IF NOT EXISTS admin_price_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_type ENUM('Residential','Shop for Rent','Event Hall') NOT NULL UNIQUE,
  listing_fee DECIMAL(12,2) NOT NULL DEFAULT 50.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================
-- Property Views Tracking
-- =========================
CREATE TABLE IF NOT EXISTS property_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  user_id INT NOT NULL,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_property_user (property_id, user_id),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Insert default price settings
INSERT IGNORE INTO admin_price_settings (property_type, listing_fee, currency) VALUES
('Residential', 50.00, 'ETB'),
('Shop for Rent', 75.00, 'ETB'),
('Event Hall', 100.00, 'ETB');

-- Admin user is automatically created by ensure_admin_user() function in config.php

-- Useful view for debugging (optional)
-- SELECT * FROM properties ORDER BY id DESC;

