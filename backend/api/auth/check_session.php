<?php
require_once '../../config/database.php';

if (isset($_SESSION['user_id'])) {
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT user_id, username, display_name, bio, avatar FROM users WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $_SESSION['user_id']);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode(array(
            "logged_in" => true,
            "user" => array(
                "user_id" => $row['user_id'],
                "username" => $row['username'],
                "display_name" => $row['display_name'],
                "bio" => $row['bio'],
                "avatar" => $row['avatar']
            )
        ));
    }
} else {
    http_response_code(200);
    echo json_encode(array("logged_in" => false));
}
?>