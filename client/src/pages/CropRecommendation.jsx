import React, { useState } from 'react';
import { Beaker, CloudRain, Droplets, FlaskConical, Sprout, Thermometer, Waves } from 'lucide-react';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import WeatherWidget from '../components/WeatherWidget';

const CropRecommendation = () => {
  const [formData, setFormData] = useState({
    soilPH: '',
    rainfall: '',
    temperature: '',
    humidity: '',
    nitrogen: '',
    phosphorus: '',
    potassium: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        soilPH: Number(formData.soilPH),
        rainfall: Number(formData.rainfall),
        temperature: Number(formData.temperature),
        humidity: Number(formData.humidity),
        nitrogen: Number(formData.nitrogen),
        phosphorus: Number(formData.phosphorus),
        potassium: Number(formData.potassium)
      };
      const res = await api.post('/crop/recommend', payload);
      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (name, label, icon, placeholder, min, max, step = '1') => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" htmlFor={name}>
        <span className="inline-flex items-center gap-2">
          {icon}
          {label}
        </span>
      </label>
      <input
        type="number"
        name={name}
        id={name}
        required
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={formData[name]}
        onChange={handleChange}
        className="input-field"
      />
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Crop Recommendation Model</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Enter all required agronomy inputs. Prediction comes from Farmix model scoring and shows confidence, accuracy, and data source.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <WeatherWidget
                onWeatherDataReturn={(weather) => {
                  setFormData((prev) => ({
                    ...prev,
                    temperature: prev.temperature || String(weather.temp || ''),
                    humidity: prev.humidity || String(weather.humidity || ''),
                    rainfall: prev.rainfall || String(weather.rainfall || '')
                  }));
                }}
              />
              <div className="rounded-2xl border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Weather values can auto-fill from widget. NPK and soil pH should come from your soil test report.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card p-8">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">Required Inputs</h2>
                {error ? (
                  <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/40 p-3 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput('soilPH', 'Soil pH', <Beaker className="w-4 h-4 text-violet-500" />, '6.5', 0, 14, '0.1')}
                    {renderInput('rainfall', 'Rainfall (mm)', <CloudRain className="w-4 h-4 text-blue-500" />, '900', 0, 4000)}
                    {renderInput('temperature', 'Temperature (C)', <Thermometer className="w-4 h-4 text-orange-500" />, '26', -10, 60, '0.1')}
                    {renderInput('humidity', 'Humidity (%)', <Droplets className="w-4 h-4 text-cyan-500" />, '65', 0, 100, '0.1')}
                    {renderInput('nitrogen', 'Nitrogen (kg/ha)', <FlaskConical className="w-4 h-4 text-emerald-500" />, '90', 0, 500)}
                    {renderInput('phosphorus', 'Phosphorus (kg/ha)', <Waves className="w-4 h-4 text-indigo-500" />, '40', 0, 500)}
                    {renderInput('potassium', 'Potassium (kg/ha)', <Sprout className="w-4 h-4 text-green-600" />, '50', 0, 500)}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {loading ? 'Running model...' : 'Generate Crop Recommendation'}
                  </button>
                </form>
              </div>

              {result ? (
                <div className="card p-8">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Model Result</h3>
                  <p className="mt-3 text-4xl font-black text-emerald-700 dark:text-emerald-400">
                    {result.recommendedCrop}
                  </p>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">Confidence</p>
                      <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                        {Math.round(Number(result.confidence || 0) * 100)}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">Model Source</p>
                      <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                        {result.modelSource || 'Farmix Model'}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Data Source: {result.dataSource || 'Farm data model'}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default CropRecommendation;
