import Stripe from "stripe";

// AWS Lambda-style handler (payment intent for embedded checkout).
// Env:
// STRIPE_SECRET_KEY, STRIPE_CONNECT_ACCOUNT_ID
// STRIPE_SUCCESS_URL (optional), STRIPE_CANCEL_URL (optional)

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const connectAccount = process.env.STRIPE_CONNECT_ACCOUNT_ID;

const stripe = new Stripe(stripeSecret || "", {
  apiVersion: "2024-11-20",
});

export const handler = async (event: any) => {
  if (!stripeSecret || !connectAccount) {
    return { statusCode: 500, body: "Stripe environment not configured" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const { items = [], customer = {}, successUrl, cancelUrl, currency = "usd" } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: "No items provided" };
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const shipping = subtotal > 100 ? 0 : 10;
    const tax = subtotal * 0.08;
    const total = Math.max(0, subtotal + shipping + tax);

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(total * 100),
        currency,
        automatic_payment_methods: { enabled: true },
        shipping: customer?.address
          ? {
              name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
              phone: customer.phone,
              address: {
                line1: customer.address,
                city: customer.city,
                state: customer.state,
                postal_code: customer.zip,
                country: customer.country || "US",
              },
            }
          : undefined,
        metadata: {
          items: JSON.stringify(
            items.map((i: any) => ({
              id: i.productId,
              name: i.name,
              qty: i.quantity,
              price: i.price,
            }))
          ),
          shipping: shipping.toString(),
          tax: tax.toString(),
          subtotal: subtotal.toString(),
          successUrl: successUrl || process.env.STRIPE_SUCCESS_URL || "",
          cancelUrl: cancelUrl || process.env.STRIPE_CANCEL_URL || "",
        },
      },
      { stripeAccount: connectAccount }
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };
  } catch (error: any) {
    console.error("Stripe error", error);
    return { statusCode: 500, body: error?.message || "Failed to create payment intent" };
  }
};

