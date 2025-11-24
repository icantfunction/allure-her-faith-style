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

  // Placeholder products to showcase animations
  const placeholderProducts: Product[] = [
    {
      productId: 'placeholder-1',
      name: 'Grace Elegance Set',
      price: 129.99,
      description: 'A timeless two-piece ensemble featuring a flowing midi skirt and coordinating blouse, perfect for Sunday service or special occasions.',
      imageUrls: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop'],
      visible: true,
    },
    {
      productId: 'placeholder-2',
      name: 'Faith & Fashion Dress',
      price: 98.50,
      description: 'Sophisticated A-line dress with elegant detailing, designed to make you feel confident and beautiful in worship.',
      imageUrls: ['https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&h=1000&fit=crop'],
      visible: true,
    },
    {
      productId: 'placeholder-3',
      name: 'Modesty Chic Ensemble',
      price: 145.00,
      description: 'Luxurious three-piece set combining modesty with contemporary style, featuring premium fabrics and impeccable tailoring.',
      imageUrls: ['https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=800&h=1000&fit=crop'],
      visible: true,
    },
    {
      productId: 'placeholder-4',
      name: 'Divine Worship Attire',
      price: 112.75,
      description: 'Elegant coordinated outfit that transitions seamlessly from worship to brunch, embodying grace and sophistication.',
      imageUrls: ['https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&h=1000&fit=crop'],
      visible: true,
    },
  ];

  useEffect(() => {
    PublicAPI.listProducts()
      .then((data) => {
        // Filter to only visible products and take first 4
        const visible = data.filter((p: Product) => p.visible !== false).slice(0, 4);
        
        // If no products from API, use placeholders
        if (visible.length === 0) {
          setProducts(placeholderProducts);
        } else {
          setProducts(visible);
        }
      })
      .catch((error) => {
        console.error(error);
        // On API error, use placeholder products
        setProducts(placeholderProducts);
      })
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
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              New products coming soon!
            </p>
          </div>
        ) : (
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
        )}
        
        {products.length > 0 && showViewAllButton && (
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