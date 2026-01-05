import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { CheckCircle2, Package, Mail } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  // Clear cart on successful checkout
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Card className="border-border shadow-luxury">
          <CardHeader className="flex flex-col items-center text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-3xl font-heading text-foreground">
              Thank you for your order!
            </CardTitle>
            <p className="text-muted-foreground max-w-xl">
              Your payment was processed successfully. We've sent a confirmation email with your order details.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order confirmation details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">A confirmation email has been sent to your email address</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">You'll receive tracking information once your order ships</span>
              </div>
              {sessionId && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Reference: {sessionId.slice(0, 20)}...
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="btn-luxury">
                <Link to="/">Return Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
