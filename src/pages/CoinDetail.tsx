import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

const CoinDetail = () => {
  const { coinId } = useParams();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("24h");

  // Mock data - replace with real API data
  const coinData = {
    name: "Bitcoin",
    symbol: "BTC",
    price: "₦75,432,000",
    change: "+2.45%",
    isPositive: true,
    volume: "₦1.2B",
    marketCap: "₦1.5T",
    high24h: "₦76,000,000",
    low24h: "₦74,000,000"
  };

  const handleBuy = () => {
    navigate(`/buy-crypto?coin=${coinId}`);
  };

  const handleSell = () => {
    navigate(`/sell-crypto?coin=${coinId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">{coinData.name}</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{coinData.symbol}</CardTitle>
              <div className={`flex items-center ${coinData.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {coinData.isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                <span className="text-sm">{coinData.change}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">{coinData.price}</div>
            
            {/* Mock Chart Area */}
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
              <span className="text-muted-foreground">Price Chart</span>
            </div>
            
            <div className="flex gap-2 mb-4">
              {["1h", "24h", "7d", "30d"].map((period) => (
                <Button
                  key={period}
                  variant={timeframe === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">24h Volume</span>
                <div className="font-semibold">{coinData.volume}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Market Cap</span>
                <div className="font-semibold">{coinData.marketCap}</div>
              </div>
              <div>
                <span className="text-muted-foreground">24h High</span>
                <div className="font-semibold">{coinData.high24h}</div>
              </div>
              <div>
                <span className="text-muted-foreground">24h Low</span>
                <div className="font-semibold">{coinData.low24h}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleBuy} className="h-12">
            Buy {coinData.symbol}
          </Button>
          <Button onClick={handleSell} variant="outline" className="h-12">
            Sell {coinData.symbol}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;