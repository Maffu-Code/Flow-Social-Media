<?php
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Not authenticated"));
    exit();
}

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->post_id)) {
    
    // Check if already liked
    $check_query = "SELECT like_id FROM likes WHERE post_id = :post_id AND user_id = :user_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":post_id", $data->post_id);
    $check_stmt->bindParam(":user_id", $_SESSION['user_id']);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() > 0) {
        // Unlike
        $query = "DELETE FROM likes WHERE post_id = :post_id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":post_id", $data->post_id);
        $stmt->bindParam(":user_id", $_SESSION['user_id']);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Post unliked", "liked" => false));
        }
    } else {
        // Like
        $query = "INSERT INTO likes (post_id, user_id) VALUES (:post_id, :user_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":post_id", $data->post_id);
        $stmt->bindParam(":user_id", $_SESSION['user_id']);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Post liked", "liked" => true));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Post ID required"));
}
?>