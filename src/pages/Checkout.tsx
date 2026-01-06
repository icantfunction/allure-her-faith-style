import { useCart } from "@/contexts/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, ShoppingBag, Trash2, Minus, Plus, Loader2, Truck, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateShipping, createCheckoutSession, ShippingQuote } from "@/lib/checkoutApi";
import { SITE_ID } from "@/utils/siteId";
import { useDebounce } from "@/hooks/useDebounce";
import StripeEmbeddedCheckout from "@/components/checkout/StripeEmbeddedCheckout";

export default function Checkout() {
  const { items, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Embedded checkout state
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [showEmbeddedCheckout, setShowEmbeddedCheckout] = useState(false);
  
  // Shipping state
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Calculate total quantity
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Debounce address fields (400ms)
  const debouncedAddress = useDebounce(address, 400);
  const debouncedCity = useDebounce(city, 400);
  const debouncedState = useDebounce(state, 400);
  const debouncedZip = useDebounce(zip, 400);

  // Fetch shipping when address changes
  const fetchShipping = useCallback(async () => {
    if (!debouncedAddress || !debouncedCity || !debouncedState || !debouncedZip || totalQuantity <= 0) {
      setShippingQuote(null);
      setShippingError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setShippingLoading(true);
    setShippingError(null);

    try {
      const quote = await calculateShipping({
        quantity: totalQuantity,
        address: {
          name: `${firstName} ${lastName}`.trim() || "Customer",
          line1: debouncedAddress,
          line2: addressLine2 || undefined,
          city: debouncedCity,
          state: debouncedState,
          postal_code: debouncedZip,
          country: "US",
        },
      });

      // Only update if this is the latest request
      if (currentRequestId === requestIdRef.current) {
        setShippingQuote(quote);
        setShippingLoading(false);
      }
    } catch (err: any) {
      if (currentRequestId === requestIdRef.current) {
        setShippingError(err?.message || "Failed to calculate shipping");
        setShippingQuote(null);
        setShippingLoading(false);
      }
    }
  }, [debouncedAddress, debouncedCity, debouncedState, debouncedZip, totalQuantity, firstName, lastName, addressLine2]);

  useEffect(() => {
    fetchShipping();
  }, [fetchShipping]);

  // Show toast when shipping calculation fails
  useEffect(() => {
    if (shippingError) {
      toast({
        title: "Couldn't calculate shipping",
        description: "Please check your address and try again.",
        variant: "destructive",
      });
    }
  }, [shippingError, toast]);

  const subtotal = totalPrice;
  const tax = subtotal * 0.08; // 8% tax
  
  // Use real shipping quote - no fallback, must have valid quote to proceed
  const shippingCost = shippingQuote ? shippingQuote.shippingAmountCents / 100 : 0;
  const total = subtotal + tax + shippingCost;
  
  // Address is complete when all required fields are filled
  const addressComplete = address && city && state && zip;
  
  // Can only proceed to payment when we have a valid shipping quote
  const canProceedToPayment = !!(shippingQuote && !shippingLoading && !shippingError);

  const handleCheckout = async () => {
    if (!firstName || !lastName || !email || !address || !city || !state || !zip) {
      toast({
        title: "Missing details",
        description: "Please complete your shipping contact information.",
        variant: "destructive",
      });
      return;
    }

    if (!shippingQuote) {
      toast({
        title: "Shipping required",
        description: "Please wait for shipping calculation to complete.",
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

      const shippingAddress = {
        name: `${firstName} ${lastName}`.trim(),
        line1: address,
        line2: addressLine2 || undefined,
        city,
        state,
        postal_code: zip,
        country: "US",
      };

      const result = await createCheckoutSession({
        lineItems,
        mode: "payment",
        siteId: SITE_ID,
        uiMode: "embedded",
        customer: {
          email,
          firstName,
          lastName,
          phone: phone || undefined,
        },
        shippingCostCents: shippingQuote.shippingAmountCents,
        shippingAddress,
        shippingQuote,
      });

      if (result.clientSecret) {
        setCheckoutClientSecret(result.clientSecret);
        setShowEmbeddedCheckout(true);
      } else if (result.url) {
        // Fallback to hosted checkout if backend doesn't support embedded
        window.location.assign(result.url);
      }
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "We couldn't start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToCart = () => {
    setShowEmbeddedCheckout(false);
    setCheckoutClientSecret(null);
  };

  const handleCheckoutComplete = () => {
    // Navigate to success page
    navigate("/checkout/success");
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

  // Show embedded checkout when ready
  if (showEmbeddedCheckout && checkoutClientSecret) {
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
            <button 
              onClick={handleBackToCart}
              className="hover:text-primary transition-colors"
            >
              Checkout
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Payment</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button 
              variant="ghost" 
              onClick={handleBackToCart}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to cart
            </Button>
            <h1 className="text-4xl font-heading font-semibold text-foreground">
              Complete Payment
            </h1>
            <p className="text-muted-foreground mt-2">
              Secure checkout powered by Stripe
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border shadow-luxury overflow-hidden">
              <CardContent className="p-0">
                <StripeEmbeddedCheckout 
                  clientSecret={checkoutClientSecret}
                  onComplete={handleCheckoutComplete}
                />
              </CardContent>
            </Card>
          </motion.div>
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
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2 (optional)</Label>
                    <Input id="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Apt, suite, unit, etc." />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g., FL" />
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
                      <span className="text-muted-foreground">Subtotal ({totalQuantity} items)</span>
                      <span className="text-foreground">${subtotal.toFixed(2)}</span>
                    </div>
                    
                    {/* Shipping Section */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        Shipping
                        {shippingLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                      </span>
                      <span className="text-foreground">
                        {shippingLoading ? (
                          "Calculating..."
                        ) : shippingQuote ? (
                          shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`
                        ) : addressComplete ? (
                          <span className="text-muted-foreground">Enter address</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Shipping Details */}
                    {shippingQuote && (
                      <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Truck className="h-3 w-3" />
                          <span>{shippingQuote.carrier} - {shippingQuote.service}</span>
                        </div>
                        {shippingQuote.deliveryDays && (
                          <p className="text-muted-foreground">
                            Estimated delivery: {shippingQuote.deliveryDays} business day{shippingQuote.deliveryDays > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {shippingError && (
                      <p className="text-xs text-destructive">{shippingError}</p>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (8%)</span>
                      <span className="text-foreground">${tax.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                  
                  <Button
                    className="w-full btn-luxury"
                    size="lg"
                    disabled={submitting || !canProceedToPayment}
                    onClick={handleCheckout}
                  >
                    {submitting ? "Redirecting..." : shippingLoading ? "Calculating Shipping..." : "Proceed to Payment"}
                  </Button>
                  
                  {!canProceedToPayment && addressComplete && !shippingLoading && (
                    <p className="text-xs text-center text-muted-foreground">
                      Complete your shipping address to see shipping options
                    </p>
                  )}
                  
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
