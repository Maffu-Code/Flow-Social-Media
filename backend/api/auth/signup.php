<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->display_name) && !empty($data->password)) {
    
    // Check if username exists
    $check_query = "SELECT user_id FROM users WHERE username = :username";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":username", $data->username);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Username already exists"));
        exit();
    }
    
    // Create user
    $query = "INSERT INTO users (username, display_name, password_hash) VALUES (:username, :display_name, :password_hash)";
    $stmt = $db->prepare($query);
    
    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
    
    $stmt->bindParam(":username", $data->username);
    $stmt->bindParam(":display_name", $data->display_name);
    $stmt->bindParam(":password_hash", $password_hash);
    
    if ($stmt->execute()) {
        $user_id = $db->lastInsertId();
        
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $data->username;
        $_SESSION['display_name'] = $data->display_name;
        
        http_response_code(201);
        echo json_encode(array(
            "message" => "User created successfully",
            "user" => array(
                "user_id" => $user_id,
                "username" => $data->username,
                "display_name" => $data->display_name,
                "avatar" => "👤",
                "bio" => "Web Developer | ReactJS Enthusiast"
            )
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Unable to create user"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data"));
}
?>