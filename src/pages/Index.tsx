import Hero from "@/components/Hero";
import About from "@/components/About";
import Shop from "@/components/Shop";
import Encouragement from "@/components/Encouragement";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <Shop />
      <Encouragement />
      <Testimonials />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
