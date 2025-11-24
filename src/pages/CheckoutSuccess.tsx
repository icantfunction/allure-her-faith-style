import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const CheckoutSuccess = () => {
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
              Thank you for your order
            </CardTitle>
            <p className="text-muted-foreground max-w-xl">
              Your payment was processed securely. We’ve sent a confirmation email with your order details.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="btn-luxury">
              <Link to="/">Return Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
