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
      {/* Background Image with parallax effect */}
      <motion.div
        style={{ 
          y: prefersReducedMotion ? 0 : y,
          backgroundImage: `url(https://scontent-mia5-1.cdninstagram.com/v/t51.2885-15/552741286_17966393963953994_6879478378473567789_n.jpg?stp=dst-jpg_e35_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQuaW1hZ2VfdXJsZ2VuLjE0NDB4MTkyMC5zZHIuZjgyNzg3LmRlZmF1bHRfaW1hZ2UuYzIifQ&_nc_ht=scontent-mia5-1.cdninstagram.com&_nc_cat=102&_nc_oc=Q6cZ2QFYR4ZS-GtP_KequGTTBHRtQ2xP8Cxd9tLcSCmrJlxde5xfpg2sFr18dCyJ-hXoGyxZBqdc8wbxw8KML3BXLqT6&_nc_ohc=ketGxuZ8f_0Q7kNvwFCQY3g&_nc_gid=TEbRi4D0HJzR1NF1eQGRKw&edm=APs17CUBAAAA&ccb=7-5&ig_cache_key=MzcyNzQwMjQyNzkyNzg3MzYzOQ%3D%3D.3-ccb7-5&oh=00_AfavefknlVmzNu94CZqiQTebO-KdNd-cfQyj7PNqF6rzKQ&oe=68D774D0&_nc_sid=10d13b)`,
          backgroundColor: 'hsl(var(--light-beige))', // Dominant color fallback
          backgroundPosition: 'center top', // Show top 50% of the image
          backgroundSize: 'cover',
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
          <div className="text-center text-white max-w-4xl mx-auto">
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
              className="text-subhero mb-8 mx-auto"
            >
              Where faith meets fashion in timeless elegance
            </motion.p>
            
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.7 }}
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