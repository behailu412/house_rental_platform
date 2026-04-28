<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? '');

switch ($action) {
  case 'check_property_updates':
    require_method('GET');
    $user = require_auth(['renter', 'owner', 'admin']);
    $lastCheck = (int)($_GET['last_check'] ?? 0);
    
    // Get newly approved properties since last check
    $stmt = $pdo->prepare(
      "SELECT p.id, p.city, p.subcity, p.property_type, p.price, p.short_description,
              (SELECT pp.image_path FROM property_photos pp 
               WHERE pp.property_id = p.id ORDER BY pp.sort_order ASC, pp.id ASC LIMIT 1) AS cover_photo
       FROM properties p 
       WHERE p.status = 'active' AND p.updated_at > FROM_UNIXTIME(:last_check)
       ORDER BY p.updated_at DESC LIMIT 10"
    );
    $stmt->execute([':last_check' => $lastCheck]);
    $newProperties = $stmt->fetchAll();
    
    // Get user's property updates if owner
    $myPropertyUpdates = [];
    if ($user['role'] === 'owner') {
      $stmt = $pdo->prepare(
        "SELECT p.id, p.status, p.updated_at
         FROM properties p 
         WHERE p.owner_id = :uid AND p.updated_at > FROM_UNIXTIME(:last_check)
         ORDER BY p.updated_at DESC LIMIT 5"
      );
      $stmt->execute([':uid' => (int)$user['id'], ':last_check' => $lastCheck]);
      $myPropertyUpdates = $stmt->fetchAll();
    }
    
    json_response([
      'ok' => true,
      'timestamp' => time(),
      'new_properties' => $newProperties,
      'my_property_updates' => $myPropertyUpdates,
    ]);
    break;

  case 'get_pending_count':
    require_method('GET');
    $user = require_auth(['admin']);
    
    $stmt = $pdo->prepare(
      "SELECT COUNT(*) as count 
       FROM properties p 
       WHERE p.status = 'pending' AND EXISTS (
         SELECT 1 FROM payments pay 
         WHERE pay.property_id = p.id AND pay.status = 'success'
       )"
    );
    $stmt->execute();
    $count = $stmt->fetch()['count'] ?? 0;
    
    json_response(['ok' => true, 'pending_count' => (int)$count]);
    break;

  default:
    send_error('Unknown action', 400);
}
?>
