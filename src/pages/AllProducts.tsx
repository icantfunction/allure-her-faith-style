import { useEffect, useRef, useState } from "react";
import { PublicAPI } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { animate } from "animejs";
import Header from "@/components/Header";

type Product = {
  productId: string;
  name: string;
  price: number;
  description?: string;
  imageUrls?: string[];
  visible?: boolean;
  sizes?: string[];
};

export default function AllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [hoverImageIndex, setHoverImageIndex] = useState(0);
  const hoverTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    PublicAPI.listProducts()
      .then((data) => {
        // Filter to only visible products
        const visible = data.filter((p: Product) => p.visible !== false);
        setProducts(visible);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleProductHover = (e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      scale: 1.02,
      filter: 'drop-shadow(0 12px 48px rgba(0,0,0,0.15))',
      duration: 400,
      easing: 'easeOutQuart',
    });
  };

  const handleProductLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      scale: 1,
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))',
      duration: 400,
      easing: 'easeOutQuart',
    });
  };

  const startHoverSlideshow = (product: Product) => {
    setHoveredProductId(product.productId);
    setHoverImageIndex(0);
    if (!product.imageUrls?.[1]) return;
    if (hoverTimerRef.current) {
      window.clearInterval(hoverTimerRef.current);
    }
    hoverTimerRef.current = window.setInterval(() => {
      setHoverImageIndex((prev) => (prev === 0 ? 1 : 0));
    }, 3000);
  };

  const stopHoverSlideshow = () => {
    if (hoverTimerRef.current) {
      window.clearInterval(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredProductId(null);
    setHoverImageIndex(0);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        window.clearInterval(hoverTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <span className="text-foreground">All Products</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-heading font-semibold text-foreground mb-4">
            Our Collection
          </h1>
          <p className="text-lg text-muted-foreground">
            {products.length} {products.length === 1 ? 'product' : 'products'} available
          </p>
        </motion.div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-6">No products available yet</p>
            <Button onClick={() => navigate("/")}>Return Home</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, idx) => (
              <motion.div
                key={product.productId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="product-card cursor-pointer"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))' }}
                onMouseEnter={(e) => {
                  handleProductHover(e);
                  startHoverSlideshow(product);
                }}
                onMouseLeave={(e) => {
                  handleProductLeave(e);
                  stopHoverSlideshow();
                }}
                onClick={() => navigate(`/product/${product.productId}`)}
              >
                <div className="aspect-[4/5] overflow-hidden bg-muted relative">
                  {product.imageUrls?.[0] ? (
                    <>
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          hoveredProductId === product.productId && hoverImageIndex === 1 && product.imageUrls?.[1]
                            ? "opacity-0 scale-105"
                            : "opacity-100 scale-100"
                        }`}
                      />
                      {product.imageUrls[1] && (
                        <img
                          src={product.imageUrls[1]}
                          alt={`${product.name} preview`}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                            hoveredProductId === product.productId && hoverImageIndex === 1 ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-xl mb-2 text-foreground">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-lg text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="btn-outline-luxury text-sm px-4 py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.productId}`);
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary-dark"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/try-on?productId=${product.productId}`);
                        }}
                      >
                        Try on
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
