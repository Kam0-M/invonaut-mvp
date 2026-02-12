# 🚀 Invonaut

**AI-Powered Invoicing Platform for Freelancers**

Invonaut is an intelligent financial assistant that predicts client payment behavior and automates invoicing workflows. Unlike traditional invoicing tools that just digitize paper processes, Invonaut uses AI to predict when clients will pay, automate follow-ups, and eliminate admin friction.

> **Core Value Proposition**: "Never chase another late payment again. AI that turns your invoicing chaos into cash flow predictability."

---

## ✨ Key Features

### 🤖 AI-Powered Intelligence
- **Payment Predictions**: AI predicts when clients will pay with confidence scores
- **Risk Assessment**: Client risk scoring based on payment history patterns
- **Smart Follow-Ups**: Automated reminder timing with 48-hour rate limiting
- **Natural Language Insights**: Human-readable explanations for all predictions

### 🎨 White Label Branding (Professional & Business Plans)
- **Custom Logo Upload**: Add your business logo (PNG/JPG/SVG/WebP, max 10MB)
- **Brand Colors**: Customize primary and secondary brand colors
- **PDF Branding**: Your logo and colors automatically applied to all invoice PDFs
- **Email Branding**: Professional branded emails with your logo and color scheme
- **Settings Management**: Easy-to-use settings page with real-time preview
- **Tier Gating**: White label features exclusive to Professional ($60/mo) and Business ($79/mo) plans

### 📊 Financial Management
- **Invoice Creation**: Clean, intuitive invoice builder with real-time previews
- **Client Management**: Complete CRM for tracking client relationships
- **Payment Tracking**: Manual status updates (Draft → Sent → Paid/Overdue)
- **Analytics Dashboard**: Revenue trends, payment metrics, and cash flow insights

### 📧 Communication
- **Email Invoices**: Send professional invoices with PDF attachments
- **Payment Reminders**: Automated follow-up emails for overdue invoices
- **Status Notifications**: Real-time updates via toast notifications

### 🔒 Security & Privacy
- **Row-Level Security**: Multi-tenant data isolation via Supabase RLS
- **Email Verification**: Secure signup flow with email confirmation
- **Input Validation**: XSS prevention and SQL injection protection
- **User Ownership**: Users can only access their own data

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Charts**: Recharts
- **Color Picker**: react-colorful (for white label)

### Backend
- **API**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (logo uploads)

### AI & Integrations
- **AI Model**: OpenAI GPT-4o-mini
- **Email Service**: Resend API
- **PDF Generation**: Custom PDF library with white label support

### DevOps
- **Hosting**: Vercel (serverless deployment)
- **Version Control**: Git + GitHub
- **Development**: Cursor IDE (AI-assisted coding)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- Supabase account (free tier)
- OpenAI API key
- Resend API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Kam0-M/Invonaut-mvp.git
cd Invonaut-mvp
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Resend
RESEND_API_KEY=your_resend_api_key
```

4. **Set up Supabase database**

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create user_profiles table
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

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoice items" ON invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoice items" ON invoice_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can update own invoice items" ON invoice_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can delete own invoice items" ON invoice_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
```

5. **Set up Supabase Storage (for logo uploads)**

In Supabase Dashboard → Storage:
- Create a new bucket called `logos`
- Set it to **Public** access
- Set file size limit to 10MB

6. **Configure Supabase Auth**

In Supabase Dashboard → Authentication → Email Templates:
- Enable "Confirm signup" email template
- Set Site URL to `http://localhost:3000` (development) or your production domain
- Set Redirect URLs to include your auth callback: `http://localhost:3000/auth/callback`

7. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
Invonaut-saas/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes (signup, login, verify)
│   │   ├── dashboard/           # Protected dashboard routes
│   │   │   ├── clients/         # Client management pages
│   │   │   ├── invoices/        # Invoice management pages
│   │   │   ├── settings/        # White label settings page
│   │   │   └── page.tsx         # Main dashboard (analytics)
│   │   ├── api/                 # API routes
│   │   │   ├── predict-payment/ # AI payment prediction endpoint
│   │   │   ├── send-invoice/    # Email sending endpoint
│   │   │   └── follow-up-invoice/ # Follow-up reminder endpoint
│   │   ├── help/                # Help center page
│   │   └── auth/                # Auth callback handler
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui base components
│   │   ├── clients/             # Client-specific components
│   │   ├── invoices/            # Invoice-specific components
│   │   └── settings/            # White label settings components
│   ├── lib/                     # Utility functions
│   │   ├── supabase/            # Supabase client configs
│   │   ├── ai/                  # AI prediction logic
│   │   ├── email/               # Email templates (white label support)
│   │   └── pdf/                 # PDF generation (white label support)
│   └── middleware.ts            # Route protection middleware
├── public/                      # Static assets
├── .env.local                   # Environment variables (not committed)
├── .env.example                 # Environment template
├── README.md                    # This file
├── USER_GUIDE.md               # End-user documentation
├── DEPLOYMENT.md               # Production deployment guide
└── package.json                # Dependencies
```

---

## 🎯 Development Workflow

### Running Locally
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing White Label Features
To test white label features without Stripe billing:

```sql
-- Manually upgrade user to Professional tier in Supabase SQL Editor
UPDATE user_profiles 
SET subscription_tier = 'professional' 
WHERE email = 'your-email@example.com';
```

### Database Migrations
When you make database schema changes, run them in Supabase SQL Editor and document them for team members.

### Environment Variables
Never commit `.env.local` to Git. Always use `.env.example` as a template.

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to Supabase"
**Solution**: 
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches your Supabase project
- Ensure RLS policies are enabled

### Issue: "Email not sending"
**Solution**:
- Verify `RESEND_API_KEY` is valid
- Free tier only sends to verified email addresses
- For production, verify your domain in Resend dashboard

### Issue: "AI predictions not working"
**Solution**:
- Check `OPENAI_API_KEY` is valid
- Ensure you have API credits
- Check API route logs for errors

### Issue: "Logo not uploading"
**Solution**:
- Check that `logos` bucket exists in Supabase Storage
- Verify bucket is set to Public access
- Ensure file is under 10MB and is PNG/JPG/SVG/WebP
- Check browser console for errors

### Issue: "White label settings not showing"
**Solution**:
- Verify subscription tier is 'professional' or 'business' in database
- Check `subscription_tier` column exists in `user_profiles` table
- Clear browser cache and refresh

### Issue: "Invoice numbers not incrementing"
**Solution**:
- Each user has independent invoice numbering
- Constraint: `UNIQUE (user_id, invoice_number)`
- Check database for conflicts

### Issue: "Cannot edit sent invoices"
**Solution**:
- This is by design (financial audit trail)
- Only "Draft" status invoices can be edited
- Create a new invoice if changes needed

---

## 🔐 Security Features

### Row-Level Security (RLS)
All database tables have RLS enabled. Users can only access their own data through PostgreSQL policies.

### Authentication Flow
1. User signs up with email
2. Verification email sent
3. User clicks link to verify
4. Redirected to dashboard after confirmation
5. Protected routes check auth status via middleware

### Data Validation
- Client names: 200 character limit
- Invoice quantities: Must be > 0
- Invoice prices: Must be >= 0
- Logo files: Max 10MB, allowed formats: PNG/JPG/SVG/WebP
- XSS prevention: HTML entities escaped
- SQL injection prevention: Parameterized queries

---

## 📊 Database Schema

### Tables
- **user_profiles** - Extends Supabase auth.users with business info + white label settings
- **clients** - Customer contact information and payment terms
- **invoices** - Invoice headers with status tracking
- **invoice_items** - Individual line items for each invoice

### Key Relationships
- `user_profiles.id` → `auth.users.id` (1:1)
- `clients.user_id` → `user_profiles.id` (many:1)
- `invoices.user_id` → `user_profiles.id` (many:1)
- `invoices.client_id` → `clients.id` (many:1)
- `invoice_items.invoice_id` → `invoices.id` (many:1)

### White Label Columns
- `logo_url` - Path to uploaded logo in Supabase Storage
- `brand_color` - Primary brand color (hex code)
- `secondary_brand_color` - Secondary brand color (hex code)
- `subscription_tier` - User's plan (starter/professional/business)

### Constraints
- Unique invoice numbers per user: `(user_id, invoice_number)`
- Cannot delete clients with existing invoices
- Cannot delete users with existing data (cascade delete)
- Subscription tier must be one of: starter, professional, business

---

## 📖 Additional Documentation

- **[User Guide](USER_GUIDE.md)** - Instructions for end users
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment steps
- **[API Documentation](docs/API.md)** - API endpoints and usage (coming soon)

---

## 🗺️ Roadmap

### Completed (Week 1-14)
- ✅ Authentication system with email verification
- ✅ Client management (CRUD operations)
- ✅ Invoice creation and management
- ✅ AI payment predictions
- ✅ Email sending with PDF attachments
- ✅ Payment tracking and follow-ups
- ✅ Analytics dashboard
- ✅ Row-level security implementation
- ✅ **White Label Feature (Professional & Business plans)**
  - Logo upload with file validation
  - Dual color picker (primary + secondary)
  - PDF branding with logo and colors
  - Email branding with logo and colors
  - Settings page with tier gating
  - Auto-save with unsaved changes warning

### In Progress (Week 14-15)
- 🔄 **Stripe Billing Integration**
  - Pricing page design
  - Stripe product creation ($30/$60/$79 plans)
  - Checkout session API
  - Webhook handler
  - Billing management page
  - Plan upgrade/downgrade flow
  - Cancel subscription flow

### Upcoming (Week 16)
- ⏳ Production deployment
- ⏳ Domain configuration
- ⏳ Monitoring and analytics setup
- ⏳ User feedback collection

### Future Features (Phase 2-3)
- 💡 Expense tracking
- 💡 Tax calculations and reports
- 💡 Recurring invoices
- 💡 Multi-currency support
- 💡 Smart contract templates
- 💡 Platform integrations (Upwork, Fiverr)
- 💡 Team collaboration (Business plan)
- 💡 API access (Business plan)

---

## 🤝 Contributing

This is a solo project, but suggestions and feedback are welcome! 

### Development Guidelines
- Follow TypeScript strict mode
- Use Tailwind CSS for styling (no custom CSS)
- Server Components by default, Client Components only when needed
- Commit after each working feature
- Write descriptive commit messages

---

## 📄 License

This project is private and not licensed for public use.

---

## 👤 Author

**Kamohelo Thakhisi**
- GitHub: [@Kam0-M](https://github.com/Kam0-M)
- Project: [Invonaut-mvp](https://github.com/Kam0-M/Invonaut-mvp)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- AI by [OpenAI](https://openai.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Color picker by [react-colorful](https://github.com/omgovich/react-colorful)
- Developed with [Cursor IDE](https://cursor.sh/)

---

## 📞 Support

For issues or questions:
1. Check this README and other documentation
2. Review [Common Issues](#-common-issues--solutions)
3. Create an issue in the GitHub repository

---

**Built with ❤️, for freelancers.**