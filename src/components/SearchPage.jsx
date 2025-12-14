import { useState } from 'react';
import { Search, Filter, Calendar, User, X, Heart, MessageCircle, Share2, Trash2, Bookmark } from 'lucide-react';
import { searchAPI, likesAPI, bookmarksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SearchPage({ onReply, onDeletePost }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    text: '',
    username: '',
    from_date: '',
    to_date: ''
  });
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      const searchParams = {
        ...filters,
        text: searchQuery || filters.text,
        limit: 50,
        offset: 0
      };
      
      const response = await searchAPI.searchPosts(searchParams);
      setSearchResults(response.data.posts);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      text: '',
      username: '',
      from_date: '',
      to_date: ''
    });
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleLikePost = async (postId) => {
    if (!user) return;
    
    try {
      await likesAPI.toggleLike(postId);
      // Update the like status in search results
      setSearchResults(prev => prev.map(post => {
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

  const handleBookmarkPost = async (postId) => {
    if (!user) return;
    
    try {
      await bookmarksAPI.toggleBookmark(postId);
      // Update the bookmark status in search results
      setSearchResults(prev => prev.map(post => {
        if (post.post_id === postId) {
          return {
            ...post,
            bookmarked_by_user: !post.bookmarked_by_user
          };
        }
        return post;
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
          <Search size={24} />
          <span>Search Posts</span>
        </h2>
        
        {/* Main Search Bar */}
        <div className="flex space-x-2 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg transition flex items-center space-x-2 ${
              showFilters ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:bg-gray-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-1" />
                  Filter by user
                </label>
                <input
                  type="text"
                  placeholder="Enter username..."
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content contains
                </label>
                <input
                  type="text"
                  placeholder="Search in post content..."
                  value={filters.text}
                  onChange={(e) => handleFilterChange('text', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  From date
                </label>
                <input
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => handleFilterChange('from_date', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  To date
                </label>
                <input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => handleFilterChange('to_date', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition flex items-center space-x-1"
              >
                <X size={14} />
                <span>Clear all</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold">
              Search Results ({searchResults.length})
            </h3>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {loading ? 'Searching...' : 'No posts found matching your criteria.'}
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {searchResults.map(post => (
                <div key={post.post_id} className="border-b border-gray-100 pb-4 last:border-0">
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
                  
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">{post.avatar}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold">{post.display_name}</span>
                          <span className="text-gray-500 ml-2">@{post.username}</span>
                          <span className="text-gray-400 ml-2">· {formatTimestamp(post.created_at)}</span>
                          {post.is_reply && (
                            <span className="text-blue-500 ml-2 text-sm">• Reply</span>
                          )}
                        </div>
                        {user && parseInt(post.user_id) === parseInt(user.user_id) && (
                          <button
                            onClick={() => onDeletePost(post.post_id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
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
                              onClick={() => onReply(post)}
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
      )}
    </div>
  );
}