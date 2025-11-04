import Hero from "@/components/Hero";
import About from "@/components/About";
import Newsletter from "@/components/Newsletter";
import InsiderReminderPopup from "@/components/InsiderReminderPopup";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <Newsletter />
      <InsiderReminderPopup />
    </div>
  );
};

export default Index;
