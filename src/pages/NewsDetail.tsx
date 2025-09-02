import React from 'react';
import { ArrowLeft, Clock, ExternalLink, Share2, Bookmark, TrendingUp } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/BottomNavigation';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock news data - in real app, fetch by ID
  const newsArticles = {
    '1': {
      id: '1',
      title: 'Bitcoin Reaches New All-Time High of $73,000',
      summary: 'Bitcoin surged to unprecedented levels amid institutional adoption and ETF approvals.',
      content: `Bitcoin has reached a new all-time high of $73,000, marking a significant milestone in the cryptocurrency's journey. This surge comes amid increased institutional adoption and the recent approval of several Bitcoin ETFs.

The rally has been driven by several factors:

**Institutional Adoption**
Major corporations continue to add Bitcoin to their treasury reserves, with companies like MicroStrategy and Tesla leading the charge. This institutional backing has provided significant support for Bitcoin's price.

**ETF Approvals**
The approval of spot Bitcoin ETFs has opened the doors for traditional investors to gain exposure to Bitcoin through familiar investment vehicles. This has led to billions of dollars in inflows.

**Regulatory Clarity**
Improved regulatory clarity in major markets has reduced uncertainty and encouraged more institutional participation in the cryptocurrency space.

**Technical Analysis**
From a technical perspective, Bitcoin has broken through key resistance levels, with analysts predicting further upside potential. The current momentum suggests the bull market is far from over.

**Market Impact**
This price surge has had a positive impact on the entire cryptocurrency market, with many altcoins also experiencing significant gains. The total cryptocurrency market cap has now exceeded $2.8 trillion.

**Looking Ahead**
Analysts remain optimistic about Bitcoin's long-term prospects, with some predicting prices could reach $100,000 in the coming months. However, investors are advised to remain cautious and consider the volatile nature of cryptocurrency markets.`,
      category: 'Bitcoin',
      time: '2 hours ago',
      source: 'CryptoNews',
      isPremium: false,
      trending: true,
      image: '₿',
      author: 'Sarah Johnson',
      readTime: '3 min read',
      tags: ['Bitcoin', 'ATH', 'Institutional', 'ETF']
    },
    '2': {
      id: '2',
      title: 'Ethereum 2.0 Staking Rewards Hit Record High',
      summary: 'Ethereum staking yields reach 8.5% as network upgrades continue to improve efficiency.',
      content: `Ethereum staking rewards have reached a record high of 8.5% APY, making it one of the most attractive yield opportunities in the cryptocurrency space. This increase comes as the Ethereum network continues to evolve following the successful transition to Proof of Stake.

**Why Staking Rewards Are Increasing**

The increase in staking rewards can be attributed to several factors:

- **Network Activity**: Higher transaction volumes on Ethereum have led to increased fee revenue for validators
- **MEV (Maximal Extractable Value)**: Validators are earning additional rewards through MEV opportunities
- **Reduced Validator Set**: Some validators have exited, concentrating rewards among remaining participants

**How Staking Works**

Ethereum staking involves locking up 32 ETH to become a validator on the network. Validators are responsible for:
- Proposing new blocks
- Validating transactions
- Maintaining network security

**Risks and Considerations**

While the rewards are attractive, staking comes with risks:
- **Slashing Risk**: Validators can lose a portion of their stake for malicious behavior
- **Liquidity Risk**: Staked ETH is locked and cannot be easily withdrawn
- **Technical Risk**: Running a validator requires technical expertise

**Market Impact**

The high staking yields are encouraging more ETH holders to stake their tokens, which reduces the circulating supply and could put upward pressure on ETH prices. Currently, over 30% of all ETH is staked on the network.

**Future Outlook**

As Ethereum continues to scale with Layer 2 solutions and future upgrades, staking rewards may fluctuate. However, the long-term outlook for Ethereum staking remains positive as the network grows and matures.`,
      category: 'Ethereum',
      time: '4 hours ago',
      source: 'EthereumDaily',
      isPremium: false,
      trending: true,
      image: '⟠',
      author: 'Michael Chen',
      readTime: '4 min read',
      tags: ['Ethereum', 'Staking', 'DeFi', 'Yield']
    }
  };

  const article = newsArticles[id as keyof typeof newsArticles];

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <Button onClick={() => navigate('/news')}>
            Back to News
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
        description: "Article link copied to clipboard",
      });
    }
  };

  const handleBookmark = () => {
    toast({
      title: "Bookmarked",
      description: "Article saved to your bookmarks",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/news" className="flex items-center text-gray-600">
            <ArrowLeft size={24} className="mr-2" />
            Back to News
          </Link>
          <div className="flex items-center space-x-2">
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
        {/* Article Header */}
        <Card className="p-6 bg-white border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">{article.image}</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
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
            <span className="text-gray-500">{article.source}</span>
          </div>
          
          <p className="text-lg text-gray-700 leading-relaxed">{article.summary}</p>
        </Card>

        {/* Article Content */}
        <Card className="p-6 bg-white border-gray-200">
          <div className="prose prose-gray max-w-none">
            {article.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <h3 key={index} className="text-lg font-semibold text-gray-900 mt-6 mb-3">
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

        {/* Tags */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </Card>

        {/* Related Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/coins')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            View {article.category} Price
          </Button>
          
          <Button
            onClick={() => navigate('/buy-sell')}
            variant="outline"
            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            Trade {article.category}
          </Button>
          
          <Button
            onClick={() => navigate('/news')}
            variant="outline"
            className="w-full"
          >
            Read More News
          </Button>
        </div>

        {/* Source Attribution */}
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Source: {article.source}</p>
              <p className="text-xs text-gray-600">Published {article.time}</p>
            </div>
            <Button variant="ghost" size="sm">
              <ExternalLink size={16} className="mr-1" />
              Visit Source
            </Button>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default NewsDetail;
