<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

require_method('POST');

$input = get_input();

$identifierRaw = (string)($input['identifier'] ?? '');
$password = (string)($input['password'] ?? '');

$phone = normalize_ethiopia_phone($identifierRaw);
if ($phone === null) send_error('Invalid identifier. Expected 09XXXXXXXX or +2519XXXXXXXX');

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM users WHERE phone = :ph LIMIT 1');
$stmt->execute([':ph' => $phone]);
$user = $stmt->fetch();

if (!$user) send_error('Invalid phone or password', 401);
if (!empty($user['is_banned'])) send_error('Account is blocked', 403);

if (!password_verify($password, (string)$user['password_hash'])) {
  send_error('Invalid phone or password', 401);
}

// Session auth payload
$authUser = [
  'id' => (int)$user['id'],
  'full_name' => (string)$user['full_name'],
  'phone' => (string)$user['phone'],
  'role' => (string)$user['role'],
  'is_banned' => (int)$user['is_banned'],
];

// Create a dedicated device session. This allows one user to stay logged in on multiple devices simultaneously.
$authSession = create_user_session((int)$user['id'], true);
establish_authenticated_session($authUser, (int)$authSession['id']);
set_remember_cookie((string)$authSession['cookie_token'], (int)$authSession['expires_ts']);

json_response(['ok' => true, 'user' => $authUser]);
