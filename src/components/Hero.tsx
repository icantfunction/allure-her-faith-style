import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";


const Hero = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
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

      toast({
        title: "Welcome to the insider list!",
        description: "You'll be the first to know when we launch.",
      });
      
      setEmail("");
      setShowEmailForm(false);
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
      {/* Background Video with parallax effect */}
      <motion.div
        style={{ 
          y: prefersReducedMotion ? 0 : y,
        }}
        className="absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Video container - responsive sizing */}
        <div className="absolute inset-0 md:h-[400%] md:-top-[370px]">
          <iframe 
            title="vimeo-player" 
            src="https://player.vimeo.com/video/1124510825?h=1e55c9c6d6&autoplay=1&loop=1&muted=1&background=1" 
            className="absolute top-0 left-1/2 -translate-x-1/2 h-full"
            style={{ 
              border: 0,
              width: 'calc(150% + 900px)'
            }}
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            allowFullScreen
          />
        </div>
        
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
          <div className="text-center text-white max-w-4xl mx-auto">
            <h1 className="text-hero mb-8">
              <img 
                src="/images/logo.png" 
                alt="Allure Her" 
                className="mx-auto h-24 md:h-36 w-auto mt-[80px]"
                width="754"
                height="332"
                fetchPriority="high"
              />
            </h1>
            
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.45 }}
              className="text-subhero mb-10 mx-auto -mt-[40px]"
            >
              Where faith meets fashion in timeless elegance
            </motion.p>
            
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.7 }}
              className="-mt-[30px]"
            >
              {!showEmailForm ? (
                <Button 
                  onClick={() => setShowEmailForm(true)}
                  className="hero-cta"
                  aria-label="Be an Insider - Get early access to our luxury Christian fashion"
                >
                  Be an Insider
                </Button>
              ) : (
                <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto md:mx-0">
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