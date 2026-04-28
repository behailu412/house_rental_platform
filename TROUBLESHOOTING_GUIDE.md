# Notification System Troubleshooting Guide

## Issue: Notifications Not Displaying in Browser

### Quick Diagnosis Steps

#### 1. Check Database Tables (Most Common Issue)
**Problem**: Missing database tables
**Test**: Open `http://localhost/house_rental_%20platform/verify_setup.php`
**Expected**: Green "Database Setup Complete" message
**If Red**: Run the SQL script immediately

#### 2. Check Browser Console for JavaScript Errors
**Steps**:
1. Open browser (Chrome/Firefox)
2. Navigate to your application
3. Press F12 → Console tab
4. Look for red error messages

**Common Errors**:
- `Failed to load resource: notifications.jsx`
- `Notifications is not defined`
- `Cannot read property 'undefined'`

#### 3. Check Network Tab for API Failures
**Steps**:
1. F12 → Network tab
2. Refresh page
3. Look for failed requests to `notifications.php`

### Step-by-Step Fix Process

#### Step 1: Database Setup (Critical)
```sql
-- Run this in phpMyAdmin:
USE house_rental_platform;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('new_property', 'new_message', 'property_approved', 'property_rejected', 'payment_received') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT NULL,
  related_type ENUM('property', 'message', 'payment') NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
) ENGINE=InnoDB;

-- Create notification_preferences table
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

-- Insert default preferences
INSERT IGNORE INTO notification_preferences (user_id)
SELECT id FROM users;
```

#### Step 2: Verify File Structure
**Required Files**:
```
backend/
  notifications.php              ✅ Created
  config.php                   ✅ Should exist

frontend/
  notifications.jsx              ✅ Created
  notification_preferences.jsx     ✅ Created
  main.jsx                     ✅ Modified
  dashboard.jsx                  ✅ Modified
  property_list.jsx              ✅ Modified
```

#### Step 3: Check Frontend Integration
**In main.jsx**: Should have this import:
```javascript
import Notifications from './notifications.jsx';
```

**In TopBar component**: Should include:
```javascript
<Notifications onPropertyClick={handlePropertyClick} />
```

#### Step 4: Test API Directly
**Test URL**: `http://localhost/house_rental_%20platform/backend/notifications.php?action=list`
**Expected**: JSON response with `{"ok":true,"items":[],"unread_count":0}`

### Common Issues and Solutions

#### Issue 1: Database Tables Missing
**Symptoms**: No notifications, API errors
**Solution**: Run SQL script in phpMyAdmin

#### Issue 2: File Path Problems
**Symptoms**: 404 errors for .jsx files
**Solution**: Ensure files are in `frontend/` folder

#### Issue 3: Import Errors
**Symptoms**: JavaScript errors in console
**Solution**: Check imports in main.jsx

#### Issue 4: Session Issues
**Symptoms**: API returns "unauthorized"
**Solution**: Ensure user is logged in

### Debug Commands

#### Check Database:
```sql
SHOW TABLES LIKE '%notification%';
SELECT COUNT(*) FROM notifications;
SELECT COUNT(*) FROM notification_preferences;
```

#### Check API:
```bash
# Test notifications endpoint
curl "http://localhost/house_rental_%20platform/backend/notifications.php?action=list"
```

#### Check Frontend:
1. Open browser dev tools (F12)
2. Console tab - look for red errors
3. Network tab - look for failed requests
4. Elements tab - check if notification bell exists

### Quick Fix Checklist

1. **Database Setup**: Run SQL script in phpMyAdmin
2. **Clear Cache**: Ctrl+F5 in browser
3. **Check Console**: F12 → Console for errors
4. **Verify Files**: All files exist in correct locations
5. **Test API**: Direct endpoint access
6. **Check Session**: User must be logged in

### Expected Behavior After Fix

- Bell icon should appear in TopBar
- Unread count badge should show numbers
- Clicking bell should open notifications modal
- New property approvals should trigger notifications
- Chat messages should trigger instant notifications

### Support Files Created

- `verify_setup.php` - Database verification tool
- `test_notifications_api.php` - Comprehensive API test
- `check_db.php` - Database connection test

**Run these files to diagnose issues**:
- `http://localhost/house_rental_%20platform/verify_setup.php`

### Final Steps

1. **Run database setup** (most critical)
2. **Clear browser cache**
3. **Test with different users**
4. **Check browser console for errors**
5. **Verify API responses**

The notification system is fully implemented - it just needs the database tables to be created to function properly.
