import { Button } from "@/components/ui/button";
import { useAnimeOnScroll } from "@/hooks/useAnimeOnScroll";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { PublicAPI } from "@/lib/api";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Loader2, ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

type Product = {
  productId: string;
  name: string;
  price?: number;
  description?: string;
  imageUrls?: string[];
  visible?: boolean;
  sizes?: string[];
};



const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { shop, loading: configLoading } = useSiteConfig();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);

  const heroAnimation = useMemo(
    () => ({
      targets: ".shop-hero-piece",
      opacity: [0, 1],
      translateY: [24, 0],
      delay: stagger(80),
      duration: 420,
      easing: "easeOutQuart",
    }),
    []
  );

  const heroRef = useAnimeOnScroll(heroAnimation);
  const skeletonRef = useRef<HTMLDivElement>(null);

  // Use shop config from context with fallback defaults
  const showViewAllButton = shop.showViewAllButton ?? true;
  const showShopSection = shop.showShopSection ?? true;

  const playEntrance = useCallback(() => {
    const cards = gridRef.current?.querySelectorAll(".product-card");
    if (!cards?.length) return;

    animate(cards, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 260,
      delay: stagger(60),
      easing: "easeOutQuad",
      begin: () => {
        cards.forEach((card) => card.classList.remove("opacity-0"));
      },
    });
  }, []);

  useEffect(() => {
    PublicAPI.listProducts()
      .then((data) => {
        const visible = data.filter((p: Product) => p.visible !== false);
        setProducts(visible);
        const curated = visible.slice(0, 6);
        setDisplayedProducts(curated);
      })
      .catch((error) => {
        console.error("Failed to load products:", error);
        // Set empty array to show "no products" message instead of hiding completely
        setProducts([]);
        setDisplayedProducts([]);
      })
      .finally(() => setLoading(false));
  }, [playEntrance]);

  const handleProductHover = (e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      scale: 1.02,
      filter: "drop-shadow(0 12px 48px rgba(0,0,0,0.15))",
      duration: 280,
      easing: "easeOutQuart",
    });
  };

  const handleProductLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      scale: 1,
      filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.06))",
      duration: 280,
      easing: "easeOutQuart",
    });
  };

  useEffect(() => {
    if (!loading) return;
    const nodes = skeletonRef.current?.querySelectorAll(".shop-skeleton");
    if (!nodes?.length) return;
    const animation = animate(nodes, {
      opacity: [0.5, 1],
      duration: 700,
      delay: stagger(120),
      direction: "alternate",
      loop: true,
      easing: "easeInOutSine",
    });
    return () => animation.pause();
  }, [loading]);

  useEffect(() => {
    if (!displayedProducts.length) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => playEntrance());
    });
    const fallback = window.setTimeout(() => {
      const cards = gridRef.current?.querySelectorAll(".product-card");
      cards?.forEach((card) => card.classList.remove("opacity-0"));
    }, 900);
    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      window.clearTimeout(fallback);
    };
  }, [displayedProducts, playEntrance]);

  const handleAddToCart = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (product.sizes && product.sizes.length > 0) {
      toast({
        title: "Choose a size",
        description: "Select your size on the product page.",
      });
      navigate(`/product/${product.productId}`);
      return;
    }
    addToCart({
      productId: product.productId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrls?.[0],
    });

    const button = e.currentTarget;
    const checkPath = button.querySelector<SVGPathElement>(".checkmark-path");
    const cartIcon = button.querySelector(".cart-bounce");

    animate(button, {
      scale: [0.95, 1],
      duration: 180,
      easing: "easeOutElastic(1, .8)",
    });

    if (checkPath) {
      const length = checkPath.getTotalLength?.() || 32;
      checkPath.setAttribute("strokeDasharray", `${length}`);
      animate(checkPath, {
        strokeDashoffset: [length, 0],
        duration: 200,
        easing: "easeOutQuad",
      });
    }

    if (cartIcon) {
      animate(cartIcon, {
        translateY: [0, -4, 0],
        scale: [1, 1.08, 1],
        duration: 180,
        easing: "easeOutQuad",
      });
    }

    toast({
      title: "Added to bag",
      description: `${product.name} is ready in your cart.`,
    });
  };

  // Wait for config to load before checking if shop should be hidden
  if (configLoading) {
    return (
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (!showShopSection) {
    return null;
  }

  // Show loading while products are being fetched
  if (loading) {
    return (
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div
            ref={skeletonRef}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="shop-skeleton rounded-2xl border border-border bg-white/70 p-6 shadow-soft"
              >
                <div className="aspect-[4/5] w-full rounded-xl bg-muted" />
                <div className="mt-5 space-y-3">
                  <div className="h-4 w-3/4 rounded-full bg-muted" />
                  <div className="h-3 w-full rounded-full bg-muted" />
                  <div className="h-3 w-2/3 rounded-full bg-muted" />
                  <div className="h-8 w-32 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show message when no products are available
  if (displayedProducts.length === 0) {
    return (
      <section className="relative py-20 px-6 bg-gradient-to-b from-muted/70 via-background to-muted/80 overflow-hidden">
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute -top-24 -right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white shadow-soft">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Coming Soon</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-primary">
              Shop the wardrobe
            </h2>
            <p className="text-lg text-foreground/80">
              Our collection is being curated with care. Check back soon to discover pieces where faith meets fashion in timeless elegance.
            </p>
            <div className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="gap-2"
              >
                Stay Updated
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20 px-6 bg-gradient-to-b from-muted/70 via-background to-muted/80 overflow-hidden">
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <div className="absolute -top-24 -right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div ref={heroRef} className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white shadow-soft shop-hero-piece">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">New drop curated for Sunday and beyond</span>
          </div>
          <div className="space-y-3 shop-hero-piece">
            <h2 className="text-4xl md:text-5xl font-heading font-semibold text-primary">
              Shop the wardrobe
            </h2>
            <p className="text-lg text-foreground/80">
              Ease through service, brunch, and the week with silhouettes that feel reverent and modern. Tap a look to
              explore the details.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3" ref={gridRef}>
          {displayedProducts.map((product) => (
            <div
              key={product.productId}
              className="product-card group relative cursor-pointer bg-white/80 backdrop-blur shadow-soft border border-border overflow-hidden opacity-0"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.06))" }}
              onMouseEnter={handleProductHover}
              onMouseLeave={handleProductLeave}
              onClick={() => navigate(`/product/${product.productId}`)}
            >
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full bg-black/60 text-white px-3 py-1 text-xs tracking-wide uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Ready to ship
              </div>
              <div className="aspect-[4/5] overflow-hidden bg-muted relative">
                {product.imageUrls?.[0] ? (
                  <>
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.imageUrls[1] && (
                      <img
                        src={product.imageUrls[1]}
                        alt={`${product.name} preview`}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-xl text-foreground">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-primary/90 bg-primary/10 px-3 py-1 rounded-full">
                    ${Number(product.price ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-primary text-primary bg-white hover:bg-primary hover:text-primary-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${product.productId}`);
                    }}
                  >
                    View look
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary-dark flex-1 justify-center gap-2"
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    <ShoppingBag className="h-4 w-4 cart-bounce" />
                    Add to bag
                    <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        className="checkmark-path"
                        d="M5 13l4 4L19 7"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="28"
                        strokeDashoffset="28"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showViewAllButton && (
          <div className="text-center mt-12">
            <Button className="btn-luxury" onClick={() => navigate("/products")}>
              View All Products
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Shop;
