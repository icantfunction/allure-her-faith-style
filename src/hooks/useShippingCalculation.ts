import { useState, useCallback } from "react";
import { calculateShipping, ShippingQuote } from "@/lib/api";

export type ShippingAddressInput = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
};

export type ShippingState = {
  loading: boolean;
  quote: ShippingQuote | null;
  error: string | null;
};

export function useShippingCalculation() {
  const [shippingState, setShippingState] = useState<ShippingState>({
    loading: false,
    quote: null,
    error: null,
  });

  const fetchShipping = useCallback(async (address: ShippingAddressInput, quantity: number) => {
    // Validate required fields
    if (!address.line1 || !address.city || !address.state || !address.postal_code) {
      setShippingState({ loading: false, quote: null, error: null });
      return null;
    }

    setShippingState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const quote = await calculateShipping({
        quantity,
        address: {
          name: address.name,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country || "US",
        },
      });
      setShippingState({ loading: false, quote, error: null });
      return quote;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to calculate shipping";
      setShippingState({ loading: false, quote: null, error: errorMessage });
      return null;
    }
  }, []);

  const resetShipping = useCallback(() => {
    setShippingState({ loading: false, quote: null, error: null });
  }, []);

  return {
    ...shippingState,
    fetchShipping,
    resetShipping,
  };
}
