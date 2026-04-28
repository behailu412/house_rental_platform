<?php
declare(strict_types=1);

// Central configuration + helpers for all backend endpoints.

// =========================
// Database config (edit for your environment)
// =========================
// XAMPP typical MySQL:
// - host: 127.0.0.1 or localhost
// - user: root
// - pass: empty
// - database: house_rental_platform (see database/rental_db.sql)

define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('DB_NAME') ?: 'house_rental_platform');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Chapa (test) keys from your prompt.
// NOTE: In production, move secrets to environment variables and never commit them.
define('CHAPA_TEST_PUBLIC_KEY', 'CHAPUBK_TEST-Lvg3CF8nsz3a5EzW2kMxpO1mxJhE2yC6');
define('CHAPA_TEST_SECRET_KEY', 'CHASECK_TEST-roEhImmhLSL7ijYcObqFkbNoH6Pmt5BU');
define('CHAPA_ENCRYPTION_KEY', 'B5Hl69oJN88bminsZCeFsKQO');

define('REMEMBER_COOKIE_NAME', 'remember_token');
define('REMEMBER_TTL_DAYS', 30);
define('SESSION_TTL_DAYS', 30);

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'httponly' => true,
  'samesite' => 'Lax',
  'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

// Allow React (dev/prod) to call PHP endpoints with cookies.
// We reflect the Origin to avoid breaking local development.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
  header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;

  $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
  $pdo = new PDO($dsn, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  return $pdo;
}

function json_response(array $data, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

function get_input(): array {
  $contentType = $_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '');
  $raw = file_get_contents('php://input') ?: '';
  $rawTrim = trim($raw);

  // JSON requests: decode from raw body.
  if (
    str_contains((string)$contentType, 'application/json')
    || $rawTrim !== '' && (str_starts_with($rawTrim, '{') || str_starts_with($rawTrim, '['))
  ) {
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
  }

  // Accept form-url-encoded or multipart
  return $_POST ?? [];
}

function send_error(string $message, int $status = 400, array $extra = []): void {
  $payload = ['ok' => false, 'error' => $message];
  if (!empty($extra)) $payload = array_merge($payload, $extra);
  json_response($payload, $status);
  exit;
}

function require_method(string $method): void {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
    send_error('Method not allowed', 405);
  }
}

function normalize_ethiopia_phone(string $input): ?string {
  $raw = preg_replace('/\s+/', '', trim($input));
  if ($raw === '') return null;

  // Local format: exactly 10 characters (09 + 8 digits)
  if (preg_match('/^09\d{8}$/', $raw) === 1) {
    return $raw;
  }

  // International format: exactly 12 characters after + (+2519 + 8 digits = 12 chars)
  // Example: +251912345678 (total 13 chars with +)
  if (preg_match('/^\+2519\d{8}$/', $raw) === 1) {
    // +2519XXXXXXXX -> 09XXXXXXXX
    return '09' . substr($raw, 5);
  }

  // Also tolerate users who remove the `+` and send `2519XXXXXXXX` (12 digits total).
  if (preg_match('/^2519\d{8}$/', $raw) === 1) {
    return '09' . substr($raw, 4);
  }

  // Reject everything else (prevents storing 9-digit values like "9XXXXXXXX").
  return null;
}

function ensure_users_phone_schema_and_data(): void {
  // If your existing DB was created with `phone` as an integer type,
  // leading `0` will be lost (e.g., "0944..." becomes "944...").
  // This function ensures `users.phone` is VARCHAR and normalizes old values.
  try {
    $pdo = db();
    $stmt = $pdo->prepare(
      "SELECT DATA_TYPE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'
       LIMIT 1"
    );
    $stmt->execute([':db' => DB_NAME]);
    $row = $stmt->fetch();
    if (!$row) return;

    $dataType = strtolower((string)$row['DATA_TYPE']);
    $isNumeric = in_array($dataType, ['int', 'bigint', 'smallint', 'mediumint', 'tinyint', 'decimal', 'numeric', 'float', 'double'], true);

    // Check if we even need to modify existing data.
    $needsFix = $isNumeric;
    if (!$needsFix) {
      $cntStmt = $pdo->query(
        "SELECT COUNT(*) AS c
         FROM users
         WHERE CHAR_LENGTH(phone)=9 AND phone REGEXP '^[0-9]{9}$' AND phone LIKE '9%'"
      );
      $cnt = (int)($cntStmt->fetch()['c'] ?? 0);
      $needsFix = $cnt > 0;
    }

    if (!$needsFix) return;

    if ($isNumeric) {
      $pdo->exec("ALTER TABLE users MODIFY phone VARCHAR(20) NOT NULL UNIQUE");
    }

    // Normalize any 9-digit values (missing the leading zero) into 10-digit local format.
    // Example:
    //   9XXXXXXXX -> 09XXXXXXXX
    $pdo->exec(
      "UPDATE users
       SET phone = CONCAT('0', phone)
       WHERE CHAR_LENGTH(phone)=9 AND phone REGEXP '^[0-9]{9}$' AND phone LIKE '9%'"
    );

    // Final cleanup: apply normalization function to recent users.
    $rows = $pdo->query("SELECT id, phone FROM users LIMIT 500")->fetchAll();
    foreach ($rows as $r) {
      $normalized = normalize_ethiopia_phone((string)$r['phone']);
      if ($normalized && $normalized !== (string)$r['phone']) {
        $upd = $pdo->prepare('UPDATE users SET phone=:p WHERE id=:id');
        $upd->execute([':p' => $normalized, ':id' => (int)$r['id']]);
      }
    }
  } catch (Throwable $e) {
    // Prototype safety: never block app if migrations fail.
  }
}

