<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? 'list');

switch ($action) {
  case 'list':
    require_method('GET');
    $user = require_auth(['renter', 'owner', 'admin']);

    $stmt = $pdo->prepare(
      "SELECT
        f.property_id,
        p.city,
        p.subcity,
        p.real_address,
        p.property_type,
        p.price,
        p.views_count,
        p.status,
        (
          SELECT pp.image_path FROM property_photos pp
          WHERE pp.property_id = p.id
          ORDER BY pp.sort_order ASC, pp.id ASC
          LIMIT 1
        ) AS cover_photo
      FROM favorites f
      JOIN properties p ON p.id = f.property_id
      WHERE f.user_id = :uid
      ORDER BY f.created_at DESC
      LIMIT 100"
    );
    $stmt->execute([':uid' => (int)$user['id']]);
    json_response(['ok' => true, 'items' => $stmt->fetchAll()]);
    break;

  case 'add':
    require_method('POST');
    $user = require_auth(['renter', 'owner', 'admin']);
    $input = get_input();
    $propertyId = safe_int($input['property_id'] ?? 0, 0);
    if ($propertyId <= 0) send_error('property_id is required');

    // Only active properties should be favorited by renters.
    $pStmt = $pdo->prepare('SELECT status FROM properties WHERE id=:id LIMIT 1');
    $pStmt->execute([':id' => $propertyId]);
    $status = $pStmt->fetch()['status'] ?? null;
    if (!$status) send_error('Property not found', 404);
    if ($user['role'] === 'renter' && $status !== 'active') send_error('Cannot favorite this property');

    $stmt = $pdo->prepare('INSERT IGNORE INTO favorites (user_id, property_id) VALUES (:uid, :pid)');
    $stmt->execute([':uid' => (int)$user['id'], ':pid' => $propertyId]);
    json_response(['ok' => true]);
    break;

  case 'remove':
    require_method('POST');
    $user = require_auth(['renter', 'owner', 'admin']);
    $input = get_input();
    $propertyId = safe_int($input['property_id'] ?? 0, 0);
    if ($propertyId <= 0) send_error('property_id is required');

    $stmt = $pdo->prepare('DELETE FROM favorites WHERE user_id=:uid AND property_id=:pid');
    $stmt->execute([':uid' => (int)$user['id'], ':pid' => $propertyId]);
    json_response(['ok' => true]);
    break;

  default:
    send_error('Unknown action', 400);
}

