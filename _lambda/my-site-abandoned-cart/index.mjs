import { createRequire } from "module";
const require = createRequire(import.meta.url);
const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.AWS_REGION || "us-east-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ region: process.env.AWS_REGION || "us-east-1" });

const ABANDONED_CARTS_TABLE = process.env.ABANDONED_CARTS_TABLE || "AbandonedCarts";
const SUBSCRIBERS_TABLE = process.env.SUBSCRIBERS_TABLE || "EmailSubscribers";
const SITE_ID_ALLOWED = process.env.SITE_ID_ALLOWED || "";
const SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS || "hello@shopallureher.com";
const RECOVERY_BASE_URL = process.env.RECOVERY_BASE_URL || "https://shopallureher.com/checkout";
const UNSUBSCRIBE_BASE_URL = process.env.UNSUBSCRIBE_BASE_URL || "https://shopallureher.com/unsubscribe";

const COOLDOWN_DAYS = Number(process.env.RECOVERY_COOLDOWN_DAYS || "7");
const DEFAULT_STAGE_DELAYS = [60, 1440, 4320];
const STAGE_DELAYS_MINUTES = (process.env.RECOVERY_STAGE_DELAYS_MINUTES || "")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);
const STAGE_DELAYS = STAGE_DELAYS_MINUTES.length ? STAGE_DELAYS_MINUTES : DEFAULT_STAGE_DELAYS;

const allowedOrigins = new Set([
  "https://shopallureher.com",
  "https://www.shopallureher.com",
  "http://localhost:5173",
]);

const corsHeaders = (event) => {
  const origin = event?.headers?.origin || event?.headers?.Origin || "";
  const allowOrigin = allowedOrigins.has(origin) ? origin : "https://shopallureher.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "content-type,authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  };
};

const J = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...headers },
  body: body == null ? "" : JSON.stringify(body),
});

const guardSite = (siteId) => {
  if (!siteId) return J(400, { error: "siteId required" });
  if (SITE_ID_ALLOWED && siteId !== SITE_ID_ALLOWED) {
    return J(403, { error: "forbidden: wrong siteId" });
  }
  return null;
};

const appendQuery = (url, key, value) => {
  if (!value) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${key}=${encodeURIComponent(value)}`;
  }
};

const formatCurrency = (amount, currency) => {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || "USD"}`;
  }
};

