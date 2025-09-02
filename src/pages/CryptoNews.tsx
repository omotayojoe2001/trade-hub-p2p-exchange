import React, { useEffect } from 'react';
import { ExternalLink, Newspaper, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';

const news = [
  {
    id: '1',
    title: 'Bitcoin Reaches New All-Time High of $73,000',
    source: 'CryptoNews',
    date: '2 hours ago',
    excerpt: 'Bitcoin surged to unprecedented levels amid institutional adoption and ETF approvals.',
    url: '#',
    category: 'Bitcoin',
    trending: true
  },
  {
    id: '2',
    title: 'Ethereum 2.0 Staking Rewards Hit Record High',
    source: 'EthereumDaily',
    date: '4 hours ago',
    excerpt: 'Ethereum staking yields reach 8.5% as network upgrades continue to improve efficiency.',
    url: '#',
    category: 'Ethereum',
    trending: true
  },
  {
    id: '3',
    title: 'Nigerian CBN Issues New Crypto Guidelines',
    source: 'LocalCrypto',
    date: '6 hours ago',
    excerpt: 'Central Bank of Nigeria releases updated guidelines for cryptocurrency trading and exchanges.',
    url: '#',
    category: 'Regulation',
    trending: false
  },
  {
    id: '4',
    title: 'DeFi Protocol Launches on Polygon Network',
    source: 'DeFiPulse',
    date: '8 hours ago',
    excerpt: 'New decentralized finance protocol promises lower fees and faster transactions.',
    url: '#',
    category: 'DeFi',
    trending: false
  }
];

const CryptoNews: React.FC = () => {
  const { isQuickAuthActive } = useQuickAuth();
  const navigate = useNavigate();

  const handleNewsClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  useEffect(() => {
    document.title = 'Crypto News & Updates';
    const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (metaDesc) {
      metaDesc.content = 'Stay updated with the latest crypto news and market updates.';
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Stay updated with the latest crypto news and market updates.';
      document.head.appendChild(m);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + '/news';
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border">
        <div className="p-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-brand" />
          <h1 className="text-xl font-bold text-foreground">Crypto News</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {news.map((item) => (
          <article
            key={item.id}
            className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleNewsClick(item.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {item.category}
                </span>
                {item.trending && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    Trending
                  </span>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <h2 className="text-base font-semibold text-foreground mb-1">{item.title}</h2>
            <p className="text-sm text-muted-foreground mb-2">{item.excerpt}</p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.source}</span>
              <span>{item.date}</span>
            </div>

            <div className="mt-3">
              <span className="inline-flex items-center gap-1 text-brand text-sm font-medium">
                Read full article <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </article>
        ))}
      </main>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default CryptoNews;
