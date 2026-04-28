<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? '');

// Listing fee configuration
define('LISTING_FEE_AMOUNT', '50');
define('LISTING_FEE_CURRENCY', 'ETB');

function chapa_request(string $method, string $url, array $payload = [], array $headers = []): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
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

    // Verify property ownership
    $pStmt = $pdo->prepare('SELECT owner_id, status FROM properties WHERE id=:id LIMIT 1');
    $pStmt->execute([':id' => $propertyId]);
    $p = $pStmt->fetch();
    if (!$p) send_error('Property not found', 404);
    if ($user['role'] === 'owner' && (int)$p['owner_id'] !== (int)$user['id']) send_error('Forbidden', 403);

    $txRef = 'propfee_' . $propertyId . '_' . time() . '_' . bin2hex(random_bytes(4));

    // Create pending payment record
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

    // Return payment page URL instead of direct Chapa checkout
    $basePath = project_base_url();
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $paymentPageUrl = $scheme . '://' . $host . $basePath . '/backend/chapa_payment_new.php?action=payment_page&tx_ref=' . $txRef;

    json_response([
      'ok' => true,
      'tx_ref' => $txRef,
      'payment_page_url' => $paymentPageUrl,
    ]);
    break;

  case 'payment_page':
    // Display payment method selection page
    $txRef = (string)($_GET['tx_ref'] ?? '');
    if ($txRef === '') {
      echo '<h1>Payment Error</h1><p>Missing transaction reference</p>';
      exit;
    }

    // Verify payment exists
    $payStmt = $pdo->prepare('SELECT p.*, pr.city, pr.subcity, pr.real_address, pr.property_type FROM payments p JOIN properties pr ON p.property_id = pr.id WHERE p.tx_ref=:tx LIMIT 1');
    $payStmt->execute([':tx' => $txRef]);
    $payment = $payStmt->fetch();
    if (!$payment) {
      echo '<h1>Payment Error</h1><p>Invalid transaction reference</p>';
      exit;
    }
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Property Listing Fee Payment - House Rental Platform</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-4xl w-full">
                <!-- Header -->
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-900 mb-2">Property Listing Fee Payment</h1>
                    <p class="text-lg text-gray-600">Complete your payment to activate the property listing</p>
                </div>

                <!-- Payment Summary Card -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold text-gray-800">Payment Summary</h2>
                        <span class="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">Pending Approval</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">Transaction Reference</p>
                            <p class="font-mono text-sm text-gray-900"><?php echo htmlspecialchars($txRef); ?></p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Amount</p>
                            <p class="text-2xl font-bold text-green-600"><?php echo htmlspecialchars($payment['amount']); ?> ETB</p>
                        </div>
                    </div>
                </div>

                <!-- Payment Method Selection -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-6">Choose Payment Method</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- CBE Bank Option -->
                        <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer payment-method" data-method="cbe">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                    <i class="fas fa-university text-blue-600 text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-800">Commercial Bank of Ethiopia</h3>
                                    <p class="text-sm text-gray-600">Bank Transfer Payment</p>
                                </div>
                            </div>
                            <div class="payment-method-details hidden" id="cbe-details">
                                <div class="bg-gray-50 rounded-lg p-4 mt-4">
                                    <h4 class="font-semibold text-gray-700 mb-3">Bank Transfer Details</h4>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Bank Name:</span>
                                            <span class="font-medium">Commercial Bank of Ethiopia</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Account Name:</span>
                                            <span class="font-medium">House Rental Platform</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Account Number:</span>
                                            <span class="font-mono font-medium">1000123456789</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Branch:</span>
                                            <span class="font-medium">Bole Branch</span>
                                        </div>
                                    </div>
                                    <button onclick="processPayment('cbe')" class="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                        <i class="fas fa-check-circle mr-2"></i>I Have Paid - Confirm Payment
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Telebirr Option -->
                        <div class="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors cursor-pointer payment-method" data-method="telebirr">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                    <i class="fas fa-mobile-alt text-green-600 text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-800">Telebirr</h3>
                                    <p class="text-sm text-gray-600">Mobile Money Payment</p>
                                </div>
                            </div>
                            <div class="payment-method-details hidden" id="telebirr-details">
                                <div class="bg-gray-50 rounded-lg p-4 mt-4">
                                    <h4 class="font-semibold text-gray-700 mb-3">Telebirr Payment</h4>
                                    <div class="text-center mb-4">
                                        <div class="w-32 h-32 bg-green-600 rounded-lg mx-auto flex items-center justify-center mb-3">
                                            <i class="fas fa-qrcode text-white text-6xl"></i>
                                        </div>
                                        <p class="text-sm text-gray-600">Scan QR code with Telebirr app</p>
                                    </div>
                                    <div class="space-y-2 text-sm mb-4">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Merchant Code:</span>
                                            <span class="font-mono font-medium">123456</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Phone Number:</span>
                                            <span class="font-medium">+251911234567</span>
                                        </div>
                                    </div>
                                    <button onclick="processPayment('telebirr')" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                                        <i class="fas fa-check-circle mr-2"></i>I Have Paid - Confirm Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Loading Overlay -->
                <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden">
                    <div class="bg-white rounded-lg p-8 max-w-sm w-full">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p class="text-lg font-semibold text-gray-800">Processing Payment...</p>
                            <p class="text-sm text-gray-600 mt-2">Please wait while we verify your payment</p>
                        </div>
                    </div>
                </div>

                <!-- Success Modal -->
                <div id="successModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden">
                    <div class="bg-white rounded-lg p-8 max-w-md w-full">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-check text-green-600 text-2xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
                            <p class="text-gray-600 mb-6">Your property listing is now pending approval by the admin.</p>
                            <button onclick="redirectToDashboard()" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Failure Modal -->
                <div id="failureModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden">
                    <div class="bg-white rounded-lg p-8 max-w-md w-full">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-times text-red-600 text-2xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">Payment Unsuccessful</h3>
                            <p class="text-gray-600 mb-6">We couldn't verify your payment. Please try again.</p>
                            <button onclick="location.reload()" class="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Payment method selection
            document.querySelectorAll('.payment-method').forEach(method => {
                method.addEventListener('click', function() {
                    // Hide all details
                    document.querySelectorAll('.payment-method-details').forEach(detail => {
                        detail.classList.add('hidden');
                    });
                    
                    // Remove active state from all methods
                    document.querySelectorAll('.payment-method').forEach(m => {
                        m.classList.remove('border-blue-500', 'border-green-500', 'bg-blue-50', 'bg-green-50');
                    });
                    
                    // Show selected method details
                    const selectedMethod = this.dataset.method;
                    document.getElementById(selectedMethod + '-details').classList.remove('hidden');
                    
                    // Add active state
                    if (selectedMethod === 'cbe') {
                        this.classList.add('border-blue-500', 'bg-blue-50');
                    } else {
                        this.classList.add('border-green-500', 'bg-green-50');
                    }
                });
            });

            function processPayment(method) {
                document.getElementById('loadingOverlay').classList.remove('hidden');
                
                // Simulate payment processing
                setTimeout(() => {
                    // Call backend to verify payment
                    fetch('?action=verify_payment&tx_ref=<?php echo urlencode($txRef); ?>&method=' + method, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('loadingOverlay').classList.add('hidden');
                        
                        if (data.ok && data.success) {
                            document.getElementById('successModal').classList.remove('hidden');
                        } else {
                            document.getElementById('failureModal').classList.remove('hidden');
                        }
                    })
                    .catch(error => {
                        document.getElementById('loadingOverlay').classList.add('hidden');
                        document.getElementById('failureModal').classList.remove('hidden');
                    });
                }, 3000);
            }

            function redirectToDashboard() {
                const basePath = window.location.pathname.replace(/\/backend\/chapa_payment_new\.php.*$/, '');
                window.location.href = window.location.origin + basePath + '/frontend/index.html#/admin';
            }
        </script>
    </body>
    </html>
    <?php
    exit;

  case 'verify_payment':
    require_method('POST');
    $txRef = (string)($_GET['tx_ref'] ?? '');
    $method = (string)($_GET['method'] ?? '');
    
    if ($txRef === '' || $method === '') {
      json_response(['ok' => false, 'error' => 'Missing parameters']);
    }

    // For test mode, simulate payment verification
    // In production, integrate with actual bank and Telebirr APIs
    $success = true; // Simulate successful payment for testing
    
    if ($success) {
      // Update payment status
      $payStmt = $pdo->prepare('SELECT id, property_id FROM payments WHERE tx_ref=:tx LIMIT 1');
      $payStmt->execute([':tx' => $txRef]);
      $payment = $payStmt->fetch();
      
      if ($payment) {
        $upd = $pdo->prepare('UPDATE payments SET status=\'success\', updated_at=NOW() WHERE id=:id');
        $upd->execute([':id' => (int)$payment['id']]);
        
        // Update property status to pending (waiting for admin approval)
        $pUpd = $pdo->prepare('UPDATE properties SET status=\'pending\', updated_at=NOW() WHERE id=:pid');
        $pUpd->execute([':pid' => (int)$payment['property_id']]);
        
        json_response(['ok' => true, 'success' => true, 'message' => 'Payment verified successfully']);
      } else {
        json_response(['ok' => false, 'error' => 'Payment not found']);
      }
    } else {
      json_response(['ok' => false, 'success' => false, 'error' => 'Payment verification failed']);
    }
    break;

  case 'callback':
    // Handle Chapa callback (for future integration)
    $trxRef = (string)($_GET['trx_ref'] ?? $_GET['tx_ref'] ?? $_POST['tx_ref'] ?? '');
    if ($trxRef === '') send_error('Missing tx_ref', 400);

    // Verify with Chapa API
    $url = 'https://api.chapa.co/v1/transaction/verify/' . rawurlencode($trxRef);
    $headers = ['Authorization: Bearer ' . CHAPA_TEST_SECRET_KEY];

    $resp = chapa_request('GET', $url, [], $headers);
    if (!$resp['ok']) {
      send_error('Chapa verify failed', 502, ['details' => $resp]);
    }

    $verifyData = $resp['data'];
    $status = (string)($verifyData['data']['status'] ?? $verifyData['status'] ?? '');

    $payStmt = $pdo->prepare('SELECT id, property_id FROM payments WHERE tx_ref=:tx LIMIT 1');
    $payStmt->execute([':tx' => $trxRef]);
    $payment = $payStmt->fetch();
    if (!$payment) send_error('Payment reference not found', 404);

    $newStatus = ($status === 'success') ? 'success' : 'failed';
    $upd = $pdo->prepare('UPDATE payments SET status=:st, updated_at=NOW() WHERE id=:id');
    $upd->execute([':st' => $newStatus, ':id' => (int)$payment['id']]);

    if ($status === 'success') {
      $pUpd = $pdo->prepare('UPDATE properties SET status=\'pending\', updated_at=NOW() WHERE id=:pid');
      $pUpd->execute([':pid' => (int)$payment['property_id']]);
    } else {
      $pUpd = $pdo->prepare('UPDATE properties SET status=\'rejected\', updated_at=NOW() WHERE id=:pid');
      $pUpd->execute([':pid' => (int)$payment['property_id']]);
    }

    // Redirect to admin dashboard
    $basePath = project_base_url();
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $redirect = $scheme . '://' . $host . $basePath . '/frontend/index.html#/admin';
    header('Location: ' . $redirect);
    exit;

  default:
    send_error('Unknown action', 400);
}
?>
