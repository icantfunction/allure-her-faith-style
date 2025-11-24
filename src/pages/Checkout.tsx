import { useCart } from "@/contexts/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createCheckoutSession } from "@/api/checkout";
import { SITE_ID } from "@/utils/siteId";

export default function Checkout() {
  const { items, totalPrice, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = totalPrice;
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const total = subtotal + tax + shipping;

  const handleCheckout = async () => {
    if (!import.meta.env.VITE_CHECKOUT_ENDPOINT) {
      toast({
        title: "Checkout not configured",
        description: "Add VITE_CHECKOUT_ENDPOINT to your env to enable payments.",
        variant: "destructive",
      });
      return;
    }

    if (!firstName || !lastName || !email || !address || !city || !state || !zip) {
      toast({
        title: "Missing details",
        description: "Please complete your shipping contact information.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const lineItems = items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(Number(item.price ?? 0) * 100),
        },
      }));

      const session = await createCheckoutSession({
        lineItems,
        mode: "payment",
        siteId: SITE_ID,
      });

      if (session?.url) {
        window.location.href = session.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Checkout failed",
        description: error.message || "We couldn't start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-heading mb-4 text-foreground">Your cart is empty</h2>
          <Button onClick={() => navigate("/")} className="btn-luxury">
            Continue Shopping
          </Button>
        </div>
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
          <span className="text-foreground">Checkout</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-heading font-semibold text-foreground mb-8"
        >
          Checkout
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items & Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border shadow-luxury">
                <CardHeader>
                  <CardTitle className="font-heading">Your Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, idx) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="flex gap-4 pb-4 border-b last:border-0"
                    >
                      {item.imageUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{item.name}</h3>
                        <p className="text-sm text-primary font-medium">${Number(item.price ?? 0).toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <p className="font-semibold text-foreground">
                          ${(Number(item.price ?? 0) * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Shipping Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border shadow-luxury">
                <CardHeader>
                  <CardTitle className="font-heading">Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border shadow-luxury sticky top-6">
                <CardHeader>
                  <CardTitle className="font-heading">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-foreground">
                        {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (8%)</span>
                      <span className="text-foreground">${tax.toFixed(2)}</span>
                    </div>
                    {subtotal < 100 && (
                      <p className="text-xs text-muted-foreground">
                        Add ${(100 - subtotal).toFixed(2)} more for free shipping
                      </p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                  
                  <Button
                    className="w-full btn-luxury"
                    size="lg"
                    disabled={submitting}
                    onClick={handleCheckout}
                  >
                    {submitting ? "Redirecting..." : "Proceed to Payment"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

type AddressAndPaymentProps = {
  onShippingChange: (value: any) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  successUrl: string;
  cancelUrl: string;
  shippingDetails: any;
};

const AddressAndPayment = ({
  onShippingChange,
  submitting,
  setSubmitting,
  successUrl,
  cancelUrl,
  shippingDetails,
}: AddressAndPaymentProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    if (!shippingDetails) {
      toast({
        title: "Missing address",
        description: "Please complete your shipping address and phone.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: successUrl,
          shipping: shippingDetails
            ? {
                name: `${shippingDetails.name || ""}`.trim(),
                phone: shippingDetails.phone,
                address: {
                  line1: shippingDetails.address?.line1,
                  line2: shippingDetails.address?.line2,
                  city: shippingDetails.address?.city,
                  state: shippingDetails.address?.state,
                  postal_code: shippingDetails.address?.postal_code,
                  country: shippingDetails.address?.country,
                },
              }
            : undefined,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message || "We couldn't complete your payment.",
          variant: "destructive",
        });
      } else {
        // If no redirect required and succeeds inline
        window.location.href = successUrl;
      }
    } catch (err: any) {
      toast({
        title: "Payment failed",
        description: err?.message || "We couldn't complete your payment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AddressElement
        options={{
          mode: "shipping",
          fields: {
            phone: "always",
          },
          validation: {
            phone: { required: "always" },
          },
          allowedCountries: ["US", "CA"],
        }}
        onChange={(event) => {
          if (event.complete) {
            onShippingChange(event.value);
          }
        }}
      />
      <PaymentElement />
      <Button
        className="w-full btn-luxury"
        size="lg"
        disabled={submitting || !stripe || !elements}
        onClick={handleSubmit}
      >
        {submitting ? "Processing..." : "Pay now"}
      </Button>
    </div>
  );
};
