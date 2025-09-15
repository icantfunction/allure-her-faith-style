import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { animate, stagger } from "animejs";
import { useAnimeOnScroll } from "@/hooks/useAnimeOnScroll";
import { fadeInUp } from "@/utils/animations";

const Encouragement = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<SVGSVGElement>(null);
  const sectionRef = useAnimeOnScroll(fadeInUp);

  useEffect(() => {
    // Heart beating animation
    if (heartRef.current) {
      animate(heartRef.current, {
        scale: [1, 1.2, 1],
        duration: 1500,
        loop: true,
        ease: 'inOutSine',
      });
    }
  }, []);

  const animateContentChange = () => {
    if (contentRef.current) {
      animate(contentRef.current.children, {
        opacity: [0, 1],
        y: [20, 0],
        duration: 600,
        delay: stagger(100),
        ease: 'outQuart',
      });
    }
  };
  
  const encouragements = [
    {
      scripture: "She is clothed with strength and dignity; she can laugh at the days to come.",
      reference: "Proverbs 31:25",
      encouragement: "You are stronger than you know, beautiful soul. Each morning brings new mercies and fresh opportunities to shine His light through your gentleness and grace.",
      question: "How can you embrace your God-given strength today?"
    },
    {
      scripture: "Charm is deceptive, and beauty is fleeting; but a woman who fears the Lord is to be praised.",
      reference: "Proverbs 31:30",
      encouragement: "Your beauty runs deeper than the surface—it flows from a heart surrendered to the Lord. This inner radiance is what makes you truly unforgettable.",
      question: "What aspects of your character reflect His love most beautifully?"
    },
    {
      scripture: "You are altogether beautiful, my darling; there is no flaw in you.",
      reference: "Song of Songs 4:7",
      encouragement: "In His eyes, you are perfectly and wonderfully made. Every perceived flaw is transformed by His love into something beautiful and purposeful.",
      question: "How does knowing God sees you as flawless change how you see yourself?"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const newSlide = (prev + 1) % encouragements.length;
      setTimeout(animateContentChange, 100);
      return newSlide;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const newSlide = (prev - 1 + encouragements.length) % encouragements.length;
      setTimeout(animateContentChange, 100);
      return newSlide;
    });
  };

  return (
    <section ref={sectionRef} className="py-20 px-6 opacity-0">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart ref={heartRef} className="w-6 h-6 text-accent fill-accent" />
            <h2 className="text-section-title text-primary">Weekly Encouragement</h2>
            <Heart className="w-6 h-6 text-accent fill-accent" />
          </div>
          <p className="text-muted-foreground">
            Nourishment for your soul, one Scripture at a time
          </p>
        </div>
        
        <Card className="bg-gradient-to-br from-secondary to-accent border-0 shadow-luxury">
          <CardContent className="p-10">
            <div className="relative">
              {/* Navigation */}
              <div className="flex justify-between items-center mb-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevSlide}
                  className="text-muted-foreground hover:text-primary"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <div className="flex space-x-2">
                  {encouragements.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextSlide}
                  className="text-muted-foreground hover:text-primary"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div ref={contentRef} className="text-center space-y-6">
                <div className="scripture-quote text-2xl">
                  {encouragements[currentSlide].scripture}
                </div>
                <div className="text-sm font-medium text-accent-gold">
                  {encouragements[currentSlide].reference}
                </div>
                
                <div className="section-divider"></div>
                
                <p className="text-foreground leading-relaxed text-lg">
                  {encouragements[currentSlide].encouragement}
                </p>
                
                <div className="bg-background/50 rounded-lg p-6 mt-8">
                  <div className="flex items-start space-x-3">
                    <Heart className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground italic text-left">
                      {encouragements[currentSlide].question}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <Button className="btn-outline-luxury">
            Subscribe for Weekly Encouragement
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Encouragement;