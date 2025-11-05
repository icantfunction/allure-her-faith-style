import React from "react";
import { AdminAPI } from "../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Palette, Save, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Config() {
  const [primary, setPrimary] = React.useState("#3948AB");
  const [accent, setAccent] = React.useState("#FDB924");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const { toast } = useToast();

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await AdminAPI.updateTheme({ primary, accent });
      setSaved(true);
      toast({
        title: "Success!",
        description: "Theme colors updated successfully",
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update theme",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

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
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground">Site Configuration</h1>
            <p className="text-muted-foreground text-sm">Customize your store's appearance</p>
          </div>
        </div>
      </motion.div>

        {/* Theme Configuration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border shadow-luxury">
            <CardHeader>
              <CardTitle className="font-heading">Brand Colors</CardTitle>
              <CardDescription>Update your primary and accent colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Color */}
                <div className="space-y-3">
                  <Label htmlFor="primary" className="text-sm font-medium">
                    Primary Color
                  </Label>
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-border shadow-sm transition-all hover:scale-105"
                      style={{ backgroundColor: primary }}
                    />
                    <Input
                      id="primary"
                      type="color"
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={primary}
                      onChange={(e) => setPrimary(e.target.value)}
                      className="h-12 font-mono text-sm"
                      placeholder="#3948AB"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for buttons, links, and primary UI elements
                  </p>
                </div>

                {/* Accent Color */}
                <div className="space-y-3">
                  <Label htmlFor="accent" className="text-sm font-medium">
                    Accent Color
                  </Label>
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-border shadow-sm transition-all hover:scale-105"
                      style={{ backgroundColor: accent }}
                    />
                    <Input
                      id="accent"
                      type="color"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="h-12 font-mono text-sm"
                      placeholder="#FDB924"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for highlights, badges, and special elements
                  </p>
                </div>
              </div>

              {/* Preview Section */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-sm font-medium mb-4">Preview</h3>
                <div className="flex gap-3 flex-wrap">
                  <button
                    className="px-6 py-2 rounded-lg font-medium text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: primary }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-6 py-2 rounded-lg font-medium text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: accent }}
                  >
                    Accent Button
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={save}
                  disabled={saving}
                  className="min-w-[140px] bg-primary hover:bg-primary-dark text-primary-foreground"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
      </motion.div>
    </div>
  );
}
