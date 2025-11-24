import { useEffect, useState, useRef } from "react";
import { PublicAPI } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { animate } from "animejs";
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
    {
      productId: 'placeholder-5',
      name: 'Sunday Best Collection',
      price: 165.00,
      description: 'Premium Sunday wear set that combines tradition with modern elegance, crafted from the finest materials.',
      imageUrls: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop'],
      visible: true,
    },
    {
      productId: 'placeholder-6',
      name: 'Praise & Style Outfit',
      price: 89.99,
      description: 'Comfortable yet sophisticated ensemble perfect for choir practice or casual worship gatherings.',
      imageUrls: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop'],
      visible: true,
    },
    {
      productId: 'placeholder-7',
      name: 'Reverence Ensemble',
      price: 178.50,
      description: 'Luxurious formal wear that honors both your faith and personal style, ideal for special church events.',
      imageUrls: ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&h=1000&fit=crop'],
      visible: true,
    },
    {
      productId: 'placeholder-8',
      name: 'Blessed Beauty Set',
      price: 124.25,
      description: 'Versatile coordinated pieces that work together or separately, bringing elegance to every occasion.',
      imageUrls: ['https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&h=1000&fit=crop'],
      visible: true,
    },
  ];

  useEffect(() => {
    PublicAPI.listProducts()
      .then((data) => {
        // Filter to only visible products
        const visible = data.filter((p: Product) => p.visible !== false);
        
        // If no products from API, use placeholders
        if (visible.length === 0) {
          setProducts(placeholderProducts);
          setFilteredProducts(placeholderProducts);
        } else {
          setProducts(visible);
          setFilteredProducts(visible);
        }
      })
      .catch((error) => {
        console.error(error);
        // On API error, use placeholder products
        setProducts(placeholderProducts);
        setFilteredProducts(placeholderProducts);
      })
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
