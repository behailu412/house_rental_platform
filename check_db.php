<?php
require_once 'backend/config.php';

try {
    $pdo = db();
    
    // Check if notification tables exist
    $stmt = $pdo->query("SHOW TABLES LIKE '%notification%'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "=== Database Check ===\n";
    echo "Notification tables found: " . implode(', ', $tables) . "\n\n";
    
    if (in_array('notifications', $tables)) {
        $count = $pdo->query("SELECT COUNT(*) FROM notifications")->fetchColumn();
        echo "Notifications table exists with $count records\n";
    } else {
        echo "ERROR: notifications table NOT FOUND\n";
    }
    
    if (in_array('notification_preferences', $tables)) {
        $count = $pdo->query("SELECT COUNT(*) FROM notification_preferences")->fetchColumn();
        echo "Notification preferences table exists with $count records\n";
    } else {
        echo "ERROR: notification_preferences table NOT FOUND\n";
    }
    
    // Test notifications API
    echo "\n=== API Test ===\n";
    $test = $pdo->query("SELECT * FROM notifications LIMIT 1")->fetch();
    if ($test) {
        echo "Sample notification found:\n";
        echo "ID: " . $test['id'] . "\n";
        echo "Type: " . $test['type'] . "\n";
        echo "Title: " . $test['title'] . "\n";
    } else {
        echo "No notifications found in database\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
