import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClickableUserProps {
  userId: string;
  displayName: string;
  userType?: string;
  isMerchant?: boolean;
  rating?: number;
  avatarUrl?: string;
  className?: string;
  showRating?: boolean;
  showBadges?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

const ClickableUser: React.FC<ClickableUserProps> = ({
  userId,
  displayName,
  userType = 'customer',
  isMerchant = false,
  rating,
  avatarUrl,
  className = '',
  showRating = true,
  showBadges = true,
  size = 'md',
  clickable = true
}) => {
  const navigate = useNavigate();

  const isPremium = userType === 'premium' || isMerchant;
  
  const avatarSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const handleClick = () => {
    if (clickable) {
      navigate(`/user-profile/${userId}`);
    }
  };

  return (
    <div 
      className={`flex items-center space-x-3 ${clickable ? 'cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors' : ''} ${className}`}
      onClick={handleClick}
    >
      <Avatar className={avatarSizes[size]}>
        <AvatarImage 
          src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} 
        />
        <AvatarFallback>
          {displayName?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className={`font-medium truncate ${textSizes[size]}`}>
            {displayName}
          </span>
          
          {showBadges && (
            <>
              {isPremium && (
                <Crown size={14} className="text-yellow-500 flex-shrink-0" />
              )}
              {isMerchant && (
                <Badge variant="secondary" className="text-xs">
                  <Shield size={10} className="mr-1" />
                  Merchant
                </Badge>
              )}
            </>
          )}
        </div>
        
        {showRating && rating && (
          <div className="flex items-center space-x-1 mt-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClickableUser;