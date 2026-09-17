<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
$image = '';
// Only verified raster images are accepted; generated filenames cannot execute as PHP.
$uploadedPath = null;
if (isset($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE) {
    $file = $_FILES['photo'];
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > 5 * 1024 * 1024) {
        json_response(['success' => false, 'message' => 'Upload a JPG, PNG, WebP or GIF image up to 5 MB (and within the server upload limit).'], 422);
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($extensions[$mime]) || !getimagesize($file['tmp_name'])) {
        json_response(['success' => false, 'message' => 'Please upload a valid JPG, PNG, WebP or GIF image.'], 422);
    }
    $directory = __DIR__ . '/../assets/img/uploads';
    if (!is_dir($directory) && !mkdir($directory, 0755, true)) throw new RuntimeException('Cannot create upload directory.');
    $image = 'assets/img/uploads/' . bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
    $uploadedPath = __DIR__ . '/../' . $image;
    if (!move_uploaded_file($file['tmp_name'], $uploadedPath)) throw new RuntimeException('Cannot save image.');
}

if (!$uploadedPath) json_response(['success' => false, 'message' => 'Choose an image within the server upload limit.'], 422);
json_response(['success' => true, 'image' => $image]);
