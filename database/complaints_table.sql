-- Complaints and Feedback System for House Rental Platform
-- Add this to your existing database by running this script

USE house_rental_platform;

-- =========================
-- Complaints/Feedback Table
-- =========================
CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('complaint', 'feedback', 'suggestion', 'bug_report', 'other') NOT NULL DEFAULT 'complaint',
  category ENUM('property', 'user_behavior', 'payment', 'technical', 'service', 'safety', 'other') NOT NULL DEFAULT 'other',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'resolved', 'rejected', 'closed') NOT NULL DEFAULT 'pending',
  
  -- Related entities (optional)
  related_property_id INT NULL,
  related_user_id INT NULL,  -- If complaint is about another user
  
  -- Admin response
  admin_response TEXT NULL,
  admin_id INT NULL,  -- Admin who responded
  responded_at DATETIME NULL,
  
  -- Resolution tracking
  resolution_details TEXT NULL,
  resolved_by INT NULL,
  resolved_at DATETIME NULL,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes for performance
  INDEX idx_user_status (user_id, status),
  INDEX idx_type_status (type, status),
  INDEX idx_priority_status (priority, status),
  INDEX idx_created_at (created_at),
  INDEX idx_admin_pending (status, created_at)  -- For admin dashboard
) ENGINE=InnoDB;

-- =========================
-- Complaint Attachments Table
-- =========================
CREATE TABLE IF NOT EXISTS complaint_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  INDEX idx_complaint (complaint_id)
) ENGINE=InnoDB;

-- =========================
-- Complaint Status History Table
-- =========================
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  old_status ENUM('pending', 'in_progress', 'resolved', 'rejected', 'closed') NULL,
  new_status ENUM('pending', 'in_progress', 'resolved', 'rejected', 'closed') NOT NULL,
  changed_by INT NOT NULL,  -- User or admin who changed status
  notes TEXT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_complaint_history (complaint_id),
  INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB;

-- =========================
-- Create directory for complaint attachments
-- =========================
-- Note: This needs to be created manually in the file system
-- mkdir c:/xampp/htdocs/house_rental_ platform/uploads/complaints/
-- chmod 755 c:/xampp/htdocs/house_rental_ platform/uploads/complaints/

-- =========================
-- Sample Data for Testing (Optional)
-- =========================
-- Insert sample complaint categories and priorities are already defined as ENUMs

-- Create a view for admin dashboard
CREATE OR REPLACE VIEW admin_complaints_summary AS
SELECT 
  c.id,
  c.type,
  c.category,
  c.title,
  c.priority,
  c.status,
  c.created_at,
  u.full_name as submitter_name,
  u.phone as submitter_phone,
  u.role as submitter_role,
  related_p.city as property_city,
  related_p.subcity as property_subcity,
  admin_u.full_name as assigned_admin,
  c.responded_at,
  c.resolved_at,
  CASE 
    WHEN c.status = 'pending' THEN DATEDIFF(NOW(), c.created_at)
    WHEN c.status IN ('resolved', 'closed') THEN DATEDIFF(c.resolved_at, c.created_at)
    ELSE DATEDIFF(NOW(), c.created_at)
  END as days_open
FROM complaints c
JOIN users u ON c.user_id = u.id
LEFT JOIN properties related_p ON c.related_property_id = related_p.id
LEFT JOIN users admin_u ON c.admin_id = admin_u.id
ORDER BY c.priority DESC, c.created_at DESC;
