import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Family, Media, Post, Notification } from '../types';
import {
  getFamily,
  getFamilyMedia,
  getFamilyPosts,
  getFamilyNotifications,
  subscribeToFamilyPosts,
  subscribeToFamilyNotifications,
  togglePostLike,
  addComment
} from '../lib/api';
import Layout from './Layout';
import PostModal from './PostModal';
import AdminPanel from './AdminPanel';
import BibleQuiz from './BibleQuiz';
import {
  Image,
  Music,
  MessageSquare,
  Bell,
  Calendar,
  Users,
  Download,
  Heart,
  MessageCircle,
  Camera,
  Headphones,
  Trophy,
  Shield,
  Plus,
  Send
} from 'lucide-react';

export default function FamilyDashboard() {
  const { userData } = useAuth();

  const [family, setFamily] = useState<Family | null>(null);
  const [recentMedia, setRecentMedia] = useState<Media[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'photos' | 'audio' | 'community'>('community');
  const [loading, setLoading] = useState(true);

  const [showPostModal, setShowPostModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadFamilyData = async () => {
      if (!userData?.familyId) return;

      try {
        setLoading(true);

        const familyData = await getFamily(userData.familyId);
        setFamily(familyData);

        const mediaData = await getFamilyMedia(userData.familyId);
        setRecentMedia(mediaData);

        const postsData = await getFamilyPosts(userData.familyId);
        setRecentPosts(postsData);

        const notificationsData = await getFamilyNotifications(userData.familyId, userData.id);
        setNotifications(notificationsData);

      } catch (error) {
        console.error('Error loading family data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFamilyData();

    let unsubscribePosts: (() => void) | undefined;
    let unsubscribeNotifications: (() => void) | undefined;

    if (userData?.familyId) {
      unsubscribePosts = subscribeToFamilyPosts(userData.familyId, setRecentPosts);
      unsubscribeNotifications = subscribeToFamilyNotifications(userData.familyId, userData.id, setNotifications);
    }

    return () => {
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [userData?.familyId, userData?.id]);

  const handleLikePost = async (postId: string) => {
    if (!userData) return;
    try {
      await togglePostLike(postId, userData.id);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!userData || !commentInputs[postId]?.trim()) return;
    try {
      await addComment(postId, userData.id, userData.displayName, commentInputs[postId].trim());
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleRefresh = async () => {
    if (!userData?.familyId) return;
    try {
      const mediaData = await getFamilyMedia(userData.familyId);
      setRecentMedia(mediaData);
      const postsData = await getFamilyPosts(userData.familyId);
      setRecentPosts(postsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const photos = recentMedia.filter(media => media.type === 'photo');
  const audio = recentMedia.filter(media => media.type === 'audio');

  return (
    <Layout title={`${family?.name} Family Dashboard`}>
      <div className="space-y-8">
        <div className="bg-white rounded-3xl shadow-lg p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome to {family?.name}</h1>
              <p className="text-white/90 text-lg">{family?.description}</p>
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>{family?.memberCount} members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Active community</span>
                </div>
                {userData?.role === 'admin' && (
                  <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Admin</span>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center">
                <Users className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{photos.length}</h3>
                <p className="text-gray-600">Photos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{audio.length}</h3>
                <p className="text-gray-600">Audio</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{recentPosts.length}</h3>
                <p className="text-gray-600">Posts</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowQuiz(true)}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-white"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Bible Quiz</h3>
                <p className="text-white/90 text-sm">Test yourself</p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowPostModal(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Post</span>
          </button>

          {userData?.role === 'admin' && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-colors space-x-2"
            >
              <Shield className="w-5 h-5" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8 py-4">
              <button
                onClick={() => setActiveTab('community')}
                className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === 'community'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Community</span>
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === 'photos'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Photos</span>
              </button>
              <button
                onClick={() => setActiveTab('audio')}
                className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === 'audio'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Headphones className="w-4 h-4" />
                <span>Audio</span>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'community' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Community Feed</h2>
                </div>
                <div className="space-y-6">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-2xl p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-medium">
                            {post.authorName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2 flex-wrap">
                            <span className="font-medium text-gray-900">{post.authorName}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            {post.type === 'announcement' && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                Announcement
                              </span>
                            )}
                            {post.type === 'prayer-request' && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                Prayer Request
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
                          <div className="flex items-center space-x-6 mb-4">
                            <button
                              onClick={() => handleLikePost(post.id)}
                              className={`flex items-center space-x-2 transition-colors ${
                                post.likes.includes(userData?.id || '')
                                  ? 'text-red-500'
                                  : 'text-gray-500 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${post.likes.includes(userData?.id || '') ? 'fill-current' : ''}`} />
                              <span className="text-sm font-medium">{post.likes.length}</span>
                            </button>
                            <div className="flex items-center space-x-2 text-gray-500">
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">{post.comments.length}</span>
                            </div>
                          </div>

                          {post.comments.length > 0 && (
                            <div className="space-y-3 mb-4">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="bg-white rounded-xl p-3">
                                  <div className="flex items-start space-x-2">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-gray-600 text-sm font-medium">
                                        {comment.authorName.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900">{comment.authorName}</p>
                                      <p className="text-sm text-gray-700">{comment.content}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post.id);
                                }
                              }}
                              placeholder="Add a comment..."
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentPosts.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No posts yet. Be the first to post!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Photos</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photos.map((photo) => (
                    <div key={photo.id} className="bg-gray-100 rounded-2xl aspect-square relative overflow-hidden group">
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <Image className="w-16 h-16 text-blue-400" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <h3 className="font-semibold mb-1">{photo.title}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/90">{photo.description || 'No description'}</span>
                          <Download className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {photos.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No photos available yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Audio</h2>
                </div>
                <div className="space-y-4">
                  {audio.map((audioFile) => (
                    <div key={audioFile.id} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Music className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{audioFile.title}</h3>
                            <p className="text-sm text-gray-600">{audioFile.description || 'No description'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors">
                            <Music className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {audio.length === 0 && (
                    <div className="text-center py-12">
                      <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No audio files available yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Updates</h2>
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div className="space-y-4">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">{notification.title}</h3>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <PostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPostCreated={handleRefresh}
      />

      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onSuccess={handleRefresh}
      />

      <BibleQuiz
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
      />
    </Layout>
  );
}
