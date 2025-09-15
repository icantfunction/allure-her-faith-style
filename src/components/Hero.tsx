import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { breathingAnimation, floatingElements, scriptureGlow } from "@/utils/animations";

const Hero = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Hero entrance animation sequence with reduced motion support
    if (titleRef.current) {
      animate(titleRef.current, {
        opacity: [0, 1],
        translateY: prefersReducedMotion ? [10, 0] : [50, 0],
        scale: prefersReducedMotion ? [0.95, 1] : [0.8, 1],
        duration: prefersReducedMotion ? 600 : 1200,
        easing: 'easeOutExpo',
      });
    }
    
    setTimeout(() => {
      if (taglineRef.current) {
        animate(taglineRef.current, {
          opacity: [0, 1],
          translateY: prefersReducedMotion ? [5, 0] : [30, 0],
          duration: prefersReducedMotion ? 400 : 800,
          easing: 'easeOutQuart',
        });
      }
    }, prefersReducedMotion ? 200 : 600);
    
    setTimeout(() => {
      if (buttonRef.current) {
        animate(buttonRef.current, {
          opacity: [0, 1],
          translateY: prefersReducedMotion ? [5, 0] : [20, 0],
          scale: prefersReducedMotion ? [0.98, 1] : [0.9, 1],
          duration: prefersReducedMotion ? 300 : 600,
          easing: 'easeOutBack',
        });
      }
    }, prefersReducedMotion ? 400 : 1000);

    // Continuous animations - only if motion is allowed
    if (!prefersReducedMotion) {
      setTimeout(() => {
        if (buttonRef.current) breathingAnimation(buttonRef.current);
        if (overlayRef.current) floatingElements(overlayRef.current);
        if (taglineRef.current) {
          setTimeout(() => scriptureGlow(taglineRef.current!), 2000);
        }
      }, 1600);
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with dominant color fallback */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundColor: 'hsl(var(--primary-light))', // Dominant color fallback
        }}
      >
        {/* Enhanced gradient scrim for better text legibility */}
        <div ref={overlayRef} className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <h1 ref={titleRef} className="text-hero mb-6 opacity-0">
          Allure Her
        </h1>
        <p ref={taglineRef} className="text-subhero mb-4 opacity-0">
          Loved. Seen. Enough.
        </p>
        <p className="text-lg mb-8 font-light opacity-90">
          Where faith meets fashion in timeless elegance
        </p>
        
        <div>
          <Button 
            ref={buttonRef} 
            className="btn-luxury text-lg px-10 py-5 opacity-0"
            aria-label="Shop the Collection - Discover our luxury Christian fashion"
          >
            Shop the Collection
          </Button>
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
    </section>
  );
};

export default Hero;