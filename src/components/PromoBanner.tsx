import { useSiteConfig } from "@/contexts/SiteConfigContext";

const PromoBanner = () => {
  const { banner } = useSiteConfig();

  if (!banner.enabled) {
    return null;
  }

  const bannerText = banner.text || "Special Offer";
  const items = Array.from({ length: 6 });

  const bannerContent = (
    <div
      className="py-2 px-4 overflow-hidden"
      style={{
        backgroundColor: banner.backgroundColor || "#000000",
        color: banner.textColor || "#ffffff",
      }}
    >
      <div className="animate-marquee flex w-max items-center">
        {[0, 1].map((loop) => (
          <div
            key={loop}
            className="flex items-center whitespace-nowrap shrink-0"
            aria-hidden={loop === 1 ? "true" : undefined}
          >
            {items.map((_, index) => (
              <span
                key={`${loop}-${index}`}
                className="text-sm font-medium tracking-wide inline-flex items-center"
              >
                {bannerText}
                <span className="mx-8 text-xs opacity-70">?</span>
              </span>
            ))}
          </div>
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
