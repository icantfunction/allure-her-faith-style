import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getPublicConfig, SiteConfigResponse, PopupConfig, BannerConfig, ShopConfig } from "@/api/config";

interface SiteConfigContextValue {
  config: SiteConfigResponse | null;
  loading: boolean;
  error: Error | null;
  refreshConfig: () => Promise<void>;
  popup: PopupConfig;
  banner: BannerConfig;
  shop: ShopConfig;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

// Default configs if API fails or returns nothing
const DEFAULT_POPUP: PopupConfig = {
  enabled: false,
  title: "Wait! Don't Miss Out 🌟",
  message: "Join our exclusive Insider's List and be the first to discover where faith meets fashion.",
  ctaText: "Join Now",
  ctaUrl: "/#email-signup",
  delaySeconds: 15,
};

const DEFAULT_BANNER: BannerConfig = {
  enabled: false,
  text: "Up to 15% OFF • USE CODE: DINA",
  discountCode: "DINA",
  linkUrl: "#",
  backgroundColor: "#000000",
  textColor: "#ffffff",
};

const DEFAULT_SHOP: ShopConfig = {
  showViewAllButton: true,
  showShopSection: true,
};

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicConfig();
      setConfig(data);
    } catch (err) {
      // Silently fail and use default config when API is unavailable
      setError(err as Error);
      // Set default config on error
      setConfig({
        siteId: "my-site",
        popup: DEFAULT_POPUP,
        banner: DEFAULT_BANNER,
        shop: DEFAULT_SHOP,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const refreshConfig = async () => {
    await loadConfig();
  };

  const popup = config?.popups || config?.popup || DEFAULT_POPUP;
  const getFlatBanner = (source?: Record<string, unknown>) => {
    if (!source) return null;
    const enabled = (source as Record<string, unknown>).bannerEnabled;
    const textValue = (source as Record<string, unknown>).bannerText;
    const discountCode = (source as Record<string, unknown>).bannerDiscountCode;
    const linkUrl = (source as Record<string, unknown>).bannerLinkUrl;
    const backgroundColor = (source as Record<string, unknown>).bannerBackgroundColor;
    const textColor = (source as Record<string, unknown>).bannerTextColor;
    const hasAny = [enabled, textValue, discountCode, linkUrl, backgroundColor, textColor].some(
      (value) => value !== undefined && value !== null && value !== ""
    );
    if (!hasAny) return null;
    return {
      enabled: typeof enabled === "boolean" ? enabled : undefined,
      text: typeof textValue === "string" ? textValue : undefined,
      discountCode: typeof discountCode === "string" ? discountCode : undefined,
      linkUrl: typeof linkUrl === "string" ? linkUrl : undefined,
      backgroundColor: typeof backgroundColor === "string" ? backgroundColor : undefined,
      textColor: typeof textColor === "string" ? textColor : undefined,
    } as BannerConfig;
  };
  const hasBannerValues = (banner?: Record<string, unknown>) => {
    if (!banner) return false;
    return ["enabled", "text", "discountCode", "linkUrl", "backgroundColor", "textColor"].some(
      (key) => {
        const value = (banner as Record<string, unknown>)[key];
        return value !== undefined && value !== null && value !== "";
      }
    );
  };
  const bannerCandidate = [
    (config as any)?.banner,
    (config as any)?.theme?.banner,
    (config as any)?.messages?.banner,
    getFlatBanner((config as any)?.theme),
    getFlatBanner((config as any)?.messages),
  ].find((candidate) => hasBannerValues(candidate as Record<string, unknown>));
  const banner = (bannerCandidate as BannerConfig) || DEFAULT_BANNER;
  const shop = config?.shop || DEFAULT_SHOP;

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        loading,
        error,
        refreshConfig,
        popup,
        banner,
        shop,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error("useSiteConfig must be used within SiteConfigProvider");
  }
  return context;
}
