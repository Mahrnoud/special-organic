<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
$body = read_json_body();
$pdo = get_db();
if (!is_array($body['content'] ?? null) || !is_int($body['revision'] ?? null)) content_error('content');
$content = validate_content($body['content'], $pdo);
$stmt = $pdo->prepare('UPDATE site_content SET content = ?, revision = revision + 1 WHERE id = 1 AND revision = ?');
$stmt->execute([json_encode($content, JSON_UNESCAPED_UNICODE), $body['revision']]);
if (!$stmt->rowCount()) json_response(['success' => false, 'message' => 'Site content was changed in another window. Reload this page before saving again.'], 409);
json_response(array_merge(['success' => true], site_content($pdo)));
