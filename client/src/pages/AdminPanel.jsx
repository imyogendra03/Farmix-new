import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  Users, Trash2, Shield, Activity, BarChart2,
  MessageSquare, Sprout, RefreshCw, Crown, UserCheck, AlertTriangle,
  Edit2, X, Save
} from 'lucide-react';
import { toast } from 'react-toastify';

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, subLabel }) => (
  <div className={`card p-6 border-t-4 ${color} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color.replace('border-', 'bg-').replace('-500', '-100')} dark:bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('border-', 'text-').replace('-500', '-600 dark:' + color.replace('border-', 'text-').replace('-500', '-400'))}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        {subLabel && <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, badge, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-indigo-500" />
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
      {badge != null && (
        <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
    {action}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, postsRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/posts'),
        api.get('/admin/stats'),
      ]);
      setUsers(usersRes.data.data || []);
      setPosts(postsRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch {
      toast.error('Failed to load admin data. Check connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') fetchAdminData();
  }, [user, fetchAdminData]);

  const handleDeletePost = async (postId, postTitle) => {
    if (!window.confirm(`Delete post "${postTitle}"? This cannot be undone.`)) return;
    setDeletingId(postId);
    try {
      await api.delete(`/admin/post/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post removed successfully');
    } catch {
      toast.error('Failed to remove post');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleChange = async (userId, currentRole, newRole, userName) => {
    console.log('🔄 Role Change Called:', { userId, currentRole, newRole, userName });
    
    // Demoting admin to farmer should use revoke endpoint
    if (currentRole === 'admin' && newRole === 'farmer') {
      console.log('✅ Using revoke endpoint for admin demotion');
      if (!window.confirm(`Revoke admin role from ${userName}? They will become a farmer.`)) return;
      setUpdatingRoleId(userId);
      try {
        console.log('📤 Calling: /admin/user/' + userId + '/revoke-admin');
        await api.put(`/admin/user/${userId}/revoke-admin`, {});
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: 'farmer' } : u));
        toast.success(`Admin role revoked. ${userName} is now a farmer.`);
      } catch (err) {
        console.error('❌ Revoke failed:', err?.response?.data?.message);
        toast.error(err?.response?.data?.message || 'Failed to revoke admin role');
      } finally {
        setUpdatingRoleId(null);
      }
      return;
    }

    // Promoting to admin or other role changes
    console.log('ℹ️ Using role update endpoint');
    if (!window.confirm(`Change ${userName}'s role to "${newRole}"?`)) return;
    setUpdatingRoleId(userId);
    try {
      console.log('📤 Calling: /admin/users/' + userId + '/role with role=' + newRole);
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`${userName} is now a ${newRole}`);
    } catch (err) {
      console.error('❌ Role update failed:', err?.response?.data?.message);
      toast.error(err?.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleDeleteUser = async (userId, userName, userRole) => {
    // If user is admin, guide them to revoke first
    if (userRole === 'admin') {
      toast.error('Please revoke admin role first, then delete the user');
      return;
    }

    if (!window.confirm(`Delete ${userName}? This cannot be undone. All their data will be removed.`)) return;
    setDeletingId(userId);
    try {
      await api.delete(`/admin/user/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success(`${userName} has been deleted`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user._id);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
    });
  };

  const handleSaveEdit = async (userId) => {
    setEditSaving(true);
    try {
      await api.put(`/admin/farmer/${userId}/edit`, editFormData);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...editFormData } : u));
      toast.success('User updated successfully');
      setEditingUserId(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  };

  // Guard — only admins allowed
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/user-dashboard" replace />;

  const editingUser = users.find(u => u._id === editingUserId);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'posts', label: 'Posts', icon: MessageSquare, count: posts.length },
    { id: 'users', label: 'Users', icon: Users, count: users.length },
  ];

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Control Panel</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Logged in as {user.name} · Administrator</p>
              </div>
            </div>
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="flex items-center gap-2 btn-outline py-2 px-4 text-sm self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                  ${activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count != null && (
                  <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <SkeletonLoader type="card" count={4} />
          ) : (
            <div className="space-y-8">

              {/* ── OVERVIEW TAB ── */}
              {activeTab === 'overview' && (
                <>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="border-indigo-500" />
                    <StatCard icon={MessageSquare} label="Community Posts" value={stats?.totalPosts} color="border-orange-500" />
                    <StatCard icon={Activity} label="Total Predictions" value={stats?.totalPredictions} color="border-nature-500" />
                    <StatCard icon={Sprout} label="Crop Analyses" value={stats?.predictionBreakdown?.cropRecommendations} color="border-emerald-500" subLabel={`${stats?.predictionBreakdown?.diseasePredictions || 0} disease · ${stats?.predictionBreakdown?.yieldPredictions || 0} yield`} />
                  </div>

                  {/* Prediction Breakdown */}
                  <div className="card p-6">
                    <SectionHeader icon={BarChart2} title="Prediction Breakdown" />
                    <div className="space-y-3">
                      {[
                        { label: 'Crop Recommendations', value: stats?.predictionBreakdown?.cropRecommendations || 0, color: 'bg-emerald-500', total: stats?.totalPredictions },
                        { label: 'Disease Predictions', value: stats?.predictionBreakdown?.diseasePredictions || 0, color: 'bg-red-500', total: stats?.totalPredictions },
                        { label: 'Yield Predictions', value: stats?.predictionBreakdown?.yieldPredictions || 0, color: 'bg-blue-500', total: stats?.totalPredictions },
                      ].map(item => {
                        const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                        return (
                          <div key={item.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                              <span className="text-gray-500 dark:text-gray-400">{item.value} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                              <div className={`${item.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Activity — 2 columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Posts */}
                    <div className="card p-6">
                      <SectionHeader icon={MessageSquare} title="Recent Posts" badge={stats?.recentPosts?.length} />
                      <div className="space-y-3">
                        {(stats?.recentPosts || []).map(p => (
                          <div key={p._id} className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                by {p.author?.name || 'Unknown'} · {p.likes?.length || 0} likes · {p.comments?.length || 0} comments
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeletePost(p._id, p.title)}
                              disabled={deletingId === p._id}
                              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-50 p-1"
                              title="Delete post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {!stats?.recentPosts?.length && <p className="text-sm text-gray-400">No posts yet.</p>}
                      </div>
                    </div>

                    {/* Recent Users */}
                    <div className="card p-6">
                      <SectionHeader icon={UserCheck} title="New Users" badge={stats?.recentUsers?.length} />
                      <div className="space-y-3">
                        {(stats?.recentUsers || []).map(u => (
                          <div key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                              {u.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                            </div>
                            <span className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium
                              ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                              {u.role}
                            </span>
                          </div>
                        ))}
                        {!stats?.recentUsers?.length && <p className="text-sm text-gray-400">No users yet.</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── POSTS TAB ── */}
              {activeTab === 'posts' && (
                <div className="card p-6">
                  <SectionHeader icon={MessageSquare} title="All Community Posts" badge={posts.length} />
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Title</th>
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Author</th>
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Likes</th>
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Comments</th>
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.map(post => (
                          <tr key={post._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="py-3 px-4 text-gray-800 dark:text-gray-200 max-w-[200px] truncate">{post.title}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-nature-100 dark:bg-nature-900/30 flex items-center justify-center text-xs font-bold text-nature-700 dark:text-nature-400 flex-shrink-0">
                                  {(post.author?.name?.[0] || '?').toUpperCase()}
                                </div>
                                {post.author?.name || 'Unknown'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{post.likes?.length || 0}</td>
                            <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{post.comments?.length || 0}</td>
                            <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDeletePost(post._id, post.title)}
                                disabled={deletingId === post._id}
                                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                              >
                                {deletingId === post._id
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <><Trash2 className="w-3 h-3" /> Delete</>
                                }
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!posts.length && (
                          <tr><td colSpan={6} className="py-8 text-center text-gray-400">No posts found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── USERS TAB ── */}
              {activeTab === 'users' && (
                <div className="card p-6">
                  <SectionHeader icon={Users} title="Registered Users" badge={users.length} />
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">User</th>
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Role</th>
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Joined</th>
                          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                                  ${u.role === 'admin' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-nature-100 dark:bg-nature-900/30 text-nature-700 dark:text-nature-400'}`}>
                                  {u.name[0].toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{u.name}</span>
                                  {u.role === 'admin' && (
                                    <Crown className="w-3 h-3 text-indigo-500 inline ml-1" />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium
                                ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {u._id !== user._id ? (
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                  {/* Edit Button */}
                                  <button
                                    onClick={() => handleEditUser(u)}
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                    title="Edit user"
                                  >
                                    <Edit2 className="w-3 h-3" /> Edit
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDeleteUser(u._id, u.name, u.role)}
                                    disabled={deletingId === u._id || u.role === 'admin'}
                                    className={`inline-flex items-center gap-1 text-xs border rounded-lg px-2 py-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                      ${u.role === 'admin'
                                        ? 'text-gray-400 border-gray-300 dark:border-gray-600'
                                        : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                                      }`}
                                    title={u.role === 'admin' ? 'Revoke admin role first' : 'Delete user'}
                                  >
                                    {deletingId === u._id
                                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                                      : <><Trash2 className="w-3 h-3" /> Delete</>
                                    }
                                  </button>

                                  {/* Role Button */}
                                  <button
                                    onClick={() => handleRoleChange(u._id, u.role, u.role === 'admin' ? 'farmer' : 'admin', u.name)}
                                    disabled={updatingRoleId === u._id}
                                    className={`inline-flex items-center gap-1 text-xs border rounded-lg px-2 py-1 transition-all disabled:opacity-50
                                      ${u.role === 'admin'
                                        ? 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                        : 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                      }`}
                                  >
                                    {updatingRoleId === u._id
                                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                                      : u.role === 'admin' ? <><AlertTriangle className="w-3 h-3" /> Revoke</> : <><Crown className="w-3 h-3" /> Admin</>
                                    }
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">You</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {!users.length && (
                          <tr><td colSpan={5} className="py-8 text-center text-gray-400">No users found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {editingUserId && editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-in fade-in scale-95">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit User</h3>
                <button
                  onClick={() => setEditingUserId(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Role Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                      ${editingUser.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>
                      {editingUser.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setEditingUserId(null)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveEdit(editingUserId)}
                  disabled={editSaving}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminPanel;
