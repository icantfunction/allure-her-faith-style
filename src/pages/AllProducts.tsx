import { useEffect, useState, useRef } from "react";
import { PublicAPI } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { animate, stagger } from "animejs";
import { useProductGridAnimations } from "@/hooks/useProductGridAnimations";
import Header from "@/components/Header";

type Product = {
  productId: string;
  name: string;
  price: number;
  description?: string;
  imageUrls?: string[];
  visible?: boolean;
};

export default function AllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingFilter, setAnimatingFilter] = useState(false);
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);
  const { animateProductsOut, animateProductsIn, animateGridReveal } = useProductGridAnimations();
  const hasAnimatedInitial = useRef(false);

  useEffect(() => {
    PublicAPI.listProducts()
      .then((data) => {
        // Filter to only visible products
        const visible = data.filter((p: Product) => p.visible !== false);
        setProducts(visible);
        setFilteredProducts(visible);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Initial grid reveal animation
  useEffect(() => {
    if (!loading && filteredProducts.length > 0 && gridRef.current && !hasAnimatedInitial.current) {
      const items = gridRef.current.querySelectorAll('.product-item');
      if (items.length > 0) {
        animateGridReveal(Array.from(items) as HTMLElement[]);
        hasAnimatedInitial.current = true;
      }
    }
  }, [loading, filteredProducts, animateGridReveal]);

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-semibold text-foreground mb-4">
            Our Collection
          </h1>
          <p className="text-lg text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-6">No products available yet</p>
            <Button onClick={() => navigate("/")}>Return Home</Button>
          </div>
        ) : (
          <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.productId}
                className="product-item product-card cursor-pointer opacity-0"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))' }}
                onMouseEnter={handleProductHover}
                onMouseLeave={handleProductLeave}
                onClick={() => navigate(`/product/${product.productId}`)}
              >
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  {product.imageUrls?.[0] ? (
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
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
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg text-primary">
                      ${product.price.toFixed(2)}
                    </span>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
