# 🚀 Invonaut Production Deployment Guide

This guide walks through deploying Invonaut to production using Vercel and Supabase.

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

### Code Quality
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] ESLint warnings addressed (`npm run lint`)
- [ ] Edge case testing completed
- [ ] Cross-browser testing done (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified (375px+ width)

### Security
- [ ] RLS (Row Level Security) enabled on all database tables
- [ ] RLS policies tested for data isolation
- [ ] Environment variables secured (not in Git)
- [ ] Email confirmation enabled in Supabase Auth
- [ ] API routes protected with authentication checks
- [ ] Input validation implemented on all forms
- [ ] XSS prevention verified
- [ ] Logo upload validation working (file size, format)

### Configuration
- [ ] Production environment variables ready
- [ ] Supabase production project created
- [ ] Supabase Storage bucket configured for logos
- [ ] OpenAI API key has sufficient credits
- [ ] Resend API key is valid
- [ ] Domain name purchased (if using custom domain)
- [ ] SSL certificate ready (handled by Vercel automatically)

### Documentation
- [ ] README.md complete and accurate
- [ ] USER_GUIDE.md created
- [ ] DEPLOYMENT.md reviewed (this file)
- [ ] .env.example up to date

---

## 🏗️ Architecture Overview

### Production Stack

```
┌─────────────────────────────────────────────┐
│          Users (Browser/Mobile)             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         Vercel (Edge Network)               │
│    - Next.js App (SSR + Static)             │
│    - API Routes (Serverless Functions)      │
└────────┬─────────────┬─────────────┬────────┘
         │             │             │
         ▼             ▼             ▼
    ┌────────┐   ┌──────────┐  ┌─────────┐
    │Supabase│   │ OpenAI   │  │ Resend  │
    │DB+Store│   │   API    │  │  Email  │
    └────────┘   └──────────┘  └─────────┘
```

### Data Flow
1. User accesses app via Vercel edge network
2. Next.js serves pages (SSR or static)
3. API routes handle backend logic
4. Supabase manages database, auth, and file storage (logos)
5. OpenAI provides AI predictions
6. Resend sends transactional emails

---

## 🗄️ Step 1: Supabase Production Setup

### Create Production Project

1. **Go to Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Click "New Project"

2. **Configure Project**
   - **Name**: Invonaut-production
   - **Database Password**: Generate strong password (save securely)
   - **Region**: Choose closest to your users (US East, EU West, etc.)
   - **Pricing Plan**: Start with Free tier
   - Click "Create new project"

3. **Wait for Provisioning** (2-3 minutes)

### Set Up Database Schema

1. **Go to SQL Editor**
   - Navigate to SQL Editor in Supabase dashboard
   - Click "New Query"

2. **Run Schema Migration**

Copy and paste this complete schema:

```sql
-- ================================================
-- Invonaut PRODUCTION DATABASE SCHEMA
-- ================================================

-- Create user_profiles table with white label support
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  business_name TEXT,
  address TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#0066FF',
  secondary_brand_color TEXT DEFAULT '#00D4AA',
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'business')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 200),
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  payment_terms INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  notes TEXT,
  last_followed_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_invoice_number_per_user UNIQUE (user_id, invoice_number)
);

-- Create invoice_items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- ================================================
-- CREATE RLS POLICIES - USER PROFILES
-- ================================================

CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ================================================
-- CREATE RLS POLICIES - CLIENTS
-- ================================================

CREATE POLICY "Users can view own clients" 
  ON clients FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" 
  ON clients FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" 
  ON clients FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" 
  ON clients FOR DELETE 
  USING (auth.uid() = user_id);

-- ================================================
-- CREATE RLS POLICIES - INVOICES
-- ================================================

CREATE POLICY "Users can view own invoices" 
  ON invoices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" 
  ON invoices FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" 
  ON invoices FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices" 
  ON invoices FOR DELETE 
  USING (auth.uid() = user_id);

-- ================================================
-- CREATE RLS POLICIES - INVOICE ITEMS
-- ================================================

CREATE POLICY "Users can view own invoice items" 
  ON invoice_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoice items" 
  ON invoice_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoice items" 
  ON invoice_items FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own invoice items" 
  ON invoice_items FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- ================================================
-- SCHEMA MIGRATION COMPLETE
-- ================================================
```

3. **Click "Run"** and verify "Success" message

### Set Up Storage for Logo Uploads

1. **Go to Storage in Supabase Dashboard**

2. **Create New Bucket**
   - Click "New Bucket"
   - **Name**: `logos`
   - **Public bucket**: Toggle ON (logos need to be publicly accessible)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: Leave empty or add: `image/png, image/jpeg, image/svg+xml, image/webp`
   - Click "Create bucket"

3. **Configure Bucket Policies**

The bucket should already be public, but verify:
- Go to Storage → logos bucket → Policies
- Ensure "Public access" is enabled
- If not, add this policy:

```sql
-- Allow public access to logo files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- Allow authenticated users to upload their own logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own logos
CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

4. **Test Logo Upload**
   - Upload a test image through Supabase dashboard
   - Verify you can access it via public URL
   - Delete test image

### Configure Authentication

1. **Go to Authentication → Settings**

2. **Enable Email Confirmation**
   - Toggle "Enable email confirmations" ON
   - Users must verify email before accessing dashboard

3. **Configure Site URL**
   - Set to your production domain: `https://your-domain.com`
   - Or Vercel URL: `https://Invonaut-mvp.vercel.app`

4. **Configure Redirect URLs**
   - Add: `https://your-domain.com/auth/callback`
   - Add: `https://your-domain.com/*` (wildcard for all routes)

5. **Customize Email Templates** (Optional)
   - Go to Authentication → Email Templates
   - Customize "Confirm signup" template
   - Add your branding and messaging

### Get API Keys

1. **Go to Settings → API**
2. **Copy these values** (save securely):
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## ☁️ Step 2: Vercel Deployment

### Initial Setup

1. **Push Code to GitHub**
```bash
cd C:\Users\kamoh\Invonaut-Project\Invonaut-saas
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

2. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Select "Import Git Repository"

3. **Connect GitHub Repository**
   - Authorize Vercel to access your GitHub
   - Select `Invonaut-mvp` repository
   - Click "Import"

### Configure Project

1. **Project Settings**
   - **Project Name**: Invonaut-mvp (or your preferred name)
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: ./
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: .next (default)

2. **Add Environment Variables**

Click "Environment Variables" and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Resend Configuration
RESEND_API_KEY=your_resend_api_key
```

**Important**: 
- Use **Production** Supabase values (not development)
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Never commit these to Git
- Storage (logos) is automatically handled via Supabase URL

3. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Celebrate when you see "Production Deployment Successful" 🎉

### Verify Deployment

1. **Visit Your Live Site**
   - Click the deployment URL (e.g., `Invonaut-mvp.vercel.app`)
   - Test signup flow
   - Create test client and invoice
   - Verify database connection works
   - **Test logo upload** (if on Professional/Business tier)

2. **Check Build Logs**
   - If deployment fails, check build logs in Vercel dashboard
   - Common issues: missing environment variables, build errors

---

## 📧 Step 3: Email Configuration (Resend)

### Why Domain Verification is Critical

**Free Tier Limitation**: Without domain verification, Resend only sends to verified email addresses (your own email). For production, you must verify your domain.

### Option A: Use Resend (Recommended)

1. **Purchase Domain** (if you don't have one)
   - Namecheap, GoDaddy, Google Domains
   - Cost: $10-15/year

2. **Add Domain to Resend**
   - Go to [resend.com/domains](https://resend.com/domains)
   - Click "Add Domain"
   - Enter your domain: `yourdomain.com`

3. **Add DNS Records**

Resend will provide DNS records to add:

```
Type: TXT
Host: @
Value: [verification code from Resend]

Type: TXT  
Host: resend._domainkey
Value: [DKIM key from Resend]
```

4. **Update DNS at Domain Registrar**
   - Log into your domain registrar (Namecheap, GoDaddy, etc.)
   - Go to DNS management
   - Add the TXT records provided by Resend
   - Save changes

5. **Verify Domain**
   - Return to Resend dashboard
   - Click "Verify Domain"
   - Wait 5-10 minutes for DNS propagation
   - Status should change to "Verified"

6. **Test Email Sending**
   - Send test invoice in production
   - Verify email delivers successfully
   - **Check that white label branding appears** (logo + colors)

### Option B: Use Alternative Email Service

If you want to use a different service:
- **SendGrid**: Popular alternative
- **Mailgun**: Developer-friendly
- **AWS SES**: Cost-effective for high volume

Update email sending code in `src/lib/email/` accordingly.

---

## 🌐 Step 4: Custom Domain Setup (Optional)

### Configure Custom Domain in Vercel

1. **Go to Vercel Project Settings**
   - Select your Invonaut-mvp project
   - Click "Domains"

2. **Add Domain**
   - Enter your domain: `Invonaut.com` or `app.Invonaut.com`
   - Click "Add"

3. **Configure DNS**

Vercel will show DNS configuration:

**Option A - Subdomain (app.Invonaut.com)**:
```
Type: CNAME
Host: app
Value: cname.vercel-dns.com
```

**Option B - Root Domain (Invonaut.com)**:
```
Type: A
Host: @
Value: 76.76.21.21

Type: CNAME
Host: www
Value: cname.vercel-dns.com
```

4. **Update DNS at Registrar**
   - Add records to your domain's DNS settings
   - Save changes
   - Wait 10-30 minutes for propagation

5. **Verify Domain**
   - Vercel automatically verifies and provisions SSL
   - Status changes to "Valid" when ready
   - HTTPS enabled automatically

6. **Update Supabase Settings**
   - Go to Supabase → Authentication → Settings
   - Update Site URL to: `https://your-domain.com`
   - Update Redirect URLs to match new domain
   - **No changes needed for Storage** - uses Supabase URLs

---

## 🔒 Step 5: Security Hardening

### Environment Variables Security

1. **Verify No Secrets in Git**
```bash
git log --all --full-history --source -- '*env*'
```
   - Should return nothing
   - If secrets found, rotate them immediately

2. **Rotate API Keys** (if exposed)
   - Generate new Supabase keys
   - Generate new OpenAI key
   - Generate new Resend key
   - Update in Vercel

### Database Security Audit

1. **Verify RLS Enabled**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
   - All tables should show `rowsecurity = true`

2. **Test Cross-User Access**
   - Create two test accounts
   - Verify User A cannot see User B's data
   - Test all CRUD operations
   - **Test User A cannot access User B's uploaded logos**

3. **Check Foreign Key Constraints**
```sql
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```
   - Verify all relationships correct

### Storage Security Audit

1. **Verify Logo Bucket Policies**
   - Check that `logos` bucket is public (read-only)
   - Verify authenticated users can upload
   - Test that users can only delete their own logos

2. **Test File Upload Limits**
   - Try uploading file > 10MB (should fail)
   - Try uploading non-image file (should fail in UI)
   - Verify only PNG/JPG/SVG/WebP accepted

### API Route Protection

Verify all API routes check authentication:

```typescript
// Example from src/app/api/predict-payment/route.ts
const supabase = createClient();
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Audit these files:
- `src/app/api/predict-payment/route.ts`
- `src/app/api/send-invoice/route.ts`
- `src/app/api/follow-up-invoice/route.ts`

---

## 📊 Step 6: Monitoring & Analytics

### Set Up Error Tracking (Optional but Recommended)

**Option 1: Sentry**
1. Create free Sentry account
2. Add Sentry Next.js SDK:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
3. Configure error reporting
4. Monitor errors in Sentry dashboard

**Option 2: Vercel Analytics**
1. Enable in Vercel dashboard (Project → Analytics)
2. Tracks page views, performance, errors
3. Free tier includes basic metrics

### Set Up User Analytics (Optional)

**Google Analytics 4**
1. Create GA4 property
2. Add tracking code to `src/app/layout.tsx`:
```typescript
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

---

## ✅ Step 7: Post-Deployment Testing

### Critical User Flows

Test these in production:

**1. Signup Flow**
- [ ] Sign up with new email
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Redirected to dashboard
- [ ] Profile created in database with default subscription_tier 'starter'

**2. Client Management**
- [ ] Create new client
- [ ] View client detail
- [ ] Edit client information
- [ ] Delete client (without invoices)
- [ ] Verify RLS (cannot see other users' clients)

**3. Invoice Creation**
- [ ] Create invoice with multiple line items
- [ ] Calculations accurate
- [ ] Invoice number auto-increments
- [ ] Save as draft

**4. Email Sending**
- [ ] Send invoice to verified email
- [ ] Email received with PDF
- [ ] PDF renders correctly
- [ ] Status changes to "Sent"
- [ ] **If Professional/Business tier**: Verify logo and colors in email

**5. Payment Tracking**
- [ ] Mark invoice as paid
- [ ] Status updates
- [ ] Dashboard metrics update

**6. AI Predictions**
- [ ] View prediction for sent invoice
- [ ] Confidence score displays
- [ ] Risk level shows
- [ ] Insights readable

**7. Follow-Up**
- [ ] Send reminder on overdue invoice
- [ ] Email received
- [ ] 48-hour rate limit works
- [ ] Timestamp updates
- [ ] **If Professional/Business tier**: Verify branded email

**8. White Label Settings (Professional/Business Only)**
- [ ] Manually upgrade test user to 'professional' tier in database
- [ ] Navigate to Settings page
- [ ] Upload logo (PNG/JPG/SVG/WebP, < 10MB)
- [ ] Logo displays in preview
- [ ] Click logo to see lightbox modal
- [ ] Choose primary brand color
- [ ] Choose secondary brand color
- [ ] Save changes (no errors)
- [ ] Create and send test invoice
- [ ] Verify logo appears in PDF
- [ ] Verify logo appears in email
- [ ] Verify colors applied correctly
- [ ] Try leaving page without saving (unsaved changes warning)

### Performance Testing

- [ ] Dashboard loads in < 2 seconds
- [ ] Invoice list loads in < 1 second
- [ ] PDF generation completes in < 3 seconds
- [ ] Logo upload completes in < 2 seconds
- [ ] Settings page loads in < 1 second
- [ ] No console errors
- [ ] Mobile responsiveness (test on actual device)

### Security Testing

- [ ] Cannot access other users' data
- [ ] Cannot access other users' uploaded logos
- [ ] Protected routes redirect to login
- [ ] API routes require authentication
- [ ] XSS prevention working
- [ ] SQL injection prevention working
- [ ] File upload validation working (size, format)

---

## 🐛 Common Deployment Issues

### Build Fails on Vercel

**Symptom**: Build logs show TypeScript errors

**Solution**:
1. Run `npm run build` locally
2. Fix all TypeScript errors
3. Commit and push fixes
4. Trigger new deployment

### Database Connection Fails

**Symptom**: "Failed to connect to Supabase"

**Solution**:
1. Verify environment variables in Vercel
2. Check Supabase project is active
3. Verify URL and keys are correct
4. Test with Postman or curl

### Logo Upload Fails

**Symptom**: "Failed to upload logo" error

**Solution**:
1. Verify `logos` bucket exists in Supabase Storage
2. Check bucket is set to Public
3. Verify file is under 10MB
4. Check file format (PNG/JPG/SVG/WebP only)
5. Check Storage policies are correct
6. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel

### Logo Not Displaying in PDFs

**Symptom**: Logo shows in Settings but not in generated PDFs

**Solution**:
1. Verify logo URL is public (test in browser)
2. Check PDF generation code in `src/lib/pdf/generate-invoice-pdf.ts`
3. Verify logo path is correct
4. Check browser console for CORS errors

### White Label Not Showing for User

**Symptom**: User cannot see Settings or white label features

**Solution**:
1. Check `subscription_tier` in database (must be 'professional' or 'business')
2. Verify tier checking logic in `src/app/dashboard/settings/page.tsx`
3. Clear browser cache
4. Check user is logged in

### Emails Not Sending

**Symptom**: "Email failed to send" error

**Solution**:
1. Verify `RESEND_API_KEY` is correct
2. Check domain verification status
3. Test with verified email first
4. Check Resend dashboard logs

### AI Predictions Not Working

**Symptom**: No predictions show on invoices

**Solution**:
1. Verify `OPENAI_API_KEY` is valid
2. Check OpenAI account has credits
3. Check API route logs in Vercel
4. Test API endpoint directly

### RLS Blocking Legitimate Access

**Symptom**: Users can't see their own data

**Solution**:
1. Check user_id matches auth.uid()
2. Verify RLS policies are correct
3. Test with `SELECT auth.uid()` in SQL
4. Temporarily disable RLS to debug (re-enable after!)

---

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

Within 2-3 minutes, changes are live in production.

### Preview Deployments

For feature branches:
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

Vercel creates preview URL for testing before merging to main.

---

## 📈 Scaling Considerations

### When to Upgrade

**Supabase Free Tier Limits**:
- 500MB database size
- 50,000 monthly active users
- 2GB file storage (for logos)
- 5GB bandwidth/month

**Upgrade When**:
- Approaching database size limit
- Need more than 50K users
- Logo storage exceeds 2GB
- Need advanced features (point-in-time recovery)

**Vercel Free Tier Limits**:
- 100GB bandwidth/month
- Unlimited serverless function executions
- 100 deployments/day

**Upgrade When**:
- Exceeding bandwidth
- Need team collaboration
- Need advanced analytics

### Database Optimization

As data grows:
1. Add indexes on frequently queried columns
2. Archive old invoices (>2 years)
3. Implement pagination on large lists
4. Use database connection pooling

### Storage Optimization

As logo uploads grow:
1. Compress logos on upload (client-side)
2. Implement image optimization service
3. Set up CDN for faster logo delivery
4. Archive deleted users' logos

---

## 🔧 Maintenance Checklist

### Weekly
- [ ] Check error logs in Vercel
- [ ] Monitor Supabase database size
- [ ] Check Supabase Storage usage
- [ ] Review user feedback/issues
- [ ] Check email delivery rates

### Monthly
- [ ] Review analytics and metrics
- [ ] Update dependencies: `npm update`
- [ ] Security audit (check for CVEs)
- [ ] Backup database (Supabase auto-backs up)
- [ ] Review API usage/costs
- [ ] Clean up unused logos in Storage

### Quarterly
- [ ] Major dependency updates
- [ ] Security penetration testing
- [ ] Performance optimization review
- [ ] User experience improvements
- [ ] Storage cleanup (archived users)

---

## 📞 Emergency Procedures

### Site Down

1. **Check Vercel Status**: [vercel-status.com](https://www.vercel-status.com)
2. **Check Supabase Status**: [status.supabase.com](https://status.supabase.com)
3. **Check Recent Deployments**: Rollback if needed
4. **Check Error Logs**: Vercel dashboard → Functions → Logs

### Data Loss (Unlikely with Supabase)

1. **Contact Supabase Support** immediately
2. **Check backup availability** (daily automatic backups)
3. **Restore from backup** via Supabase dashboard
4. **Notify affected users**

### Security Breach

1. **Rotate all API keys immediately**
2. **Enable 2FA on all accounts**
3. **Audit database access logs**
4. **Check Storage for unauthorized uploads**
5. **Notify affected users if data compromised**
6. **Update passwords/credentials**

---

## ✅ Deployment Complete

Congratulations! Invonaut is now live in production with full white label support. 🎉

### Next Steps

1. **Monitor Performance**: Check Vercel analytics daily
2. **Collect User Feedback**: Add feedback form or email
3. **Test White Label**: Upgrade test users and verify branding works
4. **Iterate**: Fix bugs and add features based on feedback
5. **Market**: Share with target users (freelancers)

### Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Supabase Storage**: [supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

**Production Deployment Date**: __________  
**Deployed By**: Kamohelo Thakhisi  
**Production URL**: __________

---

**🎉 Congratulations on deploying Invonaut to production!**