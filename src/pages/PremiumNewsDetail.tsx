import React from 'react';
import { ArrowLeft, Clock, ExternalLink, Share2, Bookmark, TrendingUp, Crown, Star } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumNewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock premium news data
  const premiumNewsArticles = {
    '5': {
      id: '5',
      title: 'Premium Trading Alert: BTC/NGN Rate Optimization',
      summary: 'Exclusive analysis shows optimal trading windows for Nigerian traders.',
      content: `**PREMIUM EXCLUSIVE ANALYSIS**

Our premium research team has identified optimal trading windows for BTC/NGN pairs that could maximize returns for Nigerian traders. This analysis is based on proprietary data and market intelligence available only to premium subscribers.

**Key Findings**

**Optimal Trading Hours**
- Best buy windows: 6:00-8:00 AM WAT and 2:00-4:00 PM WAT
- Best sell windows: 10:00 AM-12:00 PM WAT and 6:00-8:00 PM WAT
- Avoid trading during: 12:00-2:00 AM WAT (low liquidity)

**Market Patterns**
Our analysis of 6 months of trading data reveals:
- 15% better rates during optimal windows
- 23% faster transaction completion
- 8% lower slippage on large orders

**Premium Strategy Recommendations**

**For Buyers**
1. Set alerts for rate drops during morning windows
2. Use dollar-cost averaging during volatile periods
3. Consider premium escrow for large transactions

**For Sellers**
1. Time sales during peak demand hours
2. Use premium instant settlement for better rates
3. Leverage premium priority matching

**Risk Management**
- Never trade more than 5% of portfolio in single transaction
- Use premium stop-loss features for large positions
- Monitor global Bitcoin trends for timing decisions

**Exclusive Premium Tools**

**Rate Prediction Algorithm**
Our AI-powered rate prediction shows 78% accuracy for 4-hour windows, giving premium users significant advantage in timing their trades.

**Premium Alerts**
- Real-time rate notifications
- Volume spike alerts
- Regulatory news impact analysis

**Advanced Analytics**
- Historical rate correlation analysis
- Liquidity depth indicators
- Market maker activity tracking

**Market Outlook**

Based on our premium analysis:
- Short-term (1-2 weeks): Bullish trend expected
- Medium-term (1-3 months): Consolidation likely
- Long-term (6+ months): Strong upward momentum

**Regulatory Impact**
Recent CBN guidelines favor cryptocurrency adoption, creating positive sentiment for BTC/NGN trading. Premium subscribers get instant updates on regulatory changes.

**Conclusion**
Premium traders using our optimization strategies have seen 31% better performance compared to random trading times. This data-driven approach significantly improves trading outcomes.`,
      category: 'Premium Analysis',
      time: '6 hours ago',
      source: 'Premium Insights',
      isPremium: true,
      trending: false,
      image: '📊',
      author: 'Premium Research Team',
      readTime: '5 min read',
      tags: ['Premium', 'BTC', 'NGN', 'Trading', 'Analysis'],
      exclusiveFeatures: ['Rate Prediction', 'Premium Alerts', 'Advanced Analytics']
    }
  };

  const article = premiumNewsArticles[id as keyof typeof premiumNewsArticles];

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Premium Article Not Found</h1>
          <Button onClick={() => navigate('/premium-news')}>
            Back to Premium News
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Premium article link copied to clipboard",
      });
    }
  };

  const handleBookmark = () => {
    toast({
      title: "Bookmarked",
      description: "Premium article saved to your bookmarks",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/premium-news" className="flex items-center text-gray-600">
            <ArrowLeft size={24} className="mr-2" />
            Back to Premium News
          </Link>
          <div className="flex items-center space-x-2">
            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Crown size={12} className="mr-1" />
              Premium
            </div>
            <Button onClick={handleShare} variant="ghost" size="sm">
              <Share2 size={20} />
            </Button>
            <Button onClick={handleBookmark} variant="ghost" size="sm">
              <Bookmark size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Premium Badge */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <div className="flex items-center space-x-3">
            <Crown size={24} className="text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Premium Exclusive Content</h3>
              <p className="text-sm text-yellow-700">Advanced analysis available only to premium subscribers</p>
            </div>
          </div>
        </Card>

        {/* Article Header */}
        <Card className="p-6 bg-white border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">{article.image}</span>
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              {article.category}
            </span>
            {article.trending && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
                <TrendingUp size={12} className="mr-1" />
                Trending
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{article.title}</h1>
          
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-4">
              <span>By {article.author}</span>
              <span>•</span>
              <span>{article.readTime}</span>
              <span>•</span>
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                {article.time}
              </div>
            </div>
            <span className="text-yellow-600 font-medium">{article.source}</span>
          </div>
          
          <p className="text-lg text-gray-700 leading-relaxed">{article.summary}</p>
        </Card>

        {/* Exclusive Features */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Star size={16} className="mr-2 text-yellow-500" />
            Exclusive Premium Features
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {article.exclusiveFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Crown size={14} className="text-yellow-500" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Article Content */}
        <Card className="p-6 bg-white border-gray-200">
          <div className="prose prose-gray max-w-none">
            {article.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <h3 key={index} className="text-lg font-semibold text-gray-900 mt-6 mb-3 flex items-center">
                    {paragraph.includes('PREMIUM') && <Crown size={16} className="mr-2 text-yellow-500" />}
                    {paragraph.replace(/\*\*/g, '')}
                  </h3>
                );
              }
              return (
                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </Card>

        {/* Premium Tags */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Premium Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className={`text-sm px-3 py-1 rounded-full ${
                  tag === 'Premium' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tag === 'Premium' && <Crown size={12} className="inline mr-1" />}
                #{tag}
              </span>
            ))}
          </div>
        </Card>

        {/* Premium Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/premium-trade')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Crown size={16} className="mr-2" />
            Start Premium Trading
          </Button>
          
          <Button
            onClick={() => navigate('/trending-coins')}
            variant="outline"
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            View Premium Analytics
          </Button>
          
          <Button
            onClick={() => navigate('/premium-news')}
            variant="outline"
            className="w-full"
          >
            More Premium News
          </Button>
        </div>

        {/* Premium Source Attribution */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900 flex items-center">
                <Crown size={14} className="mr-1" />
                Premium Source: {article.source}
              </p>
              <p className="text-xs text-yellow-700">Exclusive content published {article.time}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-yellow-700">
              <ExternalLink size={16} className="mr-1" />
              Premium Portal
            </Button>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumNewsDetail;
