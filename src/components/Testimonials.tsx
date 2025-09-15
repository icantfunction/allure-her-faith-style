import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import testimonialImage from "@/assets/testimonial-1.jpg";
import { useAnimeOnScroll } from "@/hooks/useAnimeOnScroll";
import { staggeredFadeIn } from "@/utils/animations";

const Testimonials = () => {
  const sectionRef = useAnimeOnScroll({
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 800,
    easing: 'easeOutQuart',
  });
  
  const cardsRef = useAnimeOnScroll({
    ...staggeredFadeIn,
    targets: '.testimonial-card',
  });

  const testimonials = [
    {
      name: "Sarah M.",
      location: "Dallas, TX",
      text: "When I wear Allure Her, I feel beautiful in the most authentic way. It's not just clothing—it's a reminder that I'm loved and seen by God.",
      image: testimonialImage,
    },
    {
      name: "Rachel K.",
      location: "Atlanta, GA", 
      text: "These pieces have become my confidence uniform. Whether I'm at church or brunch with friends, I feel elegant and comfortable in my own skin.",
      image: testimonialImage,
    },
    {
      name: "Grace L.",
      location: "Phoenix, AZ",
      text: "Allure Her has transformed how I think about modest fashion. Beautiful, sophisticated, and made with such love and intention.",
      image: testimonialImage,
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 px-6 bg-gradient-subtle opacity-0">
      <div ref={cardsRef} className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-section-title mb-6 text-primary">
            How You'll Feel
          </h2>
          <p className="text-subhero max-w-2xl mx-auto">
            Hear from women who've discovered the confidence and joy that comes 
            from wearing clothing that honors both style and faith.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="testimonial-card bg-background border-0 shadow-elegant opacity-0">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full mx-auto object-cover shadow-soft"
                  />
                </div>
                
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent-gold text-accent-gold" />
                  ))}
                </div>
                
                <p className="text-muted-foreground italic mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                
                <div>
                  <h4 className="font-heading font-medium text-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.location}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Join hundreds of women experiencing confidence through faith-inspired fashion
          </p>
          <div className="flex justify-center space-x-4">
            <span className="text-sm font-medium text-primary">Loved</span>
            <span className="text-accent-gold">•</span>
            <span className="text-sm font-medium text-primary">Seen</span>
            <span className="text-accent-gold">•</span>
            <span className="text-sm font-medium text-primary">Enough</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;