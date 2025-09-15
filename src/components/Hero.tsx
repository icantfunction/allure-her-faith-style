import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const Hero = () => {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      // Register ScrollTrigger plugin
      gsap.registerPlugin(ScrollTrigger);

      // Set initial states for reveal elements
      gsap.set([titleRef.current, taglineRef.current, descriptionRef.current, buttonRef.current], {
        y: 20,
        opacity: 0
      });

      // Text reveal animations with staggered timing
      if (titleRef.current) {
        gsap.to(titleRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power2.out",
          delay: 0.3
        });
      }

      if (taglineRef.current) {
        gsap.to(taglineRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power2.out",
          delay: 0.6
        });
      }

      if (descriptionRef.current) {
        gsap.to(descriptionRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power2.out",
          delay: 0.9
        });
      }

      if (buttonRef.current) {
        gsap.to(buttonRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power2.out",
          delay: 1.2
        });
      }

      // Subtle parallax effect on background
      if (parallaxRef.current && heroRef.current) {
        gsap.to(parallaxRef.current, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }

      // Cleanup function
      return () => {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      };
    } else {
      // Fallback for reduced motion - simple fade in
      gsap.set([titleRef.current, taglineRef.current, descriptionRef.current, buttonRef.current], {
        opacity: 1
      });
    }
  }, []);

  return (
    <section ref={heroRef} className="hero gsap-hero relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with parallax effect */}
      <div 
        ref={parallaxRef}
        className="hero__media absolute inset-0 bg-cover bg-center bg-no-repeat"
        data-parallax
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundColor: 'hsl(var(--primary-light))', // Dominant color fallback
        }}
      >
        {/* Enhanced gradient scrim */}
        <div className="hero__scrim absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40"></div>
      </div>
      
      {/* Content */}
      <div className="hero__inner relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <h1 ref={titleRef} className="reveal-up text-hero mb-6 opacity-0">
          Allure Her
        </h1>
        <p ref={taglineRef} className="reveal-up d2 text-subhero mb-4 opacity-0">
          Loved. Seen. Enough.
        </p>
        <p ref={descriptionRef} className="reveal-up d3 text-lg mb-8 font-light opacity-90 opacity-0">
          Where faith meets fashion in timeless elegance
        </p>
        
        <div>
          <Button 
            ref={buttonRef} 
            className="hero__cta reveal-up d4 btn-luxury text-lg px-10 py-5 opacity-0"
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