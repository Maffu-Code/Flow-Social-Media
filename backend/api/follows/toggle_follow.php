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

if (!empty($data->following_id)) {
    
    // Can't follow yourself
    if ($data->following_id == $_SESSION['user_id']) {
        http_response_code(400);
        echo json_encode(array("message" => "Cannot follow yourself"));
        exit();
    }
    
    // Check if already following
    $check_query = "SELECT follow_id FROM follows WHERE follower_id = :follower_id AND following_id = :following_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":follower_id", $_SESSION['user_id']);
    $check_stmt->bindParam(":following_id", $data->following_id);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() > 0) {
        // Unfollow
        $query = "DELETE FROM follows WHERE follower_id = :follower_id AND following_id = :following_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":follower_id", $_SESSION['user_id']);
        $stmt->bindParam(":following_id", $data->following_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Unfollowed", "is_following" => false));
        }
    } else {
        // Follow
        $query = "INSERT INTO follows (follower_id, following_id) VALUES (:follower_id, :following_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":follower_id", $_SESSION['user_id']);
        $stmt->bindParam(":following_id", $data->following_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Followed", "is_following" => true));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "User ID required"));
}
?>