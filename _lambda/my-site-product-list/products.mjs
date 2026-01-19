import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, UpdateItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
const db = new DynamoDBClient({});
const T = process.env.PRODUCTS_TABLE;
const B = process.env.IMAGES_BUCKET;
const R = process.env.AWS_REGION || "us-east-1";
const ALLOWED = process.env.SITE_ID_ALLOWED || "";
const J=(c,b)=>({statusCode:c,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"},body:JSON.stringify(b)});
const urlFor=(key)=>`https://${B}.s3.${R}.amazonaws.com/${key}`;
const guardSite = (siteId)=>{
  if(!siteId) return J(400,{error:"siteId required"});
  if(ALLOWED && siteId !== ALLOWED) return J(403,{error:"forbidden: wrong siteId"});
  return null;
};
const isAdmin=(evt)=> (evt.requestContext?.authorizer?.jwt?.claims?.["cognito:groups"]||"").toString().includes("admins");
const normalizeSizes = (sizes)=>{
  if (!sizes) return [];
  if (Array.isArray(sizes)) return sizes.map(s=>String(s).trim()).filter(Boolean);
  if (typeof sizes === "string") {
    return sizes.split(",").map(s=>s.trim()).filter(Boolean);
  }
  return [];
};

export const listProducts = async (evt)=>{
  const siteId = evt.queryStringParameters?.siteId;
  const deny = guardSite(siteId); if (deny) return deny;
  const r = await db.send(new QueryCommand({
    TableName:T, KeyConditionExpression:"siteId=:s",
    ExpressionAttributeValues:{":s":{S:siteId}}
  }));
  const items = (r.Items||[]).map(i=>{
    const p = i.payload?.S ? JSON.parse(i.payload.S) : {};
    if (Array.isArray(p.images)) p.imageUrls = p.images.map(k=>urlFor(k));
    p.productId = i.productId.S;
    p.active = i.active?.BOOL ?? true;
    return p;
  });
  return J(200,items);
};

export const getProduct = async (evt)=>{
  const siteId = evt.queryStringParameters?.siteId;
  const id = evt.pathParameters?.id;
  const deny = guardSite(siteId); if (deny) return deny;
  if(!id) return J(400,{error:"id required"});
  const r = await db.send(new GetItemCommand({TableName:T,Key:{siteId:{S:siteId},productId:{S:id}}}));
  if(!r.Item) return J(404,{error:"not found"});
  const p = r.Item.payload?.S ? JSON.parse(r.Item.payload.S) : {};
  p.productId = id;
  if (Array.isArray(p.images)) p.imageUrls = p.images.map(k=>urlFor(k));
  return J(200,p);
};

export const createProduct = async (evt)=>{
  if(!isAdmin(evt)) return J(403,{error:"forbidden"});
  const body = JSON.parse(evt.body||"{}");
  const { siteId, name, price, images=[], description="", sku="", sizes=[] } = body;
  const deny = guardSite(siteId); if (deny) return deny;
  if(!name||price==null) return J(400,{error:"name, price required"});
  const id = body.productId || (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const now = new Date().toISOString();
  const payload = { siteId, name, price, images, description, sku, sizes: normalizeSizes(sizes), createdAt: now, updatedAt: now };
  await db.send(new PutItemCommand({
    TableName:T,
    Item:{ siteId:{S:siteId}, productId:{S:id}, active:{BOOL:true}, payload:{S:JSON.stringify(payload)} },
    ConditionExpression:"attribute_not_exists(siteId) AND attribute_not_exists(productId)"
  }));
  return J(201,{ productId:id });
};

export const updateProduct = async (evt)=>{
  if(!isAdmin(evt)) return J(403,{error:"forbidden"});
  const id = evt.pathParameters?.id;
  const body = JSON.parse(evt.body||"{}");
  const { siteId } = body;
  const deny = guardSite(siteId); if (deny) return deny;
  if(!id) return J(400,{error:"id required"});
  const now = new Date().toISOString();
  const payload = {...body, updatedAt: now };
  if (payload.sizes !== undefined) {
    payload.sizes = normalizeSizes(payload.sizes);
  }
  await db.send(new UpdateItemCommand({
    TableName:T, Key:{ siteId:{S:siteId}, productId:{S:id} },
    UpdateExpression:"SET payload=:p, updatedAt=:u",
    ExpressionAttributeValues:{":p":{S:JSON.stringify(payload)}, ":u":{S:now}}
  }));
  return { statusCode:204, headers:{"Access-Control-Allow-Origin":"*"} };
};

export const deleteProduct = async (evt)=>{
  if(!isAdmin(evt)) return J(403,{error:"forbidden"});
  const siteId = evt.queryStringParameters?.siteId;
  const id = evt.pathParameters?.id;
  const deny = guardSite(siteId); if (deny) return deny;
  if(!id) return J(400,{error:"id required"});
  await db.send(new DeleteItemCommand({ TableName:T, Key:{siteId:{S:siteId}, productId:{S:id}} }));
  return { statusCode:204, headers:{"Access-Control-Allow-Origin":"*"} };
};
