<?php
// backend/api/settings.php

require_once '../includes/cors.php';
require_once '../includes/session.php';
require_once '../config/database.php';

requireLogin();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
switch ($action) {
    case 'profile':
        if ($method === 'GET')  getProfile();
        if ($method === 'POST') updateProfile();
        break;
    case 'password':      updatePassword();      break;
    case 'notifications':
        if ($method === 'GET')  getNotifications();
        if ($method === 'POST') updateNotifications();
        break;
    case 'export':  exportCSV();       break;
    case 'delete':  deleteAccount();   break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

// ── GET PROFILE ──────────────────────────────────────────────
function getProfile() {
    $uid  = getCurrentUserId();
    $conn = getDBConnection();
    $stmt = $conn->prepare('SELECT first_name, last_name, email FROM users WHERE id=?');
    $stmt->bind_param('i', $uid);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close(); $conn->close();
    echo json_encode(['success' => true, 'data' => $user]);
}

// ── UPDATE PROFILE ───────────────────────────────────────────
function updateProfile() {
    $uid        = getCurrentUserId();
    $data       = json_decode(file_get_contents('php://input'), true);
    $first_name = trim($data['first_name'] ?? '');
    $last_name  = trim($data['last_name']  ?? '');
    $email      = trim($data['email']      ?? '');

    if (!$first_name || !$last_name || !$email) {
        echo json_encode(['success' => false, 'message' => 'All fields required']); return;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email']); return;
    }

    $conn = getDBConnection();
    $stmt = $conn->prepare('UPDATE users SET first_name=?,last_name=?,email=? WHERE id=?');
    $stmt->bind_param('sssi', $first_name, $last_name, $email, $uid);
    $ok = $stmt->execute();
    $stmt->close(); $conn->close();

    if ($ok) {
        $_SESSION['user_name']  = $first_name . ' ' . $last_name;
        $_SESSION['user_email'] = $email;
        echo json_encode(['success' => true, 'message' => 'Profile updated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Update failed']);
    }
}

// ── UPDATE PASSWORD ──────────────────────────────────────────
function updatePassword() {
    $uid      = getCurrentUserId();
    $data     = json_decode(file_get_contents('php://input'), true);
    $current  = $data['current_password']  ?? '';
    $new_p    = $data['new_password']      ?? '';
    $confirm  = $data['confirm_password']  ?? '';

    if (!$current || !$new_p || !$confirm) {
        echo json_encode(['success' => false, 'message' => 'All fields required']); return;
    }
    if ($new_p !== $confirm) {
        echo json_encode(['success' => false, 'message' => 'New passwords do not match']); return;
    }
    if (strlen($new_p) < 6) {
        echo json_encode(['success' => false, 'message' => 'Min 6 characters']); return;
    }

    $conn = getDBConnection();
    $stmt = $conn->prepare('SELECT password FROM users WHERE id=?');
    $stmt->bind_param('i', $uid); $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc(); $stmt->close();

    if (!password_verify($current, $user['password'])) {
        $conn->close();
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect']); return;
    }

    $hash = password_hash($new_p, PASSWORD_DEFAULT);
    $stmt = $conn->prepare('UPDATE users SET password=? WHERE id=?');
    $stmt->bind_param('si', $hash, $uid);
    $ok = $stmt->execute(); $stmt->close(); $conn->close();

    echo json_encode(['success' => $ok, 'message' => $ok ? 'Password updated' : 'Update failed']);
}

// ── GET NOTIFICATIONS ────────────────────────────────────────
function getNotifications() {
    $uid  = getCurrentUserId();
    $conn = getDBConnection();
    $stmt = $conn->prepare('SELECT email_notifications, daily_summary, budget_alerts FROM user_settings WHERE user_id=?');
    $stmt->bind_param('i', $uid); $stmt->execute();
    $s = $stmt->get_result()->fetch_assoc();
    $stmt->close(); $conn->close();

    if (!$s) $s = ['email_notifications' => 1, 'daily_summary' => 0, 'budget_alerts' => 1];
    echo json_encode(['success' => true, 'data' => $s]);
}

// ── UPDATE NOTIFICATIONS ─────────────────────────────────────
function updateNotifications() {
    $uid    = getCurrentUserId();
    $data   = json_decode(file_get_contents('php://input'), true);
    $email  = intval($data['email_notifications'] ?? 0);
    $daily  = intval($data['daily_summary']       ?? 0);
    $budget = intval($data['budget_alerts']       ?? 0);

    $conn = getDBConnection();
    $stmt = $conn->prepare(
        'INSERT INTO user_settings (user_id,email_notifications,daily_summary,budget_alerts)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE email_notifications=?,daily_summary=?,budget_alerts=?'
    );
    $stmt->bind_param('iiiiiii', $uid, $email, $daily, $budget, $email, $daily, $budget);
    $ok = $stmt->execute(); $stmt->close(); $conn->close();
    echo json_encode(['success' => $ok, 'message' => $ok ? 'Saved' : 'Failed']);
}

// ── EXPORT CSV DATA ──────────────────────────────────────────
function exportCSV() {
    $uid  = getCurrentUserId();
    $conn = getDBConnection();
    $stmt = $conn->prepare(
        'SELECT e.date, e.description, c.name AS category, e.amount
         FROM expenses e JOIN categories c ON e.category_id=c.id
         WHERE e.user_id=? ORDER BY e.date DESC'
    );
    $stmt->bind_param('i', $uid); $stmt->execute();
    $res  = $stmt->get_result(); $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $stmt->close(); $conn->close();
    echo json_encode(['success' => true, 'data' => $rows]);
}

// ── DELETE ACCOUNT ───────────────────────────────────────────
function deleteAccount() {
    $uid  = getCurrentUserId();
    $conn = getDBConnection();
    $conn->begin_transaction();
    try {
        foreach (['DELETE FROM expenses WHERE user_id=?',
                  'DELETE FROM user_settings WHERE user_id=?',
                  'DELETE FROM users WHERE id=?'] as $sql) {
            $s = $conn->prepare($sql);
            $s->bind_param('i', $uid); $s->execute(); $s->close();
        }
        $conn->commit();
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Account deleted']);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Deletion failed']);
    }
    $conn->close();
}

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
