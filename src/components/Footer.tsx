import { Instagram, Youtube, Music } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-heading text-4xl mb-4 font-light">
            Allure Her
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Where faith meets fashion in timeless elegance
          </p>
          
          {/* Social Media Icons */}
          <div className="flex justify-center space-x-6 mb-8">
            <a 
              href="#" 
              className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              aria-label="TikTok"
            >
              <Music className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        {/* Scripture Reference */}
        <div className="text-center border-t border-primary-foreground/20 pt-8">
          <div className="scripture-quote text-primary-foreground/90 text-lg mb-4">
            I will allure her and speak tenderly to her
          </div>
          <p className="text-primary-foreground/70 text-sm">
            Hosea 2:14
          </p>
        </div>
        
        {/* Bottom Links */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mt-8 pt-8 border-t border-primary-foreground/20 text-sm text-primary-foreground/60">
          <p>&copy; 2024 Allure Her. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Return Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;