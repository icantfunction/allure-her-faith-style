import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  GetItemCommand,
  UpdateItemCommand,
  ScanCommand
} from "@aws-sdk/client-dynamodb";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const db = new DynamoDBClient({});
const ses = new SESv2Client({});

const SITE_ID_ALLOWED = process.env.SITE_ID_ALLOWED;
const SUBSCRIBERS_TABLE = process.env.SUBSCRIBERS_TABLE || "EmailSubscribers";
const CAMPAIGNS_TABLE = process.env.CAMPAIGNS_TABLE || "EmailCampaigns";
const SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS;
const TEST_RECIPIENTS = (process.env.TEST_RECIPIENTS || "info@shopallureher.com,ramosnco@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const J = (statusCode, body) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
  },
  body: body == null ? "" : JSON.stringify(body)
});

const guardSite = (siteId) => {
  if (!siteId) return J(400, { error: "siteId required" });
  if (SITE_ID_ALLOWED && siteId !== SITE_ID_ALLOWED) {
    return J(403, { error: "forbidden: wrong siteId" });
  }
  return null;
};

// very simple: any valid JWT = admin (you only have admin user right now)
const isAdmin = (evt) => !!evt.requestContext?.authorizer?.jwt;

// helper: random id
const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---------- helpers ----------

// load subscribers (includes status/source)
async function loadSubscribers(siteId) {
  const res = await db.send(
    new QueryCommand({
      TableName: SUBSCRIBERS_TABLE,
      KeyConditionExpression: "siteId = :s",
      ExpressionAttributeValues: {
        ":s": { S: siteId }
      }
    })
  );

  const out = [];
  for (const i of res.Items ?? []) {
    const email = i.email?.S;
    let status = "subscribed";
    let source = null;
    if (i.payload?.S) {
      try {
        const p = JSON.parse(i.payload.S);
        if (p.status) status = p.status;
        if (p.source) source = p.source;
      } catch {
        // ignore parse errors, treat as subscribed
      }
    }
    if (email) {
      out.push({ email, status, source });
    }
  }
  return out;
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

// send to all active subs for a site
async function sendCampaignEmails(siteId, subject, bodyHtml, segment) {
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
      success++;
    } catch (err) {
      failed++;
      console.error("send failure", sub.email, err);
    }
  }

  return {
    totalRecipients: total,
    successCount: success,
    failedCount: failed
  };
}

// ---------- PUBLIC: subscribe ----------
export const subscribe = async (evt) => {
  let body;
  try {
    body = JSON.parse(evt.body || "{}");
  } catch {
    return J(400, { error: "invalid JSON" });
  }

  const { siteId, email, source = null } = body || {};
  const deny = guardSite(siteId);
  if (deny) return deny;

  if (!email) return J(400, { error: "email required" });
  const normalizedEmail = email.trim().toLowerCase();

  const now = new Date().toISOString();
  const payload = {
    siteId,
    email,
    source,
    status: "subscribed",
    createdAt: now,
    updatedAt: now
  };

  try {
    await db.send(
      new PutItemCommand({
        TableName: SUBSCRIBERS_TABLE,
        Item: {
          siteId: { S: siteId },
          email: { S: email },
          payload: { S: JSON.stringify(payload) }
        }
      })
    );
    return J(204, null);
  } catch (err) {
    console.error("subscribe error", err);
    return J(500, { error: "internal error" });
  }
};

// ---------- PUBLIC: unsubscribe ----------
export const unsubscribe = async (evt) => {
  let body;
  try {
    body = JSON.parse(evt.body || "{}");
  } catch {
    return J(400, { error: "invalid JSON" });
  }

  const { siteId, email } = body || {};
  const deny = guardSite(siteId);
  if (deny) return deny;

  if (!email) return J(400, { error: "email required" });

  try {
    const res = await db.send(
      new GetItemCommand({
        TableName: SUBSCRIBERS_TABLE,
        Key: {
          siteId: { S: siteId },
        email: { S: normalizedEmail }
      }
    })
  );

    if (!res.Item || !res.Item.payload?.S) {
      const now = new Date().toISOString();
      const payload = {
        siteId,
        email: normalizedEmail,
        status: "unsubscribed",
        source: "unsubscribe",
        createdAt: now,
        updatedAt: now
      };

      await db.send(
        new PutItemCommand({
          TableName: SUBSCRIBERS_TABLE,
          Item: {
            siteId: { S: siteId },
            email: { S: normalizedEmail },
            payload: { S: JSON.stringify(payload) }
          }
        })
      );

      return J(204, null);
    }

    let payload;
    try {
      payload = JSON.parse(res.Item.payload.S);
    } catch {
      payload = { siteId, email: normalizedEmail };
    }

    payload.status = "unsubscribed";
    payload.updatedAt = new Date().toISOString();

    await db.send(
      new PutItemCommand({
        TableName: SUBSCRIBERS_TABLE,
        Item: {
          siteId: { S: siteId },
          email: { S: normalizedEmail },
          payload: { S: JSON.stringify(payload) }
        }
      })
    );

    return J(204, null);
  } catch (err) {
    console.error("unsubscribe error", err);
    return J(500, { error: "internal error" });
  }
};

