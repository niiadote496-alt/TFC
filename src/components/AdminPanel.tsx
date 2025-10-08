import React, { useState } from 'react';
import { X, Upload, Image, Music, MessageSquare } from 'lucide-react';
import { uploadMedia, createPost, createNotification } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'media' | 'announcement';

export default function AdminPanel({ isOpen, onClose, onSuccess }: AdminPanelProps) {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('media');
  const [loading, setLoading] = useState(false);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');

  const [announcementContent, setAnnouncementContent] = useState('');

  if (!isOpen || userData?.role !== 'admin') return null;

  const handleMediaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !mediaFile) return;

    setLoading(true);
    try {
      await uploadMedia(userData.familyId, userData.id, mediaFile, mediaTitle, mediaDescription);

      await createNotification(
        userData.familyId,
        'New Media Uploaded',
        `${userData.displayName} uploaded: ${mediaTitle}`,
        'media'
      );

      setMediaFile(null);
      setMediaTitle('');
      setMediaDescription('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Failed to upload media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !announcementContent.trim()) return;

    setLoading(true);
    try {
      await createPost({
        familyId: userData.familyId,
        authorId: userData.id,
        authorName: userData.displayName,
        content: announcementContent.trim(),
        type: 'announcement',
      });

      await createNotification(
        userData.familyId,
        'New Announcement',
        announcementContent.substring(0, 100),
        'announcement'
      );

      setAnnouncementContent('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h2>
        <p className="text-gray-600 mb-6">Manage your family's content</p>

        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('media')}
            className={`pb-4 px-4 font-medium transition-colors relative ${
              activeTab === 'media'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Media</span>
            </div>
            {activeTab === 'media' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('announcement')}
            className={`pb-4 px-4 font-medium transition-colors relative ${
              activeTab === 'announcement'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Make Announcement</span>
            </div>
            {activeTab === 'announcement' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>

        {activeTab === 'media' && (
          <form onSubmit={handleMediaUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*,audio/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    {mediaFile ? (
                      <>
                        {mediaFile.type.startsWith('image/') ? (
                          <Image className="w-12 h-12 text-blue-600 mb-2" />
                        ) : (
                          <Music className="w-12 h-12 text-blue-600 mb-2" />
                        )}
                        <p className="text-sm font-medium text-gray-900">{mediaFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-900">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Images or Audio files
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="media-title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                id="media-title"
                type="text"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter media title"
                required
              />
            </div>

            <div>
              <label htmlFor="media-description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="media-description"
                value={mediaDescription}
                onChange={(e) => setMediaDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add a description..."
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
                disabled={loading || !mediaFile || !mediaTitle.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'announcement' && (
          <form onSubmit={handleAnnouncementPost} className="space-y-6">
            <div>
              <label htmlFor="announcement-content" className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Content
              </label>
              <textarea
                id="announcement-content"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Write your announcement here..."
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                This announcement will be posted to the community feed and all family members will receive a notification.
              </p>
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
                disabled={loading || !announcementContent.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
