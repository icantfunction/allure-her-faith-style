import { Button } from "@/components/ui/button";
import { useAnimeOnScroll } from "@/hooks/useAnimeOnScroll";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { PublicAPI } from "@/lib/api";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Loader2, ShoppingBag, Sparkles, Wand2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Product = {
  productId: string;
  name: string;
  price?: number;
  description?: string;
  imageUrls?: string[];
  visible?: boolean;
};

type FilterId = "all" | "sets" | "dresses" | "essentials";

type FilterOption = {
  id: FilterId;
  label: string;
  description: string;
};

const filterOptions: FilterOption[] = [
  { id: "all", label: "All looks", description: "Every piece, one view" },
  { id: "sets", label: "Statement sets", description: "Coordinated, ready to wear" },
  { id: "dresses", label: "Sunday best", description: "Dresses made for worship" },
  { id: "essentials", label: "Everyday ease", description: "Soft layers + staples" },
];

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const { config, loading: configLoading } = useSiteConfig();
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

  const filterRowAnimation = useMemo(
    () => ({
      targets: ".shop-filter-piece",
      opacity: [0, 1],
      translateY: [14, 0],
      delay: stagger(70),
      duration: 320,
      easing: "easeOutCubic",
    }),
    []
  );

  const heroRef = useAnimeOnScroll(heroAnimation);
  const filterRowRef = useAnimeOnScroll(filterRowAnimation);

  const showViewAllButton = config?.shop?.showViewAllButton ?? true;
  const isShopHidden = config?.shop?.showShopSection === false;

  const filterProducts = useCallback((list: Product[], filterId: FilterId) => {
    const visible = list.filter((p) => p.visible !== false);
    if (filterId === "all") return visible;

    const matchesKeyword = (product: Product, keywords: string[]) => {
      const haystack = `${product.name} ${product.description ?? ""}`.toLowerCase();
      return keywords.some((word) => haystack.includes(word));
    };

    const matches = visible.filter((product) => {
      switch (filterId) {
        case "sets":
          return matchesKeyword(product, ["set", "skirt", "pair", "co-ord", "two piece"]);
        case "dresses":
          return matchesKeyword(product, ["dress", "gown", "sunday", "wrap", "maxi"]);
        case "essentials":
          return product.price < 130 || matchesKeyword(product, ["top", "pant", "trouser", "layer", "everyday"]);
        default:
          return true;
      }
    });

    return matches.length ? matches : visible;
  }, []);

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
        const curated = filterProducts(visible, "all").slice(0, 6);
        setDisplayedProducts(curated);
        requestAnimationFrame(() => requestAnimationFrame(playEntrance));
      })
      .catch((error) => {
        console.error("Failed to load products:", error);
        // Set empty array to show "no products" message instead of hiding completely
        setProducts([]);
        setDisplayedProducts([]);
      })
      .finally(() => setLoading(false));
  }, [filterProducts, playEntrance]);

  const handleFilterChange = (filterId: FilterId) => {
    if (filterId === activeFilter) return;
    const nextList = filterProducts(products, filterId).slice(0, 6);
    setActiveFilter(filterId);
    setDisplayedProducts(nextList);
    requestAnimationFrame(() => requestAnimationFrame(playEntrance));
  };

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

  const handleAddToCart = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
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

  if (isShopHidden) {
    return null;
  }

  // Show loading while products are being fetched
  if (loading) {
    return (
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <div className="grid gap-3 sm:grid-cols-3 shop-hero-piece">
            {[
              { icon: <Wand2 className="h-4 w-4" />, title: "Mix + match ready", body: "Pieces pair across the line." },
              { icon: <ShoppingBag className="h-4 w-4" />, title: "Modesty, refined", body: "Longer hems, luxe fabrics." },
              { icon: <Sparkles className="h-4 w-4" />, title: "Ships with care", body: "Pressed, wrapped, tracked." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl bg-white/70 backdrop-blur-sm p-4 shadow-soft">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={filterRowRef} className="mt-12 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            {filterOptions.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "shop-filter-piece rounded-full px-5 py-2.5 transition-transform",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-white/70 backdrop-blur-sm border border-border"
                )}
                onClick={() => handleFilterChange(filter.id)}
              >
                <span className="text-sm font-medium">{filter.label}</span>
              </Button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shop-filter-piece">
            <p className="text-sm text-muted-foreground">
              Showing {displayedProducts.length} {displayedProducts.length === 1 ? "look" : "looks"} ·{" "}
              {filterOptions.find((f) => f.id === activeFilter)?.description}
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" className="text-primary gap-2" onClick={() => handleFilterChange("all")}>
                Reset
              </Button>
              {showViewAllButton && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate("/products")}
                >
                  View full collection
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div ref={gridRef} className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {displayedProducts.map((product) => (
            <div
              key={product.productId}
              className="product-card relative cursor-pointer bg-white/80 backdrop-blur shadow-soft border border-border overflow-hidden opacity-0"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.06))" }}
              onMouseEnter={handleProductHover}
              onMouseLeave={handleProductLeave}
              onClick={() => navigate(`/product/${product.productId}`)}
            >
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full bg-black/60 text-white px-3 py-1 text-xs tracking-wide uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Ready to ship
              </div>
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
