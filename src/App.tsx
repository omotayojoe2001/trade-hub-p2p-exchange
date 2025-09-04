
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalNotifications from "@/components/GlobalNotifications";
import QuickAuthScreen from "@/components/QuickAuthScreen";
import useInactivityDetector from "@/hooks/useInactivityDetector";
import { useAuthStorage } from "@/hooks/useAuthStorage";
import { QuickAuthProvider, useQuickAuth } from "@/hooks/useQuickAuth";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { PremiumProvider } from "./hooks/usePremium";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Coins from "./pages/Coins";
import BuySell from "./pages/BuySell";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Premium from "./pages/Premium";
import MerchantSelection from "./pages/MerchantSelection";
import MerchantList from "./pages/MerchantList";
import SelectCoin from "./pages/SelectCoin";
import MyTrades from "./pages/MyTrades";

import PaymentStatus from "./pages/PaymentStatus";
import SellPaymentStatus from "./pages/SellPaymentStatus";
import TradeStatus from "./pages/TradeStatus";
import MerchantTradeRequests from "./pages/MerchantTradeRequests";
import TradeDetails from "./pages/TradeDetails";
import SellCrypto from "./pages/SellCrypto";
import TradeCompleted from "./pages/TradeCompleted";
import NotFound from "./pages/NotFound";
import Referrals from "./pages/Referrals";
import ProfileSettings from "./pages/ProfileSettings";
import Security from "./pages/Security";
import PaymentMethods from "./pages/PaymentMethods";
import HelpSupport from "./pages/HelpSupport";
import SplashScreen from "./pages/SplashScreen";
import OnboardingSlides from "./pages/OnboardingSlides";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Enable2FA from "./pages/Enable2FA";
import IdentityVerification from "./pages/IdentityVerification";
import FaceVerification from "./pages/FaceVerification";
import VerificationSuccess from "./pages/VerificationSuccess";
import CoinDetail from "./pages/CoinDetail";
import BuyCrypto from "./pages/BuyCrypto";
import BuyCryptoMatch from "./pages/BuyCryptoMatch";
import BuyCryptoPayment from "./pages/BuyCryptoPayment";
import BuyCryptoWaiting from "./pages/BuyCryptoWaiting";
import BuyCryptoSuccess from "./pages/BuyCryptoSuccess";
import BuyCryptoCancel from "./pages/BuyCryptoCancel";
import BuyCryptoDispute from "./pages/BuyCryptoDispute";
import SellCryptoMatch from "./pages/SellCryptoMatch";
import SellCryptoWaiting from "./pages/SellCryptoWaiting";
import SellCryptoConfirmReceipt from "./pages/SellCryptoConfirmReceipt";
import SellCryptoCancel from "./pages/SellCryptoCancel";
import SellCryptoDispute from "./pages/SellCryptoDispute";
import MerchantSettings from "./pages/MerchantSettings";
import CryptoWallet from "./pages/CryptoWallet";
import RateMerchant from "./pages/RateMerchant";
import BuyCryptoFlow from "./pages/BuyCryptoFlow";
import BuyCryptoMerchantSelection from "./pages/BuyCryptoMerchantSelection";
import MerchantDashboard from "./pages/MerchantDashboard";
import PremiumPayment from "./pages/PremiumPayment";
import PremiumDashboard from "./pages/PremiumDashboard";
import NotificationsDemo from "./pages/NotificationsDemo";
import PremiumSell from "./pages/PremiumSell";
import CashDeliveryDetails from "./pages/CashDeliveryDetails";
import CashPickupDetails from "./pages/CashPickupDetails";

import SellForCash from "./pages/SellForCash";

