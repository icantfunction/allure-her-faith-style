import { Button } from "@/components/ui/button";
import { useAnimeOnScroll } from "@/hooks/useAnimeOnScroll";
import { productGridReveal } from "@/utils/animations";
import { useEffect, useState } from "react";
import { animate } from "animejs";
import { PublicAPI } from "@/lib/api";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

type Product = {
  productId: string;
  name: string;
  price: number;
  description?: string;
  imageUrls?: string[];
  visible?: boolean;
};

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { config } = useSiteConfig();
  const navigate = useNavigate();
  
  const productsRef = useAnimeOnScroll({
    ...productGridReveal,
    targets: '.product-item',
  });

  useEffect(() => {
    PublicAPI.listProducts()
      .then((data) => {
        // Filter to only visible products and take first 4
        const visible = data.filter((p: Product) => p.visible !== false).slice(0, 4);
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

  const showViewAllButton = config?.shop?.showViewAllButton ?? true;

  if (loading) {
    return (
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-6 bg-muted">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-section-title mb-6 text-primary">
            Shop the Collection
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-foreground/80">
            Versatile sets that transition beautifully from church to casual luxury, 
            designed for the woman who values both style and substance.
          </p>
        </div>
        
        <div ref={productsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div 
              key={product.productId} 
              className="product-item product-card opacity-0 cursor-pointer"
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
        
        {showViewAllButton && (
          <div className="text-center mt-12">
            <Button 
              className="btn-luxury"
              onClick={() => navigate("/products")}
            >
              View All Products
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Shop;