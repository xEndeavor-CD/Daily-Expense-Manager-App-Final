<?php
// backend/api/categories.php

require_once '../includes/cors.php';
require_once '../includes/session.php';
require_once '../config/database.php';

requireLogin();

$conn = getDBConnection();
$stmt = $conn->prepare('SELECT id, name, color FROM categories ORDER BY name ASC');
$stmt->execute();
$res  = $stmt->get_result();
$cats = [];
while ($r = $res->fetch_assoc()) $cats[] = $r;
$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'data' => $cats]);
