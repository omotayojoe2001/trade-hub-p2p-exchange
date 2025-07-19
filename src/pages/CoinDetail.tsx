import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Star, ExternalLink } from "lucide-react";
import { useCryptoData } from '@/hooks/useCryptoData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CoinDetail = () => {
  const { coinId } = useParams();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("7");
  const [coinData, setCoinData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { getCoinDetail, getCoinHistory, favorites, toggleFavorite } = useCryptoData();

  useEffect(() => {
    const loadCoinData = async () => {
      if (!coinId) return;
      
      setLoading(true);
      try {
        const [detail, history] = await Promise.all([
          getCoinDetail(coinId),
          getCoinHistory(coinId, parseInt(timeframe))
        ]);
        
        setCoinData(detail);
        
        if (history) {
          const labels = history.prices.map(([timestamp]) => {
            const date = new Date(timestamp);
            if (timeframe === "1") {
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleDateString();
          });
          
          const prices = history.prices.map(([, price]) => price);
          const isPositive = prices[prices.length - 1] > prices[0];
          
          setChartData({
            labels,
            datasets: [
              {
                label: 'Price',
                data: prices,
                borderColor: isPositive ? '#10b981' : '#ef4444',
                backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
              }
            ]
          });
        }
      } catch (error) {
        console.error('Error loading coin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCoinData();
  }, [coinId, timeframe, getCoinDetail, getCoinHistory]);

  const formatPrice = (price: number) => {
    if (price < 1) {
      return `$${price.toFixed(6)}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const handleBuy = () => {
    navigate(`/buy-crypto?coin=${coinId}`);
  };

  const handleSell = () => {
    navigate(`/sell-crypto?coin=${coinId}`);
  };

  if (loading || !coinData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="animate-pulse h-6 bg-gray-200 rounded w-24"></div>
          <div className="w-10" />
        </div>
        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-32"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isPositive = coinData.price_change_percentage_24h >= 0;
  const isFavorite = favorites.includes(coinId || '');

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: isPositive ? '#10b981' : '#ef4444',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `Price: ${formatPrice(context.parsed.y)}`,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverBackgroundColor: isPositive ? '#10b981' : '#ef4444',
      },
    },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">{coinData.name}</h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => toggleFavorite(coinId || '')}
        >
          <Star 
            className={`w-5 h-5 ${isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} 
          />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg font-medium">{coinData.symbol.toUpperCase()}</CardTitle>
                <span className="text-sm text-gray-500">#{coinData.market_cap_rank}</span>
              </div>
              <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                <span className="text-sm font-semibold">
                  {isPositive ? '+' : ''}{coinData.price_change_percentage_24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">{formatPrice(coinData.current_price)}</div>
            
            {/* Chart */}
            <div className="h-64 mb-6 bg-gray-50 rounded-lg p-4">
              {chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-gray-500">Loading chart...</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mb-6">
              {[
                { period: "1", label: "1D" },
                { period: "7", label: "7D" },
                { period: "30", label: "30D" },
                { period: "365", label: "1Y" }
              ].map(({ period, label }) => (
                <Button
                  key={period}
                  variant={timeframe === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe(period)}
                  className="flex-1"
                >
                  {label}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 block">24h Volume</span>
                <div className="font-semibold text-lg">{formatLargeNumber(coinData.total_volume)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 block">Market Cap</span>
                <div className="font-semibold text-lg">{formatLargeNumber(coinData.market_cap)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 block">24h High</span>
                <div className="font-semibold text-lg">{formatPrice(coinData.high_24h)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 block">24h Low</span>
                <div className="font-semibold text-lg">{formatPrice(coinData.low_24h)}</div>
              </div>
            </div>

            {coinData.ath && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 text-sm">All-Time High</span>
                  <span className="font-semibold text-blue-900">{formatPrice(coinData.ath)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleBuy} className="h-12 shadow-md">
            Buy {coinData.symbol.toUpperCase()}
          </Button>
          <Button onClick={handleSell} variant="outline" className="h-12 shadow-md">
            Sell {coinData.symbol.toUpperCase()}
          </Button>
        </div>

        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">View on CoinGecko</span>
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoinDetail;