import { useEffect, useRef, useState } from "react";

const HERO_VIDEO_URL = import.meta.env.VITE_HERO_VIDEO_URL as string;

export function HeroVideo() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Lazy-load: only mount video when hero section is visible
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 } // Load when 10% visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!HERO_VIDEO_URL) {
    console.warn("Missing VITE_HERO_VIDEO_URL - video will not display");
    return <div className="absolute inset-0 bg-gray-900" />;
  }

  return (
    <div ref={containerRef} className="absolute inset-0">
      {shouldLoad ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto min-h-full object-cover scale-110"
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
      ) : (
        // Lightweight skeleton while lazy-loading
        <div className="absolute inset-0 bg-gray-900 animate-pulse" />
      )}
    </div>
  );
}
