<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? 'get');

switch ($action) {
  case 'get':
    require_method('GET');
    $user = app_get_current_user();
    if (!$user) {
      send_error('Unauthorized', 401);
    }
    json_response(['ok' => true, 'user' => $user]);
    break;

  case 'update_profile':
    require_method('POST');
    $user = require_auth();
    $input = get_input();

    $fullName = trim((string)($input['full_name'] ?? ''));
    if ($fullName === '') send_error('Full name is required');
    if (mb_strlen($fullName) > 100) send_error('Full name is too long');

    $stmt = $pdo->prepare('UPDATE users SET full_name = :fn WHERE id = :id');
    $stmt->execute([
      ':fn' => $fullName,
      ':id' => (int)$user['id'],
    ]);

    $freshStmt = $pdo->prepare('SELECT id, full_name, phone, role, is_banned FROM users WHERE id = :id LIMIT 1');
    $freshStmt->execute([':id' => (int)$user['id']]);
    $fresh = $freshStmt->fetch();
    if (!$fresh) send_error('User not found', 404);

    json_response([
      'ok' => true,
      'message' => 'Profile updated successfully',
      'user' => $fresh,
    ]);
    break;

  case 'change_password':
    require_method('POST');
    $user = require_auth();
    $input = get_input();

    $currentPassword = (string)($input['current_password'] ?? '');
    $newPassword = (string)($input['new_password'] ?? '');

    if ($currentPassword === '') send_error('Current password is required');
    if ($newPassword === '') send_error('New password is required');
    if (strlen($newPassword) < 6) send_error('New password must be at least 6 characters');
    if ($currentPassword === $newPassword) send_error('New password must be different from current password');

    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => (int)$user['id']]);
    $dbUser = $stmt->fetch();
    if (!$dbUser) send_error('User not found', 404);

    $storedHash = (string)($dbUser['password_hash'] ?? '');
    if ($storedHash === '' || !password_verify($currentPassword, $storedHash)) {
      send_error('Current password is incorrect', 401);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $upd = $pdo->prepare('UPDATE users SET password_hash = :ph WHERE id = :id');
    $upd->execute([
      ':ph' => $newHash,
      ':id' => (int)$user['id'],
    ]);

    json_response(['ok' => true, 'message' => 'Password changed successfully']);
    break;

  default:
    send_error('Unknown action', 400);
}

