<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$authSessionId = current_auth_session_id();
if ($authSessionId > 0) {
  $pdo->prepare('UPDATE user_sessions SET revoked_at = NOW() WHERE id = :id')->execute([':id' => $authSessionId]);
}

$cookieRaw = (string)($_COOKIE[REMEMBER_COOKIE_NAME] ?? '');
if ($cookieRaw !== '' && str_contains($cookieRaw, ':')) {
  [$selector] = explode(':', $cookieRaw, 2);
  if (preg_match('/^[a-f0-9]{32}$/', $selector)) {
    $pdo->prepare('UPDATE user_sessions SET revoked_at = NOW() WHERE session_selector = :sel')->execute([':sel' => $selector]);
  }
}

$_SESSION = [];
if (session_status() === PHP_SESSION_ACTIVE) {
  session_destroy();
}
clear_remember_cookie();

json_response(['ok' => true]);

