import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Trash2, Bookmark } from 'lucide-react';
import { postsAPI, likesAPI, bookmarksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ThreadPage({ postId, onClose, onReply, onDeletePost, onViewThread }) {
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThread();
  }, [postId]);

  const loadThread = async () => {
    try {
      const response = await postsAPI.getThread(postId);
      setThread(response.data);
    } catch (error) {
      console.error('Failed to load thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (targetPostId) => {
    if (!user) return;
    
    try {
      await likesAPI.toggleLike(targetPostId);
      
      // Update the main post or replies
      setThread(prev => {
        const updated = { ...prev };
        
        if (updated.main_post.post_id === targetPostId) {
          updated.main_post = {
            ...updated.main_post,
            liked_by_user: !updated.main_post.liked_by_user,
            likes: updated.main_post.liked_by_user 
              ? updated.main_post.likes - 1 
              : updated.main_post.likes + 1
          };
        } else {
          updated.replies = updated.replies.map(reply => {
            if (reply.post_id === targetPostId) {
              return {
                ...reply,
                liked_by_user: !reply.liked_by_user,
                likes: reply.liked_by_user ? reply.likes - 1 : reply.likes + 1
              };
            }
            return reply;
          });
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmarkPost = async (targetPostId) => {
    if (!user) return;
    
    try {
      await bookmarksAPI.toggleBookmark(targetPostId);
      
      // Update the main post or replies
      setThread(prev => {
        const updated = { ...prev };
        
        if (updated.main_post.post_id === targetPostId) {
          updated.main_post = {
            ...updated.main_post,
            bookmarked_by_user: !updated.main_post.bookmarked_by_user
          };
        } else {
          updated.replies = updated.replies.map(reply => {
            if (reply.post_id === targetPostId) {
              return {
                ...reply,
                bookmarked_by_user: !reply.bookmarked_by_user
              };
            }
            return reply;
          });
        }
        
        return updated;
      });
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
        <div className="text-xl">Loading thread...</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-500">Thread not found</div>
      </div>
    );
  }

  const mainPost = thread.main_post;

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
            <h1 className="text-xl font-bold">Thread</h1>
            <p className="text-sm text-gray-500">{thread.replies.length} replies</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Main Post */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Parent context if this is a reply */}
          {mainPost.is_reply && mainPost.parent_content && (
            <div className="bg-gray-50 rounded p-3 mb-4 text-sm border-l-4 border-blue-200">
              <div className="flex items-center space-x-1 text-gray-500 mb-1">
                <MessageCircle size={12} />
                <span>Replying to @{mainPost.parent_username}</span>
              </div>
              <p className="text-gray-700 italic">"{mainPost.parent_content}"</p>
            </div>
          )}
          
          <div className="flex items-start space-x-3">
            <div className="text-4xl">{mainPost.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-lg">{mainPost.display_name}</span>
                  <span className="text-gray-500 ml-2">@{mainPost.username}</span>
                  <span className="text-gray-400 ml-2">· {formatTimestamp(mainPost.created_at)}</span>
                </div>
                {user && parseInt(mainPost.user_id) === parseInt(user.user_id) && (
                  <button
                    onClick={() => onDeletePost(mainPost.post_id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <p className="mt-3 text-gray-800 text-lg leading-relaxed">{mainPost.content}</p>
              <div className="flex items-center space-x-6 mt-6 text-gray-500">
                {user && (
                  <>
                    <button
                      onClick={() => handleLikePost(mainPost.post_id)}
                      className={`flex items-center space-x-2 transition ${
                        mainPost.liked_by_user ? 'text-red-500' : 'hover:text-red-500'
                      }`}
                    >
                      <Heart size={20} fill={mainPost.liked_by_user ? 'currentColor' : 'none'} />
                      <span>{mainPost.likes}</span>
                    </button>
                    <button
                      onClick={() => onReply(mainPost)}
                      className="flex items-center space-x-2 hover:text-green-500 transition"
                    >
                      <Share2 size={20} />
                      <span>Reply</span>
                    </button>
                    <button
                      onClick={() => handleBookmarkPost(mainPost.post_id)}
                      className={`flex items-center space-x-2 transition ${
                        mainPost.bookmarked_by_user ? 'text-yellow-500' : 'hover:text-yellow-500'
                      }`}
                    >
                      <Bookmark size={20} fill={mainPost.bookmarked_by_user ? 'currentColor' : 'none'} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => mainPost.replies > 0 ? onViewThread(mainPost.post_id) : null}
                  className={`flex items-center space-x-2 transition ${
                    mainPost.replies > 0 ? 'hover:text-blue-500 cursor-pointer' : 'text-gray-500'
                  }`}
                >
                  <MessageCircle size={20} />
                  <span>{mainPost.replies}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        {thread.replies.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Replies</h3>
            </div>
            <div className="divide-y">
              {thread.replies.map(reply => (
                <div key={reply.post_id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">{reply.avatar}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold">{reply.display_name}</span>
                          <span className="text-gray-500 ml-2">@{reply.username}</span>
                          <span className="text-gray-400 ml-2">· {formatTimestamp(reply.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user && parseInt(reply.user_id) === parseInt(user.user_id) && (
                            <button
                              onClick={() => onDeletePost(reply.post_id)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                        </div>
                      </div>
                      <p className="mt-2 text-gray-800">{reply.content}</p>
                      <div className="flex items-center space-x-6 mt-4 text-gray-500">
                        {user && (
                          <>
                            <button
                              onClick={() => handleLikePost(reply.post_id)}
                              className={`flex items-center space-x-2 transition ${
                                reply.liked_by_user ? 'text-red-500' : 'hover:text-red-500'
                              }`}
                            >
                              <Heart size={18} fill={reply.liked_by_user ? 'currentColor' : 'none'} />
                              <span>{reply.likes}</span>
                            </button>
                            <button
                              onClick={() => onReply(reply)}
                              className="flex items-center space-x-2 hover:text-green-500 transition"
                            >
                              <Share2 size={18} />
                              <span>Reply</span>
                            </button>
                            <button
                              onClick={() => handleBookmarkPost(reply.post_id)}
                              className={`flex items-center space-x-2 transition ${
                                reply.bookmarked_by_user ? 'text-yellow-500' : 'hover:text-yellow-500'
                              }`}
                            >
                              <Bookmark size={18} fill={reply.bookmarked_by_user ? 'currentColor' : 'none'} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => reply.replies > 0 ? onViewThread(reply.post_id) : null}
                          className={`flex items-center space-x-2 transition ${
                            reply.replies > 0 ? 'hover:text-blue-500 cursor-pointer' : 'text-gray-500'
                          }`}
                        >
                          <MessageCircle size={18} />
                          <span>{reply.replies}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

