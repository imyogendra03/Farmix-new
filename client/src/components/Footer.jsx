import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import { BrandLogo, BrandWordmark } from './BrandAssets';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-nature-900 justify-self-end text-white pt-12 pb-8 border-t border-nature-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="col-span-1 md:col-span-1 border-b md:border-b-0 border-nature-700 pb-6 md:pb-0">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BrandLogo className="h-10 w-10" />
              <BrandWordmark className="h-8" alt="Farmix footer brand name" />
            </Link>
            <p className="text-nature-200 text-sm">
              {t('footerText')}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-nature-100">Quick Links</h3>
            <ul className="space-y-2 text-sm text-nature-200">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/community" className="hover:text-white transition-colors">Community Forum</Link></li>
              <li><Link to="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-nature-100">Services</h3>
            <ul className="space-y-2 text-sm text-nature-200">
              <li><Link to="/crop-recommendation" className="hover:text-white transition-colors">Crop Recommendation</Link></li>
              <li><Link to="/disease-prediction" className="hover:text-white transition-colors">Disease Prediction</Link></li>
              <li><Link to="/yield-prediction" className="hover:text-white transition-colors">Yield Prediction</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-nature-100">Support</h3>
            <ul className="space-y-2 text-sm text-nature-200">
              <li><a href="mailto:info.farmix@gmail.com" className="hover:text-white transition-colors">info.farmix@gmail.com</a></li>
              <li><Link to="/about-us" className="hover:text-white transition-colors">Learn More</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-nature-700 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-nature-300">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()}</span>
            <BrandWordmark className="h-5" alt="Farmix copyright brand name" />
            <span>All rights reserved.</span>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
