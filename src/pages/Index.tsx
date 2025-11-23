import Hero from "@/components/Hero";
import About from "@/components/About";
import Shop from "@/components/Shop";
import Newsletter from "@/components/Newsletter";
import InsiderReminderPopup from "@/components/InsiderReminderPopup";
import { useAmbassadorTracking } from "@/hooks/useAmbassadorTracking";

const Index = () => {
  useAmbassadorTracking();
  
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <Shop />
      <Newsletter />
      <InsiderReminderPopup />
    </div>
  );
};

export default Index;
