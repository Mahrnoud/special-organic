<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

json_response(['logged_in' => !empty($_SESSION['admin_id'])]);
