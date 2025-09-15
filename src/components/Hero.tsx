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
    <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with parallax effect */}
      <motion.div
        style={{ 
          y: prefersReducedMotion ? 0 : y,
          backgroundImage: `url(${heroImage})`,
          backgroundColor: 'hsl(var(--primary-light))', // Dominant color fallback
        }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        aria-hidden="true"
      >
        {/* Enhanced gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40"></div>
      </motion.div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <motion.h1
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
          className="text-hero mb-6"
        >
          Allure Her
        </motion.h1>
        
        <motion.p
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.6 }}
          className="text-subhero mb-4"
        >
          Loved. Seen. Enough.
        </motion.p>
        
        <motion.p
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.9 }}
          className="text-lg mb-8 font-light opacity-90"
        >
          Where faith meets fashion in timeless elegance
        </motion.p>
        
        <div>
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 1.2 }}
          >
            <Button 
              className="btn-luxury text-lg px-10 py-5"
              aria-label="Shop the Collection - Discover our luxury Christian fashion"
            >
              Shop the Collection
            </Button>
          </motion.div>
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