import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { useEffect, useRef } from "react";
import anime from "animejs/lib/anime.es.js";
import { breathingAnimation, floatingElements, scriptureGlow } from "@/utils/animations";

const Hero = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero entrance animation
    const timeline = anime.timeline({
      autoplay: false,
    });

    timeline
      .add({
        targets: titleRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        scale: [0.8, 1],
        duration: 1200,
        easing: 'easeOutExpo',
      })
      .add({
        targets: taglineRef.current,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        easing: 'easeOutQuart',
      }, '-=600')
      .add({
        targets: buttonRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.9, 1],
        duration: 600,
        easing: 'easeOutBack',
      }, '-=400');

    timeline.play();

    // Continuous animations
    if (buttonRef.current) breathingAnimation(buttonRef.current);
    if (overlayRef.current) floatingElements(overlayRef.current);
    if (taglineRef.current) {
      setTimeout(() => scriptureGlow(taglineRef.current!), 2000);
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div ref={overlayRef} className="absolute inset-0 bg-black/20"></div>
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
          <Button ref={buttonRef} className="btn-luxury text-lg px-10 py-5 opacity-0">
            Shop the Collection
          </Button>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70">
        <div className="animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Hero;