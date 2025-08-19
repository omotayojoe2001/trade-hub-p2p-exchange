import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image_url?: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  read_time: string;
}

export const BlogDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock blog post data - replace with actual Supabase query
    const mockPost: BlogPost = {
      id: id || '1',
      title: 'The Future of Cryptocurrency Trading in Nigeria',
      content: `
        <div class="space-y-6">
          <p class="text-lg leading-relaxed">
            Nigeria has emerged as one of the leading countries in cryptocurrency adoption across Africa. 
            With a young, tech-savvy population and increasing awareness of digital assets, the Nigerian 
            crypto market is experiencing unprecedented growth.
          </p>
          
          <img src="/api/placeholder/800/400" alt="Cryptocurrency trading in Nigeria" class="w-full rounded-lg shadow-lg my-6" />
          
          <h2 class="text-2xl font-bold mt-8 mb-4">Market Growth and Adoption</h2>
          <p class="leading-relaxed">
            The Nigerian cryptocurrency market has grown by over 300% in the past year alone. This growth 
            is driven by several factors including inflation hedging, remittances, and the need for 
            financial inclusion among the unbanked population.
          </p>
          
          <div class="bg-primary/10 p-6 rounded-lg my-6">
            <h3 class="text-lg font-semibold mb-2">Key Statistics</h3>
            <ul class="space-y-2">
              <li>• Nigeria ranks 2nd globally in cryptocurrency adoption</li>
              <li>• Over 13 million Nigerians own cryptocurrency</li>
              <li>• Daily trading volume exceeds $50 million</li>
              <li>• 89% of crypto users are between 18-35 years old</li>
            </ul>
          </div>
          
          <h2 class="text-2xl font-bold mt-8 mb-4">Regulatory Landscape</h2>
          <p class="leading-relaxed">
            The Central Bank of Nigeria (CBN) has taken a cautious but progressive approach to cryptocurrency 
            regulation. Recent developments suggest a more favorable regulatory environment is emerging, 
            which could further boost adoption and legitimize the market.
          </p>
          
          <img src="/api/placeholder/600/300" alt="CBN cryptocurrency regulations" class="w-full rounded-lg shadow-lg my-6" />
          
          <h2 class="text-2xl font-bold mt-8 mb-4">Trading Platforms and Innovation</h2>
          <p class="leading-relaxed">
            Local cryptocurrency exchanges and P2P trading platforms like CryptoPay are revolutionizing 
            how Nigerians access and trade digital assets. These platforms provide secure, user-friendly 
            interfaces that make cryptocurrency trading accessible to everyone.
          </p>
          
          <h2 class="text-2xl font-bold mt-8 mb-4">Future Outlook</h2>
          <p class="leading-relaxed">
            As infrastructure improves and regulatory clarity increases, Nigeria is positioned to become 
            the cryptocurrency hub of Africa. The convergence of mobile technology, financial innovation, 
            and young demographics creates the perfect storm for continued growth in the crypto sector.
          </p>
          
          <div class="bg-green-50 border-l-4 border-green-500 p-6 my-6">
            <h3 class="text-lg font-semibold text-green-800 mb-2">What This Means for You</h3>
            <p class="text-green-700">
              Whether you're a seasoned trader or just getting started, now is an excellent time to 
              explore cryptocurrency trading. Platforms like CryptoPay make it easy and secure to 
              buy, sell, and trade various cryptocurrencies.
            </p>
          </div>
        </div>
      `,
      excerpt: 'Exploring the rapid growth of cryptocurrency adoption in Nigeria and what it means for the future of digital finance.',
      featured_image_url: '/api/placeholder/800/400',
      author_name: 'CryptoPay Research Team',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      tags: ['cryptocurrency', 'nigeria', 'trading', 'fintech', 'blockchain'],
      read_time: '8 min read',
    };

    setPost(mockPost);
    setLoading(false);
  }, [id]);

  const shareArticle = async () => {
    const shareData = {
      title: post?.title || 'CryptoPay Blog Post',
      text: post?.excerpt || 'Check out this interesting article from CryptoPay',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Article link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share article');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h1>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/blog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
          <Button variant="outline" size="sm" onClick={shareArticle}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <Card>
          <CardHeader>
            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="w-full h-64 md:h-80 mb-6 rounded-lg overflow-hidden">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{post.author_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{post.read_time}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Call to Action */}
            <div className="mt-12 p-6 bg-primary/10 rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-2">Ready to Start Trading?</h3>
              <p className="text-muted-foreground mb-4">
                Join thousands of Nigerians who trust CryptoPay for secure cryptocurrency trading
              </p>
              <Button onClick={() => navigate('/auth')} size="lg">
                Get Started Today
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Related Articles */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Related Articles</h2>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: 'How to Safely Trade Bitcoin in Nigeria',
                  excerpt: 'Learn the best practices for secure Bitcoin trading in the Nigerian market.',
                  image: '/api/placeholder/400/200',
                },
                {
                  title: 'Understanding Cryptocurrency Regulations',
                  excerpt: 'A comprehensive guide to crypto regulations and compliance in Nigeria.',
                  image: '/api/placeholder/400/200',
                },
              ].map((article, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <div className="aspect-video">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{article.title}</h3>
                    <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};