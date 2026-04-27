import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import SkeletonLoader from '../components/SkeletonLoader';
import WeatherWidget from '../components/WeatherWidget';

import { Leaf, Activity, Wind, Sprout, ArrowRight } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchHistory = async () => {
      try {
        const res = await api.get('/predictions/history');
        if (res.data.success) {
          setHistory(res.data.data.slice(0, 5)); // Just recent 5
        }
      } catch (err) {
        console.error('Failed to fetch prediction history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const getIconForType = (type) => {
    switch (type) {
      case 'Crop-Recommendation': return <Sprout className="w-5 h-5 text-green-500" />;
      case 'Disease-Prediction': return <Activity className="w-5 h-5 text-red-500" />;
      case 'Yield-Prediction': return <Wind className="w-5 h-5 text-blue-500" />;
      default: return <Leaf className="w-5 h-5 text-gray-500" />;
    }
  };

  // Guard (dashboard requires login)
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                Welcome back, {user?.name || 'Farmer'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Here's what's happening on your farm today.
              </p>
            </div>
            {user?.role === 'admin' && (
              <div className="mt-4 md:mt-0">
                <Link to="/admin" className="btn-primary bg-indigo-600 hover:bg-indigo-700">
                  Admin Panel
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Quick Actions & Weather */}
            <div className="lg:col-span-1 space-y-6">
              <WeatherWidget />


              <div className="card p-6 border-l-4 border-nature-600">
                 <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Tools</h2>
                 <div className="space-y-3">
                    <Link to="/crop-recommendation" className="flex items-center justify-between p-3 rounded-lg bg-nature-50 hover:bg-nature-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <Sprout className="w-5 h-5 text-nature-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">Crop Analysis</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link to="/disease-prediction" className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-red-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">Disease Scan</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link to="/yield-prediction" className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <Wind className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">Yield Forecast</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </Link>
                 </div>
              </div>
            </div>

            {/* Right Column: Prediction History */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recent Predictions</h2>
                  <Link to="/analytics" className="text-sm font-medium text-nature-600 hover:text-nature-700 dark:text-nature-400">View Analytics &rarr;</Link>
                </div>

                {loading ? (
                  <SkeletonLoader type="text" count={3} />
                ) : history.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                     <Leaf className="w-10 h-10 text-gray-300 dark:text-gray-500 mx-auto mb-3" />
                     <p className="text-gray-500 dark:text-gray-400">No predictions yet. Run a tool to see your history!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-4">
                           <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                             {getIconForType(item.type)}
                           </div>
                           <div>
                             <h4 className="font-bold text-gray-800 dark:text-white capitalize">
                               {item.type.replace('-', ' ')}
                             </h4>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                               {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                             </p>
                           </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-nature-100 text-nature-800 dark:bg-nature-900 dark:text-nature-100">
                             Result: {
                               item.type === 'Crop-Recommendation' ? item.predictionResult?.recommendedCrop :
                               item.type === 'Disease-Prediction' ? (item.predictionResult?.disease || item.predictionResult?.diseaseName) :
                               item.type === 'Yield-Prediction' ? item.predictionResult?.estimatedYield : 'Analyzed'
                             }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
