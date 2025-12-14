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

if (!empty($data->display_name) || !empty($data->bio)) {
    
    $query = "UPDATE users SET ";
    $params = array();
    
    if (!empty($data->display_name)) {
        $query .= "display_name = :display_name, ";
        $params[':display_name'] = $data->display_name;
    }
    
    if (!empty($data->bio)) {
        $query .= "bio = :bio, ";
        $params[':bio'] = $data->bio;
    }
    
    $query = rtrim($query, ", ");
    $query .= " WHERE user_id = :user_id";
    $params[':user_id'] = $_SESSION['user_id'];
    
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        $_SESSION['display_name'] = !empty($data->display_name) ? $data->display_name : $_SESSION['display_name'];
        
        http_response_code(200);
        echo json_encode(array("message" => "Profile updated successfully"));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to update profile"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "No data to update"));
}
?>