import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import SkeletonLoader from '../components/SkeletonLoader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LineChart } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/trends');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/user-dashboard" replace />;

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <LineChart className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Macro trends across the agricultural system</p>
            </div>
          </div>

          {loading ? (
            <SkeletonLoader type="card" count={2} />
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Prediction Types (Pie Chart) */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Service Usage Distribution</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.predictionTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.predictionTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Recommended Crops (Bar Chart) */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Most Recommended Crops</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topCrops}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" stroke="#8884d8" />
                      <YAxis allowDecimals={false} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">Failed to load analytics data.</div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default Analytics;
