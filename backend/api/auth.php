<?php
// backend/api/auth.php

require_once '../includes/cors.php';
require_once '../includes/session.php';
require_once '../config/database.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'login':    handleLogin();    break;
        case 'register': handleRegister(); break;
        case 'logout':   handleLogout();   break;
        case 'check':    checkSession();   break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

// ── LOGIN ────────────────────────────────────────────────────
function handleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'POST required']); return;
    }
    $data     = json_decode(file_get_contents('php://input'), true);
    $email    = trim($data['email']    ?? '');
    $password =      $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email and password are required']); return;
    }

    $conn = getDBConnection();
    $stmt = $conn->prepare('SELECT id, first_name, last_name, email, password FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close(); $conn->close();

    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']); return;
    }

    $_SESSION['user_id']    = $user['id'];
    $_SESSION['user_name']  = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['user_email'] = $user['email'];

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user'    => [
            'id'         => $user['id'],
            'first_name' => $user['first_name'],
            'last_name'  => $user['last_name'],
            'email'      => $user['email']
        ]
    ]);
}

// ── REGISTER ─────────────────────────────────────────────────
function handleRegister() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'POST required']); return;
    }
    $data       = json_decode(file_get_contents('php://input'), true);
    $first_name = trim($data['first_name'] ?? '');
    $last_name  = trim($data['last_name']  ?? '');
    $email      = trim($data['email']      ?? '');
    $password   =      $data['password']   ?? '';

    if (empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']); return;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']); return;
    }
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']); return;
    }

    $conn = getDBConnection();

    // Check duplicate
    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->close(); $conn->close();
        echo json_encode(['success' => false, 'message' => 'Email already registered']); return;
    }
    $stmt->close();

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt   = $conn->prepare('INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('ssss', $first_name, $last_name, $email, $hashed);

    if ($stmt->execute()) {
        $new_id = $stmt->insert_id;
        $_SESSION['user_id']    = $new_id;
        $_SESSION['user_name']  = $first_name . ' ' . $last_name;
        $_SESSION['user_email'] = $email;

        // Create default settings
        $s2 = $conn->prepare('INSERT INTO user_settings (user_id) VALUES (?)');
        $s2->bind_param('i', $new_id);
        $s2->execute(); $s2->close();

        echo json_encode([
            'success' => true,
            'message' => 'Registration successful',
            'user'    => ['id' => $new_id, 'first_name' => $first_name, 'last_name' => $last_name, 'email' => $email]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $conn->error]);
    }
    $stmt->close(); $conn->close();
}

// ── LOGOUT ───────────────────────────────────────────────────
function handleLogout() {
    $_SESSION = [];
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

// ── SESSION CHECK ────────────────────────────────────────────
function checkSession() {
    if (isLoggedIn()) {
        echo json_encode([
            'success'   => true,
            'logged_in' => true,
            'user'      => [
                'id'    => $_SESSION['user_id'],
                'name'  => $_SESSION['user_name'],
                'email' => $_SESSION['user_email']
            ]
        ]);
    } else {
        echo json_encode(['success' => true, 'logged_in' => false]);
    }
}
