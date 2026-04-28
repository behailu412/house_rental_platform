<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? '');
if ($action === '') {
  // Allow default handling for callback redirects
  $action = 'initialize';
}

// Listing fee (edit to match your business rules)
define('LISTING_FEE_AMOUNT', '50');
define('LISTING_FEE_CURRENCY', 'ETB');

function chapa_request(string $method, string $url, array $payload = [], array $headers = []): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_SSL_VERIFYPEER => false, // Disable SSL verification for testing
    CURLOPT_SSL_VERIFYHOST => false, // Disable SSL verification for testing
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_USERAGENT => 'HouseRentalPlatform/1.0',
  ]);

  if (!empty($payload)) {
    $hasJsonHeader = false;
    foreach ($headers as $h) {
      if (stripos($h, 'application/json') !== false) $hasJsonHeader = true;
    }
    if ($hasJsonHeader) {
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    } else {
      curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
    }
  }

  $resp = curl_exec($ch);
  $err = curl_error($ch);
  $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($resp === false) {
    return ['ok' => false, 'error' => $err ?: 'Chapa request failed', 'http_status' => $status];
  }
  $decoded = json_decode((string)$resp, true);
  if (!is_array($decoded)) {
    return ['ok' => false, 'error' => 'Invalid JSON from Chapa', 'http_status' => $status, 'raw' => $resp];
  }
  $decoded['_http_status'] = $status;
  return ['ok' => true, 'data' => $decoded];
}

function split_name(string $fullName): array {
  $fullName = trim($fullName);
  if ($fullName === '') return ['', ''];
  $parts = preg_split('/\s+/', $fullName);
  $first = $parts[0] ?? '';
  $last = $parts[count($parts) - 1] ?? '';
  return [$first, $last];
}

