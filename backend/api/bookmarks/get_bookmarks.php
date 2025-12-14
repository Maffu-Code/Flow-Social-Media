<?php
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Authentication required"));
    exit();
}

$database = new Database();
$db = $database->getConnection();

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
    COUNT(DISTINCT r.post_id) as reply_count,
    b.created_at as bookmarked_at
FROM posts p
JOIN users u ON p.user_id = u.user_id
JOIN bookmarks b ON p.post_id = b.post_id
LEFT JOIN likes l ON p.post_id = l.post_id
LEFT JOIN posts r ON p.post_id = r.parent_post_id
WHERE b.user_id = :user_id
GROUP BY p.post_id, p.content, p.parent_post_id, p.created_at, u.user_id, u.username, u.display_name, u.avatar, b.created_at
ORDER BY b.created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $_SESSION['user_id']);
$stmt->execute();

$posts = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $post = array(
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
        "bookmarked_by_user" => true,
        "bookmarked_at" => $row['bookmarked_at']
    );
    
    // Check if current user liked this post
    $like_check = "SELECT like_id FROM likes WHERE post_id = :post_id AND user_id = :user_id";
    $like_stmt = $db->prepare($like_check);
    $like_stmt->bindParam(":post_id", $row['post_id']);
    $like_stmt->bindParam(":user_id", $_SESSION['user_id']);
    $like_stmt->execute();
    
    if ($like_stmt->rowCount() > 0) {
        $post['liked_by_user'] = true;
    }
    
    array_push($posts, $post);
}

http_response_code(200);
echo json_encode($posts);
?>