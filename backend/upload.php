<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

require_method('POST');
$user = require_auth(['owner', 'admin']);

// Expected: photos[] (multipart/form-data)
if (!isset($_FILES['photos'])) {
  send_error('photos[] is required');
}

$files = $_FILES['photos'];
$names = $files['name'] ?? null;
if (!is_array($names)) {
  // PHP may send a single file as a string when only one is selected.
  $files = [
    'name' => [$files['name'] ?? ''],
    'type' => [$files['type'] ?? ''],
    'tmp_name' => [$files['tmp_name'] ?? ''],
    'error' => [$files['error'] ?? UPLOAD_ERR_NO_FILE],
    'size' => [$files['size'] ?? 0],
  ];
}

$count = is_array($files['name'] ?? null) ? count($files['name']) : 0;
if ($count <= 0) send_error('No files uploaded', 400);
if ($count > 3) send_error('You can upload up to 3 photos');

$allowedMime = [
  'image/jpeg' => 'jpg',
  'image/png' => 'png',
  'image/webp' => 'webp',
];
$maxBytes = 5 * 1024 * 1024; // 5MB

$uploadDir = __DIR__ . '/../uploads';
if (!is_dir($uploadDir)) {
  mkdir($uploadDir, 0777, true);
}

$basePath = project_base_url();
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$publicBase = rtrim($scheme . '://' . $host . $basePath, '/');

$photoPaths = [];

for ($i = 0; $i < $count; $i++) {
  $tmp = $files['tmp_name'][$i] ?? '';
  $name = $files['name'][$i] ?? '';
  $error = $files['error'][$i] ?? UPLOAD_ERR_NO_FILE;
  $size = (int)($files['size'][$i] ?? 0);

  if ($error !== UPLOAD_ERR_OK) continue;
  if ($size <= 0 || $size > $maxBytes) send_error('One of the images is too large (max 5MB)');

  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->file($tmp) ?: '';
  if (!isset($allowedMime[$mime])) send_error('Invalid image type (allowed: jpg, png, webp)');

  $ext = $allowedMime[$mime];
  $safeBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', (string)$name);
  $filename = 'prop_' . (int)$user['id'] . '_' . time() . '_' . $i . '_' . bin2hex(random_bytes(6)) . '_' . $safeBase . '.' . $ext;
  $destination = $uploadDir . DIRECTORY_SEPARATOR . $filename;

  if (!move_uploaded_file($tmp, $destination)) {
    send_error('Failed to upload image', 500);
  }

  $photoPaths[] = $publicBase . '/uploads/' . $filename;
}

json_response(['ok' => true, 'photo_paths' => $photoPaths]);

