import http from "node:http";
import { readFile } from "node:fs/promises";
import { createSign } from "node:crypto";
import { URL } from "node:url";

const PORT = Number(process.env.VTO_PORT || 8787);
const VERTEX_PROJECT_ID = process.env.VERTEX_PROJECT_ID;
const VERTEX_LOCATION = process.env.VERTEX_LOCATION || "us-central1";
const VERTEX_MODEL = process.env.VERTEX_MODEL || "virtual-try-on-preview-08-04";
const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.VERTEX_SERVICE_ACCOUNT_JSON;

const MAX_BODY_BYTES = Number(process.env.VTO_MAX_BODY_BYTES || 15_000_000);
const ALLOWED_ORIGINS = new Set(
  (process.env.VTO_ALLOWED_ORIGINS ||
    "http://localhost:5173,https://shopallureher.com,https://www.shopallureher.com")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
);

let cachedToken = null;
let cachedTokenExpiry = 0;

const jsonResponse = (res, status, payload) => {
  const body = JSON.stringify(payload || {});
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Cache-Control": "no-store",
  });
  res.end(body);
};

const base64Url = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry - 60_000) {
    return cachedToken;
  }
  if (SERVICE_ACCOUNT_PATH) {
    const raw = await readFile(SERVICE_ACCOUNT_PATH, "utf8");
    const creds = JSON.parse(raw);
    const clientEmail = creds.client_email;
    const privateKey = creds.private_key;
    const tokenUri = creds.token_uri || "https://oauth2.googleapis.com/token";

    if (!clientEmail || !privateKey) {
      throw new Error("Service account JSON missing client_email or private_key");
    }

    const now = Math.floor(Date.now() / 1000);
    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64Url(
      JSON.stringify({
        iss: clientEmail,
        sub: clientEmail,
        aud: tokenUri,
        iat: now,
        exp: now + 3600,
        scope: "https://www.googleapis.com/auth/cloud-platform",
      })
    );

    const unsigned = `${header}.${payload}`;
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    signer.end();
    const signature = signer
      .sign(privateKey, "base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const assertion = `${unsigned}.${signature}`;
    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });

    const tokenRes = await fetch(tokenUri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenJson.access_token) {
      const message =
        tokenJson.error_description || tokenJson.error || "Token request failed";
      throw new Error(message);
    }

    cachedToken = tokenJson.access_token;
    cachedTokenExpiry = Date.now() + (tokenJson.expires_in || 3600) * 1000;
    return cachedToken;
  }

  // Cloud Run / GCE default service account token
  const tokenRes = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    {
      headers: { "Metadata-Flavor": "Google" },
    }
  );
  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error("Unable to acquire default service account token");
  }

  cachedToken = tokenJson.access_token;
  cachedTokenExpiry = Date.now() + (tokenJson.expires_in || 3600) * 1000;
  return cachedToken;
}

async function callVertexTryOn({ personBase64, productBase64, sampleCount, baseSteps }) {
  if (!VERTEX_PROJECT_ID) {
    throw new Error("Missing VERTEX_PROJECT_ID");
  }
  const token = await getAccessToken();
  const endpoint = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT_ID}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_MODEL}:predict`;

  const payload = {
    instances: [
      {
        personImage: {
          image: {
            bytesBase64Encoded: personBase64,
          },
        },
        productImages: [
          {
            image: {
              bytesBase64Encoded: productBase64,
            },
          },
        ],
      },
    ],
    parameters: {
      sampleCount: sampleCount ?? 1,
      baseSteps: baseSteps ?? 30,
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error?.message || data.error || "Vertex AI error";
    throw new Error(message);
  }

  const prediction = Array.isArray(data.predictions) ? data.predictions[0] : null;
  const bytes =
    prediction?.bytesBase64Encoded ||
    prediction?.image?.bytesBase64Encoded ||
    prediction?.generatedImage?.bytesBase64Encoded ||
    null;

  if (!bytes) {
    return { raw: data };
  }

  return { imageBase64: bytes };
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/virtual-try-on") {
    jsonResponse(res, 404, { error: "not_found" });
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > MAX_BODY_BYTES) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "payload_too_large" }));
      req.destroy();
    }
  });

  req.on("end", async () => {
    let payload;
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      jsonResponse(res, 400, { error: "invalid_json" });
      return;
    }

    const personBase64 = payload.personBase64 || payload.personImageBase64;
    const productBase64 = payload.productBase64 || payload.productImageBase64;
    if (!personBase64 || !productBase64) {
      jsonResponse(res, 400, { error: "personBase64 and productBase64 are required" });
      return;
    }

    try {
      const result = await callVertexTryOn({
        personBase64,
        productBase64,
        sampleCount: payload.sampleCount,
        baseSteps: payload.baseSteps,
      });
      jsonResponse(res, 200, result);
    } catch (err) {
      jsonResponse(res, 500, { error: err?.message || "try_on_failed" });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Virtual Try-On server listening on http://localhost:${PORT}`);
});
