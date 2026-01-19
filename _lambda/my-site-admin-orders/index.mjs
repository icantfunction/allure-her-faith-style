import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const AWS = require('aws-sdk');
const PDFDocument = (await import('pdfkit')).default;
import QRCode from 'qrcode';

AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const ddb = new AWS.DynamoDB.DocumentClient();
const s3  = new AWS.S3();

const ORDERS_TABLE   = process.env.ORDERS_TABLE || 'Orders';
const ORDERS_HAS_SITE_ID = process.env.ORDERS_TABLE_HAS_SITE_ID === 'true';
const LABELS_BUCKET  = process.env.LABELS_BUCKET;
const SITE_ID_DEFAULT= process.env.SITE_ID_DEFAULT || 'my-site';

// Helpers
const ok = (b)=>({ statusCode:200, headers:cors(), body: JSON.stringify(b) });
const bad= (c,m)=>({ statusCode:c, headers:cors(), body: JSON.stringify({error:m})});
const cors=()=>({ "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"*", "Content-Type":"application/json" });
const nowIso=()=> new Date().toISOString();
const toBool=(v)=> String(v).toLowerCase()==='true';

async function listOrders(q){
  const siteId = q.siteId || SITE_ID_DEFAULT;
  const status = q.status;
  const hasLabel = q.hasLabel; // 'true'/'false'
  const limit = Math.min(parseInt(q.limit||'50',10), 200);
  const search = q.q;

  // Scan + Filter (simple + monolithic)
  const params = {
    TableName: ORDERS_TABLE,
    Limit: limit
  };

  const filterParts = [];
  const names = {};
  const values = {};

  if (siteId) {
    names['#s'] = 'siteId';
    values[':site'] = siteId;
    if (ORDERS_HAS_SITE_ID) {
      filterParts.push('#s = :site');
    } else {
      filterParts.push('(attribute_not_exists(#s) OR #s = :site)');
    }
  }

  if (status){
    filterParts.push('#st = :st');
    names['#st'] = 'status';
    values[':st'] = status;
  }

  if (hasLabel === 'true' || hasLabel === 'false'){
    const exists = hasLabel === 'true';
    filterParts.push(
      exists
        ? '(attribute_exists(trackingId) OR attribute_exists(trackingCode))'
        : '(attribute_not_exists(trackingId) AND attribute_not_exists(trackingCode))'
    );
  }

  if (filterParts.length) {
    params.FilterExpression = filterParts.join(' AND ');
    params.ExpressionAttributeNames = names;
    params.ExpressionAttributeValues = values;
  }

  const out=[];
  let lastKey;
  do{
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const r = await ddb.scan(params).promise();
    let items = r.Items || [];
    if (search){
      const ql = search.toLowerCase();
      items = items.filter(it =>
        (it.orderId||'').toLowerCase().includes(ql) ||
        (it.customerName||'').toLowerCase().includes(ql) ||
        (it.email||'').toLowerCase().includes(ql)
      );
    }
    const normalized = items.map(normalizeOrder);
    out.push(...normalized);
    lastKey = r.LastEvaluatedKey;
  } while (out.length < limit && lastKey);

  return { items: out.slice(0, limit) };
}

async function getOrder(siteId, orderId){
  const key = ORDERS_HAS_SITE_ID ? { siteId, orderId } : { orderId };
  const r = await ddb.get({ TableName: ORDERS_TABLE, Key: key }).promise();
  return normalizeOrder(r.Item);
}

function trackingIdFor(orderId){
  // short human-ish ID
  const rnd = Math.random().toString(36).slice(2,8).toUpperCase();
  return `TRK-${orderId.slice(0,6).toUpperCase()}-${rnd}`;
}

async function makeLabelsPDF(siteId, orders, opts){
  const format = (opts.format === '4x6') ? [288,432] : 'A4'; // 4x6 inches (~72dpi)
  const buffers=[];
  const doc = new PDFDocument({ size: format, margin: 24 });

  doc.on('data', d => buffers.push(d));
  const done = new Promise(res => doc.on('end', () => res(Buffer.concat(buffers))));

  for (let i=0;i<orders.length;i++){
    const o = orders[i];
    if (i>0) doc.addPage();
    const tracking = o.trackingId || trackingIdFor(o.orderId);
    // Header
    doc.fontSize(14).text(`[${siteId}] ${opts.carrier||'Standard'}`, {align:'left'});
    doc.fontSize(10).text(`Order: ${o.orderId}`);
    doc.moveDown(0.25);
    doc.text(`Ship To: ${o.customerName||''}`);
    const address = o.shippingAddress || o.address;
    if (address) {
      const a = address;
      const lines = [a.line1, a.line2, `${a.city||''} ${a.region||a.state||''} ${a.postal_code||a.postalCode||''}`, a.country].filter(Boolean);
      lines.forEach(l=> doc.text(l));
    }
    doc.moveDown(0.25);
    doc.text(`Email: ${o.email||'-'}  Phone: ${o.phone||'-'}`);
    doc.moveDown(0.25);
    doc.text(`Method: ${o.shippingMethod||'-'}   Total: ${o.total||'-'} ${o.currency||''}`);

    // QR / barcode (QR for simplicity)
    const qrDataUrl = await QRCode.toDataURL(tracking, { margin:0, scale:4 });
    const imgB64 = qrDataUrl.split(',')[1];
    const imgBuf = Buffer.from(imgB64, 'base64');
    doc.image(imgBuf, doc.page.width - 120, 24, { width: 96 });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Tracking: ${tracking}`);

    // footer
    doc.moveDown(0.5);
    doc.fontSize(8).text(`Label ID: ${tracking} • Generated: ${nowIso()}`);
  }

  doc.end();
  return await done;
}

async function updateOrdersWithLabels(siteId, orders, key){
  const updated=[];
  for (const o of orders){
    const trk = o.trackingId || trackingIdFor(o.orderId);
    await ddb.update({
      TableName: ORDERS_TABLE,
      Key: ORDERS_HAS_SITE_ID ? { siteId, orderId: o.orderId } : { orderId: o.orderId },
      UpdateExpression: 'SET #lg=:lg, #trk=:trk, #url=:url',
      ExpressionAttributeNames: { '#lg':'labelGeneratedAt', '#trk':'trackingId', '#url':'labelUrl' },
      ExpressionAttributeValues: { ':lg': nowIso(), ':trk': trk, ':url': `s3://${LABELS_BUCKET}/${key}` }
    }).promise();
    updated.push({ orderId: o.orderId, trackingId: trk });
  }
  return updated;
}