function ensure_admin_user(): void {
  // Seed the required admin credentials automatically for your prototype.
  $adminPhoneRaw = '0944794893';
  $adminPassword = 'By122119';
  $adminFullName = 'Admin';

  try {
    $pdo = db();
    $adminPhone = normalize_ethiopia_phone($adminPhoneRaw);
    if (!$adminPhone) return;

    $stmt = $pdo->prepare('SELECT id FROM users WHERE phone = :p LIMIT 1');
    $stmt->execute([':p' => $adminPhone]);
    if ($stmt->fetch()) return;

    $passwordHash = password_hash($adminPassword, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare(
      'INSERT INTO users (full_name, phone, role, password_hash) VALUES (:fn, :ph, \'admin\', :pw)'
    );
    $stmt->execute([
      ':fn' => $adminFullName,
      ':ph' => $adminPhone,
      ':pw' => $passwordHash,
    ]);
  } catch (Throwable $e) {
    // Ignore seeding issues.
  }
}

function project_base_url(): string {
  // For example:
  // /house_rental_%20platform/backend/login.php -> /house_rental_%20platform
  $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
  $scriptName = str_replace('\\', '/', $scriptName);
  $scriptDir = rtrim(dirname($scriptName), '/');
  return preg_replace('#/backend$#', '', $scriptDir) ?: '';
}

function cookie_secure_flag(): bool {
  return !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
}

function set_remember_cookie(string $token, int $expiresTs): void {
  setcookie(REMEMBER_COOKIE_NAME, $token, [
    'expires' => $expiresTs,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => cookie_secure_flag(),
  ]);
}

function clear_remember_cookie(): void {
  setcookie(REMEMBER_COOKIE_NAME, '', [
    'expires' => time() - 3600,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => cookie_secure_flag(),
  ]);
}

function client_ip(): string {
  $raw = (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '');
  if ($raw === '') return '';
  $parts = explode(',', $raw);
  return trim((string)($parts[0] ?? ''));
}

function client_user_agent(): string {
  return substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
}

function ensure_user_sessions_schema(): void {
  try {
    $pdo = db();
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS user_sessions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_selector CHAR(32) NOT NULL UNIQUE,
        session_token_hash CHAR(64) NOT NULL,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(255) NULL,
        is_persistent TINYINT(1) NOT NULL DEFAULT 1,
        last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_sessions_user_id (user_id),
        INDEX idx_user_sessions_expires (expires_at),
        CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB"
    );
  } catch (Throwable $e) {
    // Never block app startup on schema migration issues.
  }
}

function create_user_session(int $userId, bool $persistent = true): array {
  $pdo = db();
  $selector = bin2hex(random_bytes(16));
  $tokenRaw = bin2hex(random_bytes(32));
  $tokenHash = hash('sha256', $tokenRaw);
  $ttlDays = $persistent ? REMEMBER_TTL_DAYS : SESSION_TTL_DAYS;
  $expiresAt = new DateTimeImmutable('+' . $ttlDays . ' days');

  $stmt = $pdo->prepare(
    'INSERT INTO user_sessions (user_id, session_selector, session_token_hash, ip_address, user_agent, is_persistent, last_seen_at, expires_at)
     VALUES (:uid, :sel, :th, :ip, :ua, :persistent, NOW(), :ex)'
  );
  $stmt->execute([
    ':uid' => $userId,
    ':sel' => $selector,
    ':th' => $tokenHash,
    ':ip' => client_ip(),
    ':ua' => client_user_agent(),
    ':persistent' => $persistent ? 1 : 0,
    ':ex' => $expiresAt->format('Y-m-d H:i:s'),
  ]);

  return [
    'id' => (int)$pdo->lastInsertId(),
    'cookie_token' => $selector . ':' . $tokenRaw,
    'expires_ts' => $expiresAt->getTimestamp(),
  ];
}

