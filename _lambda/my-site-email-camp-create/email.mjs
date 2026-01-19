import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  GetItemCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});

const SUB_TABLE  = process.env.EMAIL_SUB_TABLE;        // EmailSubscribers
const CAMP_TABLE = process.env.EMAIL_CAMPAIGNS_TABLE;  // EmailCampaigns
const SITE_ALLOWED = process.env.SITE_ID_ALLOWED || "";

const J = (c,b)=>({
  statusCode:c,
  headers:{
    "Content-Type":"application/json",
    "Access-Control-Allow-Origin":"*"
  },
  body: JSON.stringify(b)
});

const guardSite = (siteId) => {
  if (!siteId) return J(400,{error:"siteId required"});
  if (SITE_ALLOWED && siteId !== SITE_ALLOWED) {
    return J(403,{error:"forbidden: wrong siteId"});
  }
  return null;
};

const isAdmin = (evt) => {
  const claims = evt.requestContext?.authorizer?.jwt?.claims || {};
  const groups = claims["cognito:groups"] || "";
  return groups.toString().includes("admins");
};

// ---------- PUBLIC: subscribe (no auth) ----------
// POST /public/email/subscribe
// body: { siteId, email, source? }
export const subscribe = async (evt)=>{
  let body = {};
  try {
    body = JSON.parse(evt.body || "{}");
  } catch {
    return J(400,{error:"invalid JSON body"});
  }
  const { siteId, email, source="" } = body;
  const deny = guardSite(siteId); if (deny) return deny;

  if (!email || typeof email !== "string") {
    return J(400,{error:"email required"});
  }

  const normalized = email.trim().toLowerCase();
  const now = new Date().toISOString();

  try {
    await db.send(new PutItemCommand({
      TableName: SUB_TABLE,
      Item: {
        siteId:   { S: siteId },
        email:    { S: normalized },
        createdAt:{ S: now },
        updatedAt:{ S: now },
        source:   { S: source || "" }
      }
    }));
    // no content, just CORS OK
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin":"*" } };
  } catch (err) {
    console.error("subscribe error", err);
    return J(500,{error:"internal error"});
  }
};

// ---------- ADMIN: list subscribers (JWT) ----------
// GET /admin/email/subscribers?siteId=my-site&limit=50&nextToken=BASE64
export const listSubscribers = async (evt)=>{
  if (!isAdmin(evt)) return J(403,{error:"forbidden"});

  const qs = evt.queryStringParameters || {};
  const siteId = qs.siteId;
  const deny = guardSite(siteId); if (deny) return deny;

  let limit = 50;
  if (qs.limit) {
    const n = parseInt(qs.limit, 10);
    if (!Number.isNaN(n) && n > 0) limit = Math.min(n, 200);
  }

  let ExclusiveStartKey;
  if (qs.nextToken) {
    try {
      ExclusiveStartKey = JSON.parse(
        Buffer.from(qs.nextToken, "base64").toString("utf8")
      );
    } catch {
      return J(400,{error:"invalid nextToken"});
    }
  }

  try {
    const r = await db.send(new QueryCommand({
      TableName: SUB_TABLE,
      KeyConditionExpression: "siteId = :s",
      ExpressionAttributeValues: {
        ":s": { S: siteId }
      },
      Limit: limit,
      ExclusiveStartKey
    }));

    const items = (r.Items || []).map(i => ({
      email:      i.email.S,
      createdAt:  i.createdAt?.S,
      updatedAt:  i.updatedAt?.S,
      source:     i.source?.S || null
    }));

    let nextToken = null;
    if (r.LastEvaluatedKey) {
      nextToken = Buffer.from(
        JSON.stringify(r.LastEvaluatedKey)
      ).toString("base64");
    }

    return J(200,{ items, nextToken });
  } catch (err) {
    console.error("listSubscribers error", err);
    return J(500,{error:"internal error"});
  }
};

// ---------- ADMIN: create email campaign (JWT) ----------
// POST /admin/email/campaigns
// body: { siteId, name, subject, bodyHtml?, bodyText?, scheduledAt? }
export const createCampaign = async (evt)=>{
  if (!isAdmin(evt)) return J(403,{error:"forbidden"});
  let body = {};
  try {
    body = JSON.parse(evt.body || "{}");
  } catch {
    return J(400,{error:"invalid JSON body"});
  }

  const { siteId, name, subject, bodyHtml="", bodyText="", scheduledAt=null, segment } = body;
  const deny = guardSite(siteId); if (deny) return deny;

  if (!name || !subject) {
    return J(400,{error:"name and subject required"});
  }

  const now = new Date().toISOString();
  const campaignId = body.campaignId ||
    (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

  const status = scheduledAt ? "scheduled" : "draft";

  if (segment?.type && !["all", "source", "test"].includes(segment.type)) {
    return J(400, { error: "invalid segment type" });
  }
  if (segment?.type === "source" && !segment.source) {
    return J(400, { error: "segment.source required for source segment" });
  }

  const payload = {
    siteId,
    campaignId,
    name,
    subject,
    bodyHtml,
    bodyText,
    scheduledAt,
    segment: segment || { type: "all" },
    status,
    createdAt: now,
    updatedAt: now
  };

  try {
    await db.send(new PutItemCommand({
      TableName: CAMP_TABLE,
      Item: {
        siteId:     { S: siteId },
        campaignId: { S: campaignId },
        status:     { S: status },
        payload:    { S: JSON.stringify(payload) }
      }
    }));

    return J(201,{ campaignId, status });
  } catch (err) {
    console.error("createCampaign error", err);
    return J(500,{error:"internal error"});
  }
};

// ---------- ADMIN: list campaigns (JWT) ----------
// GET /admin/email/campaigns?siteId=my-site
export const listCampaigns = async (evt)=>{
  if (!isAdmin(evt)) return J(403,{error:"forbidden"});

  const qs = evt.queryStringParameters || {};
  const siteId = qs.siteId;
  const deny = guardSite(siteId); if (deny) return deny;

  try {
    const r = await db.send(new QueryCommand({
      TableName: CAMP_TABLE,
      KeyConditionExpression: "siteId = :s",
      ExpressionAttributeValues: {
        ":s": { S: siteId }
      }
    }));

    const items = (r.Items || []).map(i => {
      if (i.payload?.S) return JSON.parse(i.payload.S);
      return {
        siteId,
        campaignId: i.campaignId.S,
        status: i.status?.S || "unknown"
      };
    });

    return J(200, items);
  } catch (err) {
    console.error("listCampaigns error", err);
    return J(500,{error:"internal error"});
  }
};
