import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Palette, BarChart3, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const quickStats = [
  {
    title: "Products",
    description: "Manage your inventory",
    icon: ShoppingBag,
    href: "/admin/products",
    color: "text-blue-500",
  },
  {
    title: "Site Config",
    description: "Customize appearance",
    icon: Palette,
    href: "/admin/config",
    color: "text-purple-500",
  },
  {
    title: "Analytics",
    description: "View performance",
    icon: BarChart3,
    href: "/admin/analytics",
    color: "text-green-500",
  },
];

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-heading font-semibold text-foreground mb-2">
          Welcome Back!
        </h1>
        <p className="text-muted-foreground">
          Manage your store and monitor performance from this dashboard
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickStats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <Link to={stat.href}>
              <Card className="group cursor-pointer border-border shadow-luxury transition-all hover:shadow-xl hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    <TrendingUp className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="font-heading mt-4">{stat.title}</CardTitle>
                  <CardDescription>{stat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-primary font-medium group-hover:underline">
                    Manage →
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
