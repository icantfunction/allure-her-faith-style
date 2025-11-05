import React from "react";
import { PublicAPI, AdminAPI } from "../../lib/api";
import { uploadWithPresign } from "../../lib/upload";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Plus, Loader2, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Product = {
  productId: string;
  name: string;
  price: number;
  images?: string[];
  imageUrls?: string[];
};

export default function Products() {
  const [list, setList] = React.useState<Product[]>([]);
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState<number>(0);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => { 
    PublicAPI.listProducts().then(setList).catch(console.error); 
  }, []);

  async function create() {
    try {
      setBusy(true);
      let images: string[] = [];
      if (file) {
        const presign = await AdminAPI.presignImage(file.name, file.type || "application/octet-stream");
        await uploadWithPresign(presign.uploadUrl, file);
        images = [presign.key];
      }
      await AdminAPI.createProduct({ name, price, images });
      setName(""); setPrice(0); setFile(null);
      setList(await PublicAPI.listProducts());
      toast({
        title: "Success!",
        description: "Product created successfully",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground">Products</h1>
            <p className="text-muted-foreground text-sm">Manage your product inventory</p>
          </div>
        </div>
      </motion.div>

      {/* Create Product Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-border shadow-luxury">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Product
            </CardTitle>
            <CardDescription>Add a new product to your inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ImagePlus className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={create}
              disabled={busy || !name}
              className="w-full md:w-auto"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Product
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Products List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border shadow-luxury">
          <CardHeader>
            <CardTitle className="font-heading">Current Products</CardTitle>
            <CardDescription>{list.length} product(s) in inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {list.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No products yet. Create your first product above.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {list.map((p, idx) => (
                  <motion.div
                    key={p.productId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    {p.imageUrls?.[0] && (
                      <img
                        src={p.imageUrls[0]}
                        alt={p.name}
                        className="w-full h-40 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-foreground">{p.name}</h3>
                      <p className="text-lg font-semibold text-primary">
                        ${p.price.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
