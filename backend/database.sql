-- ============================================================
--  DEMS  Daily Expense Management System
--  database.sql  -  Run this FIRST in phpMyAdmin SQL tab
-- ============================================================

CREATE DATABASE IF NOT EXISTS dems_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dems_db;

-- ── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7)   NOT NULL DEFAULT '#6366f1'
) ENGINE=InnoDB;

INSERT IGNORE INTO categories (name, color) VALUES
  ('Food',           '#3b82f6'),
  ('Transportation', '#10b981'),
  ('Entertainment',  '#f59e0b'),
  ('Shopping',       '#ef4444'),
  ('Utilities',      '#8b5cf6'),
  ('Health',         '#06b6d4'),
  ('Education',      '#84cc16'),
  ('Other',          '#6b7280');

-- ── EXPENSES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  category_id INT           NOT NULL,
  date        DATE          NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ── USER SETTINGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT        NOT NULL UNIQUE,
  email_notifications TINYINT(1) DEFAULT 1,
  daily_summary       TINYINT(1) DEFAULT 0,
  budget_alerts       TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── DEMO USER  (password = demo1234) ────────────────────────
INSERT IGNORE INTO users (first_name, last_name, email, password)
VALUES ('John', 'Doe', 'john@example.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ── DEMO EXPENSES ────────────────────────────────────────────
SET @uid   = (SELECT id    FROM users      WHERE email = 'john@example.com');
SET @food  = (SELECT id    FROM categories WHERE name  = 'Food');
SET @trans = (SELECT id    FROM categories WHERE name  = 'Transportation');
SET @ent   = (SELECT id    FROM categories WHERE name  = 'Entertainment');
SET @shop  = (SELECT id    FROM categories WHERE name  = 'Shopping');
SET @util  = (SELECT id    FROM categories WHERE name  = 'Utilities');

INSERT IGNORE INTO expenses (user_id, amount, category_id, date, description) VALUES
  (@uid, 45.50,  @food,  DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'Lunch at restaurant'),
  (@uid, 120.00, @trans, DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'Monthly bus pass'),
  (@uid, 25.99,  @ent,   DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Movie tickets'),
  (@uid, 89.99,  @shop,  DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'New shoes'),
  (@uid, 15.50,  @food,  DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Coffee and snacks'),
  (@uid, 55.00,  @food,  DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Groceries'),
  (@uid, 30.00,  @ent,   DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Streaming subscription'),
  (@uid, 200.00, @util,  DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'Electricity bill');

INSERT IGNORE INTO user_settings (user_id, email_notifications, daily_summary, budget_alerts)
VALUES (@uid, 1, 0, 1);
