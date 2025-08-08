import React, { useEffect } from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuickAuth } from '@/hooks/useQuickAuth';

const news = [
  {
    id: 1,
    title: 'Bitcoin holds steady as ETFs see fresh inflows',
    source: 'CoinDesk',
    date: 'Today, 10:30 AM',
    excerpt: 'Spot Bitcoin ETFs recorded another day of positive inflows as BTC consolidates above key support levels.',
    url: '#'
  },
  {
    id: 2,
    title: 'Ethereum developers schedule next testnet upgrade',
    source: 'The Block',
    date: 'Today, 9:05 AM',
    excerpt: 'Core devs finalized the timeline for the upcoming protocol upgrade focused on scaling and lower fees.',
    url: '#'
  },
  {
    id: 3,
    title: 'Stablecoin market cap rises to yearly high',
    source: 'Messari',
    date: 'Yesterday, 4:12 PM',
    excerpt: 'Liquidity returns to crypto as stablecoins expand, signaling improved market conditions.',
    url: '#'
  }
];

const CryptoNews: React.FC = () => {
  const { isQuickAuthActive } = useQuickAuth();

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
          <article key={item.id} className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-base font-semibold text-foreground mb-1">{item.title}</h2>
            <p className="text-sm text-muted-foreground mb-2">{item.excerpt}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.source}</span>
              <span>{item.date}</span>
            </div>
            <div className="mt-3">
              <a href={item.url} className="inline-flex items-center gap-1 text-brand text-sm">
                Read more <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </article>
        ))}
      </main>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default CryptoNews;
