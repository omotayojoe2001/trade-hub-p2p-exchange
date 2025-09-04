import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowRight, X } from 'lucide-react';
import { IncompleteTradeData, resumeTradeService } from '@/services/resumeTradeService';

interface ResumeTradePopupProps {
  incompleteTrades: IncompleteTradeData[];
  onClose: () => void;
  onResume: (trade: IncompleteTradeData) => void;
}

const ResumeTradePopup: React.FC<ResumeTradePopupProps> = ({
  incompleteTrades,
  onClose,
  onResume
}) => {
  const navigate = useNavigate();

  const handleResume = (trade: IncompleteTradeData) => {
    const resumeUrl = resumeTradeService.getResumeUrl(trade);
    navigate(resumeUrl);
    onResume(trade);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (incompleteTrades.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Resume Your Trade</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            You have {incompleteTrades.length} incomplete trade{incompleteTrades.length > 1 ? 's' : ''}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {incompleteTrades.slice(0, 3).map((trade) => (
            <div
              key={trade.id}
              className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleResume(trade)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {trade.data.coin_type || 'Trade'}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      {trade.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {resumeTradeService.getResumeDescription(trade)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(trade.updated_at)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
          
          {incompleteTrades.length > 3 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/my-trades')}
            >
              View All Trades ({incompleteTrades.length})
            </Button>
          )}
          
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Later
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleResume(incompleteTrades[0])}
            >
              Resume Latest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeTradePopup;
