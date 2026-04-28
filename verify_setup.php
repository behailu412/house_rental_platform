<?php
// Simple verification script
require_once 'backend/config.php';

echo "<h2>Notification System Verification</h2>";

try {
    $pdo = db();
    echo "<p>✓ Database connection successful</p>";
    
    // Check tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>Database Tables:</h3>";
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>" . htmlspecialchars($table) . "</li>";
    }
    echo "</ul>";
    
    // Check specifically for notification tables
    $hasNotifications = in_array('notifications', $tables);
    $hasPreferences = in_array('notification_preferences', $tables);
    
    echo "<h3>Notification System Status:</h3>";
    if ($hasNotifications) {
        echo "<p>✓ notifications table exists</p>";
        $count = $pdo->query("SELECT COUNT(*) FROM notifications")->fetchColumn();
        echo "<p>Records in notifications: $count</p>";
    } else {
        echo "<p style='color: red;'>✗ notifications table MISSING</p>";
    }
    
    if ($hasPreferences) {
        echo "<p>✓ notification_preferences table exists</p>";
        $count = $pdo->query("SELECT COUNT(*) FROM notification_preferences")->fetchColumn();
        echo "<p>Records in notification_preferences: $count</p>";
    } else {
        echo "<p style='color: red;'>✗ notification_preferences table MISSING</p>";
    }
    
    if (!$hasNotifications || !$hasPreferences) {
        echo "<div style='background: #ffe6e6; padding: 10px; margin: 10px 0; border: 1px solid #ff999;'>";
        echo "<h3>⚠️ FIX REQUIRED</h3>";
        echo "<p><strong>Problem:</strong> Notification database tables are missing</p>";
        echo "<p><strong>Solution:</strong> Run the SQL script to create tables</p>";
        echo "<ol>";
        echo "<li>Open phpMyAdmin (http://localhost/phpmyadmin)</li>";
        echo "<li>Select 'house_rental_platform' database</li>";
        echo "<li>Click 'Import' tab</li>";
        echo "<li>Choose file: database/notifications_table.sql</li>";
        echo "<li>Click 'Go' to execute</li>";
        echo "</ol>";
        echo "</div>";
    } else {
        echo "<div style='background: #e6ffe6; padding: 10px; margin: 10px 0; border: 1px solid #99ff99;'>";
        echo "<h3>✅ Database Setup Complete</h3>";
        echo "<p>Notification tables exist. If notifications still don't show:</p>";
        echo "<ul>";
        echo "<li>Check browser console (F12) for JavaScript errors</li>";
        echo "<li>Clear browser cache (Ctrl+F5)</li>";
        echo "<li>Check network tab for API errors</li>";
        echo "</ul>";
        echo "</div>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Database Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
