<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? 'threads');
$user = require_auth(['renter', 'owner', 'admin']);
$currentId = (int)$user['id'];
$currentRole = (string)$user['role'];

function fetch_user_by_id(PDO $pdo, int $userId): ?array {
  $stmt = $pdo->prepare('SELECT id, full_name, phone, role, is_banned FROM users WHERE id = :id LIMIT 1');
  $stmt->execute([':id' => $userId]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function fetch_property_by_id(PDO $pdo, int $propertyId): ?array {
  $stmt = $pdo->prepare('SELECT id, owner_id, city, subcity, status FROM properties WHERE id = :id LIMIT 1');
  $stmt->execute([':id' => $propertyId]);
  $row = $stmt->fetch();
  return $row ?: null;
}

switch ($action) {
  case 'send':
    require_method('POST');
    $input = get_input();

    $toUserId = safe_int($input['to_user_id'] ?? 0, 0);
    $message = trim((string)($input['message'] ?? ''));
    $propertyId = $input['property_id'] ?? null;
    $propertyId = $propertyId !== null && $propertyId !== '' ? safe_int($propertyId, 0) : null;

    if ($toUserId <= 0) send_error('to_user_id is required');
    if ($toUserId === $currentId) send_error('You cannot message yourself');
    if ($message === '' || mb_strlen($message) < 1) send_error('message is required');
    if ($propertyId !== null && $propertyId <= 0) $propertyId = null;
    if (mb_strlen($message) > 2000) send_error('Message is too long (max 2000 characters)');

    $recipient = fetch_user_by_id($pdo, $toUserId);
    if (!$recipient) send_error('Recipient not found', 404);
    if ((int)$recipient['is_banned'] === 1) send_error('Recipient account is blocked', 403);

    // Enforce private renter-owner communication by default.
    // Admin can still contact anyone for moderation purposes.
    if ($currentRole !== 'admin' && (string)$recipient['role'] !== 'admin') {
      $validPair = (
        ($currentRole === 'renter' && (string)$recipient['role'] === 'owner')
        || ($currentRole === 'owner' && (string)$recipient['role'] === 'renter')
      );
      if (!$validPair) send_error('Chat is only allowed between renters and owners', 403);
    }

    if ($propertyId !== null) {
      $property = fetch_property_by_id($pdo, $propertyId);
      if (!$property) send_error('Property not found', 404);

      $ownerId = (int)$property['owner_id'];
      if ($currentRole === 'renter') {
        // A renter can only message the owner of this property.
        if ($toUserId !== $ownerId) send_error('Invalid recipient for this property chat', 403);
      } elseif ($currentRole === 'owner') {
        // Owner can only send property-scoped messages for their own listing.
        if ($currentId !== $ownerId) send_error('You can only chat on your own listing', 403);
      }
    }

    $stmt = $pdo->prepare(
      'INSERT INTO chat_messages (property_id, from_user_id, to_user_id, message, seen, seen_at)
       VALUES (:pid, :from, :to, :msg, 0, NULL)'
    );
    $stmt->execute([
      ':pid' => $propertyId,
      ':from' => $currentId,
      ':to' => $toUserId,
      ':msg' => $message,
    ]);

    // Capture message id BEFORE any other insert happens on this connection.
    $messageId = (int)$pdo->lastInsertId();

    // Create notification for message recipient if they have message notifications enabled
    if ($stmt->rowCount() > 0) {
        // Get sender's name and check recipient's notification preferences
        $senderStmt = $pdo->prepare('SELECT full_name FROM users WHERE id = :id LIMIT 1');
        $senderStmt->execute([':id' => $currentId]);
        $sender = $senderStmt->fetch();
        
        $prefStmt = $pdo->prepare(
            'SELECT message_notifications FROM notification_preferences WHERE user_id = :uid LIMIT 1'
        );
        $prefStmt->execute([':uid' => $toUserId]);
        $preferences = $prefStmt->fetch();
        
        // Send notification if enabled (default to enabled if no preferences exist)
        $messageNotificationsEnabled = $preferences ? (int)$preferences['message_notifications'] : 1;
        
        if ($messageNotificationsEnabled && $sender) {
            $notifStmt = $pdo->prepare(
                'INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
                 VALUES (:uid, \'new_message\', :title, :message, :rid, \'message\')'
            );
            
            $title = 'New Message from ' . $sender['full_name'];
            $notifMessage = sprintf(
                'You have received a new message%s: "%s"',
                $propertyId ? ' about a property' : '',
                substr($message, 0, 100) . (strlen($message) > 100 ? '...' : '')
            );
            
            $notifStmt->execute([
                ':uid' => $toUserId,
                ':title' => $title,
                ':message' => $notifMessage,
                ':rid' => $messageId // Use the message ID
            ]);
        }
    }

    $msgStmt = $pdo->prepare(
      'SELECT id, property_id, from_user_id, to_user_id, message, seen, seen_at, created_at
       FROM chat_messages
       WHERE id = :id
       LIMIT 1'
    );
    $msgStmt->execute([':id' => $messageId]);
    $newMessage = $msgStmt->fetch();

    json_response(['ok' => true, 'message' => $newMessage ?: null]);
    break;

  case 'fetch':
    require_method('POST');
    $input = get_input();
    $withUserId = safe_int($input['with_user_id'] ?? 0, 0);
    if ($withUserId <= 0) send_error('with_user_id is required');

    $propertyId = $input['property_id'] ?? null;
    $propertyId = $propertyId !== null && $propertyId !== '' ? safe_int($propertyId, 0) : null;
    if ($withUserId === $currentId) send_error('Invalid conversation participant', 400);

    $otherUser = fetch_user_by_id($pdo, $withUserId);
    if (!$otherUser) send_error('User not found', 404);

    if ($propertyId !== null) {
      $property = fetch_property_by_id($pdo, $propertyId);
      if (!$property) send_error('Property not found', 404);

      $ownerId = (int)$property['owner_id'];
      $isOwnerSide = $currentId === $ownerId || $withUserId === $ownerId;
      if (!$isOwnerSide && $currentRole !== 'admin') {
        send_error('This property conversation is not allowed', 403);
      }
    }

    // Mark as seen for messages received by current user.
    if ($propertyId === null) {
      $stmt = $pdo->prepare(
        'UPDATE chat_messages
         SET seen=1, seen_at=NOW()
         WHERE to_user_id=:me AND from_user_id=:other AND seen=0'
      );
      $stmt->execute([':me' => $currentId, ':other' => $withUserId]);
    } else {
      $stmt = $pdo->prepare(
        'UPDATE chat_messages
         SET seen=1, seen_at=NOW()
         WHERE to_user_id=:me AND from_user_id=:other AND property_id=:pid AND seen=0'
      );
      $stmt->execute([':me' => $currentId, ':other' => $withUserId, ':pid' => $propertyId]);
    }

    // Return messages
    if ($propertyId === null) {
      $stmt = $pdo->prepare(
        "SELECT id, property_id, from_user_id, to_user_id, message, seen, seen_at, created_at
         FROM chat_messages
         WHERE (from_user_id=? AND to_user_id=?) OR (from_user_id=? AND to_user_id=?)
         ORDER BY created_at ASC
         LIMIT 100"
      );
      $stmt->execute([$currentId, $withUserId, $withUserId, $currentId]);
    } else {
      $stmt = $pdo->prepare(
        "SELECT id, property_id, from_user_id, to_user_id, message, seen, seen_at, created_at
         FROM chat_messages
         WHERE property_id=? AND
           ((from_user_id=? AND to_user_id=?) OR (from_user_id=? AND to_user_id=?))
         ORDER BY created_at ASC
         LIMIT 100"
      );
      $stmt->execute([$propertyId, $currentId, $withUserId, $withUserId, $currentId]);
    }

    $messages = $stmt->fetchAll();
    json_response(['ok' => true, 'messages' => $messages]);
    break;

  case 'threads':
    require_method('GET');
    // Telegram-style: one conversation per person.
    $stmt = $pdo->prepare(
      "SELECT
         CASE
           WHEN from_user_id = ? THEN to_user_id
           ELSE from_user_id
         END AS other_user_id,
         SUM(CASE WHEN to_user_id=? AND seen=0 THEN 1 ELSE 0 END) AS unread_count,
         MAX(created_at) AS last_at
       FROM chat_messages
       WHERE from_user_id=? OR to_user_id=?
       GROUP BY other_user_id
       ORDER BY last_at DESC
       LIMIT 60"
    );
    $stmt->execute([$currentId, $currentId, $currentId, $currentId]);
    $threads = $stmt->fetchAll();

    $result = [];
    foreach ($threads as $t) {
      $otherId = (int)$t['other_user_id'];
      $lastStmt = $pdo->prepare(
        "SELECT id, message, created_at, seen, property_id, from_user_id, to_user_id
         FROM chat_messages
         WHERE ((from_user_id=? AND to_user_id=?) OR (from_user_id=? AND to_user_id=?))
         ORDER BY created_at DESC
         LIMIT 1"
      );
      $lastStmt->execute([$currentId, $otherId, $otherId, $currentId]);
      $last = $lastStmt->fetch();

      $uStmt = $pdo->prepare('SELECT id, full_name, phone, role FROM users WHERE id=:id LIMIT 1');
      $uStmt->execute([':id' => $otherId]);
      $other = $uStmt->fetch();

      if (!$other) {
        // Skip broken threads if referenced user no longer exists.
        continue;
      }

      $result[] = [
        'thread_key' => 'u' . $otherId,
        'property_id' => null,
        'property' => null,
        'other_user' => $other,
        'unread_count' => (int)$t['unread_count'],
        'last_message' => $last ? (string)$last['message'] : '',
        'last_created_at' => $last ? (string)$last['created_at'] : null,
        'last_property_id' => $last && $last['property_id'] !== null ? (int)$last['property_id'] : null,
        'last_message_seen' => $last ? (int)$last['seen'] : 0,
        'last_message_from_me' => $last ? ((int)$last['from_user_id'] === $currentId) : false,
      ];
    }

    json_response(['ok' => true, 'threads' => $result]);
    break;

  case 'unread_summary':
    require_method('GET');
    $stmt = $pdo->prepare(
      'SELECT COUNT(*) AS unread_total
       FROM chat_messages
       WHERE to_user_id=:me AND seen=0'
    );
    $stmt->execute([':me' => $currentId]);
    $count = (int)($stmt->fetch()['unread_total'] ?? 0);
    json_response(['ok' => true, 'unread_total' => $count]);
    break;

  default:
    send_error('Unknown action', 400);
}

