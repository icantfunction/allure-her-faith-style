import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  GetItemCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const db = new DynamoDBClient({});
const ses = new SESv2Client({});

const SUB_TABLE  = process.env.EMAIL_SUB_TABLE || process.env.SUBSCRIBERS_TABLE || "EmailSubscribers";
const CAMP_TABLE = process.env.EMAIL_CAMPAIGNS_TABLE || process.env.CAMPAIGNS_TABLE || "EmailCampaigns";
const SITE_ALLOWED = process.env.SITE_ID_ALLOWED || "";
const SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS || "info@shopallureher.com";
const TEST_RECIPIENTS = (process.env.TEST_RECIPIENTS || "info@shopallureher.com,ramosnco@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

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

const normalizeSubscriber = (item) => {
  if (!item) return null;
  const email = item.email?.S;
  if (!email) return null;
  let status = item.status?.S || "subscribed";
  let source = item.source?.S || null;
  let createdAt = item.createdAt?.S;
  let updatedAt = item.updatedAt?.S;

  if (item.payload?.S) {
    try {
      const payload = JSON.parse(item.payload.S);
      if (payload.status) status = payload.status;
      if (payload.source) source = payload.source;
      if (payload.createdAt) createdAt = payload.createdAt;
      if (payload.updatedAt) updatedAt = payload.updatedAt;
    } catch {
      // ignore payload parsing errors
    }
  }

  return { email, status, source, createdAt, updatedAt };
};

async function loadSubscribers(siteId) {
  const res = await db.send(
    new QueryCommand({
      TableName: SUB_TABLE,
      KeyConditionExpression: "siteId = :s",
      ExpressionAttributeValues: {
        ":s": { S: siteId }
      }
    })
  );

  return (res.Items || [])
    .map(normalizeSubscriber)
    .filter(Boolean);
}

function applySegment(subscribers, segment) {
  const safeSegment = segment && typeof segment === "object" ? segment : { type: "all" };
  if (safeSegment.type === "test") {
    const unique = Array.from(new Set(TEST_RECIPIENTS));
    return unique.map((email) => ({ email, status: "subscribed", source: "test" }));
  }
  if (safeSegment.type === "source" && safeSegment.source) {
    return subscribers.filter(
      (sub) => sub.status === "subscribed" && sub.source === safeSegment.source
    );
  }
  return subscribers.filter((sub) => sub.status === "subscribed");
}

async function sendCampaignEmails(siteId, subject, bodyHtml, segment) {
  if (!SES_FROM_ADDRESS) {
    throw new Error("SES_FROM_ADDRESS not configured");
  }

  const subscribers = await loadSubscribers(siteId);
  const activeSubs = applySegment(subscribers, segment);

  let total = activeSubs.length;
  let success = 0;
  let failed = 0;

  for (const sub of activeSubs) {
    try {
      await ses.send(
        new SendEmailCommand({
          FromEmailAddress: SES_FROM_ADDRESS,
          Destination: { ToAddresses: [sub.email] },
          Content: {
            Simple: {
              Subject: { Data: subject },
              Body: {
                Html: { Data: bodyHtml }
              }
            }
          }
        })
      );
      success += 1;
    } catch (err) {
      failed += 1;
      console.error("send failure", sub.email, err);
    }
  }

  return {
    totalRecipients: total,
    successCount: success,
    failedCount: failed
  };
}

// ---------- PUBLIC: subscribe (no auth) ----------
// POST /public/email/subscribe
// body: { siteId, email, source? }
export const subscribe = async (evt)=>{
  if (!SUB_TABLE) return J(500,{error:"email_sub_table_not_configured"});
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
  if (!SUB_TABLE) return J(500,{error:"email_sub_table_not_configured"});

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

    const items = (r.Items || [])
      .map(normalizeSubscriber)
      .filter(Boolean);

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
  if (!CAMP_TABLE) return J(500,{error:"email_campaigns_table_not_configured"});
  let body = {};
  try {
    body = JSON.parse(evt.body || "{}");
  } catch {
    return J(400,{error:"invalid JSON body"});
  }

  const {
    siteId,
    name,
    subject,
    bodyHtml = "",
    bodyText = "",
    scheduledAt = null,
    sendAt = null,
    sendAtUtc = null,
    segment
  } = body;
  const deny = guardSite(siteId); if (deny) return deny;

  if (!name || !subject) {
    return J(400,{error:"name and subject required"});
  }

  const nowDate = new Date();
  const nowIso = nowDate.toISOString();
  const campaignId = body.campaignId ||
    (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

  const rawSendAt = sendAtUtc || sendAt || scheduledAt || null;
  let sendAtDate = rawSendAt ? new Date(rawSendAt) : null;
  if (sendAtDate && Number.isNaN(sendAtDate.getTime())) {
    sendAtDate = null;
  }
  const sendAtIso = (sendAtDate || nowDate).toISOString();
  const FUTURE_THRESHOLD_MS = 60 * 1000; // 1 minute
  const isScheduled =
    sendAtDate && sendAtDate.getTime() - nowDate.getTime() > FUTURE_THRESHOLD_MS;

  let status = "draft";
  let sendStatus = "draft";
  let stats = undefined;

  if (segment?.type && !["all", "source", "test"].includes(segment.type)) {
    return J(400, { error: "invalid segment type" });
  }
  if (segment?.type === "source" && !segment.source) {
    return J(400, { error: "segment.source required for source segment" });
  }

  if (isScheduled) {
    status = "scheduled";
    sendStatus = "scheduled";
  } else {
    try {
      stats = await sendCampaignEmails(siteId, subject, bodyHtml, segment);
      status = "sent";
      sendStatus = "sent";
    } catch (err) {
      console.error("campaign_send_failed", err);
      return J(500, { error: err?.message || "email sending not configured" });
    }
  }

  const payload = {
    siteId,
    campaignId,
    name,
    subject,
    bodyHtml,
    bodyText,
    sendAt: sendAtIso,
    segment: segment || { type: "all" },
    status,
    stats,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  try {
    await db.send(
      new PutItemCommand({
        TableName: CAMP_TABLE,
        Item: {
          siteId: { S: siteId },
          campaignId: { S: campaignId },
          status: { S: status },
          sendStatus: { S: sendStatus },
          sendAt: { S: sendAtIso },
          payload: { S: JSON.stringify(payload) }
        }
      })
    );

    return J(201, { campaignId, status, stats, sendAt: sendAtIso });
  } catch (err) {
    console.error("createCampaign error", err);
    return J(500,{error:"internal error"});
  }
};

// ---------- ADMIN: list campaigns (JWT) ----------
// GET /admin/email/campaigns?siteId=my-site
export const listCampaigns = async (evt)=>{
  if (!isAdmin(evt)) return J(403,{error:"forbidden"});
  if (!CAMP_TABLE) return J(500,{error:"email_campaigns_table_not_configured"});

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
      let payload = {};
      if (i.payload?.S) {
        try {
          payload = JSON.parse(i.payload.S);
        } catch {
          payload = {};
        }
      }
      const status =
        payload.status || i.status?.S || i.sendStatus?.S || "unknown";
      const sendAt =
        payload.sendAt || payload.scheduledAt || i.sendAt?.S || null;
      return {
        ...payload,
        siteId: payload.siteId || siteId,
        campaignId: payload.campaignId || i.campaignId.S,
        status,
        sendAt
      };
    });

    return J(200, items);
  } catch (err) {
    console.error("listCampaigns error", err);
    return J(500,{error:"internal error"});
  }
};
