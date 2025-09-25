
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

// Removed ThemeProvider to disable dark mode by default
import { useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Coins from "./pages/Coins";
import BuySell from "./pages/BuySell";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";


import MerchantList from "./pages/MerchantList";
import SelectCoin from "./pages/SelectCoin";
import MyTrades from "./pages/MyTrades";

import BuyCryptoPaymentStep1 from "./pages/BuyCryptoPaymentStep1";
import BuyCryptoPaymentStep2 from "./pages/BuyCryptoPaymentStep2";
import BuyCryptoPaymentStep3 from "./pages/BuyCryptoPaymentStep3";
import SellCryptoPaymentStep1 from "./pages/SellCryptoPaymentStep1";
import SellCryptoPaymentStep2 from "./pages/SellCryptoPaymentStep2";
import SellCryptoPaymentStep3 from "./pages/SellCryptoPaymentStep3";
import TradeStatus from "./pages/TradeStatus";

import TradeDetails from "./pages/TradeDetails";
import SellCrypto from "./pages/SellCrypto";
import SellCryptoMerchantSelection from "./pages/SellCryptoMerchantSelection";
import SellCryptoEscrow from "./pages/SellCryptoEscrow";
import SellCryptoCompleted from "./pages/SellCryptoCompleted";
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

import BuyCryptoMatch from "./pages/BuyCryptoMatch";

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
// Removed BuyCryptoSearching - not needed
import MerchantDashboard from "./pages/MerchantDashboard";
import CashDeliveryDetails from "./pages/CashDeliveryDetails";
import CashPickupDetails from "./pages/CashPickupDetails";
import SellForCash from "./pages/SellForCash";
import Dashboard from "./pages/Dashboard";
import CurrencyConversion from "./pages/CurrencyConversion";
import TrendingCoins from "./pages/TrendingCoins";
import CoinDetailPage from "./pages/CoinDetailPage";
import CreateTradeRequest from "./pages/CreateTradeRequest";
import UserProfile from "./components/UserProfile";

import SellCryptoBankTransfer from "./pages/SellCryptoBankTransfer";
import SellCryptoCashPickup from "./pages/SellCryptoCashPickup";
import SellCryptoCashDelivery from "./pages/SellCryptoCashDelivery";
import CashPickupConfirmation from "./pages/CashPickupConfirmation";
import CashDeliveryConfirmation from "./pages/CashDeliveryConfirmation";
import SendNairaGetUSD from "./pages/SendNairaGetUSD";
// import PremiumTradeCompleted from "./pages/PremiumTradeCompleted";
import CashOrderThankYou from "./pages/CashOrderThankYou";
import GlobalCodeTracker from "./components/GlobalCodeTracker";
import DeliveryStatus from "./pages/DeliveryStatus";
import TradeRequests from "./pages/TradeRequests";
import TradeRequestDetails from "./pages/TradeRequestDetails";
import MerchantTradeFlow from "./pages/MerchantTradeFlow";
import Messages from "./pages/Messages";
import EscrowFlow from "./pages/EscrowFlow";
import EscrowTradeFlow from "./pages/EscrowTradeFlow";
import CashEscrowFlow from "./pages/CashEscrowFlow";
import ReceiptPage from "./pages/ReceiptPage";
import { Blog } from "./pages/Blog";
import MerchantMatchingChoice from "./pages/MerchantMatchingChoice";
import IncomingTradeRequests from "./pages/IncomingTradeRequests";
import TradeRequestNotifications from "./pages/TradeRequestNotifications";
import SellCryptoTradeRequestDetails from "./pages/SellCryptoTradeRequestDetails";
import AutoMerchantMatch from "./pages/AutoMerchantMatch";
import VendorLogin from "./pages/VendorLogin";
import SimpleVendorDashboard from "./pages/SimpleVendorDashboard";
import CreditsPurchase from "./pages/CreditsPurchase";
import CreditsHistory from "./pages/CreditsHistory";
import AdminCredits from "./pages/AdminCredits";
import TestCredits from "./pages/TestCredits";
import VendorAuthGuard from "./components/VendorAuthGuard";
import VendorDashboard from "./components/VendorDashboard";
import VendorBankDetails from "./pages/VendorBankDetails";
import VendorProfile from "./pages/VendorProfile";
import VendorMessages from "./pages/VendorMessages";
import SendNairaPaymentStep from "./pages/SendNairaPaymentStep";
import VendorCashOrderDetails from "./pages/VendorCashOrderDetails";
import VendorPaymentConfirmation from "./pages/VendorPaymentConfirmation";
import VendorTransactions from "./pages/VendorTransactions";



// Removed BlogDetail - not needed
import { ThankYouPage } from "./pages/ThankYouPage";
// Removed SupabaseTest - not needed

import CryptoNews from "./pages/CryptoNews";
import NewsDetail from "./pages/NewsDetail";
import CryptoMarkets from "./pages/CryptoMarkets";
import UploadPaymentProof from "./pages/UploadPaymentProof";
import ReferralLanding from "./pages/ReferralLanding";
import TestTradeCompletion from "./pages/TestTradeCompletion";
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
            
          <Route path="/buy-crypto-merchant-selection" element={<BuyCryptoMerchantSelection />} />
          <Route path="/buy-crypto-match" element={<BuyCryptoMatch />} />
          {/* Removed buy-crypto-searching route - not needed */}
          
            <Route path="/buy-crypto-waiting" element={<BuyCryptoWaiting />} />
            <Route path="/buy-crypto-success" element={<BuyCryptoSuccess />} />
            <Route path="/buy-crypto-cancel" element={<BuyCryptoCancel />} />
            <Route path="/buy-crypto-dispute" element={<BuyCryptoDispute />} />

        <Route path="/merchant-matching-choice" element={<MerchantMatchingChoice />} />
        <Route path="/incoming-trade-requests" element={<IncomingTradeRequests />} />
        <Route path="/trade-notifications" element={<TradeRequestNotifications />} />
        <Route path="/sell-crypto-trade-request-details" element={<SellCryptoTradeRequestDetails />} />
            <Route path="/auto-merchant-match" element={<AutoMerchantMatch />} />
            <Route path="/merchant-list" element={<MerchantList />} />
            <Route path="/select-coin" element={<SelectCoin />} />
            <Route path="/my-trades" element={<MyTrades />} />
            <Route path="/news" element={<CryptoNews />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/crypto-markets" element={<CryptoMarkets />} />
          <Route path="/upload-payment-proof/:tradeId" element={<UploadPaymentProof />} />

            <Route path="/buy-crypto-payment-step1" element={<BuyCryptoPaymentStep1 />} />
            <Route path="/buy-crypto-payment-step2" element={<BuyCryptoPaymentStep2 />} />
            <Route path="/buy-crypto-payment-step3" element={<BuyCryptoPaymentStep3 />} />
            <Route path="/sell-crypto-payment-step1" element={<SellCryptoPaymentStep1 />} />
            <Route path="/sell-crypto-payment-step2" element={<SellCryptoPaymentStep2 />} />
            <Route path="/sell-crypto-payment-step3" element={<SellCryptoPaymentStep3 />} />
            <Route path="/trade-status" element={<TradeStatus />} />

            <Route path="/trade-details/:tradeId" element={<TradeDetails />} />
            <Route path="/sell-crypto" element={<SellCrypto />} />
            <Route path="/sell-crypto-merchant-selection" element={<SellCryptoMerchantSelection />} />
            <Route path="/sell-crypto-escrow" element={<SellCryptoEscrow />} />
            <Route path="/sell-crypto-waiting" element={<SellCryptoWaiting />} />
            <Route path="/sell-crypto-completed" element={<SellCryptoCompleted />} />
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

            <Route path="/sell-for-cash" element={<SellForCash />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/currency-conversion" element={<CurrencyConversion />} />
            <Route path="/trending-coins" element={<TrendingCoins />} />
            {/* Removed demo chat/news routes - not needed */}
            <Route path="/coin-detail/:coinId" element={<CoinDetailPage />} />
            <Route path="/create-trade-request" element={<CreateTradeRequest />} />
            <Route path="/user-profile/:userId" element={<UserProfile />} />
            
            <Route path="/sell-crypto-bank-transfer" element={<SellCryptoBankTransfer />} />
            <Route path="/sell-crypto-cash-pickup" element={<SellCryptoCashPickup />} />
            <Route path="/sell-crypto-cash-delivery" element={<SellCryptoCashDelivery />} />
            <Route path="/cash-pickup-confirmation" element={<CashPickupConfirmation />} />
            <Route path="/cash-delivery-confirmation" element={<CashDeliveryConfirmation />} />
            <Route path="/send-naira-get-usd" element={<SendNairaGetUSD />} />
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
        {/* Removed blog detail route - not needed */}
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/escrow-flow" element={<EscrowFlow />} />
        <Route path="/escrow-flow/:tradeId" element={<EscrowTradeFlow />} />
        <Route path="/cash-escrow-flow" element={<CashEscrowFlow />} />

        {/* Vendor Routes */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/dashboard" element={
          <VendorAuthGuard>
            <SimpleVendorDashboard />
          </VendorAuthGuard>
        } />
        <Route path="/vendor/profile" element={
          <VendorAuthGuard>
            <VendorProfile />
          </VendorAuthGuard>
        } />
        <Route path="/vendor/messages" element={
          <VendorAuthGuard>
            <VendorMessages />
          </VendorAuthGuard>
        } />
        <Route path="/vendor/notifications" element={
          <VendorAuthGuard>
            <SimpleVendorDashboard />
          </VendorAuthGuard>
        } />
        <Route path="/vendor/settings" element={
          <VendorAuthGuard>
            <VendorProfile />
          </VendorAuthGuard>
        } />

        {/* Credits Routes */}
        <Route path="/credits/purchase" element={<CreditsPurchase />} />
        <Route path="/credits-history" element={<CreditsHistory />} />
        <Route path="/admin/credits" element={<AdminCredits />} />
        <Route path="/test-credits" element={<TestCredits />} />

        {/* Cash Services Routes */}
        <Route path="/vendor-bank-details/:jobId?" element={<VendorBankDetails />} />
        <Route path="/send-naira-payment-step" element={<SendNairaPaymentStep />} />
        <Route path="/credits-purchase" element={<CreditsPurchase />} />
        <Route path="/vendor/cash-order/:jobId" element={<VendorCashOrderDetails />} />
        <Route path="/vendor/payment-confirmation/:orderId" element={
          <VendorAuthGuard>
            <VendorPaymentConfirmation />
          </VendorAuthGuard>
        } />
        <Route path="/vendor/transactions" element={
          <VendorAuthGuard>
            <VendorTransactions />
          </VendorAuthGuard>
        } />
        {/* Removed demo/test routes - not needed */}
            {/* Referral Route */}
            <Route path="/refer/:userId" element={<ReferralLanding />} />
            
            {/* Test Route for debugging trade completion */}
            <Route path="/test-trade-completion" element={<TestTradeCompletion />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>

    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
        <div className="light" style={{ colorScheme: 'light' }}>
          <AuthProvider>
              <QuickAuthProvider>
                <TooltipProvider>
                  <AppContent />
                  <Toaster />
                  <Sonner />
                </TooltipProvider>
              </QuickAuthProvider>
          </AuthProvider>
        </div>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
