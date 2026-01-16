import { useEffect, useRef, useState } from "react";

const HERO_VIDEO_URL = import.meta.env.VITE_HERO_VIDEO_URL as string;
const FALLBACK_IMAGE = "/images/hero.jpg";

export function HeroVideo() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [videoError, setVideoError] = useState(false);
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

  // If no video URL is configured, use fallback image
  if (!HERO_VIDEO_URL) {
    console.warn("Missing VITE_HERO_VIDEO_URL - using fallback image");
    return (
      <div className="absolute inset-0">
        <img 
          src={FALLBACK_IMAGE} 
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0">
      {shouldLoad ? (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onError={() => {
              console.warn("Video failed to load - using fallback image");
              setVideoError(true);
            }}
            className={videoError ? "hidden" : "absolute inset-0 w-full h-full min-h-full min-w-full object-cover object-center"}
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
          {videoError && (
            <img 
              src={FALLBACK_IMAGE} 
              alt="Hero background"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          )}
        </>
      ) : (
        // Lightweight skeleton while lazy-loading
        <div className="absolute inset-0 bg-gray-900 animate-pulse" />
      )}
    </div>
  );
}
