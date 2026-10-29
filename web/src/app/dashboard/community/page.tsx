'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Search,
  PlusCircle,
  ThumbsUp,
  Eye,
  Flag,
  Edit2,
  Trash2,
  Send,
  Sparkles,
  Tractor,
  Bug,
  Droplets,
  CloudSun,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  X,
  Share2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ToastProvider';

interface CommunityPost {
  id: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    profileImage?: string | null;
    role: string;
  };
  title: string;
  content: string;
  category: string;
  tags?: string[];
  imageUrl?: string | null;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  createdAt: string;
}

interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    profileImage?: string | null;
    role: string;
  };
  content: string;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Discussions', icon: Layers },
  { id: 'CROPS', label: 'Crops & Agronomy', icon: Sparkles },
  { id: 'EQUIPMENT', label: 'Machinery & Implements', icon: Tractor },
  { id: 'PESTS_DISEASES', label: 'Pests & Diseases', icon: Bug },
  { id: 'IRRIGATION', label: 'Irrigation & Water', icon: Droplets },
  { id: 'WEATHER', label: 'Weather Planning', icon: CloudSun },
  { id: 'MARKETS', label: 'Mandi Rates', icon: TrendingUp }
];

export default function CommunityPage() {
  const { user } = useStore();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);

  // Create post modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('CROPS');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);

  // Active expanded discussion thread
  const [activePost, setActivePost] = useState<any | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit post state
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Report modal state
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, showMyPostsOnly, page]);

  async function fetchPosts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '15');
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (showMyPostsOnly) params.append('myPosts', 'true');
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/community/posts?${params.toString()}`);
      setPosts(res.data?.posts || []);
      setTotal(res.data?.total || 0);
    } catch (err: any) {
      console.error('Failed to load community posts:', err);
      showToast('Failed to load community discussions.', 'warning');
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle.trim().length < 3) {
      showToast('Title must be at least 3 characters long', 'warning');
      return;
    }
    if (!newContent.trim() || newContent.trim().length < 10) {
      showToast('Please provide a detailed question or description (minimum 10 characters)', 'warning');
      return;
    }

    try {
      setCreating(true);
      const res = await api.post('/community/posts', {
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        tags: newTags.trim()
      });

      showToast('Your farming question has been posted to the community!', 'success');
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setPage(1);
      fetchPosts();
    } catch (err: any) {
      console.error('Create post error:', err);
      showToast(err.response?.data?.error || 'Failed to publish post', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDiscussion = async (postId: string) => {
    try {
      setCommentsLoading(true);
      const res = await api.get(`/community/posts/${postId}`);
      setActivePost(res.data);
    } catch (err: any) {
      console.error('Open post error:', err);
      showToast('Failed to load discussion thread', 'warning');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !newCommentText.trim() || newCommentText.trim().length < 2) return;

    try {
      setSubmittingComment(true);
      const res = await api.post(`/community/posts/${activePost.id}/comments`, {
        content: newCommentText.trim()
      });

      showToast('Reply published successfully!', 'success');
      setNewCommentText('');
      // Append comment to activePost
      setActivePost({
        ...activePost,
        comments: [...(activePost.comments || []), res.data]
      });

      // Update comment count in main list
      setPosts((prev) =>
        prev.map((p) => (p.id === activePost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p))
      );
    } catch (err: any) {
      console.error('Add comment error:', err);
      showToast(err.response?.data?.error || 'Failed to submit comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/community/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likesCount: res.data.likesCount } : p))
      );
      if (activePost && activePost.id === postId) {
        setActivePost({ ...activePost, likesCount: res.data.likesCount });
      }
    } catch (_) {}
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this community post?')) return;

    try {
      await api.delete(`/community/posts/${postId}`);
      showToast('Post removed successfully', 'success');
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (activePost?.id === postId) setActivePost(null);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete post', 'error');
    }
  };

  const handleReportPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPostId || !reportReason.trim()) return;

    try {
      await api.post('/community/reports', {
        postId: reportingPostId,
        reason: reportReason.trim()
      });
      showToast('Report submitted for moderator review. Thank you for keeping our community safe.', 'success');
      setReportingPostId(null);
      setReportReason('');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to submit report', 'error');
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'CROPS':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'EQUIPMENT':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'PESTS_DISEASES':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'IRRIGATION':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'WEATHER':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'MARKETS':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-500/30 inline-flex items-center gap-1.5">
            <Users size={14} /> Shared Farmer Knowledge Hub
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            Farmer Community & Discussions
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Connect with verified farmers, ask questions about crops & machinery, share pest solutions, and compare local mandi insights.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer shrink-0"
        >
          <PlusCircle size={16} />
          <span>Ask a Question / Post</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id && !showMyPostsOnly;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setShowMyPostsOnly(false);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500'
              }`}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => {
            setShowMyPostsOnly(!showMyPostsOnly);
            setPage(1);
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ml-auto ${
            showMyPostsOnly
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500'
          }`}
        >
          My Questions
        </button>
      </div>

      {/* Search and Filters */}
      <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions (e.g. Paddy blast, Harvester rent, Cotton prices)"
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Posts List & Active Discussion Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Posts Column */}
        <div className={`${activePost ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => {
              const isAuthor = user?.id === post.authorId || user?.role === 'ADMIN';
              const isSelected = activePost?.id === post.id;

              return (
                <div
                  key={post.id}
                  onClick={() => handleOpenDiscussion(post.id)}
                  className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md space-y-3 ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
                        {post.author?.profileImage ? (
                          <img src={post.author.profileImage} alt={post.author.name} className="w-full h-full object-cover" />
                        ) : (
                          post.author?.name?.charAt(0) || 'F'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {post.author?.name || 'Farmer'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {post.author?.role || 'FARMER'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[10px] font-medium text-slate-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => handleLikePost(post.id, e)}
                        className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                      >
                        <ThumbsUp size={14} />
                        <span>{post.likesCount}</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MessageSquare size={14} />
                        <span>{post.commentsCount} replies</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Eye size={13} />
                        <span>{post.viewsCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportingPostId(post.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Report Inappropriate Content"
                      >
                        <Flag size={13} />
                      </button>

                      {isAuthor && (
                        <button
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Users size={36} className="text-slate-400 mx-auto" />
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                No Discussions Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Be the first farmer to start a conversation or ask an agronomic question in this category.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Create First Post
              </button>
            </div>
          )}
        </div>

        {/* Active Discussion Detail Column */}
        {activePost && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5 sticky top-6">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getCategoryColor(activePost.category)}`}>
                  {activePost.category}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2">
                  {activePost.title}
                </h3>
              </div>
              <button
                onClick={() => setActivePost(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
              {activePost.content}
            </div>

            {/* Replies List */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                Farmer Replies ({activePost.comments?.length || 0})
              </span>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activePost.comments?.length > 0 ? (
                  activePost.comments.map((comment: CommunityComment) => (
                    <div
                      key={comment.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {comment.author?.name || 'Farmer'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    No replies yet. Share your experience or advise this farmer below.
                  </p>
                )}
              </div>
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleAddComment} className="pt-2">
              <div className="relative">
                <textarea
                  rows={3}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a helpful reply or share your field experience..."
                  className="w-full p-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newCommentText.trim()}
                  className="absolute right-2.5 bottom-3 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-40 transition-all cursor-pointer"
                >
                  {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Farmer Discussion
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Post to Community
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
                >
                  <option value="CROPS">Crops & Agronomy</option>
                  <option value="EQUIPMENT">Machinery & Implements</option>
                  <option value="PESTS_DISEASES">Pests & Diseases</option>
                  <option value="IRRIGATION">Irrigation & Soil Moisture</option>
                  <option value="WEATHER">Weather & Seasonal Planning</option>
                  <option value="MARKETS">Mandi Prices & APMC</option>
                  <option value="GENERAL">General Farming</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Question / Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Which fungicide is most effective for sheath blight in Paddy?"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Provide context like crop stage, soil type, symptoms observed, or field equipment used..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="paddy, disease, fungicide, guntur"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating && <Loader2 size={13} className="animate-spin" />}
                  <span>{creating ? 'Publishing...' : 'Publish Post'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-800 dark:text-white">
              Report Content for Review
            </h3>
            <p className="text-xs text-slate-500">
              Please explain why this content violates community guidelines (e.g. spam, abusive language, misinformation).
            </p>
            <form onSubmit={handleReportPost} className="space-y-4">
              <textarea
                rows={3}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none resize-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setReportingPostId(null); setReportReason(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

