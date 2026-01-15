import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type ImagePayload = {
  dataUrl: string;
  base64: string;
};

const readImage = (file: File): Promise<ImagePayload> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.split(",")[1] || "";
      resolve({ dataUrl, base64 });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export default function VirtualTryOn() {
  const [personImage, setPersonImage] = useState<ImagePayload | null>(null);
  const [productImage, setProductImage] = useState<ImagePayload | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleCount, setSampleCount] = useState(1);
  const [baseSteps, setBaseSteps] = useState(30);

  const handlePersonChange = async (file?: File | null) => {
    if (!file) return;
    const payload = await readImage(file);
    setPersonImage(payload);
    setResultImage(null);
  };

  const handleProductChange = async (file?: File | null) => {
    if (!file) return;
    const payload = await readImage(file);
    setProductImage(payload);
    setResultImage(null);
  };

  const handleGenerate = async () => {
    if (!personImage || !productImage) {
      setError("Upload both a person photo and a garment image.");
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
          productBase64: productImage.base64,
          sampleCount,
          baseSteps,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Try-on request failed");
      }
      const resultBase64 = data?.imageBase64;
      if (!resultBase64) {
        throw new Error("No image returned from Vertex AI.");
      }
      setResultImage(`data:image/png;base64,${resultBase64}`);
    } catch (err: any) {
      setError(err?.message || "Try-on failed.");
    } finally {
      setLoading(false);
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
            Upload a person photo and a garment image. We’ll generate a preview
            using Vertex AI.
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
                <Label htmlFor="productImage">Garment Photo</Label>
                <Input
                  id="productImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProductChange(e.target.files?.[0])}
                />
                {productImage && (
                  <img
                    src={productImage.dataUrl}
                    alt="Garment preview"
                    className="mt-3 w-full max-h-72 object-cover rounded-lg border"
                  />
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sampleCount">Sample Count</Label>
                  <Input
                    id="sampleCount"
                    type="number"
                    min={1}
                    max={4}
                    value={sampleCount}
                    onChange={(e) => setSampleCount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseSteps">Base Steps</Label>
                  <Input
                    id="baseSteps"
                    type="number"
                    min={10}
                    max={60}
                    value={baseSteps}
                    onChange={(e) => setBaseSteps(Number(e.target.value))}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full btn-luxury"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
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