import CurrencyConversion from "./pages/CurrencyConversion";
import PremiumTrades from "./pages/PremiumTrades";
import PremiumNotifications from "./pages/PremiumNotifications";
import PremiumSettings from "./pages/PremiumSettings";
import PremiumTrade from "./pages/PremiumTrade";
import PremiumMessages from "./pages/PremiumMessages";
import PremiumNews from "./pages/PremiumNews";
import TrendingCoins from "./pages/TrendingCoins";
import PremiumReferral from "./pages/PremiumReferral";
import PremiumChatDetail from "./pages/PremiumChatDetail";
import PremiumPaymentMethods from "./pages/PremiumPaymentMethods";
import PremiumSupport from "./pages/PremiumSupport";
import DeliveryTracking from "./pages/DeliveryTracking";
import PremiumTradeRequestDetails from "./pages/PremiumTradeRequestDetails";
import NewsDetail from "./pages/NewsDetail";
import PremiumNewsDetail from "./pages/PremiumNewsDetail";
import ChatDetail from "./pages/ChatDetail";
import CoinDetailPage from "./pages/CoinDetailPage";
import PremiumTradeRequests from "./pages/PremiumTradeRequests";
import CreateTradeRequest from "./pages/CreateTradeRequest";
import PremiumPaymentStatus from "./pages/PremiumPaymentStatus";
import Premium2FA from "./pages/Premium2FA";
import PremiumProfile from "./pages/PremiumProfile";
import UserProfile from "./components/UserProfile";
import EnhancedBuyCrypto from "./pages/EnhancedBuyCrypto";
import SellCryptoBankTransfer from "./pages/SellCryptoBankTransfer";
import SellCryptoCashPickup from "./pages/SellCryptoCashPickup";
import SellCryptoCashDelivery from "./pages/SellCryptoCashDelivery";
import CashPickupConfirmation from "./pages/CashPickupConfirmation";
import CashDeliveryConfirmation from "./pages/CashDeliveryConfirmation";
import SendNairaGetUSD from "./pages/SendNairaGetUSD";
import PremiumTradeCompleted from "./pages/PremiumTradeCompleted";
import CashOrderThankYou from "./pages/CashOrderThankYou";
import GlobalCodeTracker from "./components/GlobalCodeTracker";
import DeliveryStatus from "./pages/DeliveryStatus";
import TradeRequests from "./pages/TradeRequests";
import TradeRequestDetails from "./pages/TradeRequestDetails";
import MerchantTradeFlow from "./pages/MerchantTradeFlow";
import Messages from "./pages/Messages";
import EscrowFlow from "./pages/EscrowFlow";
import ReceiptPage from "./pages/ReceiptPage";
import { Blog } from "./pages/Blog";
import { BlogDetail } from "./pages/BlogDetail";
import { ThankYouPage } from "./pages/ThankYouPage";
import SupabaseTest from "./pages/SupabaseTest";

