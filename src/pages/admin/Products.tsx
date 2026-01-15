import React from "react";
import { PublicAPI, AdminAPI } from "../../lib/api";
import { uploadWithPresign } from "../../lib/upload";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag, Plus, Loader2, ImagePlus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

type Product = {
  productId: string;
  name: string;
  price?: number;
  description?: string;
  images?: string[];
  imageUrls?: string[];
  visible?: boolean;
};

export default function Products() {
  const [list, setList] = React.useState<Product[]>([]);
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState<number>(0);
  const [description, setDescription] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [busy, setBusy] = React.useState(false);
  
  // Edit state
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editPrice, setEditPrice] = React.useState<number>(0);
  const [editDescription, setEditDescription] = React.useState("");
  const [editFiles, setEditFiles] = React.useState<File[]>([]);
  
  // Delete state
  const [deleteProductId, setDeleteProductId] = React.useState<string | null>(null);
  
  const { toast } = useToast();

  React.useEffect(() => { 
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await PublicAPI.listProducts();
      const normalized = (data || []).map((item: Product) => ({
        ...item,
        price: item.price ?? 0,
      }));
      setList(normalized);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  }

  async function create() {
    try {
      setBusy(true);
      let images: string[] = [];
      if (files.length > 0) {
        for (const upload of files.slice(0, 2)) {
          const presign = await AdminAPI.presignImage(upload.name, upload.type || "application/octet-stream");
          await uploadWithPresign(presign.uploadUrl, upload);
          images.push(presign.key);
        }
      }
      await AdminAPI.createProduct({ name, price, description, images });
      setName(""); 
      setPrice(0); 
      setDescription("");
      setFiles([]);
      await loadProducts();
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

  async function updateProduct() {
    if (!editingProduct) return;
    
    try {
      setBusy(true);
      let images: string[] | undefined;
      
      if (editFiles.length > 0) {
        images = [];
        for (const upload of editFiles.slice(0, 2)) {
          const presign = await AdminAPI.presignImage(upload.name, upload.type || "application/octet-stream");
          await uploadWithPresign(presign.uploadUrl, upload);
          images.push(presign.key);
        }
      }
      
      await AdminAPI.updateProduct(editingProduct.productId, {
        name: editName,
        price: editPrice,
        description: editDescription,
        ...(images && { images }),
      });
      
      setEditDialogOpen(false);
      setEditingProduct(null);
      setEditFiles([]);
      await loadProducts();
      
      toast({
        title: "Success!",
        description: "Product updated successfully",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(productId: string, currentVisible: boolean) {
    try {
      await AdminAPI.updateProduct(productId, {
        visible: !currentVisible,
      });
      await loadProducts();
      toast({
        title: "Success!",
        description: `Product ${!currentVisible ? 'shown' : 'hidden'}`,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update visibility",
        variant: "destructive",
      });
    }
  }

  async function deleteProduct() {
    if (!deleteProductId) return;
    
    try {
      await AdminAPI.deleteProduct(deleteProductId);
      setDeleteProductId(null);
      await loadProducts();
      toast({
        title: "Success!",
        description: "Product deleted successfully",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price ?? 0);
    setEditDescription(product.description || "");
    setEditFiles([]);
    setEditDialogOpen(true);
  };

  const visibleCount = list.filter(p => p.visible !== false).length;
  const formatPrice = (price?: number) => {
    const value = typeof price === "number" ? price : 0;
    if (Number.isNaN(value)) return "—";
    return `$${value.toFixed(2)}`;
  };

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
            <p className="text-muted-foreground text-sm">
              {visibleCount} visible / {list.length} total products
            </p>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="image"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    if (selected.length > 2) {
                      toast({
                        title: "Too many images",
                        description: "Please select up to 2 images.",
                        variant: "destructive",
                      });
                    }
                    setFiles(selected.slice(0, 2));
                  }}
                  className="cursor-pointer"
                />
                {files.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ImagePlus className="h-4 w-4" />
                    <span>{files.map((upload) => upload.name).join(", ")}</span>
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
              <div className="grid gap-4">
                {list.map((p, idx) => (
                  <motion.div
                    key={p.productId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="border rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow"
                  >
                    {p.imageUrls?.[0] && (
                      <img
                        src={p.imageUrls[0]}
                        alt={p.name}
                        className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground truncate">{p.name}</h3>
                            {p.visible === false && (
                              <Badge variant="secondary" className="text-xs">
                                Hidden
                              </Badge>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {p.description}
                            </p>
                          )}
                          <p className="text-lg font-semibold text-primary">
                            {formatPrice(p.price)}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleVisibility(p.productId, p.visible !== false)}
                          >
                            {p.visible === false ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(p)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteProductId(p.productId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Product Image (optional)</Label>
              <Input
                id="edit-image"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  if (selected.length > 2) {
                    toast({
                      title: "Too many images",
                      description: "Please select up to 2 images.",
                      variant: "destructive",
                    });
                  }
                  setEditFiles(selected.slice(0, 2));
                }}
                className="cursor-pointer"
              />
              {editFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  New images: {editFiles.map((upload) => upload.name).join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={updateProduct} disabled={busy || !editName}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
