// Referral Service - Handle referral codes and sharing
import { useToast } from "@/hooks/use-toast";

export interface ReferralData {
  userId: string;
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  createdAt: string;
}

export interface ShareableTradeData {
  tradeId: string;
  amount: string;
  coin: string;
  status: string;
  date: string;
  merchant?: string;
  totalValue?: string;
}

// Generate a unique referral code for user
export const generateReferralCode = (userId: string, username?: string): string => {
  if (username) {
    // Use username + random suffix
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleanUsername}${suffix}`;
  }
  
  // Fallback to user ID based code
  const suffix = userId.substring(0, 8).toUpperCase();
  return `USER${suffix}`;
};

// Get user's referral code (from localStorage or generate new)
export const getUserReferralCode = (): string => {
  const stored = localStorage.getItem('user-referral-code');
  if (stored) return stored;
  
  // Generate new code
  const userId = localStorage.getItem('user-id') || 'anonymous';
  const username = localStorage.getItem('username');
  const code = generateReferralCode(userId, username);
  
  localStorage.setItem('user-referral-code', code);
  return code;
};

// Get referral link with code
export const getReferralLink = (referralCode?: string): string => {
  const code = referralCode || getUserReferralCode();
  const baseUrl = window.location.origin;
  return `${baseUrl}/signup?ref=${code}`;
};

// Create shareable trade message with referral
export const createTradeShareMessage = (
  tradeData: ShareableTradeData, 
  includeReferral: boolean = true
): string => {
  const baseMessage = `🎉 Just completed a successful ${tradeData.amount} ${tradeData.coin} trade on Central Exchange!

💰 Transaction ID: ${tradeData.tradeId}
📅 Date: ${tradeData.date}
✅ Status: ${tradeData.status.toUpperCase()}
${tradeData.merchant ? `🏪 Merchant: ${tradeData.merchant}` : ''}
${tradeData.totalValue ? `💵 Total: ${tradeData.totalValue}` : ''}

#CryptoTrading #P2P #CentralExchange`;

  if (includeReferral) {
    const referralLink = getReferralLink();
    return `${baseMessage}

🚀 Want to start trading crypto safely? Join me on Central Exchange:
${referralLink}`;
  }

  return baseMessage;
};

// Share trade to different platforms
export const shareTradeToSocial = (
  platform: string, 
  tradeData: ShareableTradeData,
  includeReferral: boolean = true
): void => {
  const message = createTradeShareMessage(tradeData, includeReferral);
  const referralLink = getReferralLink();
  
  let shareUrl = '';
  
  switch (platform.toLowerCase()) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
      break;
      
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(message)}`;
      break;
      
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      break;
      
    case 'telegram':
      shareUrl = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
      break;
      
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}&summary=${encodeURIComponent(message)}`;
      break;
      
    case 'reddit':
      shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent('Successful Crypto Trade on Central Exchange')}`;
      break;
      
    case 'copy':
      navigator.clipboard.writeText(message);
      return;
      
    default:
      console.warn('Unsupported platform:', platform);
      return;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
};

// Track referral usage (mock - implement with your analytics)
export const trackReferralShare = (platform: string, tradeId: string): void => {
  const referralCode = getUserReferralCode();
  
  // Mock tracking - replace with actual analytics
  const trackingData = {
    referralCode,
    platform,
    tradeId,
    timestamp: new Date().toISOString(),
    type: 'trade_share'
  };
  
  console.log('Referral share tracked:', trackingData);
  
  // Store in localStorage for demo (use real analytics in production)
  const existingShares = JSON.parse(localStorage.getItem('referral-shares') || '[]');
  existingShares.push(trackingData);
  localStorage.setItem('referral-shares', JSON.stringify(existingShares));
};

// Get referral statistics (mock data)
export const getReferralStats = (): ReferralData => {
  const userId = localStorage.getItem('user-id') || 'anonymous';
  const referralCode = getUserReferralCode();
  
  // Mock data - replace with actual API call
  return {
    userId,
    referralCode,
    totalReferrals: 12,
    activeReferrals: 8,
    totalEarnings: 45600, // in kobo/cents
    createdAt: new Date().toISOString()
  };
};

// Validate referral code format
export const isValidReferralCode = (code: string): boolean => {
  // Basic validation - adjust based on your format
  return /^[A-Z0-9]{4,12}$/.test(code);
};

// Process referral signup (when someone uses a referral link)
export const processReferralSignup = (referralCode: string): boolean => {
  if (!isValidReferralCode(referralCode)) {
    return false;
  }
  
  // Store the referral code for the new user
  localStorage.setItem('signup-referral-code', referralCode);
  
  // Track the referral usage
  const trackingData = {
    referralCode,
    timestamp: new Date().toISOString(),
    type: 'signup_referral'
  };
  
  console.log('Referral signup processed:', trackingData);
  return true;
};

// Get default referral message for general sharing
export const getDefaultReferralMessage = (): string => {
  const referralLink = getReferralLink();
  
  return `🚀 Join me on Central Exchange - the safest way to trade crypto in Nigeria!

✅ Secure P2P trading
✅ Instant transactions  
✅ 24/7 support
✅ Best rates guaranteed

Sign up with my link and get started:
${referralLink}

#CryptoTrading #P2P #Nigeria`;
};

// Share referral link directly (without trade context)
export const shareReferralLink = (platform: string): void => {
  const message = getDefaultReferralMessage();
  const referralLink = getReferralLink();
  
  let shareUrl = '';
  
  switch (platform.toLowerCase()) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
      break;
      
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(message)}`;
      break;
      
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      break;
      
    case 'telegram':
      shareUrl = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
      break;
      
    case 'copy':
      navigator.clipboard.writeText(message);
      return;
      
    default:
      console.warn('Unsupported platform:', platform);
      return;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
};

export default {
  generateReferralCode,
  getUserReferralCode,
  getReferralLink,
  createTradeShareMessage,
  shareTradeToSocial,
  trackReferralShare,
  getReferralStats,
  isValidReferralCode,
  processReferralSignup,
  getDefaultReferralMessage,
  shareReferralLink
};
