import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-image.jpg";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";


const Hero = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const ctaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Parallax scroll effect
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]); // subtle parallax

  const handleCtaClick = async () => {
    if (prefersReducedMotion) {
      setShowEmailForm(true);
      return;
    }

    const animeMod = await import("animejs");
    const anime: any = (animeMod as any).default || (animeMod as any);

    // Animate the button out
    if (ctaRef.current) {
      await anime({
        targets: ctaRef.current,
        scale: [1, 0.95],
        opacity: [1, 0],
        duration: 300,
        easing: 'easeInOutQuart',
      }).finished;
    }

    setShowEmailForm(true);
    // Animate the form in on next tick
    setTimeout(async () => {
      if (formRef.current) {
        const animeMod = await import("animejs");
        const anime: any = (animeMod as any).default || (animeMod as any);
        anime({
          targets: formRef.current,
          scale: [0.9, 1],
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 500,
          easing: 'easeOutQuart'
        });
      }
    }, 50);
  };
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("https://hooks.zapier.com/hooks/catch/23791564/um92syy/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          email: email,
          timestamp: new Date().toISOString(),
          source: "allure_her_insider",
        }),
      });

      if (!prefersReducedMotion && formRef.current) {
        const animeMod = await import("animejs");
        const anime: any = (animeMod as any).default || (animeMod as any);
        await anime({
          targets: formRef.current,
          scale: [1, 1.05, 1],
          duration: 600,
          easing: 'easeInOutQuart'
        }).finished;
      }

      toast({
        title: "Welcome to the insider list!",
        description: "You'll be the first to know when we launch.",
      });
      
      setEmail("");
      
      // Reset to button after successful submission
      setTimeout(() => {
        setShowEmailForm(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error submitting email:", error);
      toast({
        title: "Error",
        description: "Failed to submit email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              {!showEmailForm ? (
                <div ref={ctaRef}>
                  <Button 
                    onClick={handleCtaClick}
                    className="hero-cta"
                    aria-label="Be an Insider - Get early access to our luxury Christian fashion"
                  >
                    Be an Insider
                  </Button>
                </div>
              ) : (
                <form 
                  ref={formRef}
                  onSubmit={handleEmailSubmit} 
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto md:mx-0"
                  style={{ opacity: 0, transform: 'scale(0.9) translateY(20px)' }}
                >
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 bg-white/90 border-white/30 focus:border-white text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    className="hero-cta h-12 px-8"
                    disabled={isLoading}
                  >
                    {isLoading ? "Joining..." : "Join"}
                  </Button>
                </form>
              )}
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