<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if ($user_id) {
    // Get user info
    $query = "SELECT user_id, username, display_name, bio, avatar, created_at FROM users WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get user's posts (including replies)
        $posts_query = "SELECT 
            p.post_id,
            p.content,
            p.parent_post_id,
            p.created_at,
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
        LEFT JOIN likes l ON p.post_id = l.post_id
        LEFT JOIN posts r ON p.post_id = r.parent_post_id
        WHERE p.user_id = :user_id
        GROUP BY p.post_id, p.content, p.parent_post_id, p.created_at
        ORDER BY p.created_at DESC";
        
        $posts_stmt = $db->prepare($posts_query);
        $posts_stmt->bindParam(":user_id", $user_id);
        $posts_stmt->execute();
        
        $posts = array();
        while ($post_row = $posts_stmt->fetch(PDO::FETCH_ASSOC)) {
            $post = array(
                "post_id" => $post_row['post_id'],
                "content" => $post_row['content'],
                "parent_post_id" => $post_row['parent_post_id'],
                "parent_content" => $post_row['parent_content'],
                "parent_username" => $post_row['parent_username'],
                "created_at" => $post_row['created_at'],
                "likes" => (int)$post_row['like_count'],
                "replies" => (int)$post_row['reply_count'],
                "liked_by_user" => false,
                "bookmarked_by_user" => false,
                "is_reply" => $post_row['parent_post_id'] !== null
            );
            
            // Check if current user liked/bookmarked
            if (isset($_SESSION['user_id'])) {
                $like_check = "SELECT like_id FROM likes WHERE post_id = :post_id AND user_id = :current_user_id";
                $like_stmt = $db->prepare($like_check);
                $like_stmt->bindParam(":post_id", $post_row['post_id']);
                $like_stmt->bindParam(":current_user_id", $_SESSION['user_id']);
                $like_stmt->execute();
                
                if ($like_stmt->rowCount() > 0) {
                    $post['liked_by_user'] = true;
                }
                
                $bookmark_check = "SELECT bookmark_id FROM bookmarks WHERE post_id = :post_id AND user_id = :current_user_id";
                $bookmark_stmt = $db->prepare($bookmark_check);
                $bookmark_stmt->bindParam(":post_id", $post_row['post_id']);
                $bookmark_stmt->bindParam(":current_user_id", $_SESSION['user_id']);
                $bookmark_stmt->execute();
                
                if ($bookmark_stmt->rowCount() > 0) {
                    $post['bookmarked_by_user'] = true;
                }
            }
            
            array_push($posts, $post);
        }
        
        // Check if current user is following this user
        $is_following = false;
        if (isset($_SESSION['user_id']) && $_SESSION['user_id'] != $user_id) {
            $follow_check = "SELECT follow_id FROM follows WHERE follower_id = :follower_id AND following_id = :following_id";
            $follow_stmt = $db->prepare($follow_check);
            $follow_stmt->bindParam(":follower_id", $_SESSION['user_id']);
            $follow_stmt->bindParam(":following_id", $user_id);
            $follow_stmt->execute();
            
            if ($follow_stmt->rowCount() > 0) {
                $is_following = true;
            }
        }
        
        http_response_code(200);
        echo json_encode(array(
            "user" => $user,
            "posts" => $posts,
            "is_following" => $is_following,
            "is_own_profile" => isset($_SESSION['user_id']) && $_SESSION['user_id'] == $user_id
        ));
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "User not found"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "User ID required"));
}
?>