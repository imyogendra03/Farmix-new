import React, { useState } from 'react';
import { ShieldCheck, Upload, Image as ImageIcon, AlertCircle, Sprout } from 'lucide-react';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import OptimizedImage from '../components/OptimizedImage';

const DiseasePrediction = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError('Please select an image file (jpeg/png)');
        return;
      }
      if (file.size > 5000000) {
        setError('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please upload an image first');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await api.post('/disease/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if(res.data.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/40 rounded-full mb-4">
               <ShieldCheck className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Plant Disease Detection</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Upload a clear image of a diseased crop leaf. Our AI model will analyze the visual symptoms to identify the disease and suggest treatments.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Input Form */}
              <div className="p-8 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-md text-sm mb-6 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                
                  <div className="w-full">
                     <label 
                       htmlFor="image-upload" 
                       className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                     >
                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                         {preview ? (
                           <OptimizedImage
                             src={preview}
                             alt="Selected crop leaf preview"
                             loading="eager"
                             imgClassName="h-48 object-contain mb-2 rounded-md shadow-sm"
                           />
                         ) : (
                           <>
                             <Upload className="w-10 h-10 mb-3 text-gray-400" />
                             <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG (MAX. 5MB)</p>
                           </>
                         )}
                       </div>
                       <input id="image-upload" type="file" className="hidden" accept="image/jpeg, image/png, image/jpg" onChange={handleFileChange} />
                     </label>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate max-w-[200px]">
                    {selectedFile ? selectedFile.name : 'No file chosen'}
                  </span>
                  {selectedFile && (
                    <button type="button" onClick={() => { setSelectedFile(null); setPreview(null); }} className="text-sm text-red-500 hover:text-red-700">
                      Remove
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="w-full btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500 py-3 flex justify-center items-center disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-pulse">Analyzing Image...</span>
                  ) : (
                    'Detect Disease'
                  )}
                </button>
              </form>
            </div>

              {/* Results Area */}
              <div className="p-8 bg-gray-50 dark:bg-gray-800 flex flex-col justify-center min-h-[400px]">
                {result ? (
                  <div className="animate-fadeIn">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-3 rounded-full ${result.diseaseName === 'Healthy' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                        {result.diseaseName === 'Healthy' ? <Sprout className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">Diagnosis</h3>
                        <p className={`text-2xl font-extrabold ${result.diseaseName === 'Healthy' ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                         {result.diseaseName}
                      </p>
                    </div>
                  </div>
                  
                    <div className="mb-6 flex gap-2">
                       <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${result.severity === 'High' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
                        Severity: {result.severity}
                       </span>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Recommended Action</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {result.treatment}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Upload an image to see the diagnostic report here.</p>
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

export default DiseasePrediction;
