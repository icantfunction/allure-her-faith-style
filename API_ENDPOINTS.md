# API Endpoints Documentation

This document describes the available API Gateway endpoints and their supported routes for the Allure Her Faith Style application.

## Overview

The application uses AWS API Gateway with multiple endpoints. It's important to understand which endpoints support which operations to ensure the frontend calls the correct API.

## Available API Endpoints

### 1. CloudFront API (Recommended for Admin Operations)
**Base URL:** `https://d1pqkh0r4pj29.cloudfront.net`

**Environment Variable:** `VITE_API_BASE`

**Status:** ✅ Full Support - This is the primary API endpoint that supports all operations.

#### Supported Routes:

##### Public Routes
- `GET /public/products?siteId={siteId}` - List all products
- `GET /public/products/{id}?siteId={siteId}` - Get a single product
- `GET /public/theme?siteId={siteId}` - Get site theme configuration
- `POST /public/email/subscribe` - Subscribe to email list
- `POST /public/email/unsubscribe` - Unsubscribe from email list
- `POST /analytics/visit` - Record site visit

##### Admin Routes (Requires JWT Authentication)
- `GET /admin/config?siteId={siteId}` - Get admin configuration
- `PUT /admin/config` - Update admin configuration
- `GET /admin/products?siteId={siteId}` - List all products (admin view)
- `POST /admin/products` - Create a new product
- `PUT /admin/products/{id}` - ✅ **Update a product**
- `DELETE /admin/products/{id}?siteId={siteId}` - ✅ **Delete a product**
- `GET /admin/orders?siteId={siteId}` - List orders
- `GET /admin/orders/{orderId}?siteId={siteId}` - Get order details
- `POST /admin/orders/bulk-print-labels` - Bulk print shipping labels
- `POST /admin/orders/{orderId}/status` - Update order status
- `GET /admin/email/subscribers?siteId={siteId}` - List email subscribers
- `GET /admin/email/campaigns?siteId={siteId}` - List email campaigns
- `POST /admin/email/campaigns` - Create and send email campaign
- `GET /admin/analytics/daily?siteId={siteId}&start={date}&end={date}` - Get daily analytics
- `POST /admin/images/presign` - Get presigned URL for image upload
- `POST /admin/checkout/create-session` - Create Stripe checkout session

### 2. API Gateway 1f7dvduzvg (Shipping Calculator)
**Base URL:** `https://1f7dvduzvg.execute-api.us-east-1.amazonaws.com`

**Environment Variable:** `VITE_SHIPPING_API_URL`

**Status:** ⚠️ Limited Support - Specialized endpoint for shipping calculations only.

#### Supported Routes:
- `POST /calculate-shipping` - Calculate shipping costs for orders

### 3. API Gateway 90rzuoiw2c (Partial Admin Support)
**Base URL:** Not currently configured in this repository

**Status:** ⚠️ **Limited Support** - This API Gateway endpoint has INCOMPLETE admin functionality.

#### ✅ Supported Routes:
- `GET /admin/orders` - List orders
- `GET /admin/orders/{orderId}` - Get order details  
- `POST /admin/orders/bulk-print-labels` - Bulk print shipping labels

#### ❌ NOT Supported Routes:
- `DELETE /admin/products/{id}` - **NOT AVAILABLE** - Use CloudFront API instead
- `PUT /admin/products/{id}` - **NOT AVAILABLE** - Use CloudFront API instead

> **Important:** If you configure your frontend to use `90rzuoiw2c` as the base API, product deletion and updates will NOT work. You must use the CloudFront API endpoint (d1pqkh0r4pj29.cloudfront.net) for full admin functionality.

## Current Frontend Configuration

The frontend is currently configured to use the **CloudFront API** for all operations:

```
VITE_API_BASE=https://d1pqkh0r4pj29.cloudfront.net
VITE_SHIPPING_API_URL=https://1f7dvduzvg.execute-api.us-east-1.amazonaws.com/calculate-shipping
```

This configuration provides full functionality for:
- ✅ Product management (create, read, update, delete)
- ✅ Order management (read, update, bulk operations)
- ✅ Email management
- ✅ Analytics
- ✅ Configuration management
- ✅ Shipping calculations

## Troubleshooting

### Issue: "DELETE /admin/products/{id} returns 404 or 403"

**Cause:** You may be using an API Gateway endpoint that doesn't support the delete route (e.g., `90rzuoiw2c`).

**Solution:** 
1. Check your `VITE_API_BASE` environment variable
2. Ensure it points to the CloudFront API: `https://d1pqkh0r4pj29.cloudfront.net`
3. Alternatively, point it to an API Gateway that has the delete route implemented (e.g., `1f7dvduzvg` if it has been configured)

### Issue: "PUT /admin/products/{id} returns 404 or 403"

**Cause:** Same as above - the API endpoint doesn't support product updates.

**Solution:** Same as above - use the CloudFront API or a fully-configured API Gateway.

### Orders Work But Products Don't

**Cause:** You're likely using `90rzuoiw2c` which only has order routes implemented.

**Solution:** Switch to CloudFront API for full product management support.

## Backend Development Notes

If you're developing the backend infrastructure and need to add routes to `90rzuoiw2c`:

1. Add `DELETE /admin/products/{id}` route to support product deletion
2. Add `PUT /admin/products/{id}` route to support product updates
3. Ensure proper JWT authentication is configured
4. Update this documentation once routes are deployed

## See Also

- Frontend API implementation: `src/lib/api.ts`
- Admin products page: `src/pages/admin/Products.tsx`
- Environment configuration: `.env.example`, `.env.production`
