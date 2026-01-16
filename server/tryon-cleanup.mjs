import { readFile } from "node:fs/promises";
import { createSign, randomUUID } from "node:crypto";

const BUCKET = process.env.VTO_STORAGE_BUCKET;
const PREFIX = (process.env.VTO_STORAGE_PREFIX || "tryon").replace(/\/+$/, "");
const THRESHOLD_BYTES = Number(
  process.env.VTO_STORAGE_THRESHOLD_BYTES || 2.5 * 1024 * 1024 * 1024
);
const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.VERTEX_SERVICE_ACCOUNT_JSON;

if (!BUCKET) {
  console.error("Missing VTO_STORAGE_BUCKET");
  process.exit(1);
}

let cachedToken = null;
let cachedTokenExpiry = 0;

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

const prefixPath = PREFIX ? `${PREFIX}/` : "";

const listObjects = async (token) => {
  let items = [];
  let pageToken = "";

  while (true) {
    const url = new URL(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(BUCKET)}/o`);
    url.searchParams.set("prefix", prefixPath);
    url.searchParams.set("fields", "items(name,size,timeCreated),nextPageToken");
    url.searchParams.set("maxResults", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`list_failed: ${res.status} ${JSON.stringify(data)}`);
    }
    if (Array.isArray(data.items)) {
      items = items.concat(data.items);
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return items;
};

const deleteObject = async (token, objectName) => {
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(
    BUCKET
  )}/o/${encodeURIComponent(objectName)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`delete_failed: ${res.status} ${text}`.trim());
  }
};

const groupObjects = (items) => {
  const groups = new Map();
  for (const item of items) {
    if (!item?.name) continue;
    const size = Number(item.size || 0);
    const time = item.timeCreated || new Date(0).toISOString();

    const relative = prefixPath ? item.name.slice(prefixPath.length) : item.name;
    const folder = relative.split("/")[0] || relative || randomUUID();
    const key = prefixPath ? `${prefixPath}${folder}` : folder;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        totalBytes: 0,
        oldest: time,
        objects: [],
      });
    }
    const group = groups.get(key);
    group.totalBytes += size;
    group.objects.push(item.name);
    if (new Date(time) < new Date(group.oldest)) {
      group.oldest = time;
    }
  }
  return Array.from(groups.values()).sort(
    (a, b) => new Date(a.oldest) - new Date(b.oldest)
  );
};

const formatBytes = (value) => `${(value / (1024 * 1024 * 1024)).toFixed(2)}GB`;

const main = async () => {
  const token = await getAccessToken();
  const objects = await listObjects(token);
  const totalBytes = objects.reduce(
    (sum, item) => sum + Number(item.size || 0),
    0
  );

  console.log(`Bucket ${BUCKET} prefix ${prefixPath || "/"} size ${formatBytes(totalBytes)}`);
  if (totalBytes < THRESHOLD_BYTES) {
    console.log("Under threshold, no cleanup needed.");
    return;
  }

  const groups = groupObjects(objects);
  let currentBytes = totalBytes;
  let deletedGroups = 0;
  let deletedObjects = 0;

  for (const group of groups) {
    if (currentBytes <= THRESHOLD_BYTES) break;
    console.log(`Deleting ${group.key} (${formatBytes(group.totalBytes)})`);
    for (const objectName of group.objects) {
      await deleteObject(token, objectName);
      deletedObjects += 1;
    }
    deletedGroups += 1;
    currentBytes -= group.totalBytes;
  }

  console.log(
    `Cleanup complete: deleted ${deletedGroups} group(s), ${deletedObjects} object(s). New size ${formatBytes(currentBytes)}`
  );
};

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
