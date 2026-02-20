<?php
// backend/api/expenses.php

require_once '../includes/cors.php';
require_once '../includes/session.php';
require_once '../config/database.php';

requireLogin();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if      ($action === 'summary') getSummary();
            elseif  ($action === 'recent')  getRecentExpenses();
            elseif  ($action === 'search')  searchExpenses();
            else                            getExpenses();
            break;
        case 'POST':   addExpense();    break;
        case 'PUT':    updateExpense(); break;
        case 'DELETE': deleteExpense(); break;
        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

// ── GET ALL ──────────────────────────────────────────────────
function getExpenses() {
    $uid  = getCurrentUserId();
    $conn = getDBConnection();
    $stmt = $conn->prepare(
        'SELECT e.id, e.amount, e.description, e.date, e.category_id,
                c.name AS category_name, c.color AS category_color
         FROM expenses e
         JOIN categories c ON e.category_id = c.id
         WHERE e.user_id = ?
         ORDER BY e.date DESC, e.created_at DESC'
    );
    $stmt->bind_param('i', $uid);
    $stmt->execute();
    $res  = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $stmt->close(); $conn->close();
    echo json_encode(['success' => true, 'data' => $rows]);
}

// ── GET RECENT ───────────────────────────────────────────────
function getRecentExpenses() {
    $uid   = getCurrentUserId();
    $limit = max(1, intval($_GET['limit'] ?? 5));
    $conn  = getDBConnection();
    $stmt  = $conn->prepare(
        'SELECT e.id, e.amount, e.description, e.date,
                c.name AS category_name, c.color AS category_color
         FROM expenses e
         JOIN categories c ON e.category_id = c.id
         WHERE e.user_id = ?
         ORDER BY e.date DESC, e.created_at DESC
         LIMIT ?'
    );
    $stmt->bind_param('ii', $uid, $limit);
    $stmt->execute();
    $res  = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $stmt->close(); $conn->close();
    echo json_encode(['success' => true, 'data' => $rows]);
}

// ── SEARCH ───────────────────────────────────────────────────
function searchExpenses() {
    $uid  = getCurrentUserId();
    $q    = '%' . trim($_GET['q'] ?? '') . '%';
    $conn = getDBConnection();
    $stmt = $conn->prepare(
        'SELECT e.id, e.amount, e.description, e.date, e.category_id,
                c.name AS category_name, c.color AS category_color
         FROM expenses e
         JOIN categories c ON e.category_id = c.id
         WHERE e.user_id = ? AND (e.description LIKE ? OR c.name LIKE ?)
         ORDER BY e.date DESC'
    );
    $stmt->bind_param('iss', $uid, $q, $q);
    $stmt->execute();
    $res  = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $stmt->close(); $conn->close();
    echo json_encode(['success' => true, 'data' => $rows]);
}

