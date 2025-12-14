<?php
require_once '../../config/database.php';

session_destroy();

http_response_code(200);
echo json_encode(array("message" => "Logged out successfully"));
?>