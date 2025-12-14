import { useState } from 'react';
import { X } from 'lucide-react';

export default function ReplyModal({ post, onClose, onReply }) {
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!replyContent.trim()) return;

    setLoading(true);
    await onReply(replyContent);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold mb-4">Reply to Post</h2>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">{post.avatar}</span>
            <div>
              <span className="font-bold">{post.display_name}</span>
              <span className="text-gray-500 ml-2">@{post.username}</span>
            </div>
          </div>
          <p className="text-gray-700">{post.content}</p>
        </div>

        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
          placeholder="Write your reply..."
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
        />

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!replyContent.trim() || loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}