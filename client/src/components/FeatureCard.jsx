import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, linkTo, linkText, highlight }) => {
  return (
    <div className={`card p-6 flex flex-col h-full transform hover:-translate-y-1 transition duration-300 ${highlight ? 'border-nature-500 ring-1 ring-nature-500' : ''}`}>
      <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${highlight ? 'bg-nature-600' : 'bg-nature-100'}`}>
        <Icon className={`h-6 w-6 ${highlight ? 'text-white' : 'text-nature-600'}`} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 flex-grow mb-6">{description}</p>
      
      {linkTo && (
        <Link to={linkTo} className="inline-flex items-center text-nature-600 font-medium hover:text-nature-800 transition-colors mt-auto group">
          {linkText || 'Learn more'}
          <ArrowRight className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
};

export default FeatureCard;
