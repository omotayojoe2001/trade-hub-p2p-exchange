import React from 'react';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex space-x-2">
        <div 
          className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '600ms' }}
        ></div>
        <div 
          className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: '200ms', animationDuration: '600ms' }}
        ></div>
        <div 
          className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
          style={{ animationDelay: '400ms', animationDuration: '600ms' }}
        ></div>
      </div>
    </div>
  );
};

export default PageLoader;