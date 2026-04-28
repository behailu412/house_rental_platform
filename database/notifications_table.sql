-- Notifications Table for House Rental Platform
-- Add this to your existing database by running this script

USE house_rental_platform;

-- =========================
-- Notifications
-- =========================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('new_property', 'new_message', 'property_approved', 'property_rejected', 'payment_received') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT NULL, -- Can be property_id, message_id, or payment_id
  related_type ENUM('property', 'message', 'payment') NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
) ENGINE=InnoDB;

-- Notification Preferences Table (for future enhancement)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  email_notifications TINYINT(1) NOT NULL DEFAULT 1,
  new_property_alerts TINYINT(1) NOT NULL DEFAULT 1,
  message_notifications TINYINT(1) NOT NULL DEFAULT 1,
  property_updates TINYINT(1) NOT NULL DEFAULT 1,
  payment_notifications TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Insert default preferences for existing users
INSERT IGNORE INTO notification_preferences (user_id)
SELECT id FROM users;
