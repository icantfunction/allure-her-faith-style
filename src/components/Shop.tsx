import { Button } from "@/components/ui/button";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";

const Shop = () => {
  const products = [
    {
      id: 1,
      name: "Grace Set",
      description: "Elegant two-piece perfect for worship and beyond",
      price: "$158",
      image: product1,
    },
    {
      id: 2,
      name: "Beloved Ensemble",
      description: "Timeless sophistication for every occasion",
      price: "$142",
      image: product2,
    },
    {
      id: 3,
      name: "Faith & Fashion Set",
      description: "Modest luxury that speaks to your heart",
      price: "$175",
      image: product1,
    },
    {
      id: 4,
      name: "Pure Elegance",
      description: "Refined pieces for the modern faithful woman",
      price: "$165",
      image: product2,
    },
  ];

  return (
    <section className="py-20 px-6 bg-muted">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-section-title mb-6 text-primary">
            Shop the Collection
          </h2>
          <p className="text-subhero max-w-2xl mx-auto">
            Versatile sets that transition beautifully from church to casual luxury, 
            designed for the woman who values both style and substance.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="font-heading text-xl mb-2 text-foreground">
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg text-primary">
                    {product.price}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="btn-outline-luxury text-sm px-4 py-2"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button className="btn-luxury">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Shop;