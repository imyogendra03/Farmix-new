import React, { useState, useEffect } from 'react';
import { Satellite, Activity, Droplets } from 'lucide-react';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-toastify';
import SkeletonLoader from '../components/SkeletonLoader';
import OptimizedImage from '../components/OptimizedImage';

const SatelliteMonitor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetLat, setTargetLat] = useState('28.6139');
  const [targetLng, setTargetLng] = useState('77.2090');

  const fetchSatelliteData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/satellite/data?lat=${targetLat}&lng=${targetLng}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load satellite imagery data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSatelliteData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                <Satellite className="w-8 h-8 text-nature-600" /> Satellite Monitor
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Analyze NDVI (Normalized Difference Vegetation Index) and crop stress levels from space.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input 
                 type="text" 
                 value={targetLat} 
                 onChange={(e) => setTargetLat(e.target.value)} 
                 placeholder="Lat" 
                 className="input-field w-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input 
                 type="text" 
                 value={targetLng} 
                 onChange={(e) => setTargetLng(e.target.value)} 
                 placeholder="Lng" 
                 className="input-field w-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button 
                 onClick={fetchSatelliteData}
                 disabled={loading}
                 className="btn-primary"
              >
                Scan
              </button>
            </div>
          </div>

          {loading ? (
             <SkeletonLoader type="card" count={2} />
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               
               {/* Satellite Overlay Image */}
               <div className="lg:col-span-2 card overflow-hidden p-0 border border-gray-200 dark:border-gray-700 relative h-96">
                  <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-gray-200 dark:border-gray-700 shadow-sm text-gray-800 dark:text-gray-200">
                     TARGET: {data.coordinates.lat},{data.coordinates.lng}
                  </div>
                  {/* Mock Heatmap/Overlay */}
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse absolute inset-0 -z-10"></div>
                  <OptimizedImage
                     src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${data.coordinates.lng},${data.coordinates.lat},15,0/800x600?access_token=pk.eyJ1IjoiZmFrZTEyMyIsImEiOiJjamZ0b2IxdjAwaTExMzNwajRnZXIzbTRoIn0.ABC`}
                     fallbackSrc="https://images.unsplash.com/photo-1592982537447-6f2237bf3d90?auto=format&fit=crop&q=80&w=800&h=600"
                     alt="Satellite imagery for the selected farm area"
                     sizes="(max-width: 1024px) 100vw, 66vw"
                     imgClassName="w-full h-full object-cover"
                  />
                  {/* Thermal Mock Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-green-500/30 via-transparent to-red-500/20 mix-blend-overlay pointer-events-none"></div>
               </div>

               {/* Analysis Metrics */}
               <div className="space-y-6">
                 
                 <div className="card p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm mb-4">NDVI Index</h3>
                    <div className="flex items-end gap-3 mb-2">
                       <span className="text-4xl font-extrabold text-nature-600 dark:text-nature-400">{data.ndvi}</span>
                       <span className="text-gray-500 dark:text-gray-400 mb-1">/ 1.0</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                       <div className="bg-nature-500 h-2.5 rounded-full" style={{ width: `${Math.min(data.ndvi * 100, 100)}%` }}></div>
                    </div>
                    <p className={`text-sm font-medium ${data.healthStatus === 'Excellent' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                       Status: {data.healthStatus}
                    </p>
                 </div>

                 <div className="card p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm mb-4">Stress Indicators</h3>
                    
                    <div className="space-y-4">
                       <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                          <div className="flex items-center gap-2">
                             <Droplets className="w-5 h-5 text-blue-500" />
                             <span className="text-gray-700 dark:text-gray-300">Water Stress</span>
                          </div>
                          <span className={`font-semibold ${data.stressIndicators.waterStress === 'High' ? 'text-red-500' : 'text-green-500'}`}>
                             {data.stressIndicators.waterStress}
                          </span>
                       </div>
                       
                       <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-2">
                             <Activity className="w-5 h-5 text-nature-500" />
                             <span className="text-gray-700 dark:text-gray-300">Nitrogen</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                             {data.stressIndicators.nitrogenLevel}
                          </span>
                       </div>
                    </div>
                 </div>

               </div>
            </div>
          ) : null}

        </div>
      </div>
    </PageTransition>
  );
};

export default SatelliteMonitor;
