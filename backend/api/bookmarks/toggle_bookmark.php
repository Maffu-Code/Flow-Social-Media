<?php
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Authentication required"));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->post_id)) {
    http_response_code(400);
    echo json_encode(array("message" => "Post ID is required"));
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Check if bookmark exists
$query = "SELECT bookmark_id FROM bookmarks WHERE user_id = :user_id AND post_id = :post_id";
$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $_SESSION['user_id']);
$stmt->bindParam(":post_id", $data->post_id);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    // Remove bookmark
    $delete_query = "DELETE FROM bookmarks WHERE user_id = :user_id AND post_id = :post_id";
    $delete_stmt = $db->prepare($delete_query);
    $delete_stmt->bindParam(":user_id", $_SESSION['user_id']);
    $delete_stmt->bindParam(":post_id", $data->post_id);
    
    if ($delete_stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("message" => "Bookmark removed", "bookmarked" => false));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to remove bookmark"));
    }
} else {
    // Add bookmark
    $insert_query = "INSERT INTO bookmarks (user_id, post_id) VALUES (:user_id, :post_id)";
    $insert_stmt = $db->prepare($insert_query);
    $insert_stmt->bindParam(":user_id", $_SESSION['user_id']);
    $insert_stmt->bindParam(":post_id", $data->post_id);
    
    if ($insert_stmt->execute()) {
        http_response_code(201);
        echo json_encode(array("message" => "Post bookmarked", "bookmarked" => true));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to bookmark post"));
    }
}
?>