function normalizeOrder(order){
  if (!order) return order;
  const trackingId = order.trackingId || order.trackingCode || null;
  return {
    ...order,
    trackingId,
    hasLabel: Boolean(trackingId || order.labelUrl),
  };
}

export const handler = async (event) => {
  try{
    const method = event.requestContext?.http?.method || event.httpMethod;
    const rawPath = event.requestContext?.http?.path || event.rawPath || '';
    const qs = event.queryStringParameters || {};
    const siteId = qs.siteId || SITE_ID_DEFAULT;

    let path = rawPath;
    const stage = event.requestContext?.stage;
    if (stage && path.startsWith(`/${stage}`)) {
      path = path.slice(stage.length + 1);
    }

    if (method === 'GET' && path === '/admin/orders'){
      const data = await listOrders(qs);
      return ok(data);
    }

    if (method === 'GET' && path.startsWith('/admin/orders/')){
      const orderId = decodeURIComponent(path.split('/').pop());
      const item = await getOrder(siteId, orderId);
      return item ? ok(item) : bad(404, 'Not found');
    }

    if (method === 'POST' && path === '/admin/orders/bulk-print-labels'){
      if (!LABELS_BUCKET) return bad(500, 'LABELS_BUCKET not set');
      const body = event.body ? JSON.parse(event.body) : {};
      const ids = body.orderIds || [];
      if (!Array.isArray(ids) || ids.length === 0) return bad(400, 'orderIds required');

      const orders=[];
      for (const id of ids){
        const it = await getOrder(siteId, id);
        if (it) orders.push(it);
      }
      if (orders.length === 0) return bad(404, 'No orders found');

      const pdf = await makeLabelsPDF(siteId, orders, {
        format: body.format || 'A4',
        carrier: body.carrier || 'Standard'
      });
      const key = `labels/${siteId}/${new Date().toISOString().slice(0,10)}/batch-${Date.now()}.pdf`;
      await s3.putObject({ Bucket: LABELS_BUCKET, Key: key, Body: pdf, ContentType: 'application/pdf' }).promise();
      const pdfUrl = s3.getSignedUrl('getObject', { Bucket: LABELS_BUCKET, Key: key, Expires: 3600*24 });

      const updated = await updateOrdersWithLabels(siteId, orders, key);
      return ok({ pdfUrl, updatedCount: updated.length, updated });
    }

    return bad(404, 'Route not found');
  } catch (err){
    console.error('admin_api_error', err);
    return bad(500, err.message || 'error');
  }
};
