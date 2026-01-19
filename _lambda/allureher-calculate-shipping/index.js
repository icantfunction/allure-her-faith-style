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

exports.handler = async (event) => {
  try {
    await ensureEasyPostKey();
  } catch (e) {
    console.error("EasyPost secret bootstrap failed:", e);
    const headers = corsHeaders(event);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server misconfigured", details: e && e.message ? e.message : String(e) })
    };
  }
console.log('Incoming event:', JSON.stringify(event));

  const headers = corsHeaders(event);

  const method = event.requestContext && event.requestContext.http && event.requestContext.http.method;

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

  const { quantity, address } = body;
  if (!address) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required field: address' }) };
  }

  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  const api = new EasyPost(apiKey);
  
  // 1. Calculate Weight (15oz per item)
  const qty = quantity || 1;
  const totalWeight = 15 * qty;

  // 2. Calculate Dimensions (Scale height by quantity)
  // Example: 1 jar = 4" tall, 2 jars = 8" tall, etc.
  const boxHeight = 4 * qty; 

  try {
    const shipment = await api.Shipment.create({
      to_address: {
        name: address.name,
        street1: address.line1,
        street2: address.line2 || '',
        city: address.city,
        state: address.state,
        zip: address.postal_code,
        country: address.country || 'US',
      },
      from_address: {
        company: 'Allure Her',
        street1: '3210 N University Dr',
        street2: 'APT 825',
        city: 'Coral Springs',
        state: 'FL',
        zip: '33065',
        country: 'US',
        phone: process.env.FROM_PHONE || '555-555-5555',
      },
      parcel: {
        weight: totalWeight,
        length: 6,
        width: 4,
        height: boxHeight, // Dynamic height triggers different pricing tiers
      },
    });

    if (!shipment.rates || shipment.rates.length === 0) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'No shipping rates available' }) };
    }

    // Filter Logic: Prefer UPS -> Then USPS -> Then Cheapest
    const normalize = (s) => (s || '').toUpperCase();
    const upsRates = shipment.rates.filter(r => normalize(r.carrier).includes('UPS'));
    const uspsRates = shipment.rates.filter(r => normalize(r.carrier) === 'USPS');

    let candidateRates;
    if (upsRates.length > 0) candidateRates = upsRates;
    else if (uspsRates.length > 0) candidateRates = uspsRates;
    else candidateRates = shipment.rates;

    const lowestRate = candidateRates.reduce((prev, curr) =>
      parseFloat(prev.rate) < parseFloat(curr.rate) ? prev : curr
    );

    const rateFloat = parseFloat(lowestRate.rate);
    const rateCents = Math.round(rateFloat * 100);
    const surchargeCents = 100;
    const finalCents = rateCents + surchargeCents;
    const finalRate = finalCents / 100;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        shippingAmountCents: finalCents, 
        rate: finalRate,       
        currency: lowestRate.currency,
        carrier: lowestRate.carrier,
        service: lowestRate.service,
        deliveryDays: lowestRate.delivery_days,
        quantity: qty,
        totalWeight: totalWeight, // Debugging: verify weight
        boxHeight: boxHeight      // Debugging: verify size
      }),
    };

  } catch (error) {
    console.error('Calculation error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to calculate shipping', details: error.message }) };
  }
};
