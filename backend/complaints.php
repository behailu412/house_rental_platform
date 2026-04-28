<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$pdo = db();
$action = (string)($_GET['action'] ?? $_POST['action'] ?? 'list');

switch ($action) {
  case 'submit':
    require_method('POST');
    $user = require_auth(['renter', 'owner', 'admin']);
    $input = get_input();

    $type = (string)($input['type'] ?? 'complaint');
    $category = (string)($input['category'] ?? 'other');
    $title = trim((string)($input['title'] ?? ''));
    $description = trim((string)($input['description'] ?? ''));
    $priority = (string)($input['priority'] ?? 'medium');
    $relatedPropertyId = $input['related_property_id'] ?? null;
    $relatedUserId = $input['related_user_id'] ?? null;

    // Validation
    $validTypes = ['complaint', 'feedback', 'suggestion', 'bug_report', 'other'];
    if (!in_array($type, $validTypes, true)) send_error('Invalid type');

    $validCategories = ['property', 'user_behavior', 'payment', 'technical', 'service', 'safety', 'other'];
    if (!in_array($category, $validCategories, true)) send_error('Invalid category');

    $validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!in_array($priority, $validPriorities, true)) send_error('Invalid priority');

    if ($title === '') send_error('Title is required');
    if (mb_strlen($title) < 3) send_error('Title must be at least 3 characters');
    if (mb_strlen($title) > 255) send_error('Title is too long (max 255 characters)');

    if ($description === '') send_error('Description is required');
    if (mb_strlen($description) < 10) send_error('Description must be at least 10 characters');

    // Validate related entities if provided
    if ($relatedPropertyId !== null && $relatedPropertyId !== '') {
        $relatedPropertyId = safe_int($relatedPropertyId, 0);
        if ($relatedPropertyId <= 0) send_error('Invalid property ID');
        
        // Verify property exists
        $propStmt = $pdo->prepare('SELECT id FROM properties WHERE id = :id LIMIT 1');
        $propStmt->execute([':id' => $relatedPropertyId]);
        if (!$propStmt->fetch()) send_error('Property not found');
    } else {
        $relatedPropertyId = null;
    }

    if ($relatedUserId !== null && $relatedUserId !== '') {
        $relatedUserId = safe_int($relatedUserId, 0);
        if ($relatedUserId <= 0) send_error('Invalid user ID');
        
        // Verify user exists and is not the submitter
        $userStmt = $pdo->prepare('SELECT id FROM users WHERE id = :id LIMIT 1');
        $userStmt->execute([':id' => $relatedUserId]);
        if (!$userStmt->fetch()) send_error('User not found');
        
        if ($relatedUserId === (int)$user['id']) send_error('Cannot submit complaint about yourself');
    } else {
        $relatedUserId = null;
    }

    // Insert complaint
    $stmt = $pdo->prepare(
        'INSERT INTO complaints (user_id, type, category, title, description, priority, related_property_id, related_user_id)
         VALUES (:uid, :type, :cat, :title, :desc, :pri, :rpid, :ruid)'
    );
    $stmt->execute([
        ':uid' => (int)$user['id'],
        ':type' => $type,
        ':cat' => $category,
        ':title' => $title,
        ':desc' => $description,
        ':pri' => $priority,
        ':rpid' => $relatedPropertyId,
        ':ruid' => $relatedUserId,
    ]);

    $complaintId = (int)$pdo->lastInsertId();

    // Create initial status history
    $historyStmt = $pdo->prepare(
        'INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, notes)
         VALUES (:cid, NULL, :status, :uid, :notes)'
    );
    $historyStmt->execute([
        ':cid' => $complaintId,
        ':status' => 'pending',
        ':uid' => (int)$user['id'],
        ':notes' => 'Complaint submitted by ' . $user['full_name']
    ]);

    // Notify admins about new complaint
    $adminStmt = $pdo->prepare(
        'SELECT id FROM users WHERE role = \'admin\' AND is_banned = 0'
    );
    $adminStmt->execute();
    $admins = $adminStmt->fetchAll();

    $notifStmt = $pdo->prepare(
        'INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
         VALUES (:uid, :type, :title, :message, :rid, :rtype)'
    );

    foreach ($admins as $admin) {
        $notifStmt->execute([
            ':uid' => (int)$admin['id'],
            ':type' => 'new_complaint',
            ':title' => 'New ' . ucfirst($type) . ' Submitted',
            ':message' => sprintf(
                'A new %s titled "%s" has been submitted by %s. Priority: %s',
                $type,
                $title,
                $user['full_name'],
                $priority
            ),
            ':rid' => $complaintId,
            ':rtype' => 'complaint'
        ]);
    }

    json_response(['ok' => true, 'complaint_id' => $complaintId]);
    break;

  case 'list':
    require_method('GET');
    $user = require_auth(['renter', 'owner', 'admin']);
    
    $limit = safe_int($_GET['limit'] ?? 20, 20);
    $offset = safe_int($_GET['offset'] ?? 0, 0);
    $status = (string)($_GET['status'] ?? '');
    $type = (string)($_GET['type'] ?? '');
    $priority = (string)($_GET['priority'] ?? '');

    $sql = "
      SELECT 
        c.id, c.type, c.category, c.title, c.description, c.priority, c.status,
        c.admin_response, c.responded_at, c.resolution_details, c.resolved_at,
        c.created_at, c.updated_at,
        u.full_name as submitter_name, u.phone as submitter_phone, u.role as submitter_role,
        related_p.city as property_city, related_p.subcity as property_subcity,
        related_u.full_name as related_user_name,
        admin_u.full_name as admin_name
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN properties related_p ON c.related_property_id = related_p.id
      LEFT JOIN users related_u ON c.related_user_id = related_u.id
      LEFT JOIN users admin_u ON c.admin_id = admin_u.id
      WHERE 1=1
    ";

    $params = [];

    // Non-admin users can only see their own complaints
    if ($user['role'] !== 'admin') {
        $sql .= " AND c.user_id = :uid";
        $params[':uid'] = (int)$user['id'];
    }

    // Apply filters
    if ($status !== '') {
        $sql .= " AND c.status = :status";
        $params[':status'] = $status;
    }

    if ($type !== '') {
        $sql .= " AND c.type = :type";
        $params[':type'] = $type;
    }

    if ($priority !== '') {
        $sql .= " AND c.priority = :priority";
        $params[':priority'] = $priority;
    }

    $sql .= " ORDER BY c.priority DESC, c.created_at DESC LIMIT :limit OFFSET :offset";
    $params[':limit'] = $limit;
    $params[':offset'] = $offset;

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stmt->execute();

    $complaints = $stmt->fetchAll();

    // Get total count for pagination
    $countSql = "
      SELECT COUNT(*) as total
      FROM complaints c
      WHERE 1=1
    ";
    $countParams = [];

    if ($user['role'] !== 'admin') {
        $countSql .= " AND c.user_id = :uid";
        $countParams[':uid'] = (int)$user['id'];
    }

    if ($status !== '') {
        $countSql .= " AND c.status = :status";
        $countParams[':status'] = $status;
    }

    if ($type !== '') {
        $countSql .= " AND c.type = :type";
        $countParams[':type'] = $type;
    }

    if ($priority !== '') {
        $countSql .= " AND c.priority = :priority";
        $countParams[':priority'] = $priority;
    }

    $countStmt = $pdo->prepare($countSql);
    foreach ($countParams as $key => $value) {
        $countStmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetch()['total'];

    json_response([
        'ok' => true, 
        'items' => $complaints,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ]);
    break;

  case 'detail':
    require_method('GET');
    $user = require_auth(['renter', 'owner', 'admin']);
    $complaintId = safe_int($_GET['complaint_id'] ?? 0, 0);
    
    if ($complaintId <= 0) send_error('complaint_id is required');

    $stmt = $pdo->prepare(
        'SELECT c.*, u.full_name as submitter_name, u.phone as submitter_phone, u.role as submitter_role,
                related_p.city as property_city, related_p.subcity as property_subcity,
                related_u.full_name as related_user_name, related_u.phone as related_user_phone,
                admin_u.full_name as admin_name,
                (SELECT COUNT(*) FROM complaint_attachments ca WHERE ca.complaint_id = c.id) as attachment_count
         FROM complaints c
         JOIN users u ON c.user_id = u.id
         LEFT JOIN properties related_p ON c.related_property_id = related_p.id
         LEFT JOIN users related_u ON c.related_user_id = related_u.id
         LEFT JOIN users admin_u ON c.admin_id = admin_u.id
         WHERE c.id = :id AND (c.user_id = :uid OR :is_admin = 1)
         LIMIT 1'
    );
    $stmt->execute([
        ':id' => $complaintId,
        ':uid' => (int)$user['id'],
        ':is_admin' => $user['role'] === 'admin' ? 1 : 0
    ]);
    $complaint = $stmt->fetch();

    if (!$complaint) send_error('Complaint not found', 404);

    // Get status history
    $historyStmt = $pdo->prepare(
        'SELECT csh.*, u.full_name as changed_by_name
         FROM complaint_status_history csh
         JOIN users u ON csh.changed_by = u.id
         WHERE csh.complaint_id = :cid
         ORDER BY csh.changed_at ASC'
    );
    $historyStmt->execute([':cid' => $complaintId]);
    $history = $historyStmt->fetchAll();

    // Get attachments
    $attachStmt = $pdo->prepare(
        'SELECT * FROM complaint_attachments WHERE complaint_id = :cid ORDER BY uploaded_at ASC'
    );
    $attachStmt->execute([':cid' => $complaintId]);
    $attachments = $attachStmt->fetchAll();

    json_response([
        'ok' => true,
        'complaint' => $complaint,
        'history' => $history,
        'attachments' => $attachments
    ]);
    break;

  case 'update_status':
    require_method('POST');
    $user = require_auth(['admin']);
    $input = get_input();

    $complaintId = safe_int($input['complaint_id'] ?? 0, 0);
    $newStatus = (string)($input['status'] ?? '');
    $adminResponse = trim((string)($input['admin_response'] ?? ''));
    $resolutionDetails = trim((string)($input['resolution_details'] ?? ''));

    if ($complaintId <= 0) send_error('complaint_id is required');
    
    $validStatuses = ['pending', 'in_progress', 'resolved', 'rejected', 'closed'];
    if (!in_array($newStatus, $validStatuses, true)) send_error('Invalid status');

    // Get current complaint
    $currentStmt = $pdo->prepare('SELECT * FROM complaints WHERE id = :id LIMIT 1');
    $currentStmt->execute([':id' => $complaintId]);
    $current = $currentStmt->fetch();
    if (!$current) send_error('Complaint not found', 404);

    // Update complaint
    $updateSql = "
      UPDATE complaints 
      SET status = :status, updated_at = NOW()
    ";
    $updateParams = [
        ':status' => $newStatus,
        ':id' => $complaintId
    ];

    if ($adminResponse !== '') {
        $updateSql .= ", admin_response = :admin_response, admin_id = :admin_id, responded_at = NOW()";
        $updateParams[':admin_response'] = $adminResponse;
        $updateParams[':admin_id'] = (int)$user['id'];
    }

    if ($resolutionDetails !== '' && in_array($newStatus, ['resolved', 'closed'])) {
        $updateSql .= ", resolution_details = :resolution_details, resolved_by = :resolved_by, resolved_at = NOW()";
        $updateParams[':resolution_details'] = $resolutionDetails;
        $updateParams[':resolved_by'] = (int)$user['id'];
    }

    $updateSql .= " WHERE id = :id";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute($updateParams);

    // Create status history entry
    $historyStmt = $pdo->prepare(
        'INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, notes)
         VALUES (:cid, :old_status, :new_status, :uid, :notes)'
    );
    $historyStmt->execute([
        ':cid' => $complaintId,
        ':old_status' => $current['status'],
        ':new_status' => $newStatus,
        ':uid' => (int)$user['id'],
        ':notes' => $adminResponse ?: 'Status updated by admin'
    ]);

    // Notify the complaint submitter
    if ($newStatus !== $current['status']) {
        $notifStmt = $pdo->prepare(
            'INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
             VALUES (:uid, :type, :title, :message, :rid, :rtype)'
        );
        
        $title = 'Complaint Status Updated';
        $message = sprintf(
            'Your complaint titled "%s" has been updated to: %s',
            $current['title'],
            $newStatus
        );
        
        if ($adminResponse !== '') {
            $message .= '. Admin response: ' . substr($adminResponse, 0, 100) . (strlen($adminResponse) > 100 ? '...' : '');
        }

        $notifStmt->execute([
            ':uid' => (int)$current['user_id'],
            ':type' => 'complaint_update',
            ':title' => $title,
            ':message' => $message,
            ':rid' => $complaintId,
            ':rtype' => 'complaint'
        ]);
    }

    json_response(['ok' => true]);
    break;

  case 'upload_attachment':
    require_method('POST');
    $user = require_auth(['renter', 'owner', 'admin']);
    $complaintId = safe_int($_POST['complaint_id'] ?? 0, 0);
    
    if ($complaintId <= 0) send_error('complaint_id is required');

    // Verify complaint exists and user has permission
    $verifyStmt = $pdo->prepare(
        'SELECT id, user_id FROM complaints WHERE id = :id AND (user_id = :uid OR :is_admin = 1) LIMIT 1'
    );
    $verifyStmt->execute([
        ':id' => $complaintId,
        ':uid' => (int)$user['id'],
        ':is_admin' => $user['role'] === 'admin' ? 1 : 0
    ]);
    if (!$verifyStmt->fetch()) send_error('Complaint not found or no permission', 404);

    // Handle file upload
    if (!isset($_FILES['attachment']) || $_FILES['attachment']['error'] !== UPLOAD_ERR_OK) {
        send_error('File upload failed or no file provided');
    }

    $file = $_FILES['attachment'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword'];

    if ($file['size'] > $maxSize) send_error('File size too large (max 5MB)');
    if (!in_array($file['type'], $allowedTypes)) send_error('File type not allowed');

    // Create complaint uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../uploads/complaints/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = 'complaint_' . $complaintId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $fileExtension;
    $filePath = $uploadDir . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        send_error('Failed to save file');
    }

    // Save to database
    $attachStmt = $pdo->prepare(
        'INSERT INTO complaint_attachments (complaint_id, file_name, file_path, file_size, mime_type)
         VALUES (:cid, :fname, :fpath, :fsize, :mime)'
    );
    $attachStmt->execute([
        ':cid' => $complaintId,
        ':fname' => $file['name'],
        ':fpath' => 'uploads/complaints/' . $fileName,
        ':fsize' => $file['size'],
        ':mime' => $file['type']
    ]);

    json_response(['ok' => true, 'attachment_id' => (int)$pdo->lastInsertId()]);
    break;

  case 'delete':
    require_method('POST');
    $user = require_auth(['admin']);
    $input = get_input();
    $complaintId = safe_int($input['complaint_id'] ?? 0, 0);
    
    if ($complaintId <= 0) send_error('complaint_id is required');

    // Verify complaint exists
    $verifyStmt = $pdo->prepare('SELECT id FROM complaints WHERE id = :id LIMIT 1');
    $verifyStmt->execute([':id' => $complaintId]);
    if (!$verifyStmt->fetch()) send_error('Complaint not found', 404);

    // Delete complaint (cascades will handle related records)
    $deleteStmt = $pdo->prepare('DELETE FROM complaints WHERE id = :id');
    $deleteStmt->execute([':id' => $complaintId]);

    json_response(['ok' => true]);
    break;

  default:
    send_error('Unknown action', 400);
}
