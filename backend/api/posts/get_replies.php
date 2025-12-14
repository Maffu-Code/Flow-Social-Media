<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$post_id = isset($_GET['post_id']) ? $_GET['post_id'] : null;

if ($post_id) {
    $query = "SELECT 
        p.post_id,
        p.content,
        p.parent_post_id,
        p.created_at,
        u.user_id,
        u.username,
        u.display_name,
        u.avatar,
        COUNT(DISTINCT l.like_id) as like_count,
        COUNT(DISTINCT r.post_id) as reply_count
    FROM posts p
    JOIN users u ON p.user_id = u.user_id
    LEFT JOIN likes l ON p.post_id = l.post_id
    LEFT JOIN posts r ON p.post_id = r.parent_post_id
    WHERE p.parent_post_id = :post_id
    GROUP BY p.post_id, p.content, p.parent_post_id, p.created_at, u.user_id, u.username, u.display_name, u.avatar
    ORDER BY p.created_at ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":post_id", $post_id);
    $stmt->execute();
    
    $replies = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $reply = array(
            "post_id" => $row['post_id'],
            "user_id" => $row['user_id'],
            "username" => $row['username'],
            "display_name" => $row['display_name'],
            "avatar" => $row['avatar'],
            "content" => $row['content'],
            "created_at" => $row['created_at'],
            "likes" => (int)$row['like_count'],
            "replies" => (int)$row['reply_count'],
            "liked_by_user" => false,
            "bookmarked_by_user" => false
        );
        
        if (isset($_SESSION['user_id'])) {
            $like_check = "SELECT like_id FROM likes WHERE post_id = :post_id AND user_id = :user_id";
            $like_stmt = $db->prepare($like_check);
            $like_stmt->bindParam(":post_id", $row['post_id']);
            $like_stmt->bindParam(":user_id", $_SESSION['user_id']);
            $like_stmt->execute();
            
            if ($like_stmt->rowCount() > 0) {
                $reply['liked_by_user'] = true;
            }
            
            $bookmark_check = "SELECT bookmark_id FROM bookmarks WHERE post_id = :post_id AND user_id = :user_id";
            $bookmark_stmt = $db->prepare($bookmark_check);
            $bookmark_stmt->bindParam(":post_id", $row['post_id']);
            $bookmark_stmt->bindParam(":user_id", $_SESSION['user_id']);
            $bookmark_stmt->execute();
            
            if ($bookmark_stmt->rowCount() > 0) {
                $reply['bookmarked_by_user'] = true;
            }
        }
        
        array_push($replies, $reply);
    }
    
    http_response_code(200);
    echo json_encode($replies);
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Post ID required"));
}
?>