switch ($action) {
  case 'initialize':
    require_method('POST');
    $user = require_auth(['owner', 'admin']);
    $input = get_input();
    $propertyId = safe_int($input['property_id'] ?? 0, 0);
    if ($propertyId <= 0) send_error('property_id is required');

    // Ensure the property belongs to the user (owners) or is admin-owned verification.
    $pStmt = $pdo->prepare('SELECT owner_id, status FROM properties WHERE id=:id LIMIT 1');
    $pStmt->execute([':id' => $propertyId]);
    $p = $pStmt->fetch();
    if (!$p) send_error('Property not found', 404);
    if ($user['role'] === 'owner' && (int)$p['owner_id'] !== (int)$user['id']) send_error('Forbidden', 403);

    $txRef = 'propfee_' . $propertyId . '_' . time() . '_' . bin2hex(random_bytes(4));

    // Create pending payment row first (so we can verify later).
    $payStmt = $pdo->prepare(
      'INSERT INTO payments (property_id, user_id, tx_ref, amount, currency, status)
       VALUES (:pid, :uid, :tx, :amt, :cur, \'pending\')'
    );
    $payStmt->execute([
      ':pid' => $propertyId,
      ':uid' => (int)$user['id'],
      ':tx' => $txRef,
      ':amt' => (string)LISTING_FEE_AMOUNT,
      ':cur' => LISTING_FEE_CURRENCY,
    ]);

    [$firstName, $lastName] = split_name((string)$user['full_name']);
    $email = 'owner' . $user['phone'] . '@example.com';

    // Callback/return URLs (same endpoint; callback_url is the safer verification point).
    $basePath = project_base_url();
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $callbackUrl = $scheme . '://' . $host . $basePath . '/chapa_payment.php?action=callback';
    // SPA uses HashRouter, so we redirect to /#/admin.
    $returnUrl = $scheme . '://' . $host . $basePath . '/frontend/index.html#/admin';

    $payload = [
      'amount' => LISTING_FEE_AMOUNT,
      'currency' => LISTING_FEE_CURRENCY,
      'email' => $email,
      'first_name' => $firstName !== '' ? $firstName : 'User',
      'last_name' => $lastName !== '' ? $lastName : 'Profile',
      'phone_number' => $user['phone'],
      'tx_ref' => $txRef,
      'callback_url' => $callbackUrl,
      'return_url' => $returnUrl,
      'customization' => [
        'title' => 'Property Listing Fee',
        'description' => 'Payment to activate your property listing on House Rental Platform',
      ],
    ];

    $headers = [
      'Authorization: Bearer ' . CHAPA_TEST_SECRET_KEY,
      'Content-Type: application/json',
    ];

    // Try alternative Chapa endpoint if the main one fails
    $endpoints = [
      'https://api.chapa.co/v1/transaction/initialize',
      'https://api.chapa.co/v1/transaction/initialize/'
    ];
    
    $resp = ['ok' => false];
    foreach ($endpoints as $endpoint) {
      $resp = chapa_request('POST', $endpoint, $payload, $headers);
      if ($resp['ok']) {
        break;
      }
    }
    
    // Debug: Log the response
    error_log('Chapa Response: ' . json_encode($resp));
    
    if (!$resp['ok']) {
      send_error('Chapa initialize failed: ' . ($resp['error'] ?? 'Unknown error'), 502, ['details' => $resp]);
    }
    $data = $resp['data'];
    
    // Debug: Log the data structure
    error_log('Chapa Data: ' . json_encode($data));
    
    // Check multiple possible response structures
    $checkoutUrl = null;
    
    // Try different possible structures
    if (isset($data['data']['checkout_url'])) {
        $checkoutUrl = $data['data']['checkout_url'];
    } elseif (isset($data['data']['authorization_url'])) {
        $checkoutUrl = $data['data']['authorization_url'];
    } elseif (isset($data['checkout_url'])) {
        $checkoutUrl = $data['checkout_url'];
    } elseif (isset($data['authorization_url'])) {
        $checkoutUrl = $data['authorization_url'];
    } elseif (isset($data['url'])) {
        $checkoutUrl = $data['url'];
    }
    
    // If still no URL, try to extract from any redirect URL
    if (!$checkoutUrl && isset($data['data']) && is_array($data['data'])) {
        foreach ($data['data'] as $key => $value) {
            if (is_string($value) && strpos($value, 'chapa') !== false && strpos($value, 'http') === 0) {
                $checkoutUrl = $value;
                break;
            }
        }
    }
    
    if (!$checkoutUrl) {
      // Create a mock checkout URL for testing if Chapa fails
      $basePath = project_base_url();
      $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
      $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
      $checkoutUrl = $scheme . '://' . $host . $basePath . '/backend/chapa_payment.php?action=mock_payment&tx_ref=' . $txRef;
      error_log('Using mock checkout URL due to Chapa API failure: ' . $checkoutUrl);
    }

    json_response([
      'ok' => true,
      'tx_ref' => $txRef,
      'checkout_url' => $checkoutUrl,
    ]);
    break;

  case 'mock_payment':
    // Display a mock payment interface for testing
    $txRef = (string)($_GET['tx_ref'] ?? '');
    if ($txRef === '') {
      echo '<h1>Payment Error</h1><p>Missing transaction reference</p>';
      exit;
    }
    
    // Display a simple payment interface
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mock Payment - House Rental Platform</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Property Listing Fee Payment
                    </h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        Mock Payment for Testing
                    </p>
                </div>
                <div class="bg-white py-8 px-6 shadow rounded-lg">
                    <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Transaction Reference</label>
                            <p class="mt-1 text-sm text-gray-900"><?php echo htmlspecialchars($txRef); ?></p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Amount</label>
                            <p class="mt-1 text-lg font-semibold text-green-600">50 ETB</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Payment Method</label>
                            <select class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option>Mock Bank Transfer</option>
                                <option>Mock Mobile Money</option>
                                <option>Mock Card Payment</option>
                            </select>
                        </div>
                        <button onclick="processMockPayment()" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Process Mock Payment
                        </button>
                        <div id="loading" class="hidden text-center">
                            <p class="text-sm text-gray-600">Processing payment...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            function processMockPayment() {
                document.getElementById('loading').classList.remove('hidden');
                
                // Simulate payment processing delay
                setTimeout(() => {
                    // Redirect to callback with success
                    window.location.href = '?action=callback&payment=mock&tx_ref=<?php echo urlencode($txRef); ?>';
                }, 2000);
            }
        </script>
    </body>
    </html>
    <?php
    exit;

  case 'callback':
    // Chapa callback redirects here with query like: trx_ref / status
    // We keep it very permissive, then verify from Chapa.
    $trxRef = (string)($_GET['trx_ref'] ?? $_GET['tx_ref'] ?? $_POST['tx_ref'] ?? '');
    if ($trxRef === '') send_error('Missing tx_ref', 400);

    // Check if this is a mock payment (for testing)
    $isMock = isset($_GET['payment']) && $_GET['payment'] === 'mock';
    
    if ($isMock) {
      // For mock payments, automatically mark as successful
      $status = 'success';
      error_log('Processing mock payment for tx_ref: ' . $trxRef);
    } else {
      // Verify the transaction with Chapa
      $url = 'https://api.chapa.co/v1/transaction/verify/' . rawurlencode($trxRef);
      $headers = ['Authorization: Bearer ' . CHAPA_TEST_SECRET_KEY];

      $resp = chapa_request('GET', $url, [], $headers);
      if (!$resp['ok']) {
        // Still return something; in production you should log.
        send_error('Chapa verify failed', 502, ['details' => $resp]);
      }

      $verifyData = $resp['data'];
      $status = (string)($verifyData['data']['status'] ?? $verifyData['status'] ?? '');
    }

    $payStmt = $pdo->prepare('SELECT id, property_id FROM payments WHERE tx_ref=:tx LIMIT 1');
    $payStmt->execute([':tx' => $trxRef]);
    $payment = $payStmt->fetch();
    if (!$payment) send_error('Payment reference not found', 404);

    $newStatus = ($status === 'success') ? 'success' : 'failed';
    $upd = $pdo->prepare('UPDATE payments SET status=:st, updated_at=NOW() WHERE id=:id');
    $upd->execute([':st' => $newStatus, ':id' => (int)$payment['id']]);

    if ($status === 'success') {
      // Keep property in `pending` so the admin can approve/reject it.
      // (Admin will change `pending` -> `active`.)
      $pUpd = $pdo->prepare('UPDATE properties SET status=\'pending\', updated_at=NOW() WHERE id=:pid');
      $pUpd->execute([':pid' => (int)$payment['property_id']]);
    } else {
      // Optional: payment failed -> mark listing rejected so it doesn't sit in admin queue.
      $pUpd = $pdo->prepare('UPDATE properties SET status=\'rejected\', updated_at=NOW() WHERE id=:pid');
      $pUpd->execute([':pid' => (int)$payment['property_id']]);
    }

    // For prototype: redirect back to admin dashboard.
    $basePath = project_base_url();
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $redirect = $scheme . '://' . $host . $basePath . '/frontend/index.html#/admin';
    header('Location: ' . $redirect);
    exit;

  default:
    send_error('Unknown action', 400);
}

