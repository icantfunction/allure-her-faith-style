import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisitorStats {
  totalViews: number;
  uniqueVisitors: number;
  topPages: Array<{ page_path: string; count: number }>;
  hourlyBreakdown: Array<{ hour: number; count: number }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting visitor report generation...");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the recipient email from config
    const { data: config, error: configError } = await supabase
      .from("visitor_report_config")
      .select("recipient_email")
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      console.error("Error fetching config:", configError);
      throw new Error("No active email configuration found");
    }

    console.log("Sending report to:", config.recipient_email);

    // Calculate date range (last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get visitor data
    const { data: visitors, error: visitorsError } = await supabase
      .from("page_visitors")
      .select("*")
      .gte("visited_at", yesterday.toISOString())
      .lte("visited_at", now.toISOString());

    if (visitorsError) {
      console.error("Error fetching visitors:", visitorsError);
      throw visitorsError;
    }

    console.log(`Found ${visitors?.length || 0} visits in the last 24 hours`);

    // Calculate statistics
    const stats: VisitorStats = {
      totalViews: visitors?.length || 0,
      uniqueVisitors: new Set(visitors?.map((v) => v.session_id) || []).size,
      topPages: [],
      hourlyBreakdown: [],
    };

    // Calculate top pages
    if (visitors && visitors.length > 0) {
      const pageCounts = visitors.reduce((acc, visit) => {
        acc[visit.page_path] = (acc[visit.page_path] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      stats.topPages = Object.entries(pageCounts)
        .map(([page_path, count]) => ({ page_path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate hourly breakdown
      const hourlyCounts = visitors.reduce((acc, visit) => {
        const hour = new Date(visit.visited_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      stats.hourlyBreakdown = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourlyCounts[i] || 0,
      }));
    }

    // Generate email HTML
    const emailHtml = generateEmailHtml(stats, yesterday, now);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Visitor Reports <onboarding@resend.dev>",
      to: [config.recipient_email],
      subject: `Daily Visitor Report - ${now.toLocaleDateString()}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        stats,
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-visitor-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailHtml(stats: VisitorStats, startDate: Date, endDate: Date): string {
  const topPagesHtml = stats.topPages.length > 0
    ? stats.topPages
        .map(
          (page) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${page.page_path}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151; font-weight: 600;">${page.count}</td>
          </tr>
        `
        )
        .join("")
    : '<tr><td colspan="2" style="padding: 12px; text-align: center; color: #9ca3af;">No page visits recorded</td></tr>';

  const peakHour = stats.hourlyBreakdown.reduce((max, curr) => 
    curr.count > max.count ? curr : max, 
    { hour: 0, count: 0 }
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Visitor Report</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Daily Visitor Report</h1>
            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
              ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
            </p>
          </div>

          <!-- Stats Cards -->
          <div style="background: white; padding: 30px 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="color: #16a34a; font-size: 36px; font-weight: 700;">${stats.totalViews}</div>
                <div style="color: #15803d; font-size: 14px; margin-top: 5px;">Total Page Views</div>
              </div>
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="color: #2563eb; font-size: 36px; font-weight: 700;">${stats.uniqueVisitors}</div>
                <div style="color: #1d4ed8; font-size: 14px; margin-top: 5px;">Unique Visitors</div>
              </div>
            </div>

            <!-- Peak Hour -->
            ${stats.totalViews > 0 ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
              <div style="color: #92400e; font-size: 14px;">
                <strong>Peak Hour:</strong> ${peakHour.hour}:00 - ${peakHour.hour + 1}:00 (${peakHour.count} visits)
              </div>
            </div>
            ` : ''}

            <!-- Top Pages -->
            <div style="margin-top: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">Most Visited Pages</h2>
              <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; font-size: 14px;">Page Path</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600; font-size: 14px;">Views</th>
                  </tr>
                </thead>
                <tbody>
                  ${topPagesHtml}
                </tbody>
              </table>
            </div>

            <!-- Summary -->
            ${stats.totalViews > 0 ? `
            <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 16px;">Quick Summary</h3>
              <ul style="margin: 0; padding-left: 20px; color: #6b7280; line-height: 1.8;">
                <li>Average pages per visitor: <strong>${(stats.totalViews / Math.max(stats.uniqueVisitors, 1)).toFixed(1)}</strong></li>
                <li>Most popular page: <strong>${stats.topPages[0]?.page_path || 'N/A'}</strong></li>
                <li>Total unique sessions: <strong>${stats.uniqueVisitors}</strong></li>
              </ul>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              This is an automated report generated by your visitor tracking system.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