import CryptoNews from "./pages/CryptoNews";
import React from 'react';

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, signOut } = useAuth();
  const { isInactive, resetTimer } = useInactivityDetector();
  const { storedUser, saveUser, clearStoredUser } = useAuthStorage();
  const { setQuickAuthActive } = useQuickAuth();
  const location = useLocation();

  // Check if user is on auth-related pages
  const isOnAuthPage = ['/auth', '/onboarding', '/splash', '/email-verification', '/forgot-password', '/reset-password'].includes(location.pathname);
  
  // Save user data when they're active and logged in
  React.useEffect(() => {
    if (user && !isInactive) {
      saveUser({
        id: user.id,
        email: user.email || '',
        displayName: user.user_metadata?.display_name || user.email || ''
      });
    }
  }, [user, isInactive, saveUser]);

  // Handle inactivity - log user out for timeout
  React.useEffect(() => {
    if (isInactive && user) {
      setQuickAuthActive(true);
      signOut();
    }
  }, [isInactive, user, signOut, setQuickAuthActive]);

  // Set quick auth active when showing the screen
  React.useEffect(() => {
    const logoutReason = localStorage.getItem('logout-reason');

    if (!user && storedUser && !isOnAuthPage) {
      // Only show quick auth for timeout, not manual logout
      if (logoutReason === 'timeout' || logoutReason === null) {
        setQuickAuthActive(true);
      } else {
        // Manual logout - clear stored user and don't show quick auth
        clearStoredUser();
        setQuickAuthActive(false);
      }
    } else {
      setQuickAuthActive(false);
    }

    // Clear logout reason after handling
    if (logoutReason) {
      localStorage.removeItem('logout-reason');
    }
  }, [user, storedUser, isOnAuthPage, setQuickAuthActive, clearStoredUser]);

  const handleQuickAuthSuccess = () => {
    resetTimer();
  };

  const handleSignOut = async () => {
    await signOut();
    clearStoredUser();
    resetTimer();
  };

  return (
    <>
      {/* Only show notifications if not on auth pages */}
      {!isOnAuthPage && <GlobalNotifications />}
      
      {/* Show quick auth if user was logged out due to inactivity */}
      {!user && storedUser && !isOnAuthPage && (
        <QuickAuthScreen
          user={{
            email: storedUser.email,
            displayName: storedUser.displayName
          }}
          onSuccess={() => {
            setQuickAuthActive(false);
            handleQuickAuthSuccess();
          }}
          onCancel={() => {
            setQuickAuthActive(false);
            handleSignOut();
          }}
        />
      )}
      <GlobalCodeTracker />
      <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/home" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/coins" element={<Coins />} />
            <Route path="/buy-sell" element={<BuySell />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/profile-settings" element={<ProfileSettings />} />
            <Route path="/security" element={<Security />} />
            <Route path="/payment-methods" element={<PaymentMethods />} />
            <Route path="/help-support" element={<HelpSupport />} />
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/onboarding" element={<OnboardingSlides />} />
            <Route path="/email-verification" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/enable-2fa" element={<Enable2FA />} />
          <Route path="/identity-verification" element={<IdentityVerification />} />
          <Route path="/face-verification" element={<FaceVerification />} />
          <Route path="/verification-success" element={<VerificationSuccess />} />
            <Route path="/coin/:coinId" element={<CoinDetail />} />
            <Route path="/buy-crypto" element={<BuyCrypto />} />
          <Route path="/buy-crypto-merchant-selection" element={<BuyCryptoMerchantSelection />} />
          <Route path="/buy-crypto-match" element={<BuyCryptoMatch />} />
          <Route path="/buy-crypto-payment" element={<BuyCryptoPayment />} />
            <Route path="/buy-crypto-waiting" element={<BuyCryptoWaiting />} />
            <Route path="/buy-crypto-success" element={<BuyCryptoSuccess />} />
            <Route path="/buy-crypto-cancel" element={<BuyCryptoCancel />} />
            <Route path="/buy-crypto-dispute" element={<BuyCryptoDispute />} />
            <Route path="/merchant-selection" element={<MerchantSelection />} />
            <Route path="/merchant-list" element={<MerchantList />} />
            <Route path="/select-coin" element={<SelectCoin />} />
            <Route path="/my-trades" element={<MyTrades />} />
            <Route path="/news" element={<CryptoNews />} />

            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/sell-payment-status" element={<SellPaymentStatus />} />
            <Route path="/trade-status" element={<TradeStatus />} />
            <Route path="/merchant-trade-requests" element={<MerchantTradeRequests />} />
            <Route path="/trade-details/:tradeId" element={<TradeDetails />} />
            <Route path="/sell-crypto" element={<SellCrypto />} />
            <Route path="/sell-crypto-match" element={<SellCryptoMatch />} />
            <Route path="/sell-crypto-waiting" element={<SellCryptoWaiting />} />
            <Route path="/sell-crypto-confirm-receipt" element={<SellCryptoConfirmReceipt />} />
            <Route path="/sell-crypto-cancel" element={<SellCryptoCancel />} />
            <Route path="/sell-crypto-dispute" element={<SellCryptoDispute />} />
            <Route path="/trade-completed" element={<TradeCompleted />} />
            <Route path="/merchant-settings" element={<MerchantSettings />} />
            <Route path="/crypto-wallet" element={<CryptoWallet />} />
            <Route path="/rate-merchant" element={<RateMerchant />} />
            <Route path="/buy-crypto-flow" element={<BuyCryptoFlow />} />
            <Route path="/merchant-dashboard" element={<MerchantDashboard />} />
            <Route path="/premium-payment" element={<PremiumPayment />} />
            <Route path="/premium-dashboard" element={<PremiumDashboard />} />
            <Route path="/premium/sell" element={<PremiumSell />} />
            <Route path="/premium/cash-delivery" element={<CashDeliveryDetails />} />
            <Route path="/premium/cash-pickup" element={<CashPickupDetails />} />

            <Route path="/sell-for-cash" element={<SellForCash />} />

            <Route path="/currency-conversion" element={<CurrencyConversion />} />
            <Route path="/premium-trades" element={<PremiumTrades />} />
            <Route path="/premium-notifications" element={<PremiumNotifications />} />
            <Route path="/premium-settings" element={<PremiumSettings />} />
            <Route path="/premium-trade" element={<PremiumTrade />} />
            <Route path="/premium-messages" element={<PremiumMessages />} />
            <Route path="/premium-news" element={<PremiumNews />} />
            <Route path="/trending-coins" element={<TrendingCoins />} />
            <Route path="/premium-referral" element={<PremiumReferral />} />
            <Route path="/premium-chat/:id" element={<PremiumChatDetail />} />
            <Route path="/premium-payment-methods" element={<PremiumPaymentMethods />} />
            <Route path="/premium-support" element={<PremiumSupport />} />
            <Route path="/delivery-tracking" element={<DeliveryTracking />} />
            <Route path="/premium-trade-request-details" element={<PremiumTradeRequestDetails />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/premium-news/:id" element={<PremiumNewsDetail />} />
            <Route path="/chat/:chatId" element={<ChatDetail />} />
            <Route path="/coin-detail/:coinId" element={<CoinDetailPage />} />
            <Route path="/premium-trade-requests" element={<PremiumTradeRequests />} />
            <Route path="/create-trade-request" element={<CreateTradeRequest />} />
            <Route path="/premium-payment-status" element={<PremiumPaymentStatus />} />
            <Route path="/premium-2fa" element={<Premium2FA />} />
            <Route path="/premium-profile" element={<PremiumProfile />} />
            <Route path="/user-profile/:userId" element={<UserProfile />} />
            <Route path="/enhanced-buy-crypto" element={<EnhancedBuyCrypto />} />
            <Route path="/sell-crypto-bank-transfer" element={<SellCryptoBankTransfer />} />
            <Route path="/sell-crypto-cash-pickup" element={<SellCryptoCashPickup />} />
            <Route path="/sell-crypto-cash-delivery" element={<SellCryptoCashDelivery />} />
            <Route path="/cash-pickup-confirmation" element={<CashPickupConfirmation />} />
            <Route path="/cash-delivery-confirmation" element={<CashDeliveryConfirmation />} />
            <Route path="/send-naira-get-usd" element={<SendNairaGetUSD />} />
            <Route path="/premium-trade-completed" element={<PremiumTradeCompleted />} />
            <Route path="/cash-order-thank-you" element={<CashOrderThankYou />} />
            <Route path="/delivery-status" element={<DeliveryStatus />} />
        <Route path="/trade-requests" element={<TradeRequests />} />
        <Route path="/trade-request-details" element={<TradeRequestDetails />} />
        <Route path="/merchant-trade-flow" element={<MerchantTradeFlow />} />
        <Route path="/receipt" element={<ReceiptPage />} />
        <Route path="/receipt-page" element={<ReceiptPage />} />
        <Route path="/trade-requests" element={<TradeRequests />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:postId" element={<BlogDetail />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/escrow-flow" element={<EscrowFlow />} />
        <Route path="/supabase-test" element={<SupabaseTest />} />
            <Route path="/notifications-demo" element={<NotificationsDemo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PremiumProvider>
            <QuickAuthProvider>
              <TooltipProvider>
                <AppContent />
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </QuickAuthProvider>
          </PremiumProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
