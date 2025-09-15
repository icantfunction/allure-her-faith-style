import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

const Hero = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Parallax scroll effect
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]); // subtle parallax

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <header className="relative overflow-hidden" style={{ minHeight: '88vh' }}>
      {/* Background Image with parallax effect */}
      <motion.div
        style={{ 
          y: prefersReducedMotion ? 0 : y,
          backgroundImage: `url(${heroImage})`,
          backgroundColor: 'hsl(var(--light-beige))', // Dominant color fallback
          backgroundPosition: 'right 30% center', // Position away from text
        }}
        className="absolute inset-0 bg-cover bg-no-repeat"
        aria-hidden="true"
      >
        {/* Enhanced gradient scrim for luxury contrast */}
        <div 
          className="absolute inset-0 mix-blend-multiply"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.28), rgba(0,0,0,0.45))'
          }}
        ></div>
      </motion.div>
      
      {/* Content Container */}
      <div className="relative z-10 flex items-center px-6" style={{ minHeight: '88vh' }}>
        <div className="w-full max-w-6xl mx-auto">
          {/* Content - Left aligned on desktop, center on mobile */}
          <div className="text-center md:text-left text-white max-w-4xl">
            <motion.h1
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
              className="text-hero mb-6"
            >
              Allure Her
            </motion.h1>
            
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.45 }}
              className="text-subhero mb-8 mx-auto md:mx-0"
            >
              Where faith meets fashion in timeless elegance
            </motion.p>
            
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.7 }}
            >
              <a 
                href="#shop"
                className="hero-cta"
                aria-label="Shop the Collection - Discover our luxury Christian fashion"
              >
                Shop the Collection
              </a>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator with reduced motion support */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70">
        <div className="motion-safe:animate-bounce motion-reduce:animate-subtle-float">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </header>
  );
};

export default Hero;