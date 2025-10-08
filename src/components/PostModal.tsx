import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createPost } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function PostModal({ isOpen, onClose, onPostCreated }: PostModalProps) {
  const { userData } = useAuth();
  const [content, setContent] = useState('');
  const [type, setType] = useState<'discussion' | 'prayer-request'>('discussion');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !content.trim()) return;

    setLoading(true);
    try {
      await createPost({
        familyId: userData.familyId,
        authorId: userData.id,
        authorName: userData.displayName,
        content: content.trim(),
        type,
      });

      setContent('');
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">Create Post</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setType('discussion')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  type === 'discussion'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Discussion
              </button>
              <button
                type="button"
                onClick={() => setType('prayer-request')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  type === 'prayer-request'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Prayer Request
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Share your thoughts with your family..."
              required
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
