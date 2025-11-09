import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Eye, BarChart3 } from "lucide-react";

function iso(d: Date) { return d.toISOString().slice(0, 10); }

export default function Analytics() {
  const [rows, setRows] = React.useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const end = new Date();
        const start = new Date(Date.now() - 7 * 24 * 3600 * 1000);
        
        // Query page_visitors table from Lovable Cloud
        const { data, error } = await supabase
          .from('page_visitors')
          .select('visited_at')
          .gte('visited_at', start.toISOString())
          .lte('visited_at', end.toISOString());
        
        if (error) throw error;
        
        // Group visits by date and count
        const dailyCounts: Record<string, number> = {};
        
        data?.forEach((row) => {
          const date = new Date(row.visited_at).toISOString().slice(0, 10);
          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        
        // Convert to array format expected by chart
        const formattedRows = Object.entries(dailyCounts)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        setRows(formattedRows);
      } catch (error) {
        console.error('Error fetching analytics from Lovable Cloud:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  const totalVisits = rows.reduce((sum, r) => sum + r.count, 0);
  const avgVisits = rows.length > 0 ? Math.round(totalVisits / rows.length) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm">Last 7 days performance metrics</p>
          </div>
        </div>
      </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div variants={itemVariants}>
                <Card className="border-border shadow-elegant hover:shadow-luxury transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Visits
                    </CardTitle>
                    <Eye className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{totalVisits}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Past 7 days
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-border shadow-elegant hover:shadow-luxury transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Daily
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{avgVisits}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visits per day
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-border shadow-elegant hover:shadow-luxury transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Date Range
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">7</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Days tracked
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Chart */}
            <motion.div variants={itemVariants}>
              <Card className="border-border shadow-luxury">
                <CardHeader>
                  <CardTitle className="font-heading">Visitor Traffic</CardTitle>
                  <CardDescription>Daily visitor count for the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rows} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--primary))", r: 6 }}
                          activeDot={{ r: 8, fill: "hsl(var(--primary))" }}
                          animationBegin={0}
                          animationDuration={800}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Table */}
            <motion.div variants={itemVariants}>
              <Card className="border-border shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-heading">Detailed Breakdown</CardTitle>
                  <CardDescription>View daily statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Visits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <motion.tr
                            key={r.date}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.3 }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm text-foreground font-medium">{r.date}</td>
                            <td className="py-3 px-4 text-sm text-foreground text-right font-semibold">{r.count}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
