import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef } from "react";
import { useCartAnimations } from "@/hooks/useCartAnimations";

export default function MiniCart() {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const cartIconRef = useRef<HTMLDivElement>(null);
  const prevItemCount = useRef(totalItems);
  const { animateCartIcon } = useCartAnimations();

  // Animate when items are added
  useEffect(() => {
    if (totalItems > prevItemCount.current && cartIconRef.current) {
      animateCartIcon(cartIconRef.current);
    }
    prevItemCount.current = totalItems;
  }, [totalItems, animateCartIcon]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative"
      onClick={() => navigate("/checkout")}
    >
      <div ref={cartIconRef}>
        <ShoppingCart className="h-5 w-5" />
      </div>
      {totalItems > 0 && (
        <Badge
          variant="default"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary"
        >
          {totalItems}
        </Badge>
      )}
    </Button>
  );
}
