import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicAPI } from "@/lib/api";
import { useSearchParams } from "react-router-dom";

type ImagePayload = {
  dataUrl: string;
  base64: string;
  contentType: string;
};

type Product = {
  productId: string;
  name: string;
  imageUrls?: string[];
  visible?: boolean;
};

const readImage = (file: File): Promise<ImagePayload> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.split(",")[1] || "";
      resolve({ dataUrl, base64, contentType: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const ProgressPie = ({ value }: { value: number }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const angle = (clamped / 100) * 360;
  const fill = `conic-gradient(hsl(var(--primary)) ${angle}deg, hsl(var(--muted)) 0deg)`;

  return (
    <div className="relative h-10 w-10 shrink-0">
      <div
        className="h-10 w-10 rounded-full"
        style={{ background: fill }}
      />
      <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center text-[10px] font-semibold text-foreground">
        {clamped}%
      </div>
    </div>
  );
};

export default function VirtualTryOn() {
  const [searchParams] = useSearchParams();
  const [personImage, setPersonImage] = useState<ImagePayload | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    setProductsLoading(true);
    setProductsError(null);
    PublicAPI.listProducts()
      .then((data) => {
        if (!active) return;
        const visible = (data || []).filter(
          (item: Product) => item.visible !== false && item.imageUrls?.[0]
        );
        setProducts(visible);
        const requestedId =
          searchParams.get("productId") || searchParams.get("product") || "";
        const requestedProduct = requestedId
          ? visible.find((item) => item.productId === requestedId)
          : null;
        const initialProduct = requestedProduct || visible[0];
        if (initialProduct) {
          setSelectedProductId(initialProduct.productId);
          setProductImageUrl(initialProduct.imageUrls?.[0] || null);
        } else {
          setSelectedProductId("");
          setProductImageUrl(null);
        }
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setSelectedProductId("");
        setProductImageUrl(null);
        setProductsError("Unable to load products. Please try again.");
      })
      .finally(() => {
        if (!active) return;
        setProductsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const bump = Math.max(2, Math.round(Math.random() * 12));
        return Math.min(90, prev + bump);
      });
    }, 450);

    return () => {
      window.clearInterval(interval);
    };
  }, [loading]);

  const handlePersonChange = async (file?: File | null) => {
    if (!file) return;
    const payload = await readImage(file);
    setPersonImage(payload);
    setResultImage(null);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const next = products.find((item) => item.productId === productId);
    setProductImageUrl(next?.imageUrls?.[0] || null);
    setResultImage(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!personImage || !productImageUrl) {
      setError("Upload a person photo and choose a product to try on.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        import.meta.env.VITE_TRYON_API_URL || "/api/virtual-try-on";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personBase64: personImage.base64,
          personContentType: personImage.contentType,
          productImageUrl,
          productId: selectedProductId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          `Try-on failed (${res.status}): ${data?.error || res.statusText || "request_failed"}`
        );
      }
      const resultBase64 = data?.imageBase64;
      if (!resultBase64) {
        throw new Error(`Try-on failed (${res.status}): no_image_returned`);
      }
      setResultImage(`data:image/png;base64,${resultBase64}`);
    } catch (err: any) {
      setError(err?.message || "Try-on failed.");
    } finally {
      setProgress(100);
      window.setTimeout(() => {
        setLoading(false);
      }, 200);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-4xl font-heading font-semibold text-foreground">
            Virtual Try-On
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload a person photo and select a product.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border shadow-luxury">
            <CardHeader>
              <CardTitle className="font-heading">Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="personImage">Person Photo</Label>
                <Input
                  id="personImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePersonChange(e.target.files?.[0])}
                />
                {personImage && (
                  <img
                    src={personImage.dataUrl}
                    alt="Person preview"
                    className="mt-3 w-full max-h-72 object-cover rounded-lg border"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productSelect">Product to Try On</Label>
                <select
                  id="productSelect"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  disabled={productsLoading || products.length === 0}
                >
                  <option value="">
                    {productsLoading ? "Loading products..." : "Select a product"}
                  </option>
                  {products.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {productsError && (
                  <p className="text-sm text-destructive">{productsError}</p>
                )}
                {!productsError && products.length === 0 && !productsLoading && (
                  <p className="text-sm text-muted-foreground">
                    No products available yet.
                  </p>
                )}
                {productImageUrl && (
                  <img
                    src={productImageUrl}
                    alt="Selected product preview"
                    className="mt-3 w-full max-h-72 object-cover rounded-lg border"
                  />
                )}
              </div>



              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full btn-luxury"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <ProgressPie value={progress} />
                    <span>Generating {Math.round(progress)}%</span>
                  </span>
                ) : (
                  "Generate Try-On"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-luxury">
            <CardHeader>
              <CardTitle className="font-heading">Result</CardTitle>
            </CardHeader>
            <CardContent>
              {resultImage ? (
                <img
                  src={resultImage}
                  alt="Virtual try-on result"
                  className="w-full rounded-lg border"
                />
              ) : (
                <div className="min-h-[320px] flex items-center justify-center text-muted-foreground">
                  Your generated preview will appear here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
