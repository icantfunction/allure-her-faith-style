// ---- EasyPost secret bootstrap (AllureHer hard isolation) ----
const AWS_SDK = require("aws-sdk");
const https_ep = require("https");

let _cachedSecret = null;
let _verified = false;

function httpGetJson(url, apiKey) {
  return new Promise((resolve, reject) => {
    const req = https_ep.request(url, {
      method: "GET",
      headers: { "Authorization": "Basic " + Buffer.from(apiKey + ":").toString("base64") }
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ statusCode: res.statusCode || 0, json: JSON.parse(data || "{}") }); }
        catch (e) { reject(new Error("Failed to parse JSON from EasyPost")); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function ensureEasyPostKey() {
  if (process.env.EASYPOST_API_KEY) return;

  const arn = process.env.EASYPOST_SECRET_ARN;
  if (!arn) throw new Error("Missing EASYPOST_SECRET_ARN");

  if (!_cachedSecret) {
    const sm = new AWS_SDK.SecretsManager();
    const resp = await sm.getSecretValue({ SecretId: arn }).promise();
    const secret = JSON.parse(resp.SecretString || "{}");
    if (!secret.api_key) throw new Error("Secret missing api_key");
    _cachedSecret = secret;
  }

  process.env.EASYPOST_API_KEY = _cachedSecret.api_key;

  // Guardrail: verify key belongs to expected child user
  if (!_verified && _cachedSecret.user_id) {
    const me = await httpGetJson("https://api.easypost.com/v2/users", _cachedSecret.api_key);
    const actualId = me.json && me.json.id;
    if (!actualId || actualId !== _cachedSecret.user_id) {
      throw new Error(`EasyPost key user mismatch: expected ${_cachedSecret.user_id}, got ${actualId || "unknown"}`);
    }
    _verified = true;
  }
}
// ---- end bootstrap ----

const EasyPost = require('@easypost/api');
const AWS = require('aws-sdk');
const https = require('https');

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
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    "Content-Type": "application/json",
  };
}

const dynamo = new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE_NAME || 'Orders';
const STRIPE_SECRET_ARN = process.env.STRIPE_SECRET_ARN || process.env.STRIPE_SECRET_ID || 'stripe/my-site/secret-key';

let _stripeKey = null;
async function getStripeKey() {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY;
  if (_stripeKey) return _stripeKey;
  const sm = new AWS.SecretsManager();
  const resp = await sm.getSecretValue({ SecretId: STRIPE_SECRET_ARN }).promise();
  const raw = resp.SecretString || (resp.SecretBinary ? Buffer.from(resp.SecretBinary, 'base64').toString('utf8') : '');
  if (!raw) throw new Error('Stripe secret not found');
  try {
    const obj = JSON.parse(raw);
    _stripeKey = obj['stripe-secret-key'] || obj['stripe_secret_key'] || obj['STRIPE_SECRET_KEY'] || raw;
  } catch {
    _stripeKey = raw;
  }
  if (!_stripeKey || !_stripeKey.startsWith('sk_')) {
    throw new Error('Stripe secret key missing or invalid');
  }
  return _stripeKey;
}

function stripeRequest(method, path, apiKey, body) {
  const payload = body ? body.toString() : '';
  const options = {
    hostname: 'api.stripe.com',
    path,
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const status = res.statusCode || 0;
        if (status < 200 || status >= 300) {
          return reject(new Error(`Stripe error ${status}: ${data}`));
        }
        try {
          resolve(JSON.parse(data || '{}'));
        } catch {
          resolve({});
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function reverseTransfer(transferId, amountCents) {
  if (!transferId || !amountCents || amountCents <= 0) return null;
  const apiKey = await getStripeKey();
  const body = new URLSearchParams({ amount: String(amountCents) });
  return stripeRequest('POST', `/v1/transfers/${transferId}/reversals`, apiKey, body);
}

// Your UPS carrier account ID (keep this)
const UPS_CARRIER_ACCOUNT_ID =
  process.env.UPS_CARRIER_ACCOUNT_ID || 'ca_3904318f62544303b17846ea80476a97';

exports.handler = async (event) => {
  
  await ensureEasyPostKey();
console.log('Incoming event:', JSON.stringify(event));

  const headers = corsHeaders(event);

  const method =
    event.requestContext &&
    event.requestContext.http &&
    event.requestContext.http.method;

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let body;
  try {
    body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {};
  } catch (e) {
    console.error('Error parsing body:', e);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { orderId, address, quantity } = body;
  if (!address || !orderId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: orderId, address' }) };
  }

  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  const api = new EasyPost(apiKey);
  const totalWeight = 15 * (quantity || 1);

  try {
    // 1) Check DynamoDB for existing label
    const existingResp = await dynamo.get({ TableName: ORDERS_TABLE, Key: { orderId } }).promise();
    const existingItem = existingResp.Item || null;
    const existingTracking = existingItem?.trackingId || existingItem?.trackingCode;
    if (existingResp.Item && existingTracking && existingResp.Item.labelUrl) {
      console.log('Returning existing label from DynamoDB');
      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          success: true,
          trackingId: existingTracking,
          trackingCode: existingResp.Item.trackingCode,
          labelUrl: existingResp.Item.labelUrl,
          carrier: existingResp.Item.carrier || null,
          service: existingResp.Item.service || null,
          orderId,
        }),
      };
    }

    // 2) Create shipment
    // We removed the strict carrier_accounts filter so we can see what EasyPost actually returns first
    const shipment = await api.Shipment.create({
      to_address: {
        name: address.name, street1: address.line1, street2: address.line2 || '',
        city: address.city, state: address.state, zip: address.postal_code,
        country: address.country || 'US',
        phone: '555-555-5555' // UPS often requires a phone number
      },
      from_address: {
        company: 'Allure Her', street1: '3210 N University Dr', street2: 'APT 825',
        city: 'Coral Springs', state: 'FL', zip: '33065', country: 'US',
        phone: process.env.FROM_PHONE || '555-555-5555'
      },
      parcel: { weight: totalWeight, length: 6, width: 4, height: 4 }, // Ensure valid dims
    });

    if (!shipment.rates || shipment.rates.length === 0) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'No shipping rates available' }) };
    }

    // 3) FILTER LOGIC: Look for 'UPS' OR 'UPSDAP'
    const normalize = (s) => (s || '').toUpperCase();
    
    // This is the fix: check if carrier includes "UPS" (handles "UPS" and "UPSDAP")
    const upsRates = shipment.rates.filter(r => normalize(r.carrier).includes('UPS'));
    
    const uspsRates = shipment.rates.filter(r => normalize(r.carrier) === 'USPS');

    let candidateRates;
    if (upsRates.length > 0) {
      candidateRates = upsRates;
      console.log('UPS rates found (UPS or UPSDAP). Using UPS.');
    } else if (uspsRates.length > 0) {
      candidateRates = uspsRates;
      console.log('No UPS rates found. Falling back to USPS.');
    } else {
      candidateRates = shipment.rates;
      console.log('No UPS or USPS rates found. Using all available.');
    }

    // Pick cheapest from the chosen candidate list
    const lowestRate = candidateRates.reduce((prev, curr) =>
      parseFloat(prev.rate) < parseFloat(curr.rate) ? prev : curr
    );

    console.log('Buying label with rate:', lowestRate.carrier, lowestRate.service, lowestRate.rate);

    // 4) Buy Label
    const boughtShipment = await api.Shipment.buy(shipment.id, lowestRate);

    // 5) Save to DynamoDB
    const trackingCode = boughtShipment.tracking_code;
    const trackingId = trackingCode;
    const labelUrl = boughtShipment.postage_label.label_url;
    const nowIso = new Date().toISOString();

    await dynamo.update({
      TableName: ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: 'SET trackingId = :tid, trackingCode = :t, labelUrl = :l, carrier = :c, service = :s, labelGeneratedAt = :lg, updatedAt = :u',
      ExpressionAttributeValues: {
        ':tid': trackingId,
        ':t': trackingCode,
        ':l': labelUrl,
        ':c': lowestRate.carrier,
        ':s': lowestRate.service,
        ':lg': nowIso,
        ':u': nowIso,
      },
    }).promise();

    let transferReversalId;
    let feeTransferError;
    try {
      const shippingCostRaw = existingItem?.shippingCost;
      const shippingCostValue = typeof shippingCostRaw === 'number' ? shippingCostRaw : Number(shippingCostRaw);
      const shippingCostCents = Number.isFinite(shippingCostValue)
        ? Math.round(shippingCostValue * 100)
        : null;
      const transferId = existingItem?.stripeTransferId;
      const alreadyCaptured = !!existingItem?.shippingFeeCapturedAt;

      if (transferId && shippingCostCents && !alreadyCaptured) {
        const reversal = await reverseTransfer(transferId, shippingCostCents);
        transferReversalId = reversal?.id;
        await dynamo.update({
          TableName: ORDERS_TABLE,
          Key: { orderId },
          UpdateExpression: 'SET shippingFeeCapturedAt = :ts, shippingFeeAmountCents = :amt, stripeTransferReversalId = :rid, updatedAt = :u',
          ExpressionAttributeValues: {
            ':ts': new Date().toISOString(),
            ':amt': shippingCostCents,
            ':rid': transferReversalId || null,
            ':u': new Date().toISOString(),
          },
        }).promise();
      }
    } catch (feeErr) {
      feeTransferError = feeErr?.message || String(feeErr);
      console.error('Shipping fee transfer error:', feeTransferError);
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true, trackingId, trackingCode, labelUrl,
        carrier: lowestRate.carrier, service: lowestRate.service, orderId,
        shippingFeeTransferId: transferReversalId,
        shippingFeeTransferError: feeTransferError || undefined,
      }),
    };
  } catch (error) {
    console.error('Label creation error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create label', details: error.message }) };
  }
};
