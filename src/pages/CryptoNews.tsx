import React, { useEffect, useState } from 'react';
import { Bell, MessageCircle, Heart, MoreHorizontal, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';

const featuredNews = {
  id: '1',
  title: 'Bitcoin Reaches New All-Time High of $73,000',
  excerpt: 'Bitcoin surged to unprecedented levels amid institutional adoption and ETF approvals driving massive market momentum.',
  image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=400&fit=crop',
  date: '2h ago'
};

const newsItems = [
  {
    id: '2',
    title: 'Ethereum 2.0 Staking Rewards Hit Record High',
    excerpt: 'Ethereum staking yields reach 8.5% as network upgrades continue to improve efficiency and validator participation.',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=80&h=80&fit=crop',
    date: '4h ago'
  },
  {
    id: '3',
    title: 'Nigerian CBN Issues New Crypto Guidelines',
    excerpt: 'Central Bank of Nigeria releases updated guidelines for cryptocurrency trading and exchanges in the region.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&h=80&fit=crop',
    date: '6h ago'
  },
  {
    id: '4',
    title: 'DeFi Protocol Launches on Polygon Network',
    excerpt: 'New decentralized finance protocol promises lower fees and faster transactions for users.',
    image: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=80&h=80&fit=crop',
    date: '8h ago'
  },
  {
    id: '5',
    title: 'Major Exchange Adds Support for Layer 2',
    excerpt: 'Leading cryptocurrency exchange integrates Layer 2 solutions to reduce transaction costs.',
    image: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=80&h=80&fit=crop',
    date: '12h ago'
  }
];

const categories = ['For You', 'Crypto News', 'Market Updates', 'Regulations'];

const CryptoNews: React.FC = () => {
  const { isQuickAuthActive } = useQuickAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('For You');
  const [savedNews, setSavedNews] = useState<Set<string>>(new Set());

  const handleNewsClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  const handleSaveNews = (newsId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedNews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
      } else {
        newSet.add(newsId);
      }
      return newSet;
    });
  };

  const handleShareNews = (newsId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: title,
        url: `${window.location.origin}/news/${newsId}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/news/${newsId}`);
      // You could add a toast notification here
    }
  };

  useEffect(() => {
    document.title = 'News - TradeHub';
  }, []);

  return (
    <div className="min-h-screen bg-white font-['Poppins'] pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white z-10 px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">News</h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center"
            >
              <Bell size={20} className="text-gray-600" />
            </button>
            <button 
              onClick={() => navigate('/messages')}
              className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center"
            >
              <MessageCircle size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Featured News Block */}
      <div className="relative h-[50vh] mx-4 mt-4 rounded-t-2xl overflow-hidden cursor-pointer" onClick={() => handleNewsClick(featuredNews.id)}>
        <img 
          src={featuredNews.image} 
          alt={featuredNews.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Top-right overlay buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button 
            onClick={(e) => handleSaveNews(featuredNews.id, e)}
            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Heart 
              size={16} 
              className={`text-white ${savedNews.has(featuredNews.id) ? 'fill-current' : ''}`} 
            />
          </button>
          <button 
            onClick={(e) => handleShareNews(featuredNews.id, featuredNews.title, e)}
            className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <MoreHorizontal size={16} className="text-white" />
          </button>
        </div>
        
        {/* Bottom-left overlay content */}
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-white font-medium text-lg mb-3 leading-tight drop-shadow-lg">
            {featuredNews.title}
          </h2>
          <button className="border border-white text-white px-4 py-2 rounded-full text-sm font-medium">
            Read More →
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 mt-6 mb-4">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-[#1A73E8] text-white'
                  : 'border border-gray-200 text-black'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed List */}
      <div className="px-4 space-y-3 mb-6">
        {newsItems.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm cursor-pointer"
            onClick={() => handleNewsClick(item.id)}
          >
            <div className="flex space-x-3">
              {/* Thumbnail */}
              <img 
                src={item.image} 
                alt={item.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 flex-1 pr-2">
                    {item.title}
                  </h3>
                  <div className="flex space-x-1 flex-shrink-0">
                    <button 
                      onClick={(e) => handleSaveNews(item.id, e)}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Heart 
                        size={12} 
                        className={`text-gray-400 ${savedNews.has(item.id) ? 'fill-current text-red-500' : ''}`} 
                      />
                    </button>
                    <button 
                      onClick={(e) => handleShareNews(item.id, item.title, e)}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal size={12} className="text-gray-400" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-tight mb-3 line-clamp-2">
                  {item.excerpt}
                </p>
                
                {/* Bottom row */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">{item.date}</span>
                  <span className="text-[#1A73E8] text-sm font-medium flex items-center">
                    Read More <ArrowRight size={14} className="ml-1" />
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default CryptoNews;
