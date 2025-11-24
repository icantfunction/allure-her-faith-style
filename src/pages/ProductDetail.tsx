import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PublicAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useCartAnimations } from "@/hooks/useCartAnimations";
import { ChevronRight, Minus, Plus, ShoppingCart, Loader2, Check } from "lucide-react";
import Header from "@/components/Header";

type Product = {
  productId: string;
  name: string;
  price: number;
  description?: string;
  imageUrls?: string[];
};

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { animateButtonTap, animateSuccess } = useCartAnimations();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const successIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!productId) return;
    
    PublicAPI.getProduct(productId)
      .then(setProduct)
      .catch((err) => {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [productId, toast]);

  const handleAddToCart = () => {
    if (!product || !addButtonRef.current) return;
    
    // Animate button tap
    animateButtonTap(addButtonRef.current);
    
    // Add to cart
    addToCart(
      {
        productId: product.productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrls?.[0],
      },
      quantity
    );
    
    // Show success indicator
    setShowSuccess(true);
    
    // Animate success icon
    setTimeout(() => {
      if (successIconRef.current) {
        animateSuccess(successIconRef.current);
      }
    }, 50);
    
    // Hide success indicator after animation
    setTimeout(() => {
      setShowSuccess(false);
    }, 1500);
    
    toast({
      title: "Added to cart",
      description: `${quantity} × ${product.name}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-heading mb-4">Product not found</h2>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-muted py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {product.imageUrls?.[0] ? (
              <img
                src={product.imageUrls[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-heading font-semibold text-foreground mb-4">
                {product.name}
              </h1>
              <p className="text-3xl font-medium text-primary">
                ${product.price.toFixed(2)}
              </p>
            </div>

            {product.description && (
              <div className="prose prose-neutral">
                <p className="text-foreground/80">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="relative">
              <Button
                ref={addButtonRef}
                onClick={handleAddToCart}
                className="w-full btn-luxury"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              
              {/* Success indicator */}
              {showSuccess && (
                <div 
                  ref={successIconRef}
                  className="absolute inset-0 flex items-center justify-center bg-primary rounded-md opacity-0"
                  style={{ pointerEvents: 'none' }}
                >
                  <Check className="h-6 w-6 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Continue Shopping */}
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
