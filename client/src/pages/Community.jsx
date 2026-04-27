import React, { useState, useEffect, useContext } from 'react';
import { Users, AlertCircle, MessageSquare, ThumbsUp, Search, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-toastify';

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Post
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pagination & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Interaction State
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [interacting, setInteracting] = useState(false);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPosts(page, searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, page]);

  const fetchPosts = async (currentPage, search) => {
    setLoading(true);
    try {
      const res = await api.get(`/community/posts?page=${currentPage}&limit=10&search=${encodeURIComponent(search)}`);
      if(res.data.success) {
        setPosts(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      setError('Failed to load community discussions.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await api.post('/community/post', { title, content });
      if(res.data.success) {
        setTitle('');
        setContent('');
        toast.success("Post created successfully!");
        fetchPosts(1, searchQuery); // Reload to page 1
        setPage(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!user) return toast.info("Please login to like posts.");
    if (interacting) return;
    
    setInteracting(true);
    try {
      const res = await api.put(`/community/post/${postId}/like`);
      if(res.data.success) {
        setPosts(posts.map(p => 
          p._id === postId ? { ...p, likes: res.data.data.likes } : p
        ));
      }
    } catch (err) {
      toast.error("Failed to update like status.");
    } finally {
      setInteracting(false);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!user) return toast.info("Please login to comment.");
    
    const text = commentInput[postId];
    if (!text?.trim()) return;

    setInteracting(true);
    try {
      const res = await api.post(`/community/post/${postId}/comment`, { text });
      if(res.data.success) {
        setPosts(posts.map(p => 
          p._id === postId ? { ...p, comments: res.data.data.comments } : p
        ));
        setCommentInput({ ...commentInput, [postId]: '' });
        toast.success("Comment added!");
      }
    } catch (err) {
      toast.error("Failed to add comment.");
    } finally {
      setInteracting(false);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <PageTransition>
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-nature-100 dark:bg-nature-900/40 rounded-lg">
               <Users className="w-8 h-8 text-nature-600 dark:text-nature-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Farmers Community</h1>
              <p className="text-gray-600 dark:text-gray-400">Share knowledge, ask questions, and connect.</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search discussions..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-nature-500 transition-colors"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Create Post Form */}
            {user ? (
               <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleCreatePost}>
                  <input
                    type="text"
                    placeholder="Discussion Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-lg font-semibold px-0 py-2 border-0 border-b border-gray-200 dark:border-gray-700 focus:ring-0 focus:border-nature-500 bg-transparent mb-4 text-gray-900 dark:text-white"
                    required
                  />
                  <textarea
                    placeholder="What do you want to ask or share?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full resize-none px-0 py-2 border-0 focus:ring-0 bg-transparent text-gray-700 dark:text-gray-300"
                    rows="3"
                    required
                  ></textarea>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Posting as <span className="font-medium text-nature-700 dark:text-nature-400">{user.name}</span></span>
                    <button type="submit" disabled={submitting} className="btn-primary py-2 px-6 rounded-full text-sm">
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </form>
               </div>
            ) : (
              <div className="bg-nature-50 dark:bg-nature-900/20 p-6 rounded-xl border border-nature-200 dark:border-nature-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-nature-800 dark:text-nature-300">Join the discussion</h3>
                  <p className="text-sm text-nature-600 dark:text-nature-500">Log in to post your own questions and answers.</p>
                </div>
                <a href="/login" className="btn-primary bg-nature-700 dark:bg-nature-600 text-sm">Login</a>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/40 p-4 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-nature-200 border-t-nature-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              /* Posts List */
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                     <p className="text-gray-500 dark:text-gray-400">No discussions found. Be the first to post!</p>
                  </div>
                ) : (
                  <>
                  {posts.map((post) => (
                    <div key={post._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{post.title}</h2>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-4">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                           <button 
                             onClick={() => handleToggleLike(post._id)}
                             disabled={interacting}
                             className={`flex items-center gap-1.5 transition-colors ${user && post.likes?.includes(user._id) ? 'text-nature-600 dark:text-nature-400' : 'hover:text-nature-600 dark:hover:text-nature-400'}`}
                           >
                             <ThumbsUp className={`w-4 h-4 ${user && post.likes?.includes(user._id) ? 'fill-current' : ''}`} />
                             <span>{post.likes?.length || 0}</span>
                           </button>
                           <button 
                             onClick={() => toggleComments(post._id)}
                             className="flex items-center gap-1.5 hover:text-nature-600 dark:hover:text-nature-400 cursor-pointer transition-colors"
                           >
                             <MessageSquare className="w-4 h-4" />
                             <span>{post.comments?.length || 0}</span>
                           </button>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-nature-200 dark:bg-nature-800 flex items-center justify-center text-xs font-bold text-nature-700 dark:text-nature-300">
                             {post.author?.name?.charAt(0) || 'U'}
                           </div>
                           <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{post.author?.name || 'Unknown User'}</span>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {expandedComments[post._id] && (
                        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 animate-fadeIn">
                          {post.comments?.length > 0 ? (
                            <div className="space-y-4 mb-4">
                              {post.comments.map((c, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex flex-col">
                                  <span className="text-xs font-semibold text-nature-700 dark:text-nature-400 mb-1">{c.user?.name || 'User'}</span>
                                  <span className="text-sm text-gray-700 dark:text-gray-200">{c.text}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">No comments yet.</p>
                          )}
                          
                          {user && (
                            <form onSubmit={(e) => handleAddComment(e, post._id)} className="flex items-center gap-2">
                              <input 
                                type="text"
                                value={commentInput[post._id] || ''}
                                onChange={(e) => setCommentInput({...commentInput, [post._id]: e.target.value})}
                                placeholder="Add a comment..."
                                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nature-500 dark:text-white"
                              />
                              <button type="submit" disabled={interacting} className="p-2 bg-nature-100 dark:bg-nature-900/50 text-nature-700 dark:text-nature-400 hover:bg-nature-200 dark:hover:bg-nature-900 rounded-lg transition-colors">
                                <Send className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-4">
                      <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                      <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-nature-600 rounded-xl p-6 text-white shadow-md">
              <h3 className="font-bold text-lg mb-2">Community Guidelines</h3>
              <ul className="space-y-3 text-sm text-nature-100">
                <li className="flex gap-2"><span className="font-bold">•</span> Be respectful and supportive.</li>
                <li className="flex gap-2"><span className="font-bold">•</span> Share accurate farming data.</li>
                <li className="flex gap-2"><span className="font-bold">•</span> Avoid promotional spam.</li>
                <li className="flex gap-2"><span className="font-bold">•</span> Consult experts for critical issues.</li>
              </ul>
            </div>
          </div>
          
        </div>

      </div>
    </div>
    </PageTransition>
  );
};

export default Community;
