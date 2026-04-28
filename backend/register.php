<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

require_method('POST');

$input = get_input();

$fullName = trim((string)($input['full_name'] ?? ''));
$phoneRaw = (string)($input['phone'] ?? '');
$role = (string)($input['role'] ?? 'renter');
$password = (string)($input['password'] ?? '');
$confirmPassword = (string)($input['confirm_password'] ?? '');

if ($fullName === '') send_error('Full name is required');

$phone = normalize_ethiopia_phone($phoneRaw);
if ($phone === null) send_error('Invalid phone number. Expected 09XXXXXXXX or +2519XXXXXXXX');

if (!in_array($role, ['renter', 'owner'], true)) {
  send_error('Invalid role');
}

// Password rules: minimum 6 characters
if (mb_strlen($password) < 6) send_error('Password must be at least 6 characters');
if ($password !== $confirmPassword) send_error('Password confirmation does not match');

$pdo = db();

try {
  // Check existing
  $stmt = $pdo->prepare('SELECT id FROM users WHERE phone = :p LIMIT 1');
  $stmt->execute([':p' => $phone]);
  if ($stmt->fetch()) {
    send_error('Phone number already registered', 409);
  }

  $passwordHash = password_hash($password, PASSWORD_BCRYPT);

  $stmt = $pdo->prepare(
    'INSERT INTO users (full_name, phone, role, password_hash) VALUES (:fn, :ph, :r, :pw)'
  );
  $stmt->execute([
    ':fn' => $fullName,
    ':ph' => $phone,
    ':r' => $role,
    ':pw' => $passwordHash,
  ]);

  json_response(['ok' => true]);
} catch (Throwable $e) {
  // Keep response JSON so the frontend can display a meaningful error.
  send_error('Database error', 500, ['details' => $e->getMessage()]);
}

