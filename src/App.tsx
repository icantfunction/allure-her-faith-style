import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminHome from "./pages/admin/Home";
import AdminCallback from "./pages/admin/Callback";
import AdminProducts from "./pages/admin/Products";
import AdminConfig from "./pages/admin/Config";
import AdminAnalytics from "./pages/admin/Analytics";
import { usePageVisitor } from "@/hooks/usePageVisitor";

const queryClient = new QueryClient();

const AppContent = () => {
  usePageVisitor();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/admin" element={<AdminHome />} />
      <Route path="/admin/callback" element={<AdminCallback />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/config" element={<AdminConfig />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
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
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
