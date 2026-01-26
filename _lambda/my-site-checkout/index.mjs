import { createRequire } from "module";
const require = createRequire(import.meta.url);
const AWS = require("aws-sdk");
import Stripe from "stripe";

const sm = new AWS.SecretsManager({ region: process.env.AWS_REGION || "us-east-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ region: process.env.AWS_REGION || "us-east-1" });

const ORDERS_TABLE = process.env.ORDERS_TABLE_NAME || "Orders";
const ABANDONED_CARTS_TABLE = process.env.ABANDONED_CARTS_TABLE || "AbandonedCarts";
const ALLOW_TEST_SHIPPING_CODE = process.env.ALLOW_TEST_SHIPPING_CODE === "true";
const TEST_SHIPPING_CODE = (process.env.TEST_SHIPPING_CODE || "DAVID-TEST").trim().toUpperCase();
const ORDER_WEIGHT_OZ = Number(process.env.ORDER_WEIGHT_OZ || "15");
const SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS || "hello@shopallureher.com";
const ORDER_NOTIFICATION_EMAILS = (process.env.ORDER_NOTIFICATION_EMAILS || "info@shopallureher.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

let stripeClient = null;
async function getStripe() {
  if (stripeClient) return stripeClient;

  let key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const secretId =
      process.env.STRIPE_SECRET_ARN ||
      process.env.STRIPE_SECRET_ID ||
      "stripe/my-site/secret-key";

    const sv = await sm.getSecretValue({ SecretId: secretId }).promise();
    let raw =
      sv.SecretString ||
      (sv.SecretBinary ? Buffer.from(sv.SecretBinary, "base64").toString("utf8") : null);

    if (!raw) throw new Error("Stripe secret not found in Secrets Manager");

    try {
      const obj = JSON.parse(raw);
      key = obj["stripe-secret-key"] || obj["stripe_secret_key"] || obj["STRIPE_SECRET_KEY"];
      if (!key) {
        for (const v of Object.values(obj)) {
          if (typeof v === "string" && v.startsWith("sk_")) { key = v; break; }
        }
      }
    } catch {
      key = raw;
    }
  }

  if (!key || !/^sk_(live|test)_/.test(key)) {
    throw new Error("Stripe secret key not found or invalid format");
  }

  stripeClient = new Stripe(key);
  return stripeClient;
}

async function retrieveCheckoutSession(stripe, sessionId, stripeAccount) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    if (stripeAccount) {
      return await stripe.checkout.sessions.retrieve(
        sessionId,
        {},
        { stripeAccount }
      );
    }
    throw err;
  }
}

async function listCheckoutLineItems(stripe, sessionId, stripeAccount) {
  try {
    return await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
  } catch (err) {
    if (stripeAccount) {
      return await stripe.checkout.sessions.listLineItems(
        sessionId,
        { limit: 100 },
        { stripeAccount }
      );
    }
    throw err;
  }
}

async function retrievePaymentIntent(stripe, paymentIntentId, stripeAccount) {
  if (!paymentIntentId) return null;
  try {
    return await stripe.paymentIntents.retrieve(
      paymentIntentId,
      { expand: ["charges.data.transfer"] }
    );
  } catch (err) {
    if (stripeAccount) {
      return await stripe.paymentIntents.retrieve(
        paymentIntentId,
        { expand: ["charges.data.transfer"] },
        { stripeAccount }
      );
    }
    throw err;
  }
}

async function createCheckoutSessionSafe(stripe, args) {
  try {
    return await stripe.checkout.sessions.create(args);
  } catch (err) {
    const message = err?.message || "";
    const param = err?.param || "";
    const code = err?.code || "";
    const isTransferCapabilityIssue =
      code === "insufficient_capabilities_for_transfer" ||
      /stripe_transfers/i.test(message);
    if (isTransferCapabilityIssue && args?.payment_intent_data) {
      const fallback = { ...args };
      delete fallback.payment_intent_data; // fall back to a direct charge
      return await stripe.checkout.sessions.create(fallback);
    }
    const looksLikePaymentTypeIssue =
      param === "payment_method_types" ||
      /payment_method_types/i.test(message) ||
      /payment method/i.test(message) ||
      /payment_method/i.test(code);

    if (!looksLikePaymentTypeIssue) throw err;

    const fallback = { ...args };
    delete fallback.payment_method_types; // let Stripe pick the account defaults
    return await stripe.checkout.sessions.create(fallback);
  }
}

