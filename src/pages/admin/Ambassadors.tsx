import React from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";
import {
  adminListAmbassadors,
  adminCreateAmbassador,
  type Ambassador,
} from "@/api/ambassadors";

export default function Ambassadors() {
  const { toast } = useToast();
  const { idToken } = useAuth();
  const [ambassadors, setAmbassadors] = React.useState<Ambassador[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [note, setNote] = React.useState("");

  const loadAmbassadors = async () => {
    try {
      setLoading(true);
      const data = await adminListAmbassadors();
      setAmbassadors(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading ambassadors",
        description: error.message || "Failed to load ambassadors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (idToken) {
      loadAmbassadors();
    }
  }, [idToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim() || !name.trim()) {
      toast({
        title: "Missing fields",
        description: "Code and name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      await adminCreateAmbassador({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        note: note.trim(),
      });

      toast({
        title: "Ambassador created",
        description: `${code.toUpperCase()} has been added successfully`,
      });

      setCode("");
      setName("");
      setNote("");
      await loadAmbassadors();
    } catch (error: any) {
      toast({
        title: "Error creating ambassador",
        description: error.message || "Failed to create ambassador",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const totalVisits = ambassadors.reduce((sum, a) => sum + (a.stats?.visitCount ?? 0), 0);
  const activeCount = ambassadors.filter(a => a.active).length;

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
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground">Ambassadors</h1>
            <p className="text-muted-foreground text-sm">Track referral codes and ambassador performance</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ambassadors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{ambassadors.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-luxury">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Ambassadors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-luxury">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalVisits}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border shadow-luxury">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <CardTitle className="font-heading">Create New Ambassador</CardTitle>
            </div>
            <CardDescription>Add a new referral code for tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="TIKTOK-ALYSSA"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Alyssa TikTok"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Launch campaign, Q4 2025"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Ambassador
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ambassadors List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border shadow-luxury">
          <CardHeader>
            <CardTitle className="font-heading">Ambassador List</CardTitle>
            <CardDescription>{ambassadors.length} ambassador(s) registered</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ambassadors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No ambassadors yet. Create your first referral code above.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ambassadors.map((ambassador) => (
                      <TableRow key={ambassador.code}>
                        <TableCell className="font-mono font-semibold">
                          {ambassador.code}
                        </TableCell>
                        <TableCell className="font-medium">{ambassador.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                          {ambassador.note || "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {ambassador.stats?.visitCount ?? 0}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ambassador.stats?.lastVisitAt
                            ? new Date(ambassador.stats.lastVisitAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              ambassador.active
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {ambassador.active ? "Active" : "Inactive"}
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
      </motion.div>
    </div>
  );
}
