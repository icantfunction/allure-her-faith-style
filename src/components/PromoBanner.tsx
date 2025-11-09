import { useSiteConfig } from "@/contexts/SiteConfigContext";

const PromoBanner = () => {
  const { banner } = useSiteConfig();

  if (!banner.enabled) {
    return null;
  }

  const bannerContent = (
    <div 
      className="py-2 px-4 overflow-hidden"
      style={{
        backgroundColor: banner.backgroundColor || "#000000",
        color: banner.textColor || "#ffffff",
      }}
    >
      <div className="animate-marquee whitespace-nowrap flex">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="text-sm font-medium inline-flex items-center">
            {banner.text || "Special Offer"} <span className="mx-8 text-xs">•</span>
          </span>
        ))}
      </div>
    </div>
  );

  if (banner.linkUrl) {
    return (
      <a href={banner.linkUrl} className="block hover:opacity-90 transition-opacity">
        {bannerContent}
      </a>
    );
  }

  return bannerContent;
};

export default PromoBanner;