const allowedOrigins = new Set([
  "https://shopallureher.com",
  "https://www.shopallureher.com",
  "http://localhost:5173",
]);

function corsHeaders(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || "";
  const allowOrigin = allowedOrigins.has(origin) ? origin : "https://shopallureher.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type,authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  };
}

function withSessionId(url) {
  if (!url) return url;
  if (url.includes("{CHECKOUT_SESSION_ID}")) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("session_id")) {
      parsed.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
    }
    return parsed.toString();
  } catch {
    return url.includes("session_id=") ? url : `${url}?session_id={CHECKOUT_SESSION_ID}`;
  }
}

function formatCurrency(amountCents, currency) {
  if (typeof amountCents !== "number") return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency || "USD"}`;
  }
}

async function sendConfirmationEmail(order) {
  if (!order?.email) return;

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0; border-bottom:1px solid #eee;">
            <strong>${item.name}</strong><br />
            <span style="color:#666;">Qty: ${item.quantity}</span>
          </td>
          <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:right;">
            ${formatCurrency(Math.round((item.price || 0) * 100), order.currency)}
          </td>
        </tr>
      `
    )
    .join("");

  const address = order.shippingAddress || {};
  const addressLines = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country || "US",
  ]
    .filter(Boolean)
    .join("\n");

  const subject = `Order confirmation ${order.orderId}`;
  const textBody = `Allure Her — Order Confirmation\n\nThank you for your order, ${order.customerName}!\n\nOrder ID: ${order.orderId}\n\nItems:\n${(order.items || [])
    .map((item) => `- ${item.quantity} x ${item.name}`)
    .join("\n")}\n\nSubtotal: ${formatCurrency(
    Math.round((order.subtotal || 0) * 100),
    order.currency
  )}\nShipping: ${formatCurrency(
    Math.round((order.shippingCost || 0) * 100),
    order.currency
  )}\nTax: ${formatCurrency(
    Math.round((order.taxAmount || 0) * 100),
    order.currency
  )}\nTotal: ${formatCurrency(
    Math.round((order.total || 0) * 100),
    order.currency
  )}\n\nShipping to:\n${addressLines}\n\nWe'll send tracking details once your order ships.\n\nWith love,\nAllure Her`;

  const htmlBody = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Order confirmation</title>
      </head>
      <body style="margin:0; background:#f6f2ec; font-family: 'Georgia', 'Times New Roman', serif; color:#111;">
        <div style="padding:24px;">
          <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #ece6df;">
            <div style="padding:24px; background:#111; color:#fff; text-align:center;">
              <div style="font-size:20px; letter-spacing:1px; text-transform:uppercase;">Allure Her</div>
              <div style="margin-top:6px; font-size:14px; color:#d6c7b8;">Order Confirmed</div>
            </div>
            <div style="padding:28px;">
              <p style="margin:0 0 12px;">Hi <strong>${order.customerName || "there"}</strong>,</p>
              <p style="margin:0 0 18px; color:#444;">Thank you for your order. We are preparing your pieces now.</p>
              <div style="padding:14px 16px; border:1px solid #eee; border-radius:12px; background:#faf8f5; margin-bottom:20px;">
                <div style="font-size:12px; color:#777; text-transform:uppercase; letter-spacing:1px;">Order ID</div>
                <div style="font-size:18px; font-weight:700;">${order.orderId}</div>
              </div>

              <table style="width:100%; border-collapse:collapse; margin-bottom:18px;">
                <thead>
                  <tr>
                    <th style="text-align:left; padding-bottom:8px; font-size:12px; color:#666; text-transform:uppercase; letter-spacing:1px;">Item</th>
                    <th style="text-align:right; padding-bottom:8px; font-size:12px; color:#666; text-transform:uppercase; letter-spacing:1px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <tbody>
                  <tr>
                    <td style="padding:4px 0; color:#666;">Subtotal</td>
                    <td style="padding:4px 0; text-align:right;">${formatCurrency(Math.round((order.subtotal || 0) * 100), order.currency)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0; color:#666;">Shipping</td>
                    <td style="padding:4px 0; text-align:right;">${formatCurrency(Math.round((order.shippingCost || 0) * 100), order.currency)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0; color:#666;">Tax</td>
                    <td style="padding:4px 0; text-align:right;">${formatCurrency(Math.round((order.taxAmount || 0) * 100), order.currency)}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:10px; font-weight:700; border-top:1px solid #eee;">Total</td>
                    <td style="padding-top:10px; font-weight:700; text-align:right; border-top:1px solid #eee;">
                      ${formatCurrency(Math.round((order.total || 0) * 100), order.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style="padding:14px 16px; border:1px solid #eee; border-radius:12px; background:#fff;">
                <div style="font-size:12px; color:#666; text-transform:uppercase; letter-spacing:1px;">Shipping to</div>
                <div style="margin-top:6px; white-space:pre-line; color:#333;">${addressLines}</div>
              </div>

              <p style="margin:18px 0 0; color:#444;">We will email tracking details once your order ships.</p>
              <p style="margin:8px 0 0; color:#444;">With love,<br />Allure Her</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await ses
    .sendEmail({
      Source: SES_FROM_ADDRESS,
      Destination: { ToAddresses: [order.email] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: textBody },
          Html: { Data: htmlBody },
        },
      },
    })
    .promise();
}

async function sendAdminOrderEmail(order) {
  if (!ORDER_NOTIFICATION_EMAILS.length) return;

  const itemsText = (order.items || [])
    .map((item) => `- ${item.quantity} x ${item.name}`)
    .join("\n");

  const address = order.shippingAddress || {};
  const addressLines = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country || "US",
  ]
    .filter(Boolean)
    .join("\n");

  const subject = `New order ${order.orderId}`;
  const textBody = `New order received\n\nOrder ID: ${order.orderId}\nCustomer: ${
    order.customerName || "Customer"
  }\nEmail: ${order.email || "N/A"}\nPhone: ${order.phone || "N/A"}\n\nItems:\n${itemsText}\n\nSubtotal: ${formatCurrency(
    Math.round((order.subtotal || 0) * 100),
    order.currency
  )}\nShipping: ${formatCurrency(
    Math.round((order.shippingCost || 0) * 100),
    order.currency
  )}\nTax: ${formatCurrency(
    Math.round((order.taxAmount || 0) * 100),
    order.currency
  )}\nTotal: ${formatCurrency(
    Math.round((order.total || 0) * 100),
    order.currency
  )}\n\nShipping to:\n${addressLines}\n`;

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">
            <strong>${item.name}</strong><br />
            <span style="color:#666;">Qty: ${item.quantity}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">
            ${formatCurrency(Math.round((item.price || 0) * 100), order.currency)}
          </td>
        </tr>
      `
    )
    .join("");

  const htmlBody = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New order</title>
      </head>
      <body style="margin:0;background:#f6f2ec;font-family: 'Georgia','Times New Roman',serif;color:#111;">
        <div style="padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ece6df;">
            <div style="padding:20px;background:#111;color:#fff;text-align:center;">
              <div style="font-size:18px;letter-spacing:1px;text-transform:uppercase;">Allure Her</div>
              <div style="margin-top:6px;font-size:13px;color:#d6c7b8;">New order received</div>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 12px;"><strong>Order ID:</strong> ${order.orderId}</p>
              <p style="margin:0 0 12px;"><strong>Customer:</strong> ${order.customerName || "Customer"}</p>
              <p style="margin:0 0 12px;"><strong>Email:</strong> ${order.email || "N/A"}</p>
              <p style="margin:0 0 18px;"><strong>Phone:</strong> ${order.phone || "N/A"}</p>

              <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
                <thead>
                  <tr>
                    <th style="text-align:left;padding-bottom:6px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Item</th>
                    <th style="text-align:right;padding-bottom:6px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
                <tbody>
                  <tr>
                    <td style="padding:4px 0;color:#666;">Subtotal</td>
                    <td style="padding:4px 0;text-align:right;">${formatCurrency(
                      Math.round((order.subtotal || 0) * 100),
                      order.currency
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#666;">Shipping</td>
                    <td style="padding:4px 0;text-align:right;">${formatCurrency(
                      Math.round((order.shippingCost || 0) * 100),
                      order.currency
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#666;">Tax</td>
                    <td style="padding:4px 0;text-align:right;">${formatCurrency(
                      Math.round((order.taxAmount || 0) * 100),
                      order.currency
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:10px;font-weight:700;border-top:1px solid #eee;">Total</td>
                    <td style="padding-top:10px;font-weight:700;text-align:right;border-top:1px solid #eee;">
                      ${formatCurrency(Math.round((order.total || 0) * 100), order.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style="padding:12px 14px;border:1px solid #eee;border-radius:10px;background:#faf8f5;">
                <div style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Shipping to</div>
                <div style="margin-top:6px;white-space:pre-line;color:#333;">${addressLines}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await ses
    .sendEmail({
      Source: SES_FROM_ADDRESS,
      Destination: { ToAddresses: ORDER_NOTIFICATION_EMAILS },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: textBody },
          Html: { Data: htmlBody },
        },
      },
    })
    .promise();
}
async function handleConfirm(body) {
  const sessionId = body?.sessionId;
  if (!sessionId) {
    return { statusCode: 400, body: { error: "sessionId required" } };
  }

  const stripe = await getStripe();
  const stripeAccount = body?.stripeAccount || process.env.STRIPE_CONNECT_ACCOUNT_ID || undefined;
  const session = await retrieveCheckoutSession(stripe, sessionId, stripeAccount);

  if (!session || session.payment_status !== "paid") {
    return { statusCode: 409, body: { error: "payment_not_confirmed" } };
  }

  const lineItems = await listCheckoutLineItems(stripe, sessionId, stripeAccount);
  const items = (lineItems.data || []).map((item) => {
    const unitAmount = item.price?.unit_amount ?? (item.amount_total ? item.amount_total / item.quantity : 0);
    return {
      name: item.description || item.price?.product?.name || "Item",
      quantity: item.quantity || 1,
      price: (unitAmount || 0) / 100,
      weight: ORDER_WEIGHT_OZ,
    };
  });

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);

  const metadata = session.metadata || {};
  const cartId = body?.cartId || metadata.cartId || null;
  let metadataShippingAddress = null;
  if (typeof metadata.shippingAddress === "string") {
    try {
      metadataShippingAddress = JSON.parse(metadata.shippingAddress);
    } catch {
      metadataShippingAddress = null;
    }
  }

  const collectedShipping = session.collected_information?.shipping_details;
  const shippingDetails = session.shipping_details || collectedShipping;
  const addressSource = shippingDetails?.address || metadataShippingAddress;

  const shippingAddress = addressSource
    ? {
        name:
          shippingDetails?.name ||
          metadataShippingAddress?.name ||
          session.customer_details?.name,
        line1: addressSource.line1,
        line2: addressSource.line2,
        city: addressSource.city,
        state: addressSource.state,
        postal_code: addressSource.postal_code,
        country: addressSource.country,
      }
    : undefined;

  const customerPhone =
    session.customer_details?.phone ||
    metadata.customerPhone ||
    metadata.phone ||
    undefined;

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  let chargeId;
  let transferId;
  if (paymentIntentId) {
    try {
      const paymentIntent = await retrievePaymentIntent(stripe, paymentIntentId, stripeAccount);
      const charge = paymentIntent?.charges?.data?.[0];
      chargeId = charge?.id;
      const transferRef = charge?.transfer;
      transferId =
        typeof transferRef === "string"
          ? transferRef
          : (transferRef && transferRef.id) || undefined;
    } catch (err) {
      console.warn("Unable to load payment intent details", err?.message || err);
    }
  }

  const order = {
    orderId: session.id,
    siteId: session.metadata?.siteId || body?.siteId || process.env.SITE_ID_DEFAULT || "my-site",
    customerName:
      session.customer_details?.name ||
      shippingDetails?.name ||
      metadataShippingAddress?.name ||
      "Customer",
    email: session.customer_details?.email || session.customer_email || "",
    phone: customerPhone,
    status: "NEW",
    total: typeof session.amount_total === "number" ? session.amount_total / 100 : 0,
    subtotal: typeof session.amount_subtotal === "number" ? session.amount_subtotal / 100 : undefined,
    shippingCost: typeof session.total_details?.amount_shipping === "number"
      ? session.total_details.amount_shipping / 100
      : undefined,
    taxAmount: typeof session.total_details?.amount_tax === "number"
      ? session.total_details.amount_tax / 100
      : undefined,
    currency: session.currency?.toUpperCase(),
    shippingMethod: session.metadata?.shippingMethod || session.metadata?.shippingService || "Standard",
    items,
    totalQuantity,
    totalWeight,
    shippingAddress,
    stripePaymentIntentId: paymentIntentId || undefined,
    stripeChargeId: chargeId,
    stripeTransferId: transferId,
    stripeAccountId: stripeAccount || undefined,
    createdAt: session.created ? new Date(session.created * 1000).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = await ddb.get({ TableName: ORDERS_TABLE, Key: { orderId: order.orderId } }).promise();
  if (existing.Item?.confirmationSentAt) {
    return { statusCode: 200, body: { alreadyConfirmed: true, orderId: order.orderId } };
  }

  const merged = { ...(existing.Item || {}), ...order };
  await ddb.put({ TableName: ORDERS_TABLE, Item: merged }).promise();

  await sendConfirmationEmail(order);
  try {
    await sendAdminOrderEmail(order);
  } catch (err) {
    console.warn("admin_order_email_failed", err?.message || err);
  }

  const confirmationIso = new Date().toISOString();
  await ddb.update({
    TableName: ORDERS_TABLE,
    Key: { orderId: order.orderId },
    UpdateExpression: "SET confirmationSentAt = :ts, confirmationEmail = :em, updatedAt = :u",
    ExpressionAttributeValues: {
      ":ts": confirmationIso,
      ":em": order.email,
      ":u": confirmationIso,
    },
  }).promise();

  if (cartId) {
    try {
      await ddb.update({
        TableName: ABANDONED_CARTS_TABLE,
        Key: { siteId: order.siteId, cartId },
        UpdateExpression: "SET #status = :status, convertedAt = :ts, updatedAt = :u",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":status": "converted",
          ":ts": confirmationIso,
          ":u": confirmationIso,
        },
      }).promise();
    } catch (err) {
      console.warn("abandoned_cart_update_failed", err?.message || err);
    }
  }

  return { statusCode: 200, body: { confirmed: true, orderId: order.orderId } };
}

export const handler = async (event) => {
  const cors = corsHeaders(event);
  const method = (event?.requestContext?.http?.method || "").toUpperCase();

  const rawPath = event?.requestContext?.http?.path || event?.rawPath || "";
  let path = rawPath;
  const stage = event?.requestContext?.stage;
  if (stage && path.startsWith(`/${stage}`)) {
    path = path.slice(stage.length + 1);
  }

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  const DEBUG = process.env.DEBUG === "true";

  try {
    const body =
      typeof event?.body === "string"
        ? JSON.parse(event.body || "{}")
        : (event?.body || {});

    if (method === "POST" && path === "/public/checkout/confirm") {
      const result = await handleConfirm(body);
      return {
        statusCode: result.statusCode,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify(result.body),
      };
    }

    const siteId = body.siteId || process.env.SITE_ID_DEFAULT || "unknown-site";
    const uiMode = body.uiMode === "embedded" ? "embedded" : "hosted";
    const mode = body.mode || "payment";

    const line_items = Array.isArray(body.lineItems) ? body.lineItems : [];
    if (!line_items.length) {
      return {
        statusCode: 400,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "lineItems required" }),
      };
    }

    const shipping_address_collection =
      body.shipping_address_collection || { allowed_countries: ["US"] };

    const rawShippingCode = typeof body.shippingCode === "string" ? body.shippingCode : "";
    const normalizedShippingCode = rawShippingCode.trim().toUpperCase();
    const shippingCodeValid =
      ALLOW_TEST_SHIPPING_CODE &&
      normalizedShippingCode &&
      normalizedShippingCode === TEST_SHIPPING_CODE;
    const shippingCostCents = shippingCodeValid ? 1 : Number(body.shippingCostCents);
    const rawDiscountCode = typeof body.discountCode === "string" ? body.discountCode : "";
    const normalizedDiscountCode = rawDiscountCode.trim().toUpperCase();
    const discountPercent = Number(body.discountPercent);
    const shipping_options =
      Number.isFinite(shippingCostCents) && shippingCostCents >= 0
        ? [
            {
              shipping_rate_data: {
                display_name: body.shippingQuote?.service || body.shippingQuote?.carrier || "Shipping",
                type: "fixed_amount",
                fixed_amount: { amount: Math.round(shippingCostCents), currency: "usd" },
              },
            },
          ]
        : body.shipping_options || [
            {
              shipping_rate_data: {
                display_name: "Standard",
                type: "fixed_amount",
                fixed_amount: { amount: 0, currency: "usd" },
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 3 },
                  maximum: { unit: "business_day", value: 5 },
                },
              },
            },
            {
              shipping_rate_data: {
                display_name: "Express",
                type: "fixed_amount",
                fixed_amount: { amount: 1200, currency: "usd" },
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 1 },
                  maximum: { unit: "business_day", value: 2 },
                },
              },
            },
          ];

    const currency = line_items?.[0]?.price_data?.currency || "usd";
    const normalizedCurrency = String(currency || "usd").toLowerCase();
    const payment_method_types = ["card", "link"];
    if (normalizedCurrency === "usd") {
      payment_method_types.push("affirm", "cashapp", "klarna");
    }
    if (normalizedCurrency === "eur") {
      payment_method_types.push("klarna", "eps");
    }

    const origin =
      event?.headers?.origin || event?.headers?.Origin || "https://shopallureher.com";

    const success_url = withSessionId(
      body.successUrl || process.env.STRIPE_SUCCESS_URL || "https://example.com/success"
    );

    const cancel_url =
      body.cancelUrl || process.env.STRIPE_CANCEL_URL || "https://example.com/cancel";

    const return_url = withSessionId(
      body.returnUrl || process.env.STRIPE_RETURN_URL || (origin + "/checkout/return")
    );

    const stripeAccount =
      body.stripeAccount || process.env.STRIPE_CONNECT_ACCOUNT_ID || undefined;

    const payment_intent_data = stripeAccount
      ? {
          on_behalf_of: stripeAccount,
          transfer_data: { destination: stripeAccount },
        }
      : undefined;

    const stripe = await getStripe();

    const metadata = { siteId };
    if (body.cartId) metadata.cartId = String(body.cartId);
    if (body.shippingQuote?.carrier) metadata.shippingCarrier = body.shippingQuote.carrier;
    if (body.shippingQuote?.service) metadata.shippingService = body.shippingQuote.service;
    if (body.shippingQuote?.service) metadata.shippingMethod = body.shippingQuote.service;
    if (shippingCodeValid) metadata.shippingCode = normalizedShippingCode;
    if (normalizedDiscountCode) metadata.discountCode = normalizedDiscountCode;
    if (Number.isFinite(discountPercent) && discountPercent > 0) {
      metadata.discountPercent = String(discountPercent);
    }
    if (body.customer?.phone) metadata.customerPhone = String(body.customer.phone);
    if (body.shippingAddress) {
      try {
        const serialized = JSON.stringify(body.shippingAddress);
        if (serialized.length <= 450) {
          metadata.shippingAddress = serialized;
        }
      } catch {
        // ignore serialization errors, shipping address will be pulled from Stripe
      }
    }

    const createArgs = {
      mode,
      line_items,
      customer_email: body.customer?.email || body.customer_email || undefined,
      billing_address_collection: body.billing_address_collection || "auto",
      shipping_address_collection,
      shipping_options,
      payment_method_types,
      payment_intent_data,
      metadata,
      ...(uiMode === "embedded"
        ? { ui_mode: "embedded", return_url }
        : { success_url, cancel_url }),
    };

    const session = await createCheckoutSessionSafe(stripe, createArgs);

    const payload =
      uiMode === "embedded"
        ? { id: session.id, clientSecret: session.client_secret }
        : { id: session.id, url: session.url };

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };
  } catch (err) {
    console.error("checkout_error", {
      message: err?.message,
      code: err?.code,
      type: err?.type,
      stack: err?.stack,
    });

    const out = DEBUG
      ? { error: "stripe_error", message: err?.message, code: err?.code, type: err?.type }
      : { error: "internal_error" };

    return {
      statusCode: 500,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify(out),
    };
  }
};
