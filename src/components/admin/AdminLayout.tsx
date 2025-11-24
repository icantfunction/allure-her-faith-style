import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  Palette,
  BarChart3,
  Mail,
  Users,
  LogOut,
  Menu,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Orders", url: "/admin/orders", icon: Package },
  { title: "Products", url: "/admin/products", icon: ShoppingBag },
  { title: "Email & Subscribers", url: "/admin/emails", icon: Mail },
  { title: "Ambassadors", url: "/admin/ambassadors", icon: Users },
  { title: "Site Config", url: "/admin/config", icon: Palette },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="Logo" className="h-8 w-8" />
              <div>
                <h1 className="text-lg font-heading font-semibold">Admin Portal</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Management Dashboard</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={signOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Backdrop */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 top-16 bg-background/80 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: isMobile ? -256 : 0, opacity: isMobile ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? -256 : 0, opacity: isMobile ? 0 : 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`${
                isMobile ? "fixed left-0 top-16 z-50" : "sticky top-16"
              } h-[calc(100vh-4rem)] w-64 overflow-hidden border-r bg-card`}
            >
              <nav className="space-y-2 p-4">
                {navItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <Link
                      key={item.url}
                      to={item.url}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-accent ${
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="whitespace-nowrap">{item.title}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <div className="mt-8 border-t p-4">
                <p className="mb-3 text-xs font-medium text-muted-foreground">QUICK ACTIONS</p>
                <div className="space-y-2">
                  <Link
                    to="/"
                    className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                  >
                    View Site →
                  </Link>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
