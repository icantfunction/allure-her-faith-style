import React from "react";
import { AdminAPI } from "../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Eye, BarChart3, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function iso(d: Date) { return d.toISOString().slice(0, 10); }

export default function Analytics() {
  const [rows, setRows] = React.useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const end = new Date();
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    AdminAPI.dailyAnalytics(iso(start), iso(end))
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalVisits = rows.reduce((sum, r) => sum + r.count, 0);
  const avgVisits = rows.length > 0 ? Math.round(totalVisits / rows.length) : 0;

  const exportAnalyticsCSV = (data: { date: string; count: number }[]) => {
    const csvData = data.map(row => ({
      Date: row.date,
      'Page Visits': row.count
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportAnalyticsPDF = (data: { date: string; count: number }[], totalVisits: number, avgVisits: number) => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(18);
    doc.text('Analytics Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    // Add summary stats
    doc.setFontSize(12);
    doc.text('Summary (Last 7 Days)', 14, 40);
    doc.setFontSize(10);
    doc.text(`Total Visits: ${totalVisits}`, 14, 48);
    doc.text(`Average Daily Visits: ${avgVisits}`, 14, 54);
    
    // Add data table
    autoTable(doc, {
      startY: 65,
      head: [['Date', 'Page Visits']],
      body: data.map(row => [row.date, row.count.toString()]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [57, 72, 171] }
    });
    
    doc.save(`analytics_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-semibold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground text-sm">Last 7 days performance metrics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportAnalyticsCSV(rows)}
              disabled={loading || rows.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportAnalyticsPDF(rows, totalVisits, avgVisits)}
              disabled={loading || rows.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
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
