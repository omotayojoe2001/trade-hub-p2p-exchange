import React from 'react';
import { ArrowLeft, ExternalLink, Calendar, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NewsDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock news data - in production, fetch by ID
  const newsItem = {
    id: id,
    title: 'Bitcoin Reaches New All-Time High of $73,000',
    source: 'CryptoNews',
    date: '2 hours ago',
    content: `Bitcoin has reached a new all-time high of $73,000, marking a significant milestone in the cryptocurrency's journey. This surge comes amid increased institutional adoption and the approval of several Bitcoin ETFs.

The price rally has been driven by several factors including:

• Institutional investment from major corporations
• Approval of Bitcoin ETFs by regulatory bodies
• Growing acceptance of cryptocurrency as a store of value
• Reduced supply due to halving events

Market analysts predict that this could be the beginning of a new bull run, with some forecasting Bitcoin could reach $100,000 by the end of the year.

However, investors are advised to exercise caution and conduct thorough research before making investment decisions.`,
    category: 'Bitcoin',
    trending: true
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">News Detail</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <article className="bg-card border border-border rounded-xl p-6">
          {/* Category and trending badges */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {newsItem.category}
            </span>
            {newsItem.trending && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                Trending
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-foreground mb-4">
            {newsItem.title}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{newsItem.source}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{newsItem.date}</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            {newsItem.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-foreground mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* External link */}
          <div className="mt-6 pt-4 border-t border-border">
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Read Original Article
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
};

export default NewsDetail;