// ── SUMMARY ──────────────────────────────────────────────────
function getSummary() {
    $uid  = getCurrentUserId();
    $conn = getDBConnection();

    // Today
    $s = $conn->prepare('SELECT COALESCE(SUM(amount),0) AS t FROM expenses WHERE user_id=? AND date=CURDATE()');
    $s->bind_param('i', $uid); $s->execute();
    $today = floatval($s->get_result()->fetch_assoc()['t']); $s->close();

    // This month
    $s = $conn->prepare('SELECT COALESCE(SUM(amount),0) AS t FROM expenses WHERE user_id=? AND MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())');
    $s->bind_param('i', $uid); $s->execute();
    $month = floatval($s->get_result()->fetch_assoc()['t']); $s->close();

    // Count this month
    $s = $conn->prepare('SELECT COUNT(*) AS c FROM expenses WHERE user_id=? AND MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())');
    $s->bind_param('i', $uid); $s->execute();
    $count = intval($s->get_result()->fetch_assoc()['c']); $s->close();

    $avg = $count > 0 ? round($month / $count, 2) : 0;

    // Category breakdown this month
    $s = $conn->prepare(
        'SELECT c.name, c.color, COALESCE(SUM(e.amount),0) AS total
         FROM expenses e JOIN categories c ON e.category_id=c.id
         WHERE e.user_id=? AND MONTH(e.date)=MONTH(CURDATE()) AND YEAR(e.date)=YEAR(CURDATE())
         GROUP BY c.id ORDER BY total DESC'
    );
    $s->bind_param('i', $uid); $s->execute();
    $r = $s->get_result(); $cats = [];
    while ($row = $r->fetch_assoc()) $cats[] = $row;
    $s->close();

    // Daily last 7 days
    $s = $conn->prepare(
        'SELECT DATE(date) AS day, COALESCE(SUM(amount),0) AS total
         FROM expenses WHERE user_id=? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE(date) ORDER BY day ASC'
    );
    $s->bind_param('i', $uid); $s->execute();
    $r = $s->get_result(); $daily = [];
    while ($row = $r->fetch_assoc()) $daily[] = $row;
    $s->close();

    // Monthly last 6 months
    $s = $conn->prepare(
        'SELECT DATE_FORMAT(date,"%b %Y") AS month, YEAR(date) AS yr, MONTH(date) AS mo,
                COALESCE(SUM(amount),0) AS total
         FROM expenses WHERE user_id=? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY yr, mo ORDER BY yr ASC, mo ASC'
    );
    $s->bind_param('i', $uid); $s->execute();
    $r = $s->get_result(); $monthly = [];
    while ($row = $r->fetch_assoc()) $monthly[] = $row;
    $s->close();

    $conn->close();

    echo json_encode([
        'success' => true,
        'data'    => [
            'today_total'        => $today,
            'month_total'        => $month,
            'total_transactions' => $count,
            'average_expense'    => $avg,
            'categories'         => $cats,
            'daily'              => $daily,
            'monthly'            => $monthly
        ]
    ]);
}

// ── ADD ──────────────────────────────────────────────────────
function addExpense() {
    $uid  = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);

    $amount      = floatval($data['amount']      ?? 0);
    $category_id = intval($data['category_id']   ?? 0);
    $date        =         $data['date']          ?? '';
    $description = trim(   $data['description']  ?? '');

    if ($amount <= 0 || !$category_id || !$date) {
        echo json_encode(['success' => false, 'message' => 'Amount, category and date are required']);
        return;
    }

    $conn = getDBConnection();
    $stmt = $conn->prepare('INSERT INTO expenses (user_id,amount,category_id,date,description) VALUES (?,?,?,?,?)');
    $stmt->bind_param('idiss', $uid, $amount, $category_id, $date, $description);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Expense added', 'id' => $stmt->insert_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add expense']);
    }
    $stmt->close(); $conn->close();
}

// ── UPDATE ───────────────────────────────────────────────────
function updateExpense() {
    $uid  = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);
    $id   = intval($data['id'] ?? 0);
    if (!$id) { echo json_encode(['success' => false, 'message' => 'Invalid ID']); return; }

    $amount      = floatval($data['amount']      ?? 0);
    $category_id = intval($data['category_id']   ?? 0);
    $date        =         $data['date']          ?? '';
    $description = trim(   $data['description']  ?? '');

    if ($amount <= 0 || !$category_id || !$date) {
        echo json_encode(['success' => false, 'message' => 'Amount, category and date are required']);
        return;
    }

    $conn = getDBConnection();
    $stmt = $conn->prepare('UPDATE expenses SET amount=?,category_id=?,date=?,description=? WHERE id=? AND user_id=?');
    $stmt->bind_param('dissii', $amount, $category_id, $date, $description, $id, $uid);

    if ($stmt->execute() && $stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Expense updated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Update failed or not found']);
    }
    $stmt->close(); $conn->close();
}

// ── DELETE ───────────────────────────────────────────────────
function deleteExpense() {
    $uid  = getCurrentUserId();
    $id   = intval($_GET['id'] ?? 0);
    if (!$id) { echo json_encode(['success' => false, 'message' => 'Invalid ID']); return; }

    $conn = getDBConnection();
    $stmt = $conn->prepare('DELETE FROM expenses WHERE id=? AND user_id=?');
    $stmt->bind_param('ii', $id, $uid);

    if ($stmt->execute() && $stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Expense deleted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Delete failed or not found']);
    }
    $stmt->close(); $conn->close();
}