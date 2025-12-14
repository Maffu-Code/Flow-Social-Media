import { useState, useEffect } from 'react';
import { Home, Upload, User, Heart, MessageCircle, Share2, Trash2, Edit, LogOut, Search, Bookmark } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { postsAPI, likesAPI, bookmarksAPI } from './services/api';
import Auth from './components/Auth';
import ReplyModal from './components/ReplyModal';
import EditProfile from './components/EditProfile';
import SearchPage from './components/SearchPage';
import BookmarksPage from './components/BookmarksPage';
import UserProfile from './components/UserProfile';
import ThreadPage from './components/ThreadPage';

export default function App() {
  const { user, logout, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  const [viewingThread, setViewingThread] = useState(null);

  useEffect(() => {
    loadPosts();
  }, [currentPage, user]);

  const loadPosts = async () => {
    try {
      // Home page shows original posts + first-level replies only
      // Search and profile pages show all levels
      const response = currentPage === 'search' || currentPage === 'profile'
        ? await postsAPI.getAllPosts() 
        : await postsAPI.getPostsWithFirstLevelReplies();
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      setAuthMode('login');
      setShowAuth(true);
      return;
    }

    if (!newPost.trim()) return;

    setLoading(true);
    try {
      await postsAPI.createPost(newPost);
      setNewPost('');
      setCurrentPage('home');
      await loadPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!user) {
      setAuthMode('login');
      setShowAuth(true);
      return;
    }

    try {
      await postsAPI.deletePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) {
      setAuthMode('login');
      setShowAuth(true);
      return;
    }

    try {
      await likesAPI.toggleLike(postId);
      await loadPosts();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmarkPost = async (postId) => {
    if (!user) {
      setAuthMode('login');
      setShowAuth(true);
      return;
    }

    try {
      await bookmarksAPI.toggleBookmark(postId);
      await loadPosts();
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleReply = async (content, parentPostId) => {
    if (!user) {
      setAuthMode('login');
      setShowAuth(true);
      return;
    }

    try {
      await postsAPI.createPost(content, parentPostId || selectedPost.post_id);
      setShowReplyModal(false);
      setSelectedPost(null);
      await loadPosts();
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };



  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const userPosts = posts.filter(p => {
    if (!user) return false;
    return parseInt(p.user_id) === parseInt(user.user_id);
  });

  const handleViewProfile = (userId) => {
    setViewingUserProfile(userId);
  };

  const handleViewThread = (postId) => {
    setViewingThread(postId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-500">Flow</h1>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">Hello, {user.display_name}</span>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition"
                >
                  <LogOut size={20} />
                  <span className="text-sm">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuth(true);
                  }}
                  className="text-blue-500 hover:text-blue-600 font-semibold"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuth(true);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-600 transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <main>
          {currentPage === 'home' && (
            <div className="space-y-4">
              {user && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">What's happening?</h2>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Share your thoughts..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleCreatePost}
                      disabled={loading}
                      className="bg-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-600 transition disabled:bg-gray-300"
                    >
                      {loading ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.post_id}>
                    <div className="bg-white rounded-lg shadow p-6">
                      {/* Reply context for first-level replies */}
                      {post.is_reply && post.parent_content && (
                        <div className="bg-gray-50 rounded p-3 mb-4 text-sm border-l-4 border-blue-200">
                          <div className="flex items-center space-x-1 text-gray-500 mb-1">
                            <MessageCircle size={12} />
                            <span>Replying to @{post.parent_username}</span>
                          </div>
                          <p className="text-gray-700 italic">"{post.parent_content}"</p>
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <button 
                          onClick={() => handleViewProfile(post.user_id)}
                          className="text-3xl hover:opacity-80 transition"
                        >
                          {post.avatar}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <button 
                                onClick={() => handleViewProfile(post.user_id)}
                                className="font-bold hover:underline"
                              >
                                {post.display_name}
                              </button>
                              <span className="text-gray-500 ml-2">@{post.username}</span>
                              <span className="text-gray-400 ml-2">· {formatTimestamp(post.created_at)}</span>
                              {post.is_reply && (
                                <span className="text-blue-500 ml-2 text-sm">• Reply</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {user && parseInt(post.user_id) === parseInt(user.user_id) && (
                                <button
                                  onClick={() => handleDeletePost(post.post_id)}
                                  className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}

                            </div>
                          </div>
                          <p className="mt-2 text-gray-800">{post.content}</p>
                          <div className="flex items-center space-x-6 mt-4 text-gray-500">
                            {user && (
                              <>
                                <button
                                  onClick={() => handleLikePost(post.post_id)}
                                  className={`flex items-center space-x-2 transition ${
                                    post.liked_by_user ? 'text-red-500' : 'hover:text-red-500'
                                  }`}
                                >
                                  <Heart size={18} fill={post.liked_by_user ? 'currentColor' : 'none'} />
                                  <span>{post.likes}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPost(post);
                                    setShowReplyModal(true);
                                  }}
                                  className="flex items-center space-x-2 hover:text-green-500 transition"
                                >
                                  <Share2 size={18} />
                                  <span>Reply</span>
                                </button>
                                <button
                                  onClick={() => handleBookmarkPost(post.post_id)}
                                  className={`flex items-center space-x-2 transition ${
                                    post.bookmarked_by_user ? 'text-yellow-500' : 'hover:text-yellow-500'
                                  }`}
                                >
                                  <Bookmark size={18} fill={post.bookmarked_by_user ? 'currentColor' : 'none'} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => post.replies > 0 ? handleViewThread(post.post_id) : null}
                              className={`flex items-center space-x-2 transition ${
                                post.replies > 0 ? 'hover:text-blue-500 cursor-pointer' : 'text-gray-500'
                              }`}
                            >
                              <MessageCircle size={18} />
                              <span>{post.replies}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentPage === 'upload' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Create New Post</h2>
              {user ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's on your mind?
                    </label>
                    <textarea
                      className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="6"
                      placeholder="Write something interesting..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    {newPost.length} characters
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setNewPost('');
                        setCurrentPage('home');
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPost.trim() || loading}
                      className="bg-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">You need to login to create posts</p>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuth(true);
                    }}
                    className="bg-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-600 transition"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          )}

          {currentPage === 'profile' && (
            <div className="space-y-4">
              {user ? (
                <>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="text-6xl">{user.avatar}</div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold">{user.display_name}</h2>
                          <p className="text-gray-500">@{user.username}</p>
                          <p className="mt-3 text-gray-700">{user.bio}</p>
                          <div className="flex space-x-6 mt-4 text-sm">
                            <div>
                              <span className="font-bold">{userPosts.length}</span>
                              <span className="text-gray-500 ml-1">Posts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEditProfile(true)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition"
                      >
                        <Edit size={16} />
                        <span className="text-sm font-semibold">Edit Profile</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-bold text-lg mb-4">My Posts</h3>
                    <div className="space-y-4">
                      {userPosts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No posts yet</p>
                      ) : (
                        userPosts.map(post => (
                          <div key={post.post_id} className="border-b border-gray-200 pb-4 last:border-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center text-sm text-gray-500">
                                  <span>{formatTimestamp(post.created_at)}</span>
                                </div>
                                <p className="mt-2 text-gray-800">{post.content}</p>
                                <div className="flex items-center space-x-6 mt-3 text-gray-500 text-sm">
                                  <span className="flex items-center space-x-1">
                                    <Heart size={16} />
                                    <span>{post.likes}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <MessageCircle size={16} />
                                    <span>{post.replies}</span>
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeletePost(post.post_id)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600 mb-4">You need to login to view your profile</p>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuth(true);
                    }}
                    className="bg-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-600 transition"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          )}

          {currentPage === 'search' && (
            <SearchPage 
              onReply={(post) => {
                setSelectedPost(post);
                setShowReplyModal(true);
              }}
              onDeletePost={handleDeletePost}
            />
          )}

          {currentPage === 'bookmarks' && (
            <BookmarksPage 
              onReply={(post) => {
                setSelectedPost(post);
                setShowReplyModal(true);
              }}
              onDeletePost={handleDeletePost}
            />
          )}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-2">
          <div className="flex justify-around py-3">
            <button
              onClick={() => setCurrentPage('home')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
                currentPage === 'home' ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home size={20} />
              <span className="text-xs font-medium">Home</span>
            </button>
            <button
              onClick={() => setCurrentPage('search')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
                currentPage === 'search' ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Search size={20} />
              <span className="text-xs font-medium">Search</span>
            </button>
            <button
              onClick={() => setCurrentPage('upload')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
                currentPage === 'upload' ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Upload size={20} />
              <span className="text-xs font-medium">Post</span>
            </button>
            {user && (
              <button
                onClick={() => setCurrentPage('bookmarks')}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
                  currentPage === 'bookmarks' ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bookmark size={20} />
                <span className="text-xs font-medium">Saved</span>
              </button>
            )}
            <button
              onClick={() => setCurrentPage('profile')}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition ${
                currentPage === 'profile' ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User size={20} />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>
      </nav>

      {showAuth && <Auth onClose={() => setShowAuth(false)} initialMode={authMode} />}
      {showReplyModal && (
        <ReplyModal
          post={selectedPost}
          onClose={() => {
            setShowReplyModal(false);
            setSelectedPost(null);
          }}
          onReply={handleReply}
        />
      )}
      {showEditProfile && <EditProfile onClose={() => setShowEditProfile(false)} />}
      {viewingUserProfile && (
        <div className="fixed inset-0 z-50">
          <UserProfile
            userId={viewingUserProfile}
            onClose={() => setViewingUserProfile(null)}
            onReply={(post) => {
              setSelectedPost(post);
              setShowReplyModal(true);
            }}
            onDeletePost={handleDeletePost}
          />
        </div>
      )}
      {viewingThread && (
        <div className="fixed inset-0 z-50">
          <ThreadPage
            postId={viewingThread}
            onClose={() => setViewingThread(null)}
            onReply={(post) => {
              setSelectedPost(post);
              setShowReplyModal(true);
            }}
            onDeletePost={handleDeletePost}
            onViewThread={handleViewThread}
          />
        </div>
      )}
    </div>
  );
}