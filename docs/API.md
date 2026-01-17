# 🔌 Flowance API Documentation

This document provides technical details about Flowance's internal API routes.

**Note**: These are internal API routes used by the Next.js frontend, not public REST APIs. They require authentication and are accessed via the Flowance web application.

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [API Routes Overview](#api-routes-overview)
- [Invoice APIs](#invoice-apis)
- [AI Prediction API](#ai-prediction-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All API routes require authentication via Supabase Auth. Requests must include a valid session cookie.

### Authentication Flow

```typescript
// Example: Checking authentication in API route
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "error": "Access denied"
}
```

---

## 📊 API Routes Overview

| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/predict-payment` | POST | Get AI payment prediction for invoice | ✅ Yes |
| `/api/send-invoice` | POST | Email invoice to client | ✅ Yes |
| `/api/download-invoice` | POST | Generate and download invoice PDF | ✅ Yes |
| `/api/follow-up-invoice` | POST | Send payment reminder email | ✅ Yes |

---

## 📄 Invoice APIs

### Send Invoice Email

**Endpoint**: `POST /api/send-invoice`

**Description**: Sends an invoice email to the client with PDF attachment. Automatically updates invoice status to "sent".

**Request Body**:
```typescript
{
  invoiceId: string  // UUID of the invoice
}
```

**Response** (Success - 200):
```json
{
  "message": "Invoice sent successfully"
}
```

**Response** (Error - 400):
```json
{
  "error": "Invoice not found"
}
```

**Response** (Error - 400):
```json
{
  "error": "Client email not found"
}
```

**Response** (Error - 500):
```json
{
  "error": "Failed to send invoice email",
  "details": "Error message from email service"
}
```

**What It Does**:
1. Fetches invoice details from database
2. Validates client has email address
3. Fetches user's white label settings (logo, colors)
4. Generates PDF with branding
5. Sends email via Resend API with PDF attachment
6. Updates invoice status to "sent"
7. Returns success or error response

**Email Content**:
- Subject: "Invoice [INV-00001] from [Business Name]"
- Includes user's logo (if white label enabled)
- Branded with user's colors (if white label enabled)
- Professional invoice summary
- PDF attachment

**Validation**:
- Invoice must belong to authenticated user (RLS check)
- Client must have an email address
- Invoice can be in any status (Draft, Sent, Paid, Overdue)

---

### Download Invoice PDF

**Endpoint**: `POST /api/download-invoice`

**Description**: Generates and returns invoice PDF for download.

**Request Body**:
```typescript
{
  invoiceId: string  // UUID of the invoice
}
```

**Response** (Success - 200):
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice-INV-00001.pdf"

[PDF binary data]
```

**Response** (Error - 400):
```json
{
  "error": "Invoice not found"
}
```

**Response** (Error - 500):
```json
{
  "error": "Failed to generate PDF",
  "details": "Error message"
}
```

**What It Does**:
1. Fetches invoice details and items
2. Fetches user's white label settings (logo, colors)
3. Generates PDF with branding
4. Returns PDF as downloadable file

**PDF Features**:
- Professional layout with business details
- User's logo (if white label enabled)
- Branded colors (if white label enabled)
- All invoice line items
- Subtotal, tax, and total calculations
- Payment terms and notes

**Validation**:
- Invoice must belong to authenticated user (RLS check)

---

### Send Follow-Up Reminder

**Endpoint**: `POST /api/follow-up-invoice`

**Description**: Sends a payment reminder email for an overdue invoice.

**Request Body**:
```typescript
{
  invoiceId: string  // UUID of the invoice
}
```

**Response** (Success - 200):
```json
{
  "message": "Follow-up email sent successfully"
}
```

**Response** (Error - 400):
```json
{
  "error": "Invoice not found"
}
```

**Response** (Error - 400):
```json
{
  "error": "Client email not found"
}
```

**Response** (Error - 429):
```json
{
  "error": "Please wait 48 hours between follow-ups"
}
```

**Response** (Error - 500):
```json
{
  "error": "Failed to send follow-up email",
  "details": "Error message"
}
```

**What It Does**:
1. Fetches invoice details
2. Validates client has email address
3. Checks last follow-up timestamp (48-hour rate limit)
4. Fetches user's white label settings (logo, colors)
5. Sends reminder email via Resend API
6. Updates `last_followed_up` timestamp
7. Returns success or error response

**Rate Limiting**:
- Can only send one reminder per 48 hours per invoice
- Checks `last_followed_up` column in database
- Returns 429 error if within 48-hour window

**Email Content**:
- Subject: "Payment Reminder: Invoice [INV-00001]"
- Includes user's logo (if white label enabled)
- Branded with user's colors (if white label enabled)
- Professional reminder message
- Number of days overdue
- Original invoice details

**Validation**:
- Invoice must belong to authenticated user (RLS check)
- Client must have email address
- Must wait 48 hours since last follow-up

---

## 🤖 AI Prediction API

### Get Payment Prediction

**Endpoint**: `POST /api/predict-payment`

**Description**: Uses OpenAI GPT-4o-mini to predict when a client will pay an invoice.

**Request Body**:
```typescript
{
  invoiceId: string  // UUID of the invoice
}
```

**Response** (Success - 200):
```json
{
  "predictedDate": "2026-02-15",
  "confidence": 87,
  "riskLevel": "low",
  "insights": "Based on this client's payment history of 92% on-time payments and industry benchmarks, payment is expected within 18 days of the due date. The invoice amount of $2,500 is within the client's typical range."
}
```

**Response** (Error - 400):
```json
{
  "error": "Invoice not found"
}
```

**Response** (Error - 400):
```json
{
  "error": "Client information not found"
}
```

**Response** (Error - 500):
```json
{
  "error": "Failed to generate prediction",
  "details": "OpenAI API error message"
}
```

**What It Does**:
1. Fetches invoice and client details
2. Fetches client's payment history from database
3. Analyzes historical payment patterns
4. Sends data to OpenAI GPT-4o-mini
5. Returns structured prediction with confidence score

**Response Fields**:
- `predictedDate` (string): ISO date when payment is expected (YYYY-MM-DD)
- `confidence` (number): Confidence score from 0-100
  - 90-100: Very confident
  - 70-89: Moderately confident
  - Below 70: Less confident (limited data)
- `riskLevel` (string): Risk assessment
  - `"low"`: Client likely to pay on time
  - `"medium"`: Some concern, monitor closely
  - `"high"`: High chance of late payment
- `insights` (string): Natural language explanation of the prediction

**AI Model**:
- Model: `gpt-4o-mini`
- Context includes:
  - Client payment history (all past invoices)
  - Industry payment benchmarks
  - Invoice amount and payment terms
  - Seasonal factors
  - Similar client patterns

**Cost**:
- Approximately $0.002 per prediction (as of Jan 2026)
- Uses ~500-1000 tokens per request

**Validation**:
- Invoice must belong to authenticated user (RLS check)
- Client data must exist

**Error Handling**:
- If OpenAI API fails, returns 500 error
- If quota exceeded, returns specific error message
- Always validates JSON response from AI

---

## ⚠️ Error Handling

### Standard Error Format

All API routes return errors in this format:

```json
{
  "error": "Human-readable error message",
  "details": "Additional technical details (optional)"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid request data or missing fields |
| 401 | Unauthorized | Not authenticated (no valid session) |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error (database, API, etc.) |

### Common Errors

**Authentication Error**:
```json
{
  "error": "Unauthorized"
}
```

**Resource Not Found**:
```json
{
  "error": "Invoice not found"
}
```

**Rate Limit Exceeded**:
```json
{
  "error": "Please wait 48 hours between follow-ups"
}
```

**External API Error**:
```json
{
  "error": "Failed to send email",
  "details": "Resend API returned 402: Payment Required"
}
```

---

## 🚦 Rate Limiting

### Follow-Up Email Rate Limit

**Rule**: 48-hour cooldown between follow-up reminders per invoice

**Implementation**:
- Stored in `last_followed_up` column (timestamptz)
- Checked in `/api/follow-up-invoice` endpoint
- Returns 429 error if within 48-hour window

**Calculation**:
```typescript
const now = new Date()
const lastFollowUp = new Date(invoice.last_followed_up)
const hoursSince = (now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60)

if (hoursSince < 48) {
  return NextResponse.json(
    { error: 'Please wait 48 hours between follow-ups' },
    { status: 429 }
  )
}
```

**User Feedback**:
- UI shows "Next reminder in Xh" badge
- Button disabled until 48 hours have passed
- Tooltip explains rate limit on hover

---

## 🔧 Development & Testing

### Testing API Routes Locally

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Get authenticated session** (login via UI)

3. **Test with curl** (copy session cookie from browser):
   ```bash
   curl -X POST http://localhost:3000/api/send-invoice \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
     -d '{"invoiceId": "UUID_HERE"}'
   ```

4. **Or use Postman**:
   - Set method to POST
   - Add session cookie from browser
   - Send request body as JSON

### Testing in Production

All API routes are accessible at:
```
https://your-domain.com/api/[route-name]
```

Same authentication requirements apply (must be logged in).

---

## 🚀 Future API Enhancements

Planned for future releases:

- [ ] Public REST API (with API keys) for Business plan users
- [ ] Webhook endpoints for real-time events
- [ ] Batch invoice operations
- [ ] Invoice templates API
- [ ] Expense tracking API
- [ ] Reports and analytics API
- [ ] GraphQL API (alternative to REST)

---

## 📞 Support

For API-related issues:
- Check error logs in Vercel dashboard (Production)
- Check browser console (Development)
- Review Supabase logs for database errors
- Check OpenAI API status for prediction failures
- Check Resend API logs for email issues

---

**Last Updated**: January 18, 2026  
**API Version**: 0.95.0  
**Documentation Status**: Complete for MVP