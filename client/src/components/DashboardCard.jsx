import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className="h-10 w-10 bg-nature-50 rounded-full flex items-center justify-center text-nature-600">
           {Icon && <Icon className="h-5 w-5" />}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-gray-900">{value}</span>
        </div>
        {trend && (
           <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
             {trend.isPositive ? '+' : '-'}{trend.value}%
           </span>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
