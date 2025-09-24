import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Upload, RefreshCw, Calendar, Filter, Search, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { creditsService } from '@/services/creditsService';

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'spend' | 'refund';
  amount: number;
  description: string;
  created_at: string;
  reference_id?: string;
}

interface CreditPurchase {
  id: string;
  crypto_type: string;
  crypto_amount: number;
  credits_amount: number;
  status: string;
  created_at: string;
  payment_address: string;
}

const CreditsHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'purchases' | 'spending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchUserCredits();
    }
  }, [user]);

  const fetchUserCredits = async () => {
    if (!user) return;
    try {
      const credits = await creditsService.getUserCredits(user.id);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch credit transactions
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch credit purchases
      const { data: purchasesData } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setTransactions(transactionsData || []);
      setPurchases(purchasesData || []);
    } catch (error) {
      console.error('Error fetching credit history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Download className="w-4 h-4 text-green-600" />;
      case 'spend':
        return <Upload className="w-4 h-4 text-red-600" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'paid':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'paid':
        return <AlertCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filterData = () => {
    let allData = [];
    
    if (activeTab === 'all' || activeTab === 'purchases') {
      allData = [...allData, ...purchases.map(p => ({ ...p, type: 'purchase' }))];
    }
    
    if (activeTab === 'all' || activeTab === 'spending') {
      allData = [...allData, ...transactions.filter(t => t.type === 'spend').map(t => ({ ...t, type: 'spend' }))];
    }
    
    // Sort by date
    allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Apply search filter
    if (searchTerm) {
      allData = allData.filter(item => 
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.crypto_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter.replace('d', ''));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      allData = allData.filter(item => new Date(item.created_at) >= cutoff);
    }
    
    return allData;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading credit history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">Credits History</h1>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Balance Card */}
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Credits</p>
                <p className="text-2xl font-bold">{userCredits.toLocaleString()}</p>
                <p className="text-blue-100 text-sm">${(userCredits * 0.01).toFixed(2)} USD</p>
              </div>
              <div className="text-right">
                <TrendingUp className="w-8 h-8 text-blue-200 mb-2" />
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => navigate('/credits-purchase')}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Top Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border-b space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'purchases', label: 'Purchases' },
            { key: 'spending', label: 'Spending' }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Date Filter */}
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Time' },
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' }
          ].map((filter) => (
            <button
              key={filter.key}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                dateFilter === filter.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setDateFilter(filter.key as any)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading history...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filterData().length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || dateFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms.'
                      : 'Your credit activity will appear here once you start using the platform.'}
                  </p>
                  <Button onClick={() => navigate('/credits-purchase')} className="bg-blue-600 hover:bg-blue-700">
                    Purchase Credits
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filterData().map((item: any) => (
                <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {item.type === 'purchase' ? (
                      // Purchase Record
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Download className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                Credit Purchase
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.crypto_amount?.toFixed(8)} {item.crypto_type}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              +{item.credits_amount} credits
                            </div>
                            <div className="text-sm text-gray-500">
                              ${(item.credits_amount * 0.01).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {formatDate(item.created_at)}
                          </div>
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            <span className="capitalize">{item.status}</span>
                          </div>
                        </div>
                        
                        {item.payment_address && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Payment Address</div>
                            <div className="text-xs font-mono text-gray-700 break-all">
                              {item.payment_address}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Spending Record
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <Upload className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              Credit Spent
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.description}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDate(item.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            {item.amount} credits
                          </div>
                          <div className="text-sm text-gray-500">
                            ${(Math.abs(item.amount) * 0.01).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsHistory;