<?php
// backend/config/database.php
// ── Edit these credentials to match your XAMPP MySQL setup ──

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');          // default XAMPP = empty string
define('DB_NAME', 'dems_db');

function getDBConnection() {
    // Suppress mysqli connection warnings — we handle errors manually
    $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed. Check that XAMPP MySQL is running and dems_db exists.'
        ]);
        exit;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}
