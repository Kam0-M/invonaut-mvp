# 📘 Flowance User Guide

Welcome to Flowance! This guide will help you get started with managing your freelance invoicing and payments.

---

## 🎯 What is Flowance?

Flowance is an AI-powered invoicing platform designed specifically for freelancers. It helps you:
- Create and send professional invoices
- Track payments automatically
- Predict when clients will pay (using AI)
- Follow up on overdue payments
- Analyze your revenue trends

---

## 🚀 Getting Started

### Creating Your Account

1. **Sign Up**
   - Go to the Flowance homepage
   - Click "Sign Up" or "Get Started"
   - Enter your email and create a password
   - Click "Create Account"

2. **Verify Your Email**
   - Check your inbox for a verification email
   - Click the verification link
   - You'll be automatically redirected to your dashboard

3. **Complete Your Profile** (Optional but Recommended)
   - Add your business name
   - Add your business address
   - This information will appear on your invoices

### First-Time Setup Checklist

- ✅ Verify your email address
- ✅ Add at least one client
- ✅ Create your first invoice
- ✅ Explore the dashboard

---

## 👥 Managing Clients

### Adding a New Client

1. Click **"Clients"** in the sidebar menu
2. Click **"Create Client"** button
3. Fill in client information:
   - **Name** (required) - Up to 200 characters
   - **Email** (optional but needed for sending invoices)
   - **Phone** (optional)
   - **Company** (optional)
   - **Address** (optional)
   - **Payment Terms** (default: 30 days)
4. Click **"Create Client"**

**Tips**:
- Add an email address if you want to send invoices directly
- Payment terms determine the default due date for invoices
- You can edit client information anytime

### Viewing Client Details

1. Go to **Clients** page
2. Click on any client name
3. View client information and all related invoices
4. See payment history at a glance

### Editing a Client

1. Open client detail page
2. Click **"Edit Client"** button
3. Update information
4. Click **"Update Client"**

### Deleting a Client

**Important**: You cannot delete a client who has existing invoices. Delete all invoices first.

1. Open client detail page
2. Click **"Delete Client"** button
3. Confirm deletion in the dialog

---

## 📄 Creating Invoices

### Step-by-Step Invoice Creation

1. **Navigate to Invoices**
   - Click **"Invoices"** in the sidebar
   - Click **"Create Invoice"** button

2. **Select Client**
   - Start typing client name in the search box
   - Select client from dropdown
   - Or click "Create New Client" if needed

