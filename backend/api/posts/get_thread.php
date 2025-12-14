<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$post_id = isset($_GET['post_id']) ? $_GET['post_id'] : null;

if (!$post_id) {
    http_response_code(400);
    echo json_encode(array("message" => "Post ID is required"));
    exit();
}

// Get the main post
$main_query = "SELECT 
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
    CASE WHEN p.parent_post_id IS NOT NULL THEN 
        (SELECT pp.content FROM posts pp WHERE pp.post_id = p.parent_post_id LIMIT 1)
        ELSE NULL
    END as parent_content,
    CASE WHEN p.parent_post_id IS NOT NULL THEN 
        (SELECT pu.username FROM posts pp JOIN users pu ON pp.user_id = pu.user_id WHERE pp.post_id = p.parent_post_id LIMIT 1)
        ELSE NULL
    END as parent_username
FROM posts p
JOIN users u ON p.user_id = u.user_id
LEFT JOIN likes l ON p.post_id = l.post_id
LEFT JOIN posts r ON p.post_id = r.parent_post_id
WHERE p.post_id = :post_id
GROUP BY p.post_id, p.content, p.parent_post_id, p.created_at, u.user_id, u.username, u.display_name, u.avatar";

$main_stmt = $db->prepare($main_query);
$main_stmt->bindParam(":post_id", $post_id);
$main_stmt->execute();

if ($main_stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(array("message" => "Post not found"));
    exit();
}

$main_post_row = $main_stmt->fetch(PDO::FETCH_ASSOC);
$main_post = array(
    "post_id" => $main_post_row['post_id'],
    "user_id" => $main_post_row['user_id'],
    "username" => $main_post_row['username'],
    "display_name" => $main_post_row['display_name'],
    "avatar" => $main_post_row['avatar'],
    "content" => $main_post_row['content'],
    "parent_post_id" => $main_post_row['parent_post_id'],
    "parent_content" => $main_post_row['parent_content'],
    "parent_username" => $main_post_row['parent_username'],
    "created_at" => $main_post_row['created_at'],
    "likes" => (int)$main_post_row['like_count'],
    "replies" => (int)$main_post_row['reply_count'],
    "liked_by_user" => false,
    "bookmarked_by_user" => false,
    "is_reply" => $main_post_row['parent_post_id'] !== null
);

// Check if current user liked/bookmarked the main post
if (isset($_SESSION['user_id'])) {
    $like_check = "SELECT like_id FROM likes WHERE post_id = :post_id AND user_id = :user_id";
    $like_stmt = $db->prepare($like_check);
    $like_stmt->bindParam(":post_id", $post_id);
    $like_stmt->bindParam(":user_id", $_SESSION['user_id']);
    $like_stmt->execute();
    
    if ($like_stmt->rowCount() > 0) {
        $main_post['liked_by_user'] = true;
    }
    
    $bookmark_check = "SELECT bookmark_id FROM bookmarks WHERE post_id = :post_id AND user_id = :user_id";
    $bookmark_stmt = $db->prepare($bookmark_check);
    $bookmark_stmt->bindParam(":post_id", $post_id);
    $bookmark_stmt->bindParam(":user_id", $_SESSION['user_id']);
    $bookmark_stmt->execute();
    
    if ($bookmark_stmt->rowCount() > 0) {
        $main_post['bookmarked_by_user'] = true;
    }
}

// Get all replies to this post (nested)
$replies_query = "SELECT 
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

$replies_stmt = $db->prepare($replies_query);
$replies_stmt->bindParam(":post_id", $post_id);
$replies_stmt->execute();

$replies = array();
while ($row = $replies_stmt->fetch(PDO::FETCH_ASSOC)) {
    $reply = array(
        "post_id" => $row['post_id'],
        "user_id" => $row['user_id'],
        "username" => $row['username'],
        "display_name" => $row['display_name'],
        "avatar" => $row['avatar'],
        "content" => $row['content'],
        "parent_post_id" => $row['parent_post_id'],
        "created_at" => $row['created_at'],
        "likes" => (int)$row['like_count'],
        "replies" => (int)$row['reply_count'],
        "liked_by_user" => false,
        "bookmarked_by_user" => false
    );
    
    // Check if current user liked/bookmarked this reply
    if (isset($_SESSION['user_id'])) {
        $like_check = "SELECT like_id FROM likes WHERE post_id = :reply_id AND user_id = :user_id";
        $like_stmt = $db->prepare($like_check);
        $like_stmt->bindParam(":reply_id", $row['post_id']);
        $like_stmt->bindParam(":user_id", $_SESSION['user_id']);
        $like_stmt->execute();
        
        if ($like_stmt->rowCount() > 0) {
            $reply['liked_by_user'] = true;
        }
        
        $bookmark_check = "SELECT bookmark_id FROM bookmarks WHERE post_id = :reply_id AND user_id = :user_id";
        $bookmark_stmt = $db->prepare($bookmark_check);
        $bookmark_stmt->bindParam(":reply_id", $row['post_id']);
        $bookmark_stmt->bindParam(":user_id", $_SESSION['user_id']);
        $bookmark_stmt->execute();
        
        if ($bookmark_stmt->rowCount() > 0) {
            $reply['bookmarked_by_user'] = true;
        }
    }
    
    array_push($replies, $reply);
}

$response = array(
    "main_post" => $main_post,
    "replies" => $replies
);

http_response_code(200);
echo json_encode($response);
?>