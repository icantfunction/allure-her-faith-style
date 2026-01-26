import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { getCartId, getStoredContact, setStoredContact } from "@/lib/checkoutContact";
import { syncAbandonedCart } from "@/api/abandonedCart";
import { SITE_ID } from "@/utils/siteId";

export default function CheckoutContact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items } = useCart();
  const saved = getStoredContact();

  const [firstName, setFirstName] = useState(saved?.firstName ?? "");
  const [lastName, setLastName] = useState(saved?.lastName ?? "");
  const [email, setEmail] = useState(saved?.email ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: "Missing info",
        description: "Please add your first name, last name, and email.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const contact = setStoredContact({ firstName, lastName, email });

    setSubmitting(true);
    try {
      await syncAbandonedCart({
        siteId: SITE_ID,
        cartId: getCartId(),
        items,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        source: "contact",
      });
    } catch (error: any) {
      toast({
        title: "Saved locally",
        description: "We could not save your cart just yet, but you can keep going.",
      });
    } finally {
      setSubmitting(false);
      navigate("/checkout");
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

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Card className="border-border shadow-luxury">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-heading">Where should we send your cart?</CardTitle>
            <CardDescription>
              We only use this to save your checkout and send updates about your order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="pt-2 space-y-3">
                <Button type="submit" className="w-full btn-luxury" disabled={submitting}>
                  {submitting ? "Saving..." : "Continue to Shipping"}
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/">Return to shop</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
