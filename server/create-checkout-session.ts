import Stripe from "stripe";

// AWS Lambda-style handler for Stripe Checkout Sessions (embedded or hosted).
// Env:
// STRIPE_SECRET_KEY, STRIPE_CONNECT_ACCOUNT_ID (optional)

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const connectAccount = process.env.STRIPE_CONNECT_ACCOUNT_ID;

const stripe = new Stripe(stripeSecret || "", {
  apiVersion: "2024-11-20",
});

export const handler = async (event: any) => {
  if (!stripeSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "Stripe environment not configured" }) };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const { 
      items = [], 
      customer = {}, 
      uiMode = "hosted",
      successUrl,
      cancelUrl,
      returnUrl,
      currency = "usd",
      discountCode,
      discountPercent
    } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No items provided" }) };
    }

    // Build line items for Stripe Checkout
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round((item.price || 0) * 100),
      },
      quantity: item.quantity || 1,
    }));

    const normalizedCurrency = String(currency || "usd").toLowerCase();
    const paymentMethodTypes = ["card", "link"];
    if (normalizedCurrency === "usd") {
      paymentMethodTypes.push("affirm", "cashapp", "klarna");
    }
    if (normalizedCurrency === "eur") {
      paymentMethodTypes.push("klarna", "eps");
    }

    // Determine origin for return/success URLs
    const origin = event.headers?.origin || event.headers?.Origin || "https://shopallureher.com";
    const isEmbedded = uiMode === "embedded";

    // Build session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      payment_method_types: paymentMethodTypes,
      customer_email: customer.email || undefined,
      metadata: {
        customerName: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
        customerPhone: customer.phone || "",
        ...(discountCode ? { discountCode: String(discountCode).trim().toUpperCase() } : {}),
        ...(Number.isFinite(discountPercent)
          ? { discountPercent: String(discountPercent) }
          : {}),
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      ...(isEmbedded
        ? {
            ui_mode: "embedded",
            return_url: returnUrl || `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          }
        : {
            success_url: successUrl || `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${origin}/checkout`,
          }),
    };

    // Create session (with optional Connect account)
    const session = connectAccount
      ? await stripe.checkout.sessions.create(sessionParams, { stripeAccount: connectAccount })
      : await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(
        isEmbedded
          ? { clientSecret: session.client_secret }
          : { url: session.url }
      ),
    };
  } catch (error: any) {
    console.error("Stripe error", error);
    return { 
      statusCode: 500, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error?.message || "Failed to create checkout session" }) 
    };
  }
};

