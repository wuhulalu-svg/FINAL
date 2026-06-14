import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Trash2, Image as ImageIcon, X, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// API 基础地址
const API_BASE = 'https://final-production-4362.up.railway.app/api';

interface Post {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  content: string;
  image: string | null;
  like_count: number;
  comment_count: number;
  user_liked: number;
  created_at: string;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  content: string;
  created_at: string;
}

interface HealthSquareProps {
  userId: number;
  userName: string;
}

// 简单的中英文翻译映射（用于翻译用户发布的内容）
const contentTranslations: Record<string, { zh: string; en: string }> = {
  '跑步': { zh: '跑步', en: 'Running' },

};

function translateContent(content: string, targetLang: 'zh' | 'en'): string {
  if (targetLang === 'zh') return content;
  
  let translated = content;
  for (const [key, val] of Object.entries(contentTranslations)) {
    if (translated.includes(key)) {
      translated = translated.replace(new RegExp(key, 'g'), val.en);
    }
  }
  return translated;
}

export function HealthSquare({ userId, userName }: HealthSquareProps) {
  const { t, language, formatDate, formatShortDate } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem('token');

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE}/square/posts`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('获取动态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: number) => {
    try {
      const response = await fetch(`${API_BASE}/square/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  };

  const handleSubmitPost = async () => {
    if (!newPostContent.trim()) {
      alert(t('请输入内容'));
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/square/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ content: newPostContent, image: newPostImage })
      });
      
      if (response.ok) {
        setNewPostContent('');
        setNewPostImage(null);
        setShowPostForm(false);
        fetchPosts();
      } else {
        const error = await response.json();
        alert(error.error || t('发布失败'));
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert(t('发布失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`${API_BASE}/square/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleComment = async (postId: number) => {
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      const response = await fetch(`${API_BASE}/square/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ content: newComment })
      });
      
      if (response.ok) {
        setNewComment('');
        fetchComments(postId);
        fetchPosts();
      } else {
        const error = await response.json();
        alert(error.error || t('评论失败'));
      }
    } catch (error) {
      console.error('评论失败:', error);
      alert(t('评论失败'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm(t('confirmDelete'))) return;
    
    try {
      const response = await fetch(`${API_BASE}/square/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (response.ok) {
        fetchPosts();
      } else {
        alert(t('deleteFailed'));
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert(t('deleteFailed'));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (language === 'zh') {
      if (minutes < 1) return '刚刚';
      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      return `${days}天前`;
    } else {
      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes} minutes ago`;
      if (hours < 24) return `${hours} hours ago`;
      return `${days} days ago`;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {!showPostForm ? (
        <button
          onClick={() => setShowPostForm(true)}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-4 mb-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <ImageIcon size={20} />
          <span>{t('shareYourHealthMoment')}</span>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">{t('publishPost')}</h3>
            <button onClick={() => setShowPostForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={t('shareYourHealthMoment')}
            className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
            rows={4}
          />
          {newPostImage && (
            <div className="relative mt-4 inline-block">
              <img src={newPostImage} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
              <button
                onClick={() => setNewPostImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <ImageIcon size={20} />
              <span>{t('addImage')}</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              onClick={handleSubmitPost}
              disabled={submitting || !newPostContent.trim()}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {submitting ? t('publishPost') : t('publishPost')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🏋️</div>
            <h3 className="text-gray-800 dark:text-white font-medium mb-2">{t('noPosts')}</h3>
            <p className="text-gray-500">{t('beFirstToShare')}</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-5 pb-3 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {post.user_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">{post.user_name}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={10} />
                      {formatTime(post.created_at)}
                    </p>
                  </div>
                </div>
                {post.user_id === userId && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="px-5 pb-3">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {translateContent(post.content, language)}
                </p>
                {post.image && (
                  <img
                    src={post.image}
                    alt="Post image"
                    className="mt-3 rounded-xl max-h-96 w-full object-cover"
                  />
                )}
              </div>

              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-6">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 transition-colors ${post.user_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                >
                  <Heart size={20} fill={post.user_liked ? 'currentColor' : 'none'} />
                  <span>{post.like_count}</span>
                </button>
                <button
                  onClick={() => {
                    if (expandedComments === post.id) {
                      setExpandedComments(null);
                    } else {
                      setExpandedComments(post.id);
                      if (!comments[post.id]) {
                        fetchComments(post.id);
                      }
                    }
                  }}
                  className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <MessageCircle size={20} />
                  <span>{post.comment_count}</span>
                </button>
              </div>

              {expandedComments === post.id && (
                <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                          {comment.user_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-2">
                            <span className="font-medium text-sm text-gray-800 dark:text-white">{comment.user_name}</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                              {translateContent(comment.content, language)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(comment.created_at)}</p>
                        </div>
                      </div>
                    ))}
                    {(!comments[post.id] || comments[post.id].length === 0) && (
                      <p className="text-center text-gray-400 text-sm py-2">{t('noComments')}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t('writeComment')}
                      className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
