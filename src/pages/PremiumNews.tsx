import React, { useState } from 'react';
import { Crown, Newspaper, TrendingUp, Clock, Star, Filter, Search, ExternalLink, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumNews = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleNewsClick = (newsId: string) => {
    navigate(`/premium-news/${newsId}`);
  };

  const newsArticles = [
    {
      id: '1',
      title: 'Bitcoin Reaches New All-Time High of $98,000',
      summary: 'Bitcoin continues its bullish run as institutional adoption increases globally.',
      category: 'Bitcoin',
      time: '15 mins ago',
      source: 'CoinDesk',
      isPremium: true,
      trending: true,
      image: '₿'
    },
    {
      id: '2',
      title: 'Ethereum 2.0 Staking Rewards Hit Record High',
      summary: 'ETH staking yields reach 8.5% as more validators join the network.',
      category: 'Ethereum',
      time: '1 hour ago',
      source: 'CryptoNews',
      isPremium: true,
      trending: false,
      image: 'Ξ'
    },
    {
      id: '3',
      title: 'Nigeria Central Bank Announces CBDC Pilot Program',
      summary: 'eNaira pilot program expands to include P2P trading platforms.',
      category: 'Regulation',
      time: '2 hours ago',
      source: 'Bloomberg',
      isPremium: true,
      trending: true,
      image: '🇳🇬'
    },
    {
      id: '4',
      title: 'DeFi TVL Surpasses $100 Billion Mark',
      summary: 'Decentralized finance protocols see massive growth in locked value.',
      category: 'DeFi',
      time: '4 hours ago',
      source: 'DeFiPulse',
      isPremium: false,
      trending: false,
      image: '🔗'
    },
    {
      id: '5',
      title: 'Premium Trading Alert: BTC/NGN Rate Optimization',
      summary: 'Exclusive analysis shows optimal trading windows for Nigerian traders.',
      category: 'Premium Analysis',
      time: '6 hours ago',
      source: 'Premium Insights',
      isPremium: true,
      trending: false,
      image: '📊'
    }
  ];

  const categories = ['all', 'Bitcoin', 'Ethereum', 'Regulation', 'DeFi', 'Premium Analysis'];

  const filteredNews = newsArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || article.category === filter;
    return matchesSearch && matchesFilter;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Bitcoin': return 'bg-orange-100 text-orange-800';
      case 'Ethereum': return 'bg-blue-100 text-blue-800';
      case 'Regulation': return 'bg-red-100 text-red-800';
      case 'DeFi': return 'bg-purple-100 text-purple-800';
      case 'Premium Analysis': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Newspaper size={24} className="mr-2 text-gray-600" />
              Crypto News
            </h1>
            <p className="text-gray-600 text-sm">Exclusive insights and market analysis</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Premium Benefits */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Star size={20} className="mr-2 text-gray-600" />
            Premium News Benefits
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Newspaper size={20} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Exclusive Articles</div>
            </div>
            <div className="text-center">
              <TrendingUp size={20} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Market Analysis</div>
            </div>
            <div className="text-center">
              <Clock size={20} className="text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Real-time Updates</div>
            </div>
          </div>
        </Card>

        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trending News */}
        <Card className="p-4 bg-white border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp size={20} className="mr-2 text-red-500" />
            Trending Now
          </h3>
          <div className="space-y-3">
            {filteredNews.filter(article => article.trending).slice(0, 2).map((article) => (
              <div
                key={article.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleNewsClick(article.id)}
              >
                <div className="text-2xl">{article.image}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{article.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500">{article.time}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {article.isPremium && (
                    <Crown size={16} className="text-yellow-500" />
                  )}
                  <ArrowRight size={14} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* News Articles */}
        <div className="space-y-3">
          {filteredNews.map((article) => (
            <Card
              key={article.id}
              className="p-4 cursor-pointer hover:shadow-md transition-all bg-white border-gray-200 hover:border-gray-300"
              onClick={() => handleNewsClick(article.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-3xl">{article.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 flex items-center">
                        {article.title}
                        {article.isPremium && (
                          <Crown size={14} className="ml-2 text-yellow-600" />
                        )}
                        {article.trending && (
                          <TrendingUp size={14} className="ml-2 text-gray-600" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {article.summary}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-500">{article.source}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{article.time}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Premium Analysis Section */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Crown size={20} className="mr-2 text-yellow-600" />
            Premium Market Analysis
          </h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-1">BTC/NGN Trading Signals</h4>
              <p className="text-sm text-gray-700">
                Current optimal entry point detected. Premium algorithm suggests 15% upside potential.
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-600">Updated 5 mins ago</span>
                <Button size="sm" variant="outline">
                  View Analysis
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-1">Nigerian Market Insights</h4>
              <p className="text-sm text-gray-700">
                Exclusive data on P2P trading volumes and price movements in Nigeria.
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-600">Updated 1 hour ago</span>
                <Button size="sm" variant="outline">
                  Read More
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Empty State */}
        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <Newspaper size={48} className="text-yellow-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-900 mb-2">No news found</h3>
            <p className="text-yellow-700">
              {searchTerm ? 'Try adjusting your search terms' : 'No news articles match your filter'}
            </p>
          </div>
        )}
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumNews;
