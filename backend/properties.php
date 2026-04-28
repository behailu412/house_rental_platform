<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? 'list');

function should_auto_approve_pending_properties(PDO $pdo): bool {
  $stmt = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'auto_approve_pending_properties' LIMIT 1");
  $stmt->execute();
  $row = $stmt->fetch();
  return (string)($row['setting_value'] ?? '0') === '1';
}

switch ($action) {
  case 'city_autocomplete':
    require_method('GET');
    $q = trim((string)($_GET['q'] ?? ''));
    if ($q === '') json_response(['ok' => true, 'items' => []]);
    $stmt = $pdo->prepare(
      "SELECT DISTINCT city FROM properties
       WHERE status='active' AND city LIKE :q
       ORDER BY city ASC LIMIT 10"
    );
    $stmt->execute([':q' => $q . '%']);
    $items = array_map(fn($r) => $r['city'], $stmt->fetchAll());
    json_response(['ok' => true, 'items' => $items]);
    break;

  case 'subcity_autocomplete':
    require_method('GET');
    $city = trim((string)($_GET['city'] ?? ''));
    if ($city === '') json_response(['ok' => true, 'items' => []]);
    $stmt = $pdo->prepare(
      "SELECT DISTINCT subcity FROM properties
       WHERE status='active' AND city = :city
       ORDER BY subcity ASC LIMIT 10"
    );
    $stmt->execute([':city' => $city]);
    $items = array_map(fn($r) => $r['subcity'], $stmt->fetchAll());
    json_response(['ok' => true, 'items' => $items]);
    break;

  case 'search':
    require_method('GET');
    $city = trim((string)($_GET['city'] ?? ''));
    $subcity = trim((string)($_GET['subcity'] ?? ''));
    $propertyType = trim((string)($_GET['type'] ?? ''));
    $q = trim((string)($_GET['q'] ?? ''));

    $sql = "
      SELECT
        p.id,
        p.city,
        p.subcity,
        p.real_address,
        p.property_type,
        p.short_description,
        p.price,
        p.views_count,
        (
          SELECT pp.image_path FROM property_photos pp
          WHERE pp.property_id = p.id
          ORDER BY pp.sort_order ASC, pp.id ASC
          LIMIT 1
        ) AS cover_photo
      FROM properties p
      WHERE p.status='active'
    ";
    $params = [];
    if ($city !== '') {
      $sql .= " AND p.city = :city ";
      $params[':city'] = $city;
    }
    if ($subcity !== '') {
      $sql .= " AND p.subcity = :subcity ";
      $params[':subcity'] = $subcity;
    }
    if ($propertyType !== '') {
      $sql .= " AND p.property_type = :ptype ";
      $params[':ptype'] = $propertyType;
    }
    if ($q !== '') {
      $sql .= " AND (p.real_address LIKE :q OR p.short_description LIKE :q) ";
      $params[':q'] = '%' . $q . '%';
    }

    $sql .= " ORDER BY p.created_at DESC LIMIT 50";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    json_response(['ok' => true, 'items' => $stmt->fetchAll()]);
    break;

  case 'my_properties':
    require_method('GET');
    $user = require_auth(['owner', 'admin']);
    $stmt = $pdo->prepare(
      "SELECT
         p.id,
         p.city,
         p.subcity,
         p.real_address,
         p.property_type,
         p.short_description,
         p.description,
         p.rules,
         p.price,
         p.views_count,
         p.status,
         p.created_at,
         (
           SELECT pp.image_path FROM property_photos pp
           WHERE pp.property_id = p.id
           ORDER BY pp.sort_order ASC, pp.id ASC
           LIMIT 1
         ) AS cover_photo
       FROM properties p
       WHERE p.owner_id = :uid 
       AND EXISTS (
         SELECT 1 FROM payments pay 
         WHERE pay.property_id = p.id AND pay.status = 'success'
       )
       ORDER BY p.created_at DESC
       LIMIT 50"
    );
    $stmt->execute([':uid' => (int)$user['id']]);
    json_response(['ok' => true, 'items' => $stmt->fetchAll()]);
    break;

  case 'owner_property_detail':
    require_method('GET');
    $user = require_auth(['owner', 'admin']);
    $propertyId = safe_int($_GET['property_id'] ?? 0, 0);
    if ($propertyId <= 0) send_error('property_id is required');

    $pStmt = $pdo->prepare(
      "SELECT
        p.id,
        p.owner_id,
        p.city,
        p.subcity,
        p.real_address,
        p.property_type,
        p.short_description,
        p.description,
        p.rules,
        p.price,
        p.status
       FROM properties p
       WHERE p.id = :id
       LIMIT 1"
    );
    $pStmt->execute([':id' => $propertyId]);
    $property = $pStmt->fetch();
    if (!$property) send_error('Property not found', 404);
    if ($user['role'] === 'owner' && (int)$property['owner_id'] !== (int)$user['id']) send_error('Forbidden', 403);

    $hasPaidStmt = $pdo->prepare(
      "SELECT 1 FROM payments WHERE property_id = :pid AND status = 'success' LIMIT 1"
    );
    $hasPaidStmt->execute([':pid' => $propertyId]);
    if (!$hasPaidStmt->fetch()) send_error('Only paid listings can be managed from this dashboard', 403);

    $photosStmt = $pdo->prepare(
      "SELECT image_path FROM property_photos WHERE property_id = :pid ORDER BY sort_order ASC, id ASC"
    );
    $photosStmt->execute([':pid' => $propertyId]);
    $photoPaths = array_map(static fn($r) => (string)$r['image_path'], $photosStmt->fetchAll());

    unset($property['owner_id']);
    $property['photo_paths'] = $photoPaths;
    json_response(['ok' => true, 'item' => $property]);
    break;

  case 'set_rented':
    require_method('POST');
    $user = require_auth(['owner', 'admin']);
    $input = get_input();
    $propertyId = safe_int($input['property_id'] ?? 0, 0);
    if ($propertyId <= 0) send_error('property_id is required');
    
    // Ensure property belongs to owner
    $pStmt = $pdo->prepare('SELECT owner_id FROM properties WHERE id=:id LIMIT 1');
    $pStmt->execute([':id' => $propertyId]);
    $property = $pStmt->fetch();
    if (!$property) send_error('Property not found', 404);
    if ($user['role'] === 'owner' && (int)$property['owner_id'] !== (int)$user['id']) send_error('Forbidden', 403);
    
    $stmt = $pdo->prepare('UPDATE properties SET status=\'rented\', updated_at=NOW() WHERE id=:id');
    $stmt->execute([':id' => $propertyId]);
    json_response(['ok' => true]);
    break;

  case 'delete_mine':
    require_method('POST');
    $user = require_auth(['owner', 'admin']);
    $input = get_input();
    $propertyId = safe_int($input['property_id'] ?? 0, 0);
    if ($propertyId <= 0) send_error('property_id is required');

    $pStmt = $pdo->prepare('SELECT owner_id, status FROM properties WHERE id=:id LIMIT 1');
    $pStmt->execute([':id' => $propertyId]);
    $property = $pStmt->fetch();
    if (!$property) send_error('Property not found', 404);
    if ($user['role'] === 'owner' && (int)$property['owner_id'] !== (int)$user['id']) send_error('Forbidden', 403);

    if (!in_array((string)$property['status'], ['rented', 'rejected'], true)) {
      send_error('Only rented or rejected listings can be deleted from this section', 400);
    }

    $delStmt = $pdo->prepare('DELETE FROM properties WHERE id = :id');
    $delStmt->execute([':id' => $propertyId]);
    json_response(['ok' => true]);
    break;

  case 'repost_update':
    require_method('POST');
    $user = require_auth(['owner', 'admin']);
    $input = get_input();

    $propertyId = safe_int($input['property_id'] ?? 0, 0);
    if ($propertyId <= 0) send_error('property_id is required');

    $city = trim((string)($input['city'] ?? ''));
    $subcity = trim((string)($input['subcity'] ?? ''));
    $realAddress = trim((string)($input['real_address'] ?? ''));
    $propertyType = trim((string)($input['property_type'] ?? 'Residential'));
    $shortDescription = trim((string)($input['short_description'] ?? ''));
    $description = (string)($input['description'] ?? '');
    $rules = (string)($input['rules'] ?? '');
    $price = safe_float($input['price'] ?? 0.0, 0.0);
    $photoPaths = $input['photo_paths'] ?? [];

    if ($city === '' || $subcity === '' || $realAddress === '') send_error('City, subcity, and real address are required');
    if ($price <= 0) send_error('Price must be greater than 0');

    $validTypes = ['Residential', 'Shop for Rent', 'Event Hall'];
    if (!in_array($propertyType, $validTypes, true)) send_error('Invalid property type');
    if (!is_array($photoPaths)) send_error('photo_paths must be an array');
    if (count($photoPaths) === 0) send_error('At least one photo is required');
    if (count($photoPaths) > 3) send_error('You can upload up to 3 photos');

    $pStmt = $pdo->prepare('SELECT owner_id, status FROM properties WHERE id=:id LIMIT 1');
    $pStmt->execute([':id' => $propertyId]);
    $property = $pStmt->fetch();
    if (!$property) send_error('Property not found', 404);
    if ($user['role'] === 'owner' && (int)$property['owner_id'] !== (int)$user['id']) send_error('Forbidden', 403);

    $currentStatus = (string)$property['status'];
    if (!in_array($currentStatus, ['rented', 'rejected'], true)) {
      send_error('Only rented or rejected listings can be reposted from this section', 400);
    }

    $nextStatus = $currentStatus === 'rejected'
      ? (should_auto_approve_pending_properties($pdo) ? 'active' : 'pending')
      : 'rented';

    $updStmt = $pdo->prepare(
      "UPDATE properties
       SET city=:c,
           subcity=:sc,
           real_address=:ra,
           property_type=:pt,
           short_description=:sd,
           description=:d,
           rules=:r,
           price=:p,
           status=:st,
           updated_at=NOW()
       WHERE id=:id"
    );
    $updStmt->execute([
      ':c' => $city,
      ':sc' => $subcity,
      ':ra' => $realAddress,
      ':pt' => $propertyType,
      ':sd' => $shortDescription !== '' ? $shortDescription : null,
      ':d' => $description !== '' ? $description : null,
      ':r' => $rules !== '' ? $rules : null,
      ':p' => $price,
      ':st' => $nextStatus,
      ':id' => $propertyId,
    ]);

    $pdo->prepare('DELETE FROM property_photos WHERE property_id = :pid')->execute([':pid' => $propertyId]);
    $photoStmt = $pdo->prepare(
      'INSERT INTO property_photos (property_id, image_path, sort_order) VALUES (:pid, :path, :so)'
    );
    $sort = 0;
    foreach ($photoPaths as $path) {
      $path = trim((string)$path);
      if ($path === '') continue;
      $photoStmt->execute([
        ':pid' => $propertyId,
        ':path' => $path,
        ':so' => $sort,
      ]);
      $sort++;
    }

    json_response([
      'ok' => true,
      'property_id' => $propertyId,
      'requires_payment' => $currentStatus === 'rented',
      'submitted_for_approval' => $currentStatus === 'rejected',
    ]);
    break;

  case 'list':
    // Backward-friendly default listing.
    require_method('GET');
    json_response(['ok' => true, 'items' => []]);
    break;

  case 'create_pending':
    require_method('POST');
    $user = require_auth(['owner', 'admin']);
    $input = get_input();

    $city = trim((string)($input['city'] ?? ''));
    $subcity = trim((string)($input['subcity'] ?? ''));
    $realAddress = trim((string)($input['real_address'] ?? ''));
    $propertyType = trim((string)($input['property_type'] ?? 'Residential'));
    $shortDescription = trim((string)($input['short_description'] ?? ''));
    $description = (string)($input['description'] ?? '');
    $rules = (string)($input['rules'] ?? '');
    $price = safe_float($input['price'] ?? 0.0, 0.0);
    $photoPaths = $input['photo_paths'] ?? [];

    if ($city === '' || $subcity === '' || $realAddress === '') send_error('City, subcity, and real address are required');
    if ($price <= 0) send_error('Price must be greater than 0');

    $validTypes = ['Residential', 'Shop for Rent', 'Event Hall'];
    if (!in_array($propertyType, $validTypes, true)) send_error('Invalid property type');

    if (!is_array($photoPaths)) send_error('photo_paths must be an array');
    if (count($photoPaths) > 3) send_error('You can upload up to 3 photos');

    // Insert pending property
    $stmt = $pdo->prepare(
      'INSERT INTO properties (owner_id, city, subcity, real_address, property_type, short_description, description, rules, price, status)
       VALUES (:oid, :c, :sc, :ra, :pt, :sd, :d, :r, :p, \'pending\')'
    );
    $stmt->execute([
      ':oid' => (int)$user['id'],
      ':c' => $city,
      ':sc' => $subcity,
      ':ra' => $realAddress,
      ':pt' => $propertyType,
      ':sd' => $shortDescription !== '' ? $shortDescription : null,
      ':d' => $description !== '' ? $description : null,
      ':r' => $rules !== '' ? $rules : null,
      ':p' => $price,
    ]);
    $propertyId = (int)$pdo->lastInsertId();

    // Store photos
    $sort = 0;
    $photoStmt = $pdo->prepare(
      'INSERT INTO property_photos (property_id, image_path, sort_order) VALUES (:pid, :path, :so)'
    );
    foreach ($photoPaths as $path) {
      $path = (string)$path;
      if ($path === '') continue;
      $photoStmt->execute([
        ':pid' => $propertyId,
        ':path' => $path,
        ':so' => $sort,
      ]);
      $sort++;
    }

    json_response(['ok' => true, 'property_id' => $propertyId]);
    break;

  default:
    send_error('Unknown action', 400);
}

