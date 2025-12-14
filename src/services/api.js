import axios from 'axios';

const API_BASE_URL = 'http://localhost/backend/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Auth APIs
export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login.php', { username, password }),
  
  signup: (username, display_name, password) => 
    api.post('/auth/signup.php', { username, display_name, password }),
  
  logout: () => 
    api.post('/auth/logout.php'),
  
  checkSession: () => 
    api.get('/auth/check_session.php')
};

// Posts APIs
export const postsAPI = {
  getPosts: () => 
    api.get('/posts/get_posts.php'),
  
  getAllPosts: () => 
    api.get('/posts/get_all_posts.php'),
  
  getPostsWithFirstLevelReplies: () => 
    api.get('/posts/get_posts_with_first_level_replies.php'),
  
  getThread: (post_id) => 
    api.get(`/posts/get_thread.php?post_id=${post_id}`),
  
  createPost: (content, parent_post_id = null) => 
    api.post('/posts/create_post.php', { content, parent_post_id }),
  
  deletePost: (post_id) => 
    api.post('/posts/delete_post.php', { post_id }),
  
  getReplies: (post_id) => 
    api.get(`/posts/get_replies.php?post_id=${post_id}`)
};

// Likes APIs
export const likesAPI = {
  toggleLike: (post_id) => 
    api.post('/likes/toggle_like.php', { post_id })
};

// Users APIs
export const usersAPI = {
  updateProfile: (display_name, bio) => 
    api.post('/users/update_profile.php', { display_name, bio }),
  
  getUserProfile: (user_id) => 
    api.get(`/users/get_user_profile.php?user_id=${user_id}`)
};

// Follows APIs
export const followsAPI = {
  toggleFollow: (user_id) => 
    api.post('/follows/toggle_follow.php', { following_id: user_id })
};

// Bookmarks APIs
export const bookmarksAPI = {
  toggleBookmark: (post_id) => 
    api.post('/bookmarks/toggle_bookmark.php', { post_id }),
  
  getBookmarks: () => 
    api.get('/bookmarks/get_bookmarks.php')
};

// Search APIs
export const searchAPI = {
  searchPosts: (params) => {
    const queryString = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryString.append(key, params[key]);
      }
    });
    return api.get(`/search/search_posts.php?${queryString.toString()}`);
  }
};

export default api;