// ---------- ADMIN: list subscribers ----------
export const listSubscribers = async (evt) => {
  if (!isAdmin(evt)) return J(403, { error: "forbidden" });

  const siteId = evt.queryStringParameters?.siteId;
  const deny = guardSite(siteId);
  if (deny) return deny;

  try {
    const res = await db.send(
      new QueryCommand({
        TableName: SUBSCRIBERS_TABLE,
        KeyConditionExpression: "siteId = :s",
        ExpressionAttributeValues: {
          ":s": { S: siteId }
        }
      })
    );

    const items =
      res.Items?.map((i) => {
        if (!i.payload?.S) return null;
        try {
          const p = JSON.parse(i.payload.S);
          return {
            email: p.email,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            source: p.source ?? null,
            status: p.status ?? "subscribed"
          };
        } catch {
          return null;
        }
      }).filter(Boolean) ?? [];

    return J(200, { items, nextToken: null });
  } catch (err) {
    console.error("listSubscribers error", err);
    return J(500, { error: "internal error" });
  }
};

// ---------- ADMIN: list campaigns ----------
export const listCampaigns = async (evt) => {
  if (!isAdmin(evt)) return J(403, { error: "forbidden" });

  const siteId = evt.queryStringParameters?.siteId;
  const deny = guardSite(siteId);
  if (deny) return deny;

  try {
    const res = await db.send(
      new QueryCommand({
        TableName: CAMPAIGNS_TABLE,
        KeyConditionExpression: "siteId = :s",
        ExpressionAttributeValues: {
          ":s": { S: siteId }
        },
        ScanIndexForward: false, // newest first
        Limit: 100
      })
    );

    const items =
      res.Items?.map((i) => {
        if (!i.payload?.S) return null;
        try {
          const p = JSON.parse(i.payload.S);
          return {
            campaignId: p.campaignId,
            subject: p.subject,
            sendAt: p.sendAt ?? null,
            status: p.status ?? "sent",
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            stats: p.stats || {}
          };
        } catch {
          return null;
        }
      }).filter(Boolean) ?? [];

    return J(200, items);
  } catch (err) {
    console.error("listCampaigns error", err);
    return J(500, { error: "internal error" });
  }
};

// ---------- ADMIN: create (immediate OR scheduled) campaign ----------
export const createCampaign = async (evt) => {
  if (!isAdmin(evt)) return J(403, { error: "forbidden" });

  if (!SES_FROM_ADDRESS) {
    console.error("SES_FROM_ADDRESS env not set");
    return J(500, { error: "email sending not configured" });
  }

  let body;
  try {
    body = JSON.parse(evt.body || "{}");
  } catch {
    return J(400, { error: "invalid JSON" });
  }

  const { siteId, subject, bodyHtml, sendAt, segment } = body || {};
  const deny = guardSite(siteId);
  if (deny) return deny;

  if (!subject || !bodyHtml) {
    return J(400, { error: "subject and bodyHtml required" });
  }
  if (segment?.type && !["all", "source", "test"].includes(segment.type)) {
    return J(400, { error: "invalid segment type" });
  }
  if (segment?.type === "source" && !segment.source) {
    return J(400, { error: "segment.source required for source segment" });
  }

  const now = new Date();
  let sendAtDate = sendAt ? new Date(sendAt) : now;
  if (isNaN(sendAtDate.getTime())) {
    // bad sendAt, fall back to now
    sendAtDate = now;
  }
  const sendAtIso = sendAtDate.toISOString();

  const FUTURE_THRESHOLD_MS = 60 * 1000; // > 1 minute in the future = scheduled
  const isScheduled = sendAtDate.getTime() - now.getTime() > FUTURE_THRESHOLD_MS;

  const campaignId = newId();
  const createdIso = now.toISOString();

  if (isScheduled) {
    const payload = {
      siteId,
      campaignId,
      subject,
      bodyHtml,
      sendAt: sendAtIso,
      createdAt: createdIso,
      updatedAt: createdIso,
      status: "scheduled",
      segment: segment || { type: "all" },
      stats: {
        totalRecipients: 0,
        successCount: 0,
        failedCount: 0
      }
    };

    await db.send(
      new PutItemCommand({
        TableName: CAMPAIGNS_TABLE,
        Item: {
          siteId: { S: siteId },
          campaignId: { S: campaignId },
          sendStatus: { S: "scheduled" },
          sendAt: { S: sendAtIso },
          payload: { S: JSON.stringify(payload) }
        }
      })
    );

    return J(200, {
      campaignId,
      status: "scheduled",
      sendAt: sendAtIso
    });
  } else {
    // immediate send
    const stats = await sendCampaignEmails(siteId, subject, bodyHtml, segment);

    const payload = {
      siteId,
      campaignId,
      subject,
      bodyHtml,
      sendAt: sendAtIso,
      createdAt: createdIso,
      updatedAt: new Date().toISOString(),
      status: "sent",
      segment: segment || { type: "all" },
      stats
    };

    await db.send(
      new PutItemCommand({
        TableName: CAMPAIGNS_TABLE,
        Item: {
          siteId: { S: siteId },
          campaignId: { S: campaignId },
          sendStatus: { S: "sent" },
          sendAt: { S: sendAtIso },
          payload: { S: JSON.stringify(payload) }
        }
      })
    );

    return J(200, {
      campaignId,
      status: "sent",
      stats
    });
  }
};

