import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Shop from "@/components/Shop";
import Newsletter from "@/components/Newsletter";
import InsiderReminderPopup from "@/components/InsiderReminderPopup";
import Footer from "@/components/Footer";
import { useAmbassadorTracking } from "@/hooks/useAmbassadorTracking";

const Index = () => {
  useAmbassadorTracking();
  
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <About />
      <Shop />
      <Newsletter />
      <InsiderReminderPopup />
      <Footer />
    </div>
  );
};

export default Index;
