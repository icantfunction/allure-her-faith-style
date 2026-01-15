import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import ProductDetail from "./pages/ProductDetail";
import AllProducts from "./pages/AllProducts";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import AdminHome from "./pages/admin/Home";
import AdminLogin from "./pages/admin/Login";
import ForgotPassword from "./pages/admin/ForgotPassword";
import ResetPassword from "./pages/admin/ResetPassword";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminConfig from "./pages/admin/Config";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminEmailManagement from "./pages/admin/EmailManagement";
import AdminAmbassadors from "./pages/admin/Ambassadors";
import AdminLayout from "@/components/admin/AdminLayout";
import { AuthProvider } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import { usePageVisitor } from "@/hooks/usePageVisitor";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { CartProvider } from "@/contexts/CartContext";

const queryClient = new QueryClient();

const AppContent = () => {
  usePageVisitor();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/product/:productId" element={<ProductDetail />} />
      <Route path="/products" element={<AllProducts />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/checkout/return" element={<CheckoutSuccess />} />
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot" element={<ForgotPassword />} />
      <Route path="/admin/reset" element={<ResetPassword />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout><AdminHome /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/emails" element={<ProtectedRoute><AdminLayout><AdminEmailManagement /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/ambassadors" element={<ProtectedRoute><AdminLayout><AdminAmbassadors /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/config" element={<ProtectedRoute><AdminLayout><AdminConfig /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute><AdminLayout><AdminAnalytics /></AdminLayout></ProtectedRoute>} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SiteConfigProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </SiteConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
