import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

// Initialize Stripe with publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

interface StripeEmbeddedCheckoutProps {
  clientSecret: string;
  onComplete?: () => void;
}

export default function StripeEmbeddedCheckout({
  clientSecret,
  onComplete,
}: StripeEmbeddedCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Missing checkout session</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret, onComplete }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}
