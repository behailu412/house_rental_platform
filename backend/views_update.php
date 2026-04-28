<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? 'increment');

switch ($action) {
  case 'increment':
    require_method('POST');
    $input = get_input();
    $propertyId = safe_int($input['property_id'] ?? 0, 0);
    if ($propertyId <= 0) send_error('property_id is required');

    $stmt = $pdo->prepare('UPDATE properties SET views_count = views_count + 1, updated_at=NOW() WHERE id=:id');
    $stmt->execute([':id' => $propertyId]);

    $stmt = $pdo->prepare('SELECT views_count FROM properties WHERE id=:id');
    $stmt->execute([':id' => $propertyId]);
    $views = (int)($stmt->fetch()['views_count'] ?? 0);

    json_response(['ok' => true, 'views_count' => $views]);
    break;

  default:
    send_error('Unknown action', 400);
}

