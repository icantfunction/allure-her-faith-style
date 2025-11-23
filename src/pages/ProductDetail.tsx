import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PublicAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

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
    if (!product) return;
    
    addToCart(
      {
        productId: product.productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrls?.[0],
      },
      quantity
    );
    
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="aspect-square rounded-lg overflow-hidden bg-muted"
          >
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
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
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
            <Button
              onClick={handleAddToCart}
              className="w-full btn-luxury"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>

            {/* Continue Shopping */}
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Continue Shopping
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
