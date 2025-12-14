import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageCircle, Trash2, Bookmark, UserPlus, UserMinus } from 'lucide-react';
import { usersAPI, followsAPI, likesAPI, bookmarksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserProfile({ userId, onClose, onReply, onDeletePost }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const response = await usersAPI.getUserProfile(userId);
      setProfile(response.data);
      setFollowing(response.data.is_following);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    
    try {
      await followsAPI.toggleFollow(userId);
      setFollowing(!following);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) return;
    
    try {
      await likesAPI.toggleLike(postId);
      setProfile(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if (post.post_id === postId) {
            return {
              ...post,
              liked_by_user: !post.liked_by_user,
              likes: post.liked_by_user ? post.likes - 1 : post.likes + 1
            };
          }
          return post;
        })
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmarkPost = async (postId) => {
    if (!user) return;
    
    try {
      await bookmarksAPI.toggleBookmark(postId);
      setProfile(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if (post.post_id === postId) {
            return {
              ...post,
              bookmarked_by_user: !post.bookmarked_by_user
            };
          }
          return post;
        })
      }));
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-500">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">{profile.user.display_name}</h1>
            <p className="text-sm text-gray-500">{profile.posts.length} posts</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="text-6xl">{profile.user.avatar}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.user.display_name}</h2>
                <p className="text-gray-500">@{profile.user.username}</p>
                <p className="mt-3 text-gray-700">{profile.user.bio}</p>
                <div className="flex space-x-6 mt-4 text-sm">
                  <div>
                    <span className="font-bold">{profile.posts.length}</span>
                    <span className="text-gray-500 ml-1">Posts</span>
                  </div>
                </div>
              </div>
            </div>
            {user && !profile.is_own_profile && (
              <button
                onClick={handleFollow}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition ${
                  following
                    ? 'bg-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {following ? <UserMinus size={16} /> : <UserPlus size={16} />}
                <span>{following ? 'Unfollow' : 'Follow'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-4">Posts & Replies</h3>
          <div className="space-y-4">
            {profile.posts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No posts yet</p>
            ) : (
              profile.posts.map(post => (
                <div key={post.post_id} className="border-b border-gray-200 pb-4 last:border-0">
                  {/* Reply context - show when it's a reply */}
                  {post.is_reply && post.parent_content && (
                    <div className="bg-gray-50 rounded p-3 mb-2 text-sm border-l-4 border-blue-200">
                      <div className="flex items-center space-x-1 text-gray-500 mb-1">
                        <MessageCircle size={12} />
                        <span>Replying to @{post.parent_username}</span>
                      </div>
                      <p className="text-gray-700 italic">"{post.parent_content}"</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{formatTimestamp(post.created_at)}</span>
                        {post.is_reply && (
                          <span className="text-blue-500 ml-2">• Reply</span>
                        )}
                      </div>
                      <p className="mt-2 text-gray-800">{post.content}</p>
                      <div className="flex items-center space-x-6 mt-3 text-gray-500 text-sm">
                        {user && (
                          <>
                            <button
                              onClick={() => handleLikePost(post.post_id)}
                              className={`flex items-center space-x-1 transition ${
                                post.liked_by_user ? 'text-red-500' : 'hover:text-red-500'
                              }`}
                            >
                              <Heart size={16} fill={post.liked_by_user ? 'currentColor' : 'none'} />
                              <span>{post.likes}</span>
                            </button>
                            <button
                              onClick={() => onReply(post)}
                              className="flex items-center space-x-1 hover:text-green-500 transition"
                            >
                              <MessageCircle size={16} />
                              <span>Reply</span>
                            </button>
                            <button
                              onClick={() => handleBookmarkPost(post.post_id)}
                              className={`flex items-center space-x-1 transition ${
                                post.bookmarked_by_user ? 'text-yellow-500' : 'hover:text-yellow-500'
                              }`}
                            >
                              <Bookmark size={16} fill={post.bookmarked_by_user ? 'currentColor' : 'none'} />
                            </button>
                          </>
                        )}
                        <button
                          className="flex items-center space-x-1 text-gray-500"
                          disabled
                        >
                          <MessageCircle size={16} />
                          <span>{post.replies}</span>
                        </button>
                      </div>
                    </div>
                    {user && profile.is_own_profile && (
                      <button
                        onClick={() => onDeletePost(post.post_id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
