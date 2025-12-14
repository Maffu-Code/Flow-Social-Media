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
    
    // Check if post belongs to user
    $check_query = "SELECT user_id FROM posts WHERE post_id = :post_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":post_id", $data->post_id);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() > 0) {
        $row = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row['user_id'] == $_SESSION['user_id']) {
            $query = "DELETE FROM posts WHERE post_id = :post_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":post_id", $data->post_id);
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(array("message" => "Post deleted successfully"));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Unable to delete post"));
            }
        } else {
            http_response_code(403);
            echo json_encode(array("message" => "Not authorized to delete this post"));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Post not found"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Post ID required"));
}
?>