const buildRecoveryEmail = (cart, stage) => {
  const firstName = cart.firstName || "there";
  const currency = cart.currency || "USD";
  const items = Array.isArray(cart.items) ? cart.items : [];
  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const subjectMap = [
    "You left something behind",
    "Your cart is still waiting",
    "Last chance to complete your order",
  ];
  const subject = subjectMap[Math.min(stage, subjectMap.length - 1)];

  const recoveryUrl = appendQuery(RECOVERY_BASE_URL, "cartId", cart.cartId);
  const unsubscribeUrl = appendQuery(UNSUBSCRIBE_BASE_URL, "email", cart.email);

  const itemRows = items
    .map((item) => {
      const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;">
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              <tr>
                ${item.imageUrl ? `<td style="width:72px;padding-right:12px;"><img src="${item.imageUrl}" width="72" height="72" alt="" style="border-radius:10px;object-fit:cover;display:block;"></td>` : ""}
                <td style="vertical-align:top;">
                  <div style="font-weight:600;font-size:14px;color:#111;">${item.name || "Item"}</div>
                  ${item.size ? `<div style="font-size:12px;color:#777;margin-top:2px;">Size: ${item.size}</div>` : ""}
                  <div style="font-size:12px;color:#777;margin-top:2px;">Qty: ${item.quantity || 1}</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#111;">
            ${formatCurrency(itemTotal, currency)}
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
      </head>
      <body style="margin:0;background:#f6f2ec;font-family:'Georgia','Times New Roman',serif;color:#111;">
        <div style="padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ece6df;">
            <div style="padding:24px;background:#111;color:#fff;text-align:center;">
              <div style="font-size:20px;letter-spacing:1px;text-transform:uppercase;">Allure Her</div>
              <div style="margin-top:6px;font-size:14px;color:#d6c7b8;">Your cart is saved</div>
            </div>
            <div style="padding:28px;">
              <p style="margin:0 0 10px;">Hi <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 18px;color:#444;">We saved your cart so you can pick up right where you left off.</p>

              <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <thead>
                  <tr>
                    <th style="text-align:left;padding-bottom:8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Item</th>
                    <th style="text-align:right;padding-bottom:8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:12px;">
                <span style="font-size:14px;color:#666;">Cart total</span>
                <span style="font-size:18px;font-weight:700;color:#111;">${formatCurrency(total, currency)}</span>
              </div>

              <div style="text-align:center;margin:22px 0;">
                <a href="${recoveryUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;">
                  Resume checkout
                </a>
              </div>

              <p style="margin:0;color:#666;font-size:12px;text-align:center;">
                Need help? Reply to this email and we will take care of you.
              </p>
            </div>
            <div style="padding:16px 24px;background:#faf8f5;text-align:center;font-size:12px;color:#777;">
              <p style="margin:0;">You are receiving this reminder because you started a checkout at Allure Her.</p>
              <p style="margin:8px 0 0 0;"><a href="${unsubscribeUrl}" style="color:#777;">Unsubscribe</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${firstName},

We saved your cart so you can pick up right where you left off.

Resume checkout: ${recoveryUrl}

If you want to stop these reminders: ${unsubscribeUrl}
`;

  return { subject, html, text };
};

const isSuppressed = async (siteId, email) => {
  if (!siteId || !email) return false;
  try {
    const res = await ddb
      .get({ TableName: SUBSCRIBERS_TABLE, Key: { siteId, email } })
      .promise();
    if (!res.Item?.payload) return false;
    const payload = JSON.parse(res.Item.payload);
    return payload?.status === "unsubscribed";
  } catch {
    return false;
  }
};

export const upsertCart = async (event) => {
  const cors = corsHeaders(event);
  const method = (event?.requestContext?.http?.method || "").toUpperCase();

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return J(400, { error: "invalid JSON" }, cors);
  }

  const { siteId, cartId, items, email, firstName, lastName, source } = body || {};
  const deny = guardSite(siteId);
  if (deny) return { ...deny, headers: { ...deny.headers, ...cors } };

  if (!cartId || !Array.isArray(items) || items.length === 0) {
    return J(400, { error: "cartId and items required" }, cors);
  }

  const nowIso = new Date().toISOString();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  const existing = await ddb
    .get({ TableName: ABANDONED_CARTS_TABLE, Key: { siteId, cartId } })
    .promise();

  const merged = {
    ...(existing.Item || {}),
    siteId,
    cartId,
    items,
    email: normalizedEmail || existing.Item?.email,
    firstName: typeof firstName === "string" ? firstName.trim() : existing.Item?.firstName,
    lastName: typeof lastName === "string" ? lastName.trim() : existing.Item?.lastName,
    source: source || existing.Item?.source || null,
    status: "open",
    recoveryStage: 0,
    lastActivityAt: nowIso,
    updatedAt: nowIso,
    createdAt: existing.Item?.createdAt || nowIso,
  };

  await ddb.put({ TableName: ABANDONED_CARTS_TABLE, Item: merged }).promise();

  return { statusCode: 204, headers: cors, body: "" };
};

export const getCart = async (event) => {
  const cors = corsHeaders(event);
  const method = (event?.requestContext?.http?.method || "").toUpperCase();

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  const qs = event?.queryStringParameters || {};
  const siteId = qs.siteId;
  const cartId = qs.cartId;
  const deny = guardSite(siteId);
  if (deny) return { ...deny, headers: { ...deny.headers, ...cors } };

  if (!cartId) return J(400, { error: "cartId required" }, cors);

  const res = await ddb
    .get({ TableName: ABANDONED_CARTS_TABLE, Key: { siteId, cartId } })
    .promise();

  if (!res.Item) return J(404, { error: "not_found" }, cors);

  const out = {
    siteId: res.Item.siteId,
    cartId: res.Item.cartId,
    email: res.Item.email,
    firstName: res.Item.firstName,
    lastName: res.Item.lastName,
    items: res.Item.items,
    updatedAt: res.Item.updatedAt,
  };

  return J(200, out, cors);
};

export const dispatchAbandonedCarts = async () => {
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

  let lastKey;
  const items = [];

  do {
    const res = await ddb
      .scan({
        TableName: ABANDONED_CARTS_TABLE,
        FilterExpression: "#status = :open AND attribute_exists(email)",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":open": "open" },
        ExclusiveStartKey: lastKey,
      })
      .promise();

    if (res.Items?.length) items.push(...res.Items);
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  let sentCount = 0;

  for (const cart of items) {
    if (!cart?.email || !cart?.cartId) continue;
    if (!Array.isArray(cart.items) || cart.items.length === 0) continue;

    const lastActivity = cart.lastActivityAt || cart.updatedAt || cart.createdAt;
    if (!lastActivity) continue;
    const lastActivityMs = Date.parse(lastActivity);
    if (Number.isNaN(lastActivityMs)) continue;

    const inactiveMinutes = (nowMs - lastActivityMs) / 60000;
    if (inactiveMinutes < STAGE_DELAYS[0]) continue;

    const stage = Number.isFinite(cart.recoveryStage) ? Number(cart.recoveryStage) : 0;
    const lastSentAt = cart.lastRecoverySentAt;
    const lastSentMs = lastSentAt ? Date.parse(lastSentAt) : null;

    if (stage === 0) {
      if (lastSentMs && nowMs - lastSentMs < cooldownMs) continue;
      if (inactiveMinutes < STAGE_DELAYS[0]) continue;
    }
    if (stage === 1 && inactiveMinutes < STAGE_DELAYS[1]) continue;
    if (stage === 2 && inactiveMinutes < STAGE_DELAYS[2]) continue;
    if (stage >= 3) continue;

    const suppressed = await isSuppressed(cart.siteId, cart.email);
    if (suppressed) continue;

    const emailPayload = buildRecoveryEmail(cart, stage);
    try {
      await ses
        .sendEmail({
          Source: SES_FROM_ADDRESS,
          Destination: { ToAddresses: [cart.email] },
          Message: {
            Subject: { Data: emailPayload.subject },
            Body: {
              Html: { Data: emailPayload.html },
              Text: { Data: emailPayload.text },
            },
          },
        })
        .promise();

      sentCount += 1;

      await ddb
        .update({
          TableName: ABANDONED_CARTS_TABLE,
          Key: { siteId: cart.siteId, cartId: cart.cartId },
          UpdateExpression:
            "SET recoveryStage = :stage, lastRecoverySentAt = :sent, updatedAt = :u",
          ExpressionAttributeValues: {
            ":stage": stage + 1,
            ":sent": nowIso,
            ":u": nowIso,
          },
        })
        .promise();
    } catch (err) {
      console.error("abandoned_cart_send_failed", cart.cartId, err);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ sentCount }),
  };
};