3. **Set Invoice Dates**
   - **Issue Date**: Date you're creating the invoice (defaults to today)
   - **Due Date**: Payment deadline (auto-calculated based on client's payment terms)

4. **Add Line Items**
   - **Description**: What you're charging for (e.g., "Website Design - Homepage")
   - **Quantity**: How many units (e.g., 10 hours)
   - **Unit Price**: Price per unit (e.g., $100/hour)
   - **Total**: Automatically calculated (Quantity × Unit Price)
   
   Click **"Add Item"** to add more line items

5. **Review Totals**
   - **Subtotal**: Sum of all line items
   - **Tax**: Automatically calculated (if applicable)
   - **Total**: Final amount due

6. **Add Notes** (Optional)
   - Add payment instructions
   - Include project details
   - Add thank you message

7. **Save Invoice**
   - Click **"Create Invoice"**
   - Invoice is saved as "Draft" status

### Invoice Numbering

Invoices are automatically numbered in sequence:
- Your first invoice: INV-00001
- Your second invoice: INV-00002
- And so on...

Each user has their own independent invoice numbering.

---

## 📧 Sending Invoices

### Email an Invoice

1. Open the invoice detail page
2. Click **"Send Email"** button
3. Invoice is sent to client's email address with PDF attachment
4. Status automatically changes to "Sent"

**Requirements**:
- Client must have an email address
- Email button only appears for Draft invoices

**What Your Client Receives**:
- Professional email with your business details
- Invoice summary
- PDF attachment of complete invoice
- Payment instructions

### Download Invoice as PDF

1. Open invoice detail page
2. Click **"Download PDF"** button
3. PDF saves to your downloads folder

**PDF Includes**:
- Your business information
- Client information
- Invoice number and dates
- All line items with calculations
- Subtotal, tax, and total
- Payment terms and notes

---

## 💰 Tracking Payments

### Invoice Statuses

**Draft** (Gray Badge)
- Invoice created but not sent yet
- Can still be edited
- Not visible to client

**Sent** (Blue Badge)
- Invoice emailed to client
- Cannot be edited (create new invoice instead)
- Awaiting payment

**Paid** (Green Badge)
- Payment received
- No further action needed

**Overdue** (Red Badge)
- Invoice past due date and unpaid
- Shows "X days overdue"
- Consider sending follow-up

### Marking Invoice as Paid

When your client pays:

1. Open invoice detail page
2. Click **"Mark as Paid"** button
3. Confirm action
4. Status changes to "Paid"
5. Dashboard metrics update automatically

**Note**: Flowance doesn't integrate with payment processors yet. You must manually mark invoices as paid.

### Filtering Invoices

On the Invoices page, filter by status:
- **All**: See everything
- **Draft**: Unsent invoices
- **Sent**: Awaiting payment
- **Paid**: Completed invoices
- **Overdue**: Past due invoices needing attention

---

## 🔔 Following Up on Payments

### When to Follow Up

Follow-up reminders are useful for:
- Invoices past their due date
- Invoices that haven't been paid on time
- Clients who need a gentle reminder

### Sending a Payment Reminder

1. Open an overdue invoice
2. Click **"Send Reminder"** button
3. Automated follow-up email sent to client

**Features**:
- Professional, friendly reminder email
- Includes invoice details and amount due
- Reminds client of overdue status
- **Rate Limited**: Can only send one reminder per 48 hours (prevents spam)

**What the Email Includes**:
- Invoice number and amount
- Original due date
- Number of days overdue
- Payment instructions
- Link to original invoice

---

## 🤖 AI Payment Predictions

### Understanding AI Predictions

For invoices with "Sent" status, Flowance uses AI to predict:
- **When the client will likely pay**
- **Confidence score** (how certain the AI is)
- **Risk level** (Low, Medium, or High risk of late payment)
- **Natural language insights** explaining the prediction

### How AI Predictions Work

The AI analyzes:
- Client's historical payment patterns
- Industry payment benchmarks
- Invoice amount and terms
- Seasonal trends
- Similar client behaviors

### Reading AI Predictions

**Predicted Payment Date**
- Best estimate of when payment will arrive
- Example: "January 15, 2026"

**Confidence Score**
- Percentage showing prediction reliability
- 90%+ = Very confident
- 70-89% = Moderately confident
- Below 70% = Less confident (new client, limited data)

**Risk Level**
- **Low Risk** (Green): Client likely to pay on time
- **Medium Risk** (Yellow): Some concern, monitor closely
- **High Risk** (Red): High chance of late payment, follow up proactively

**AI Insights**
- Plain English explanation
- Example: "This client has paid 87% of invoices on time in the past. Based on similar invoices, payment is expected within 18 days."

### Important Disclaimers

⚠️ **AI predictions are estimates, not guarantees**
- Use as guidance, not certainty
- New clients have less accurate predictions
- Always maintain professional communication
- Predictions improve as you use the system more

---

## 📊 Understanding Your Dashboard

### Dashboard Overview

Your dashboard shows key metrics at a glance:

**Metric Cards**:
- **Total Revenue**: All-time invoice total
- **Pending**: Unpaid invoices (Sent + Overdue)
- **Paid This Month**: Revenue received this month
- **Overdue**: Count of past-due invoices

### Revenue Trend Chart

**6-Month Revenue Visualization**
- Line chart showing monthly revenue
- Tracks paid invoices only
- Helps spot seasonal patterns
- Useful for cash flow planning

### Status Breakdown Chart

**Pie Chart of Invoice Statuses**
- Visual split of Draft/Sent/Paid/Overdue
- Quick health check of business
- Click segments for details (coming soon)

### Recent Activity

**Recent Invoices**
- Last 10 invoices created
- Quick status view
- Click any invoice to open details

**Recent Clients**
- Last 10 clients added
- Quick access to client profiles
- Click any client to view details

---

## 🔍 Searching and Filtering

### Client Search

On the Clients page:
- Type client name in search box
- Results filter in real-time
- Search matches name and company

### Invoice Filtering

On the Invoices page:
- Use status tabs to filter
- Combine with search (coming soon)
- Sort by date (coming soon)

---

## ✏️ Editing Invoices

### What You Can Edit

**Draft Invoices**: Everything can be edited
- Client
- Dates
- Line items
- Notes

**Sent/Paid/Overdue Invoices**: Cannot be edited
- This maintains financial audit trail
- Create a new invoice if corrections needed
- Or add notes explaining changes

### How to Edit a Draft Invoice

1. Open invoice detail page
2. Click **"Edit Invoice"** button
3. Make your changes
4. Click **"Update Invoice"**

---

## ❌ Deleting Invoices

### Deleting Any Invoice

1. Open invoice detail page
2. Click **"Delete Invoice"** button
3. Confirm deletion
4. Invoice permanently removed

**Warning**: Deletion is permanent and cannot be undone.

**When to Delete**:
- Duplicate invoices created by mistake
- Test invoices during setup
- Invoices created for wrong client

**When NOT to Delete**:
- Sent or paid invoices (keep for records)
- Consider marking as "Cancelled" instead (coming soon)

---

## 💡 Best Practices

### Invoice Management
- ✅ Send invoices promptly after completing work
- ✅ Use clear, descriptive line item descriptions
- ✅ Set realistic payment terms (30 days is standard)
- ✅ Follow up on overdue invoices within 7 days
- ✅ Keep invoice notes professional and brief

### Client Management
- ✅ Add client email addresses for easy sending
- ✅ Update payment terms based on client history
- ✅ Keep contact information current
- ✅ Add notes about client preferences

### Payment Tracking
- ✅ Mark invoices as paid immediately when payment received
- ✅ Monitor dashboard metrics weekly
- ✅ Review overdue invoices daily
- ✅ Use AI predictions to plan cash flow
- ✅ Follow up proactively on high-risk invoices

### Using AI Predictions
- ✅ Check predictions after sending invoices
- ✅ Use risk levels to prioritize follow-ups
- ✅ Monitor confidence scores over time
- ✅ Provide feedback (coming soon) to improve predictions
- ❌ Don't rely solely on AI for critical decisions

---

## 🔒 Security & Privacy

### Your Data is Protected

- **Encryption**: All data encrypted in transit and at rest
- **Privacy**: Only you can see your data
- **Isolation**: Each user's data is completely separate
- **Backups**: Automatic daily backups
- **Access Control**: Secure login with email verification

### Best Security Practices

- ✅ Use a strong, unique password
- ✅ Don't share your login credentials
- ✅ Log out on shared computers
- ✅ Verify email addresses before sending invoices
- ✅ Review invoice details before sending

---

## ❓ Common Questions

### Can I customize invoice templates?
Not yet. Custom templates are planned for a future update.

### Can I accept online payments?
Not yet. Payment processor integration (Stripe, PayPal) is coming soon.

### Can I set up recurring invoices?
Not yet. Recurring invoice scheduling is on the roadmap.

### Can I track expenses?
Not yet. Expense tracking is planned for a future release.

### Can I export my data?
Not yet. CSV/Excel export functionality is coming soon.

### Can I use multiple currencies?
Not yet. Currently, only USD is supported.

### How much does Flowance cost?
Pricing information will be announced at public launch.

### Is there a mobile app?
Not yet, but the web interface is mobile-responsive and works on all devices.

---

## 🆘 Getting Help

### If Something Isn't Working

1. **Refresh the page** - Solves most temporary issues
2. **Check your internet connection**
3. **Try a different browser** (Chrome, Firefox, Safari, Edge)
4. **Clear browser cache and cookies**
5. **Log out and log back in**

### Common Issues

**"Cannot send email"**
- Verify client has an email address
- Check invoice status is "Draft"
- Ensure you have verified your email

**"Invoice won't save"**
- Check all required fields are filled
- Ensure line item quantities are positive
- Verify dates are valid (due date after issue date)

**"Can't edit invoice"**
- Only Draft invoices can be edited
- Sent/Paid/Overdue invoices are locked
- Create a new invoice for corrections

**"AI prediction not showing"**
- Predictions only show for "Sent" invoices
- New clients may have lower confidence
- Refresh page if prediction doesn't appear

---

## 📞 Support Contact

For additional help:
- Email: support@flowance.com (coming soon)
- Documentation: Check README.md for technical details
- GitHub: Report bugs at repository issues page

---

## 🎉 Tips for Success

### First Week Goals
- Create 5 clients
- Send 3 invoices
- Mark 1 invoice as paid
- Explore all dashboard features

### First Month Goals
- Build complete client list
- Send all outstanding invoices
- Review AI predictions weekly
- Follow up on overdue invoices promptly
- Analyze revenue trends

### Long-Term Success
- Maintain consistent invoicing schedule
- Review dashboard metrics weekly
- Use AI insights for cash flow planning
- Keep client information updated
- Respond to payment delays quickly

---

**Need more help? Check the [README.md](README.md) for technical documentation or [DEPLOYMENT.md](DEPLOYMENT.md) for setup instructions.**

**Happy invoicing! 🚀**