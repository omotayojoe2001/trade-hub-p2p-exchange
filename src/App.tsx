
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Coins from "./pages/Coins";
import BuySell from "./pages/BuySell";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Premium from "./pages/Premium";
import MerchantSelection from "./pages/MerchantSelection";
import MerchantList from "./pages/MerchantList";
import SelectCoin from "./pages/SelectCoin";
import MyTrades from "./pages/MyTrades";
import TradeHistory from "./pages/TradeHistory";
import PaymentStatus from "./pages/PaymentStatus";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
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
            <Route path="/coin/:coinId" element={<CoinDetail />} />
            <Route path="/buy-crypto" element={<BuyCrypto />} />
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
            <Route path="/trade-history" element={<TradeHistory />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/trade-details" element={<TradeDetails />} />
            <Route path="/sell-crypto" element={<SellCrypto />} />
            <Route path="/sell-crypto-match" element={<SellCryptoMatch />} />
            <Route path="/sell-crypto-waiting" element={<SellCryptoWaiting />} />
            <Route path="/sell-crypto-confirm-receipt" element={<SellCryptoConfirmReceipt />} />
            <Route path="/sell-crypto-cancel" element={<SellCryptoCancel />} />
            <Route path="/sell-crypto-dispute" element={<SellCryptoDispute />} />
            <Route path="/trade-completed" element={<TradeCompleted />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
