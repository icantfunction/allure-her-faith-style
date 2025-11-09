import React from "react";
import { motion } from "framer-motion";
import { Mail, Users, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";
import {
  adminListSubscribers,
  adminListEmailCampaigns,
  type Subscriber,
  type Campaign,
} from "@/api/allureherApi";
import CampaignComposer from "@/components/admin/CampaignComposer";

export default function EmailManagement() {
  const { toast } = useToast();
  const { idToken } = useAuth();
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = React.useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [composerOpen, setComposerOpen] = React.useState(false);

  const loadSubscribers = async () => {
    try {
      setLoadingSubscribers(true);
      const data = await adminListSubscribers();
      setSubscribers(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading subscribers",
        description: error.message || "Failed to load subscribers",
        variant: "destructive",
      });
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const data = await adminListEmailCampaigns();
      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading campaigns",
        description: error.message || "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  React.useEffect(() => {
    if (idToken) {
      loadSubscribers();
      loadCampaigns();
    }
  }, [idToken]);

  const activeSubscribers = subscribers.filter((s) => s.status === "subscribed");
  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCampaignSuccess = () => {
    setComposerOpen(false);
    loadCampaigns();
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
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground">Email & Subscribers</h1>
            <p className="text-muted-foreground text-sm">Manage your email campaigns and subscriber list</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <Card className="border-border shadow-luxury">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{subscribers.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-luxury">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeSubscribers.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-luxury">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campaigns Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{campaigns.length}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs defaultValue="subscribers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscribers" className="gap-2">
              <Users className="h-4 w-4" />
              Subscribers
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Send className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
          </TabsList>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers">
            <Card className="border-border shadow-luxury">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-heading">Subscriber List</CardTitle>
                    <CardDescription>
                      {filteredSubscribers.length} subscriber(s) found
                    </CardDescription>
                  </div>
                  <Input
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loadingSubscribers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSubscribers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>
                      {searchTerm
                        ? "No subscribers found matching your search."
                        : "No subscribers yet. They'll appear here when someone signs up."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Subscribed At</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscribers.map((subscriber) => (
                          <TableRow key={subscriber.email}>
                            <TableCell className="font-medium">{subscriber.email}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                {subscriber.source || "unknown"}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {subscriber.subscribedAt
                                ? new Date(subscriber.subscribedAt).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                  subscriber.status === "subscribed"
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                                }`}
                              >
                                {subscriber.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card className="border-border shadow-luxury">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-heading">Campaign History</CardTitle>
                    <CardDescription>{campaigns.length} campaign(s) sent</CardDescription>
                  </div>
                  <Button onClick={() => setComposerOpen(true)} className="gap-2">
                    <Send className="h-4 w-4" />
                    Create Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCampaigns ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="mb-4">No campaigns sent yet.</p>
                    <Button onClick={() => setComposerOpen(true)} variant="outline">
                      Send Your First Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead className="text-right">Total Recipients</TableHead>
                          <TableHead className="text-right">Success</TableHead>
                          <TableHead className="text-right">Failed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map((campaign) => (
                          <TableRow key={campaign.campaignId}>
                            <TableCell className="font-medium">{campaign.subject}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(campaign.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {campaign.stats?.totalRecipients ?? "-"}
                            </TableCell>
                            <TableCell className="text-right text-green-600 dark:text-green-400">
                              {campaign.stats?.successCount ?? "-"}
                            </TableCell>
                            <TableCell className="text-right text-red-600 dark:text-red-400">
                              {campaign.stats?.failedCount ?? "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      <CampaignComposer open={composerOpen} onOpenChange={setComposerOpen} onSuccess={handleCampaignSuccess} />
    </div>
  );
}
