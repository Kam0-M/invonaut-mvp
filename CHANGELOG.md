# Changelog

All notable changes to Flowance will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned Features
- Stripe billing integration (Week 14-15)
  - Pricing page with 3 tiers ($29/$59/$79)
  - Checkout session API
  - Webhook handler for subscription events
  - Billing management page
  - Plan upgrade/downgrade flow
  - Cancel subscription flow
- Production deployment (Week 16)
- Expense tracking module (Phase 2)
- Recurring invoices (Phase 2)
- Multi-currency support (Phase 2)
- Team collaboration features (Business plan)
- API access (Business plan)

---

## [0.95.0] - 2026-01-18

### Added

#### White Label Branding (Professional & Business Plans)
- Logo upload functionality with drag-and-drop support
  - Supported formats: PNG, JPG, SVG, WebP
  - Maximum file size: 10MB
  - File validation and error handling
- Dual color picker for brand customization
  - Primary brand color (headers, buttons)
  - Secondary brand color (accents, highlights)
  - Live preview with react-colorful
- PDF branding integration
  - User logo appears on invoice PDFs
  - Brand colors applied to PDF design
- Email branding integration
  - User logo appears in invoice emails
  - Brand colors applied to email templates
- Settings page with tier gating
  - Only Professional/Business users see white label options
  - Upgrade prompts for Starter users
- Logo lightbox modal for full-size preview
- Unsaved changes browser warning
- Auto-save functionality with visual feedback
- Supabase Storage integration (`logos` bucket)

#### Visual Polish & Design
- Premium landing page design
  - Navy gradient hero section
  - Floating AI prediction showcase card
  - Stats bar with key metrics
  - Feature highlights with icons
- Enhanced dashboard with premium aesthetic
  - Bold typography (font-black, tracking-tight)
  - Gradient cards with hover effects
  - Color-coded metric cards
- Redesigned all auth pages (5 pages)
  - Login, Signup, Verify Email, Forgot Password, Reset Password
  - Consistent branding and spacing
- Redesigned all client pages (4 pages)
  - List, New, Detail, Edit
  - Premium cards with hover animations
- Redesigned all invoice pages (4 pages)
  - List, New, Detail, Edit
  - Standardized button components
- Analytics page placeholder
- Help center page with FAQs and getting started guide

#### New Features
- Password reset flow
  - "Forgot Password" page
  - "Reset Password" page with token validation
- 48-hour follow-up rate limit display
  - Shows "Next reminder in Xh" badge
  - Visual countdown until next reminder allowed
  - Tooltip on hover for disabled buttons
- Improved dashboard analytics
  - 6-month revenue trend chart
  - Invoice status breakdown pie chart
  - Recent activity lists

### Changed
- Standardized all button components
  - Uniform sizing (px-5 py-2.5)
  - Consistent border thickness (border-2)
  - Matching rounded corners (rounded-xl)
  - Same font weight (font-bold text-sm)
  - Same icon size (w-4 h-4)
- Updated database schema
  - Added `logo_url` column to user_profiles
  - Added `brand_color` column (default: #0066FF)
  - Added `secondary_brand_color` column (default: #00D4AA)
  - Added `subscription_tier` column (default: 'starter')
- Enhanced email templates with white label support
- Enhanced PDF generation with white label support
- Improved table row components with bold typography
- Updated README.md with white label feature documentation
- Updated USER_GUIDE.md with white label instructions
- Updated DEPLOYMENT.md with Storage setup steps

### Fixed
- Button alignment consistency across all invoice pages
- Text visibility in address input fields (was white on white)
- Follow-up button stretching issue (now matches other buttons)
- Client name truncation for long names (200 char limit)
- Invoice row hover states (now blue instead of gray)

### Security
- Logo upload file validation (size, format)
- Supabase Storage RLS policies for logo access
- Tier checking to prevent unauthorized white label access

---

## [0.88.0] - 2026-01-11

### Added

#### Core Invoicing System
- Invoice creation with dynamic line items
- Auto-incrementing invoice numbers (INV-00001, INV-00002, etc.)
- Invoice status tracking (Draft, Sent, Paid, Overdue)
- Invoice editing (drafts only, sent invoices locked)
- Invoice deletion with confirmation dialog
- PDF invoice generation with professional formatting
- Email sending with PDF attachments via Resend API
- Mark as paid functionality
- Filter invoices by status (All/Draft/Sent/Paid/Overdue)

#### Client Management
- Complete CRUD operations for clients
- Client detail pages with invoice history
- Search functionality for client names
- 200-character name limit with validation
- Payment terms configuration (default: 30 days)
- Cannot delete clients with existing invoices

#### AI Payment Predictions
- GPT-4o-mini powered payment date predictions
- Confidence scores (0-100%)
- Risk level indicators (Low/Medium/High)
- Natural language insights explaining predictions
- Only shows for "Sent" invoices

#### Automated Follow-Ups
- Payment reminder emails for overdue invoices
- Professional email templates
- 48-hour rate limiting to prevent spam
- Tracks last follow-up timestamp
- Shows days overdue indicator

#### Dashboard & Analytics
- Revenue metrics (Total, Pending, Paid This Month, Overdue)
- 6-month revenue trend chart (Recharts LineChart)
- Invoice status breakdown chart (Recharts PieChart)
- Recent invoices list (10 most recent)
- Recent clients list (10 most recent)
- Empty states for no data

#### Landing Page
- Modern, professional design
- Navy-blue gradient hero section
- AI prediction showcase
- Stats bar (time saved, accuracy, speed)
- Feature highlights
- Pricing display ($29/$59/$79)
- Mobile-responsive

#### Documentation
- Complete README.md with setup instructions
- USER_GUIDE.md for end users
- DEPLOYMENT.md for production deployment
- .env.example with all required variables

### Security
- Row Level Security (RLS) enabled on all tables
- RLS policies for complete data isolation
- Users can only access their own data
- API routes protected with authentication checks
- Input validation (XSS prevention, SQL injection protection)
- Email verification required for signup
- Secure password reset flow

### Technical
- Next.js 16 with App Router
- TypeScript strict mode
- Tailwind CSS for styling
- Supabase (PostgreSQL + Auth)
- OpenAI API integration
- Resend API for emails
- shadcn/ui components
- Recharts for data visualization

---

## [0.10.0] - 2025-12-15

### Added
- Initial project setup
- Next.js 16 + TypeScript configuration
- Tailwind CSS setup
- Supabase integration (Database + Authentication)
- Basic folder structure
- Environment variable configuration
- Git repository initialization

### Development
- Cursor IDE setup for AI-assisted development
- ESLint and Prettier configuration
- TypeScript strict mode enabled

---

## Version Numbering

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR** version (1.0.0) - Incompatible API changes
- **MINOR** version (0.1.0) - New features, backwards compatible
- **PATCH** version (0.0.1) - Bug fixes, backwards compatible

Current version before 1.0.0 indicates the product is in MVP/beta phase.