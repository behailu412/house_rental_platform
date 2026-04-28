<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? 'list');

switch ($action) {
  case 'list':
    require_method('GET');
    $user = require_auth(['renter', 'owner', 'admin']);
    $limit = safe_int($_GET['limit'] ?? 20, 20);
    $offset = safe_int($_GET['offset'] ?? 0, 0);
    $unreadOnly = (int)($_GET['unread_only'] ?? 0);
    
    $sql = "
      SELECT 
        id, type, title, message, related_id, related_type, is_read, created_at
      FROM notifications 
      WHERE user_id = :uid
    ";
    $params = [':uid' => (int)$user['id']];
    
    if ($unreadOnly) {
        $sql .= " AND is_read = 0";
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    $params[':limit'] = $limit;
    $params[':offset'] = $offset;
    
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stmt->execute();
    
    $notifications = $stmt->fetchAll();
    
    // Get unread count
    $countStmt = $pdo->prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = :uid AND is_read = 0');
    $countStmt->execute([':uid' => (int)$user['id']]);
    $unreadCount = (int)$countStmt->fetch()['count'];
    
    json_response([
        'ok' => true, 
        'items' => $notifications,
        'unread_count' => $unreadCount
    ]);
    break;

  case 'mark_read':
    require_method('POST');
    $user = require_auth(['renter', 'owner', 'admin']);
    $input = get_input();
    
    $notificationId = safe_int($input['notification_id'] ?? 0, 0);
    $markAll = (int)($input['mark_all'] ?? 0);
    $type = (string)($input['type'] ?? '');
    
    if ($type !== '') {
        // Mark all notifications of a specific type as read
        $validTypes = ['new_property', 'new_message', 'property_approved', 'property_rejected', 'payment_received', 'new_complaint', 'complaint_update'];
        if (!in_array($type, $validTypes, true)) send_error('Invalid notification type');
        
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = :uid AND type = :type AND is_read = 0');
        $stmt->execute([':uid' => (int)$user['id'], ':type' => $type]);
        $affected = $stmt->rowCount();
        json_response(['ok' => true, 'marked_count' => $affected]);
    } elseif ($markAll) {
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = :uid AND is_read = 0');
        $stmt->execute([':uid' => (int)$user['id']]);
        $affected = $stmt->rowCount();
        json_response(['ok' => true, 'marked_count' => $affected]);
    } elseif ($notificationId > 0) {
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :uid');
        $stmt->execute([':id' => $notificationId, ':uid' => (int)$user['id']]);
        json_response(['ok' => true, 'marked_count' => $stmt->rowCount()]);
    } else {
        send_error('notification_id, mark_all, or type is required');
    }
    break;

  case 'delete':
    require_method('POST');
    $user = require_auth(['renter', 'owner', 'admin']);
    $input = get_input();
    
    $notificationId = safe_int($input['notification_id'] ?? 0, 0);
    if ($notificationId <= 0) send_error('notification_id is required');
    
    $stmt = $pdo->prepare('DELETE FROM notifications WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $notificationId, ':uid' => (int)$user['id']]);
    json_response(['ok' => true, 'deleted_count' => $stmt->rowCount()]);
    break;

  case 'create':
    require_method('POST');
    $user = require_auth(['owner', 'admin']); // Only owners and admins can create notifications
    $input = get_input();
    
    $userId = safe_int($input['user_id'] ?? 0, 0);
    $type = (string)($input['type'] ?? '');
    $title = trim((string)($input['title'] ?? ''));
    $message = trim((string)($input['message'] ?? ''));
    $relatedId = $input['related_id'] ?? null;
    $relatedId = $relatedId !== null && $relatedId !== '' ? safe_int($relatedId, 0) : null;
    $relatedType = (string)($input['related_type'] ?? '');
    
    if ($userId <= 0) send_error('user_id is required');
    if ($type === '') send_error('type is required');
    if ($title === '') send_error('title is required');
    if ($message === '') send_error('message is required');
    
    $validTypes = ['new_property', 'new_message', 'property_approved', 'property_rejected', 'payment_received', 'new_complaint', 'complaint_update'];
    if (!in_array($type, $validTypes, true)) send_error('Invalid notification type');
    
    $validRelatedTypes = ['property', 'message', 'payment', 'complaint'];
    if ($relatedType !== '' && !in_array($relatedType, $validRelatedTypes, true)) {
        send_error('Invalid related_type');
    }
    
    $stmt = $pdo->prepare(
        'INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
         VALUES (:uid, :type, :title, :message, :rid, :rtype)'
    );
    $stmt->execute([
        ':uid' => $userId,
        ':type' => $type,
        ':title' => $title,
        ':message' => $message,
        ':rid' => $relatedId,
        ':rtype' => $relatedType ?: null
    ]);
    
    json_response(['ok' => true, 'notification_id' => (int)$pdo->lastInsertId()]);
    break;

  case 'preferences':
    require_method('GET');
    $user = require_auth(['renter', 'owner', 'admin']);
    
    $stmt = $pdo->prepare('SELECT * FROM notification_preferences WHERE user_id = :uid LIMIT 1');
    $stmt->execute([':uid' => (int)$user['id']]);
    $preferences = $stmt->fetch();
    
    if (!$preferences) {
        // Create default preferences
        $stmt = $pdo->prepare(
            'INSERT INTO notification_preferences (user_id) VALUES (:uid)'
        );
        $stmt->execute([':uid' => (int)$user['id']]);
        
        $stmt = $pdo->prepare('SELECT * FROM notification_preferences WHERE user_id = :uid LIMIT 1');
        $stmt->execute([':uid' => (int)$user['id']]);
        $preferences = $stmt->fetch();
    }
    
    json_response(['ok' => true, 'preferences' => $preferences]);
    break;

  case 'update_preferences':
    require_method('POST');
    $user = require_auth(['renter', 'owner', 'admin']);
    $input = get_input();
    
    $emailNotifications = (int)($input['email_notifications'] ?? 1);
    $newPropertyAlerts = (int)($input['new_property_alerts'] ?? 1);
    $messageNotifications = (int)($input['message_notifications'] ?? 1);
    $propertyUpdates = (int)($input['property_updates'] ?? 1);
    $paymentNotifications = (int)($input['payment_notifications'] ?? 1);
    
    $stmt = $pdo->prepare(
        'UPDATE notification_preferences 
         SET email_notifications = :email, new_property_alerts = :new_prop, 
             message_notifications = :msg, property_updates = :prop_update, 
             payment_notifications = :payment, updated_at = NOW()
         WHERE user_id = :uid'
    );
    $stmt->execute([
        ':email' => $emailNotifications,
        ':new_prop' => $newPropertyAlerts,
        ':msg' => $messageNotifications,
        ':prop_update' => $propertyUpdates,
        ':payment' => $paymentNotifications,
        ':uid' => (int)$user['id']
    ]);
    
    json_response(['ok' => true]);
    break;

  default:
    send_error('Unknown action', 400);
}
