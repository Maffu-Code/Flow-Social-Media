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

if (!empty($data->content)) {
    
    $query = "INSERT INTO posts (user_id, content, parent_post_id) VALUES (:user_id, :content, :parent_post_id)";
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(":user_id", $_SESSION['user_id']);
    $stmt->bindParam(":content", $data->content);
    
    $parent_id = isset($data->parent_post_id) ? $data->parent_post_id : null;
    $stmt->bindParam(":parent_post_id", $parent_id);
    
    if ($stmt->execute()) {
        $post_id = $db->lastInsertId();
        
        http_response_code(201);
        echo json_encode(array(
            "message" => "Post created successfully",
            "post_id" => $post_id
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create post"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Content cannot be empty"));
}
?>