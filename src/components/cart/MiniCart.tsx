import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MiniCart() {
  const { totalItems } = useCart();
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative"
      onClick={() => navigate("/checkout")}
    >
      <ShoppingCart className="h-5 w-5" />
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
