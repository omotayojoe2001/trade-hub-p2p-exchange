import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Search, TrendingUp, User } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';

// Import blog images
import blogCryptoTrading from '@/assets/blog-crypto-trading.jpg';
import blogSecurity from '@/assets/blog-security.jpg';
import blogP2PTrading from '@/assets/blog-p2p-trading.jpg';
import blogBitcoinAnalysis from '@/assets/blog-bitcoin-analysis.jpg';
import blogRegulation from '@/assets/blog-regulation.jpg';
import blogChartPatterns from '@/assets/blog-chart-patterns.jpg';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  featured_image_url?: string;
  author_name: string;
  created_at: string;
  tags: string[];
  read_time: string;
  category: string;
}

export const Blog: React.FC = () => {
  const navigate = useNavigate();
  const isQuickAuthActive = false;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Trading', 'Security', 'News', 'Education', 'Market Analysis'];

  useEffect(() => {
    // Mock blog posts data - replace with actual Supabase query
    const mockPosts: BlogPost[] = [
      {
        id: '1',
        title: 'The Future of Cryptocurrency Trading in Nigeria',
        excerpt: 'Exploring the rapid growth of cryptocurrency adoption in Nigeria and what it means for the future of digital finance.',
        featured_image_url: blogChartPatterns,
        author_name: 'CryptoPay Research Team',
        created_at: '2024-01-15T10:00:00Z',
        tags: ['cryptocurrency', 'nigeria', 'trading'],
        read_time: '8 min read',
        category: 'Market Analysis',
      },
      {
        id: '2',
        title: 'How to Secure Your Crypto Wallet: Best Practices',
        excerpt: 'Learn essential security measures to protect your cryptocurrency investments from theft and fraud.',
        featured_image_url: blogCryptoTrading,
        author_name: 'Security Team',
        created_at: '2024-01-12T14:30:00Z',
        tags: ['security', 'wallet', 'safety'],
        read_time: '6 min read',
        category: 'Security',
      },
      {
        id: '3',
        title: 'Understanding P2P Trading: A Beginner\'s Guide',
        excerpt: 'Everything you need to know about peer-to-peer cryptocurrency trading and how to get started safely.',
        featured_image_url: blogSecurity,
        author_name: 'Education Team',
        created_at: '2024-01-10T09:15:00Z',
        tags: ['p2p', 'trading', 'beginner'],
        read_time: '10 min read',
        category: 'Education',
      },
      {
        id: '4',
        title: 'Bitcoin Price Analysis: Q1 2024 Outlook',
        excerpt: 'Technical analysis and market predictions for Bitcoin\'s performance in the first quarter of 2024.',
        featured_image_url: blogP2PTrading,
        author_name: 'Market Analyst',
        created_at: '2024-01-08T16:45:00Z',
        tags: ['bitcoin', 'analysis', 'prediction'],
        read_time: '12 min read',
        category: 'Market Analysis',
      },
      {
        id: '5',
        title: 'New CBN Guidelines for Cryptocurrency Exchanges',
        excerpt: 'Latest regulatory updates from the Central Bank of Nigeria affecting cryptocurrency trading platforms.',
        featured_image_url: blogBitcoinAnalysis,
        author_name: 'Regulatory Team',
        created_at: '2024-01-05T11:20:00Z',
        tags: ['regulation', 'cbn', 'compliance'],
        read_time: '7 min read',
        category: 'News',
      },
      {
        id: '6',
        title: 'Mastering Chart Patterns for Crypto Trading',
        excerpt: 'Learn to identify and trade profitable chart patterns in the cryptocurrency market.',
        featured_image_url: blogRegulation,
        author_name: 'Trading Expert',
        created_at: '2024-01-03T13:10:00Z',
        tags: ['trading', 'technical-analysis', 'patterns'],
        read_time: '15 min read',
        category: 'Trading',
      },
    ];

    setPosts(mockPosts);
    setLoading(false);
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            CryptoPay Blog
          </h1>
          <p className="text-muted-foreground text-lg">
            Stay updated with the latest in cryptocurrency trading, security, and market insights
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Article */}
        {featuredPost && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/blog/${featuredPost.id}`)}
          >
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src={featuredPost.featured_image_url}
                  alt={featuredPost.title}
                  className="w-full h-64 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                />
              </div>
              <div className="md:w-1/2 p-6 flex flex-col justify-center">
                <div className="space-y-4">
                  <Badge variant="secondary" className="w-fit">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                  
                  <CardTitle className="text-2xl md:text-3xl leading-tight">
                    {featuredPost.title}
                  </CardTitle>
                  
                  <p className="text-muted-foreground text-lg">
                    {featuredPost.excerpt}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{featuredPost.author_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(featuredPost.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{featuredPost.read_time}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {featuredPost.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card 
              key={post.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/blog/${post.id}`)}
            >
              <div className="aspect-video">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {post.read_time}
                  </span>
                </div>
                
                <CardTitle className="text-lg leading-tight line-clamp-2">
                  {post.title}
                </CardTitle>
                
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{post.author_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No articles found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or category filters
            </p>
          </div>
        )}

        {filteredPosts.length > 0 && (
          <div className="text-center">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        )}

        {/* Newsletter Signup */}
        <Card className="bg-primary/10">
          <CardContent className="p-8 text-center space-y-4">
            <CardTitle className="text-2xl">Stay Updated</CardTitle>
            <p className="text-muted-foreground">
              Subscribe to our newsletter for the latest cryptocurrency insights and trading tips
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input placeholder="Enter your email" type="email" />
              <Button>Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};