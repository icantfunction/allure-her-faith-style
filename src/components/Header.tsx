import { Link } from "react-router-dom";
import MiniCart from "@/components/cart/MiniCart";
import logo from "@/assets/logo.png";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/5 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Allure Her" className="h-8 w-auto" />
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Home
          </Link>
          <MiniCart />
        </nav>
      </div>
    </header>
  );
}
