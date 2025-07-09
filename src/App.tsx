
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
            <Route path="/merchant-selection" element={<MerchantSelection />} />
            <Route path="/merchant-list" element={<MerchantList />} />
            <Route path="/select-coin" element={<SelectCoin />} />
            <Route path="/my-trades" element={<MyTrades />} />
            <Route path="/trade-history" element={<TradeHistory />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/trade-details" element={<TradeDetails />} />
            <Route path="/sell-crypto" element={<SellCrypto />} />
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