function establish_authenticated_session(array $user, int $authSessionId): void {
  session_regenerate_id(true);
  $_SESSION['auth_user_id'] = (int)$user['id'];
  $_SESSION['auth_session_id'] = $authSessionId;
}

function current_auth_session_id(): int {
  return safe_int($_SESSION['auth_session_id'] ?? 0, 0);
}

function current_auth_user_id(): int {
  return safe_int($_SESSION['auth_user_id'] ?? 0, 0);
}

function load_user_by_id(int $userId): ?array {
  if ($userId <= 0) return null;
  $stmt = db()->prepare('SELECT id, full_name, phone, role, is_banned FROM users WHERE id = :id LIMIT 1');
  $stmt->execute([':id' => $userId]);
  $user = $stmt->fetch();
  return $user ?: null;
}

function app_get_current_user(): ?array {
  $pdo = db();
  $authUserId = current_auth_user_id();
  $authSessionId = current_auth_session_id();

  if ($authUserId > 0 && $authSessionId > 0) {
    $stmt = $pdo->prepare(
      'SELECT id FROM user_sessions
       WHERE id = :sid AND user_id = :uid AND revoked_at IS NULL AND expires_at > NOW()
       LIMIT 1'
    );
    $stmt->execute([':sid' => $authSessionId, ':uid' => $authUserId]);
    $sessionRow = $stmt->fetch();
    if ($sessionRow) {
      $pdo->prepare('UPDATE user_sessions SET last_seen_at = NOW() WHERE id = :sid')->execute([':sid' => $authSessionId]);
      return load_user_by_id($authUserId);
    }
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) session_destroy();
  }

  $cookieRaw = (string)($_COOKIE[REMEMBER_COOKIE_NAME] ?? '');
  if ($cookieRaw === '' || !str_contains($cookieRaw, ':')) return null;
  [$selector, $tokenRaw] = explode(':', $cookieRaw, 2);
  if ($selector === '' || $tokenRaw === '') return null;
  if (!preg_match('/^[a-f0-9]{32}$/', $selector)) return null;

  $stmt = $pdo->prepare(
    'SELECT us.id, us.user_id, us.session_token_hash, us.expires_at, us.revoked_at, u.id AS uid, u.full_name, u.phone, u.role, u.is_banned
     FROM user_sessions us
     JOIN users u ON u.id = us.user_id
     WHERE us.session_selector = :sel
     LIMIT 1'
  );
  $stmt->execute([':sel' => $selector]);
  $row = $stmt->fetch();
  if (!$row) {
    clear_remember_cookie();
    return null;
  }

  if (!empty($row['revoked_at'])) {
    clear_remember_cookie();
    return null;
  }

  $expiresAt = strtotime((string)$row['expires_at']);
  if (!$expiresAt || $expiresAt <= time()) {
    $pdo->prepare('UPDATE user_sessions SET revoked_at = NOW() WHERE id = :id')->execute([':id' => (int)$row['id']]);
    clear_remember_cookie();
    return null;
  }

  $incomingHash = hash('sha256', $tokenRaw);
  if (!hash_equals((string)$row['session_token_hash'], $incomingHash)) {
    $pdo->prepare('UPDATE user_sessions SET revoked_at = NOW() WHERE id = :id')->execute([':id' => (int)$row['id']]);
    clear_remember_cookie();
    return null;
  }

  $pdo->prepare(
    'UPDATE user_sessions
     SET last_seen_at = NOW(), ip_address = :ip, user_agent = :ua
     WHERE id = :id'
  )->execute([
    ':ip' => client_ip(),
    ':ua' => client_user_agent(),
    ':id' => (int)$row['id'],
  ]);

  $user = [
    'id' => (int)$row['uid'],
    'full_name' => (string)$row['full_name'],
    'phone' => (string)$row['phone'],
    'role' => (string)$row['role'],
    'is_banned' => (int)$row['is_banned'],
  ];
  establish_authenticated_session($user, (int)$row['id']);
  set_remember_cookie($cookieRaw, $expiresAt);
  return $user;
}

function require_auth(?array $roles = null): array {
  $user = app_get_current_user();
  if (!$user) send_error('Unauthorized', 401);
  if (!empty($user['is_banned'])) send_error('Account is blocked', 403);

  if ($roles && !in_array($user['role'], $roles, true)) {
    send_error('Forbidden', 403);
  }
  return $user;
}

function safe_int($v, int $default = 0): int {
  if (is_int($v)) return $v;
  if (!is_numeric($v)) return $default;
  return (int)$v;
}

function safe_float($v, float $default = 0.0): float {
  if (is_float($v) || is_int($v)) return (float)$v;
  if (!is_numeric($v)) return $default;
  return (float)$v;
}

// --- Prototype auto-fixes ---
ensure_users_phone_schema_and_data();
ensure_admin_user();
ensure_user_sessions_schema();