// ---------- SCHEDULER: dispatch due campaigns ----------
// Invoked by EventBridge rule (no HTTP/gateway context)
export const dispatchDueCampaigns = async () => {
  const nowIso = new Date().toISOString();

  try {
    const res = await db.send(
      new ScanCommand({
        TableName: CAMPAIGNS_TABLE,
        FilterExpression: "sendStatus = :scheduled AND sendAt <= :now",
        ExpressionAttributeValues: {
          ":scheduled": { S: "scheduled" },
          ":now": { S: nowIso }
        }
      })
    );

    const items = res.Items ?? [];
    console.log(
      "dispatchDueCampaigns: found",
      items.length,
      "campaign(s) due at or before",
      nowIso
    );

    for (const item of items) {
      const siteId = item.siteId?.S;
      const campaignId = item.campaignId?.S;
      if (!siteId || !campaignId) continue;

      // Acquire lock: only proceed if still scheduled
      try {
        await db.send(
          new UpdateItemCommand({
            TableName: CAMPAIGNS_TABLE,
            Key: {
              siteId: { S: siteId },
              campaignId: { S: campaignId }
            },
            ConditionExpression: "sendStatus = :scheduled",
            UpdateExpression: "SET sendStatus = :sending",
            ExpressionAttributeValues: {
              ":scheduled": { S: "scheduled" },
              ":sending": { S: "sending" }
            }
          })
        );
      } catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
          // someone else grabbed it
          continue;
        }
        console.error("dispatch lock error", siteId, campaignId, err);
        continue;
      }

      // parse payload
      let payload = {};
      if (item.payload?.S) {
        try {
          payload = JSON.parse(item.payload.S);
        } catch {
          payload = {};
        }
      }

      const subject = payload.subject;
      const bodyHtml = payload.bodyHtml;
      if (!subject || !bodyHtml) {
        console.error(
          "campaign missing subject/bodyHtml",
          siteId,
          campaignId
        );
        const now2 = new Date().toISOString();
        payload.status = "failed";
        payload.updatedAt = now2;
        await db.send(
          new UpdateItemCommand({
            TableName: CAMPAIGNS_TABLE,
            Key: {
              siteId: { S: siteId },
              campaignId: { S: campaignId }
            },
            UpdateExpression:
              "SET sendStatus = :failed, payload = :payload",
            ExpressionAttributeValues: {
              ":failed": { S: "failed" },
              ":payload": { S: JSON.stringify(payload) }
            }
          })
        );
        continue;
      }

      // send emails now
      const stats = await sendCampaignEmails(siteId, subject, bodyHtml, payload.segment);
      const now2 = new Date().toISOString();
      payload.status = "sent";
      payload.updatedAt = now2;
      payload.stats = stats;

      await db.send(
        new UpdateItemCommand({
          TableName: CAMPAIGNS_TABLE,
          Key: {
            siteId: { S: siteId },
            campaignId: { S: campaignId }
          },
          UpdateExpression: "SET sendStatus = :sent, payload = :payload",
          ExpressionAttributeValues: {
            ":sent": { S: "sent" },
            ":payload": { S: JSON.stringify(payload) }
          }
        })
      );
    }

    return {
      statusCode: 200,
      body: ""
    };
  } catch (err) {
    console.error("dispatchDueCampaigns error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "internal error" })
    };
  }
};
