
import React from 'react';
import BottomNavigation from '@/components/BottomNavigation';

interface BlankPageProps {
  title: string;
  message?: string;
}

const BlankPage = ({ title, message = "Nothing to show" }: BlankPageProps) => {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-6xl mb-4">📄</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 text-center">{message}</p>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default BlankPage;
