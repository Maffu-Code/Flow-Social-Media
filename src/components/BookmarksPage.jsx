import { useState, useEffect } from 'react';
import { Bookmark, Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import { bookmarksAPI, likesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BookmarksPage({ onReply, onDeletePost }) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    try {
      const response = await bookmarksAPI.getBookmarks();
      setBookmarks(response.data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) return;
    
    try {
      await likesAPI.toggleLike(postId);
      setBookmarks(prev => prev.map(post => {
        if (post.post_id === postId) {
          return {
            ...post,
            liked_by_user: !post.liked_by_user,
            likes: post.liked_by_user ? post.likes - 1 : post.likes + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleRemoveBookmark = async (postId) => {
    if (!user) return;
    
    try {
      await bookmarksAPI.toggleBookmark(postId);
      setBookmarks(prev => prev.filter(post => post.post_id !== postId));
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
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

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 mb-4">You need to login to view your bookmarks</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
          <Bookmark size={24} />
          <span>Bookmarks</span>
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="text-xl">Loading bookmarks...</div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No bookmarks yet</p>
            <p className="text-gray-400 text-sm">Bookmark posts to read them later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map(post => (
              <div key={post.post_id} className="border-b border-gray-100 pb-4 last:border-0">
                {/* Reply context for bookmarked replies */}
                {post.parent_post_id && (
                  <div className="bg-gray-50 rounded p-3 mb-3 text-sm border-l-4 border-blue-200">
                    <div className="flex items-center space-x-1 text-gray-500 mb-1">
                      <MessageCircle size={12} />
                      <span>This is a reply to a post</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{post.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold">{post.display_name}</span>
                        <span className="text-gray-500 ml-2">@{post.username}</span>
                        <span className="text-gray-400 ml-2">· {formatTimestamp(post.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {parseInt(post.user_id) === parseInt(user.user_id) && (
                          <button
                            onClick={() => onDeletePost(post.post_id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveBookmark(post.post_id)}
                          className="text-yellow-500 hover:bg-yellow-50 p-2 rounded-full transition"
                          title="Remove bookmark"
                        >
                          <Bookmark size={18} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-800">{post.content}</p>
                    <div className="flex items-center space-x-6 mt-4 text-gray-500">
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
                        onClick={() => onReply(post)}
                        className="flex items-center space-x-2 hover:text-green-500 transition"
                      >
                        <Share2 size={18} />
                        <span>Reply</span>
                      </button>
                      <button
                        className="flex items-center space-x-2 text-gray-500"
                        disabled
                      >
                        <MessageCircle size={18} />
                        <span>{post.replies}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}