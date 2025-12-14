<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    
    $query = "SELECT user_id, username, display_name, password_hash, bio, avatar FROM users WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $data->username);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($data->password, $row['password_hash'])) {
            $_SESSION['user_id'] = $row['user_id'];
            $_SESSION['username'] = $row['username'];
            $_SESSION['display_name'] = $row['display_name'];
            
            http_response_code(200);
            echo json_encode(array(
                "message" => "Login successful",
                "user" => array(
                    "user_id" => $row['user_id'],
                    "username" => $row['username'],
                    "display_name" => $row['display_name'],
                    "bio" => $row['bio'],
                    "avatar" => $row['avatar']
                )
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Invalid password"));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "User not found"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data"));
}
?>