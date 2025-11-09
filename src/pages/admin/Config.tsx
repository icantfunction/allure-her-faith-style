import React from "react";
import { AdminAPI } from "../../lib/api";
import { getPublicConfig, adminUpdateConfig } from "@/api/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Palette, Save, CheckCircle2, Bell, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Config() {
  // Theme colors
  const [primary, setPrimary] = React.useState("#3948AB");
  const [accent, setAccent] = React.useState("#FDB924");
  
  // Popup config
  const [popupEnabled, setPopupEnabled] = React.useState(false);
  const [popupTitle, setPopupTitle] = React.useState("Wait! Don't Miss Out 🌟");
  const [popupMessage, setPopupMessage] = React.useState("Join our exclusive Insider's List and be the first to discover where faith meets fashion.");
  const [popupCtaText, setPopupCtaText] = React.useState("Join Now");
  const [popupCtaUrl, setPopupCtaUrl] = React.useState("/#email-signup");
  const [popupDelaySeconds, setPopupDelaySeconds] = React.useState(15);
  
  // Banner config
  const [bannerEnabled, setBannerEnabled] = React.useState(false);
  const [bannerText, setBannerText] = React.useState("Up to 15% OFF • USE CODE: DINA");
  const [bannerDiscountCode, setBannerDiscountCode] = React.useState("DINA");
  const [bannerLinkUrl, setBannerLinkUrl] = React.useState("#");
  const [bannerBackgroundColor, setBannerBackgroundColor] = React.useState("#000000");
  const [bannerTextColor, setBannerTextColor] = React.useState("#ffffff");
  
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  // Load current config on mount
  React.useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getPublicConfig();
        
        if (config.theme) {
          if (config.theme.primary) setPrimary(config.theme.primary);
          if (config.theme.accent) setAccent(config.theme.accent);
        }
        
        if (config.popup) {
          setPopupEnabled(config.popup.enabled || false);
          setPopupTitle(config.popup.title || "Wait! Don't Miss Out 🌟");
          setPopupMessage(config.popup.message || "Join our exclusive Insider's List and be the first to discover where faith meets fashion.");
          setPopupCtaText(config.popup.ctaText || "Join Now");
          setPopupCtaUrl(config.popup.ctaUrl || "/#email-signup");
          setPopupDelaySeconds(config.popup.delaySeconds || 15);
        }
        
        if (config.banner) {
          setBannerEnabled(config.banner.enabled || false);
          setBannerText(config.banner.text || "Up to 15% OFF • USE CODE: DINA");
          setBannerDiscountCode(config.banner.discountCode || "DINA");
          setBannerLinkUrl(config.banner.linkUrl || "#");
          setBannerBackgroundColor(config.banner.backgroundColor || "#000000");
          setBannerTextColor(config.banner.textColor || "#ffffff");
        }
      } catch (error) {
        console.error("Failed to load config:", error);
        toast({
          title: "Error",
          description: "Failed to load current configuration",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadConfig();
  }, [toast]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await adminUpdateConfig({
        theme: { primary, accent },
        popup: {
          enabled: popupEnabled,
          title: popupTitle,
          message: popupMessage,
          ctaText: popupCtaText,
          ctaUrl: popupCtaUrl,
          delaySeconds: popupDelaySeconds,
        },
        banner: {
          enabled: bannerEnabled,
          text: bannerText,
          discountCode: bannerDiscountCode,
          linkUrl: bannerLinkUrl,
          backgroundColor: bannerBackgroundColor,
          textColor: bannerTextColor,
        },
      });
      
      setSaved(true);
      toast({
        title: "Success!",
        description: "Site configuration updated successfully",
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
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

      {/* Promo Banner Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border shadow-luxury">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="font-heading">Promo Banner</CardTitle>
            </div>
            <CardDescription>Configure the scrolling promotional banner at the top of your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="banner-enabled" className="text-sm font-medium">
                Enable Banner
              </Label>
              <Switch
                id="banner-enabled"
                checked={bannerEnabled}
                onCheckedChange={setBannerEnabled}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="banner-text">Banner Text</Label>
                <Input
                  id="banner-text"
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  placeholder="Up to 15% OFF • USE CODE: DINA"
                  disabled={!bannerEnabled}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-code">Discount Code</Label>
                  <Input
                    id="banner-code"
                    value={bannerDiscountCode}
                    onChange={(e) => setBannerDiscountCode(e.target.value)}
                    placeholder="DINA"
                    disabled={!bannerEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-link">Link URL</Label>
                  <Input
                    id="banner-link"
                    value={bannerLinkUrl}
                    onChange={(e) => setBannerLinkUrl(e.target.value)}
                    placeholder="#"
                    disabled={!bannerEnabled}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-bg">Background Color</Label>
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-border"
                      style={{ backgroundColor: bannerBackgroundColor }}
                    />
                    <Input
                      id="banner-bg"
                      type="color"
                      value={bannerBackgroundColor}
                      onChange={(e) => setBannerBackgroundColor(e.target.value)}
                      disabled={!bannerEnabled}
                      className="cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={bannerBackgroundColor}
                      onChange={(e) => setBannerBackgroundColor(e.target.value)}
                      disabled={!bannerEnabled}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-text-color">Text Color</Label>
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-border"
                      style={{ backgroundColor: bannerTextColor }}
                    />
                    <Input
                      id="banner-text-color"
                      type="color"
                      value={bannerTextColor}
                      onChange={(e) => setBannerTextColor(e.target.value)}
                      disabled={!bannerEnabled}
                      className="cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={bannerTextColor}
                      onChange={(e) => setBannerTextColor(e.target.value)}
                      disabled={!bannerEnabled}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Preview */}
            {bannerEnabled && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-3">Preview</h3>
                <div 
                  className="py-2 px-4 rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: bannerBackgroundColor,
                    color: bannerTextColor,
                  }}
                >
                  <div className="text-sm font-medium text-center">
                    {bannerText}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Popup Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border shadow-luxury">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="font-heading">Email Signup Popup</CardTitle>
            </div>
            <CardDescription>Configure the popup that appears to encourage email signups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="popup-enabled" className="text-sm font-medium">
                Enable Popup
              </Label>
              <Switch
                id="popup-enabled"
                checked={popupEnabled}
                onCheckedChange={setPopupEnabled}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="popup-title">Popup Title</Label>
                <Input
                  id="popup-title"
                  value={popupTitle}
                  onChange={(e) => setPopupTitle(e.target.value)}
                  placeholder="Wait! Don't Miss Out 🌟"
                  disabled={!popupEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-message">Popup Message</Label>
                <Textarea
                  id="popup-message"
                  value={popupMessage}
                  onChange={(e) => setPopupMessage(e.target.value)}
                  placeholder="Join our exclusive Insider's List..."
                  disabled={!popupEnabled}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="popup-cta">CTA Button Text</Label>
                  <Input
                    id="popup-cta"
                    value={popupCtaText}
                    onChange={(e) => setPopupCtaText(e.target.value)}
                    placeholder="Join Now"
                    disabled={!popupEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="popup-url">CTA URL</Label>
                  <Input
                    id="popup-url"
                    value={popupCtaUrl}
                    onChange={(e) => setPopupCtaUrl(e.target.value)}
                    placeholder="/#email-signup"
                    disabled={!popupEnabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-delay">Delay (seconds)</Label>
                <Input
                  id="popup-delay"
                  type="number"
                  value={popupDelaySeconds}
                  onChange={(e) => setPopupDelaySeconds(Number(e.target.value))}
                  min="0"
                  max="300"
                  disabled={!popupEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Time to wait before showing the popup to visitors
                </p>
              </div>
            </div>

            {/* Popup Preview */}
            {popupEnabled && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-3">Preview</h3>
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h2 className="text-xl font-semibold mb-2">{popupTitle}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{popupMessage}</p>
                  <Button className="w-full">{popupCtaText}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex justify-end"
      >
        <Button
          onClick={save}
          disabled={saving}
          size="lg"
          className="min-w-[160px]"
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
              Save All Changes
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
