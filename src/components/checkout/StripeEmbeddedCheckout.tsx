import { useCallback, useState } from "react";
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

export interface CheckoutParams {
  cartId?: string;
  lineItems: Array<{
    quantity: number;
    price_data: {
      currency: string;
      product_data: { name: string };
      unit_amount: number;
    };
  }>;
  siteId: string;
  customer?: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  shippingCostCents?: number;
  shippingCode?: string;
  discountCode?: string;
  discountPercent?: number;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
  };
  shippingQuote?: {
    carrier: string;
    service: string;
    deliveryDays?: number;
    totalWeight: number;
  };
}

interface StripeEmbeddedCheckoutProps {
  checkoutParams: CheckoutParams;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

const CHECKOUT_ENDPOINT =
  import.meta.env.VITE_CHECKOUT_ENDPOINT ??
  "https://d1pqkh0r4pj29.cloudfront.net/admin/checkout/create-session";

const CHECKOUT_SESSION_ID_KEY = "checkout_session_id";

export default function StripeEmbeddedCheckout({
  checkoutParams,
  onComplete,
  onError,
}: StripeEmbeddedCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      const origin = window.location.origin;
      const returnUrl = `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

      const res = await fetch(CHECKOUT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          ...checkoutParams,
          mode: "payment",
          uiMode: "embedded",
          returnUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Checkout failed (${res.status})`);
      }

      if (data?.id) {
        window.sessionStorage.setItem(CHECKOUT_SESSION_ID_KEY, String(data.id));
      }

      const clientSecret = data?.clientSecret || data?.client_secret;
      if (!clientSecret) {
        throw new Error("Checkout response missing clientSecret");
      }

      return clientSecret;
    } catch (err: any) {
      setError(err.message || "Failed to initialize checkout");
      onError?.(err);
      throw err;
    }
  }, [checkoutParams, onError]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="text-primary underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[400px]">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret, onComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
