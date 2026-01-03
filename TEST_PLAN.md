# Flowance MVP - Comprehensive Test Plan

**Version:** 1.0  
**Date:** 2024  
**Status:** Ready for Testing

---

## Table of Contents

1. [User Flow Test Scenarios](#1-user-flow-test-scenarios)
2. [Edge Case Checklist](#2-edge-case-checklist)
3. [Cross-Browser Testing Checklist](#3-cross-browser-testing-checklist)
4. [Security Checklist](#4-security-checklist)
5. [Performance Testing](#5-performance-testing)
6. [Accessibility Testing](#6-accessibility-testing)

---

## 1. User Flow Test Scenarios

### 1.1 Complete User Journey: Signup → Create Client → Create Invoice → Send Email → Follow Up

#### Test Case 1.1.1: New User Registration Flow
- [ ] Navigate to signup page
- [ ] Enter valid email address
- [ ] Enter valid password (min 8 characters)
- [ ] Submit signup form
- [ ] Verify email confirmation is sent (if required)
- [ ] Verify redirect to dashboard after signup
- [ ] Verify user can see empty state messages
- [ ] Verify user profile is created

**Expected Result:** User successfully signs up and lands on dashboard

---

#### Test Case 1.1.2: Create First Client
- [ ] From dashboard, click "Add Client" button
- [ ] Fill in client name (required field)
- [ ] Fill in optional fields: email, phone, company, address
- [ ] Select payment terms (7, 15, 30, 45, or 60 days)
- [ ] Submit form
- [ ] Verify success toast notification appears
- [ ] Verify redirect to clients list
- [ ] Verify new client appears in list
- [ ] Verify client count updates on dashboard

**Expected Result:** Client created successfully and visible in clients list

---

#### Test Case 1.1.3: Create Invoice from Client Page
- [ ] Navigate to clients list
- [ ] Click on a client name or "Create Invoice" link
- [ ] Verify client is pre-selected in invoice form
- [ ] Verify client field is locked/disabled
- [ ] Fill in invoice details:
  - [ ] Issue date (auto-filled with today)
  - [ ] Due date (auto-filled with +30 days)
  - [ ] Add at least one line item with description
  - [ ] Enter quantity and unit price
  - [ ] Verify total calculates automatically
  - [ ] Add multiple line items
  - [ ] Set tax rate (optional)
  - [ ] Add notes (optional)
- [ ] Verify subtotal, tax, and total calculate correctly
- [ ] Click "Save as Draft"
- [ ] Verify success toast notification
- [ ] Verify redirect to invoices list
- [ ] Verify invoice appears with "Draft" status

**Expected Result:** Invoice created as draft with all line items saved

---

#### Test Case 1.1.4: Send Invoice Email
- [ ] Navigate to invoice detail page
- [ ] Verify "Send Invoice" button is visible (for draft/sent invoices)
- [ ] Click "Send Invoice" button
- [ ] Verify modal opens with email input
- [ ] Verify client email is pre-filled
- [ ] Verify email preview shows correct invoice number
- [ ] Click "Send Invoice" in modal
- [ ] Verify loading toast appears
- [ ] Verify success toast notification
- [ ] Verify invoice status changes to "Sent"
- [ ] Verify "Send Invoice" button is hidden for paid invoices
- [ ] Verify email is actually sent (check inbox)

**Expected Result:** Invoice email sent successfully and status updated

---

#### Test Case 1.1.5: Follow Up on Overdue Invoice
- [ ] Create invoice with due date in the past
- [ ] Mark invoice as "Sent"
- [ ] Navigate to invoice detail page
- [ ] Verify invoice shows as "Overdue" status
- [ ] Verify "Send Reminder" button is visible
- [ ] Click "Send Reminder" button
- [ ] Verify loading toast appears
- [ ] Verify success toast notification
- [ ] Verify "Last followed up" timestamp updates
- [ ] Try to send another reminder immediately
- [ ] Verify error message: "Wait 48 hours between reminders"
- [ ] Wait 48 hours (or modify database timestamp)
- [ ] Verify reminder can be sent again

**Expected Result:** Follow-up reminder sent and 48-hour cooldown enforced

---

### 1.2 Invoice Management Flow

#### Test Case 1.2.1: Edit Draft Invoice
- [ ] Create a draft invoice
- [ ] Navigate to invoice detail page
- [ ] Click "Edit" button
- [ ] Verify edit form loads with existing data
- [ ] Modify client (if multiple clients exist)
- [ ] Modify issue date and due date
- [ ] Add new line item
- [ ] Remove existing line item
- [ ] Modify existing line item
- [ ] Update tax rate
- [ ] Update notes
- [ ] Submit changes
- [ ] Verify success toast notification
- [ ] Verify redirect to invoice detail page
- [ ] Verify all changes are saved

**Expected Result:** Draft invoice edited successfully

---

#### Test Case 1.2.2: Attempt to Edit Sent Invoice
- [ ] Create and send an invoice (status = "sent")
- [ ] Navigate to invoice detail page
- [ ] Verify "Edit" button is NOT visible
- [ ] Try to access edit URL directly: `/dashboard/invoices/[id]/edit`
- [ ] Verify redirect to invoice detail page
- [ ] Verify error message or redirect occurs

**Expected Result:** Sent invoices cannot be edited

---

#### Test Case 1.2.3: Delete Invoice with Items
- [ ] Create invoice with multiple line items
- [ ] Navigate to invoice detail page
- [ ] Click "Delete Invoice" button
- [ ] Verify confirmation dialog appears
- [ ] Verify dialog shows invoice number
- [ ] Verify dialog warns about permanent deletion
- [ ] Click "Cancel" - verify dialog closes
- [ ] Click "Delete Invoice" again
- [ ] Click "Delete" in confirmation dialog
- [ ] Verify loading toast appears
- [ ] Verify success toast notification
- [ ] Verify redirect to invoices list
- [ ] Verify invoice is removed from list
- [ ] Verify invoice items are also deleted (check database)

**Expected Result:** Invoice and all associated items deleted successfully

---

#### Test Case 1.2.4: Download Invoice PDF
- [ ] Navigate to invoice detail page
- [ ] Click "Download PDF" button
- [ ] Verify PDF downloads
- [ ] Open PDF and verify:
  - [ ] Invoice number is correct
  - [ ] Client information is correct
  - [ ] Line items are displayed correctly
  - [ ] Totals are calculated correctly
  - [ ] Dates are formatted correctly
  - [ ] Business information is included

**Expected Result:** PDF downloads with all correct information

---

### 1.3 Client Management Flow

#### Test Case 1.3.1: View Clients List
- [ ] Navigate to clients page
- [ ] Verify all clients are displayed in table
- [ ] Verify columns: Name, Company, Email, Phone, Payment Terms
- [ ] Verify empty state if no clients exist
- [ ] Verify "Add New Client" button is visible
- [ ] Click on client name
- [ ] Verify navigation to client detail page (if exists)

**Expected Result:** Clients list displays correctly

---

#### Test Case 1.3.2: Search/Filter Clients
- [ ] Navigate to invoice creation page
- [ ] Click on client search field
- [ ] Type client name
- [ ] Verify dropdown appears with matching clients
- [ ] Verify client name and company are shown
- [ ] Click on a client
- [ ] Verify client is selected
- [ ] Verify checkmark appears
- [ ] Type non-existent client name
- [ ] Verify "No clients found" message
- [ ] Verify "Add new client" link appears

**Expected Result:** Client search works correctly

---

## 2. Edge Case Checklist

### 2.1 Invoice Creation Edge Cases

#### Test Case 2.1.1: Create Invoice with $0 Total
- [ ] Create invoice with line items where all prices are $0
- [ ] Verify invoice can be saved
- [ ] Verify total shows $0.00
- [ ] Verify invoice appears in list
- [ ] Verify invoice can be sent (if allowed)

**Expected Result:** Invoice with $0 total can be created

---

#### Test Case 2.1.2: Create Invoice with Negative Values
- [ ] Try to enter negative quantity
- [ ] Verify validation prevents negative values
- [ ] Try to enter negative unit price
- [ ] Verify validation prevents negative values
- [ ] Try to enter negative tax rate
- [ ] Verify validation prevents negative values

**Expected Result:** Negative values are prevented

---

#### Test Case 2.1.3: Create Invoice with Very Large Numbers
- [ ] Enter quantity: 999,999,999
- [ ] Enter unit price: 999,999.99
- [ ] Verify calculations work correctly
- [ ] Verify currency formatting displays correctly
- [ ] Verify invoice saves successfully

**Expected Result:** Large numbers handled correctly

---

#### Test Case 2.1.4: Create Invoice with Decimal Values
- [ ] Enter quantity: 1.5
- [ ] Enter unit price: 99.99
- [ ] Verify total calculates: 149.985 (rounds to 149.99)
- [ ] Verify currency formatting: $149.99
- [ ] Verify invoice saves with correct totals

**Expected Result:** Decimal calculations work correctly

---

#### Test Case 2.1.5: Duplicate Invoice Number
- [ ] Create invoice with number INV-00001
- [ ] Try to create another invoice
- [ ] Verify system generates next number (INV-00002)
- [ ] Manually try to create invoice with existing number (if possible)
- [ ] Verify error message: "This invoice number already exists"

**Expected Result:** Duplicate invoice numbers are prevented

---

#### Test Case 2.1.6: Create Invoice Without Client
- [ ] Navigate to invoice creation
- [ ] Try to submit without selecting client
- [ ] Verify error message: "Please select a client"
- [ ] Verify form does not submit

**Expected Result:** Client selection is required

---

#### Test Case 2.1.7: Create Invoice Without Line Items
- [ ] Select a client
- [ ] Try to submit with no line items
- [ ] Verify error message: "Please add at least one line item"
- [ ] Add line item with empty description
- [ ] Try to submit
- [ ] Verify error message: "All line items must have a description"

**Expected Result:** Line items with descriptions are required

---

#### Test Case 2.1.8: Create Invoice with Past Due Date
- [ ] Create invoice with due date in the past
- [ ] Verify invoice can be created
- [ ] Verify invoice shows as "Overdue" immediately
- [ ] Verify follow-up button is available

**Expected Result:** Past due dates are allowed

---

### 2.2 Client Management Edge Cases

#### Test Case 2.2.1: Create Client Without Email
- [ ] Create client with only name (no email)
- [ ] Verify client saves successfully
- [ ] Create invoice for this client
- [ ] Try to send invoice
- [ ] Verify "Send Invoice" button is hidden or disabled
- [ ] Verify appropriate message about missing email

**Expected Result:** Clients without email cannot receive invoices via email

---

#### Test Case 2.2.2: Create Client with Invalid Email
- [ ] Try to create client with email: "notanemail"
- [ ] Verify validation error appears
- [ ] Try email: "test@"
- [ ] Verify validation error appears
- [ ] Enter valid email: "test@example.com"
- [ ] Verify client saves successfully

**Expected Result:** Invalid email formats are rejected

---

#### Test Case 2.2.3: Create Duplicate Client
- [ ] Create client: "John Doe"
- [ ] Try to create another client: "John Doe"
- [ ] Verify if duplicate is allowed or prevented
- [ ] If allowed, verify both clients exist
- [ ] If prevented, verify error message

**Expected Result:** Duplicate clients handled appropriately

---

#### Test Case 2.2.4: Delete Client with Invoices
- [ ] Create client
- [ ] Create invoice for this client
- [ ] Try to delete client (if delete functionality exists)
- [ ] Verify behavior:
  - [ ] Option A: Deletion prevented with error message
  - [ ] Option B: Deletion allowed, invoices remain but client reference is null
  - [ ] Option C: Cascade delete removes invoices too

**Expected Result:** Appropriate handling of client deletion with invoices

---

### 2.3 Email Sending Edge Cases

#### Test Case 2.3.1: Send Invoice to Invalid Email
- [ ] Create invoice for client with email: "invalid@email"
- [ ] Try to send invoice
- [ ] Verify error message about invalid email
- [ ] Verify invoice status does not change to "sent"

**Expected Result:** Invalid emails are rejected

---

#### Test Case 2.3.2: Send Invoice with No Email Service
- [ ] Disable email service (if possible in test environment)
- [ ] Try to send invoice
- [ ] Verify error message appears
- [ ] Verify invoice status does not change
- [ ] Verify user-friendly error message

**Expected Result:** Graceful error handling when email service fails

---

#### Test Case 2.3.3: Send Invoice in Demo Mode
- [ ] Try to send invoice to email other than kamohelo.thakhisi@gmail.com
- [ ] Verify demo mode error message appears
- [ ] Verify message explains restriction
- [ ] Send to allowed email
- [ ] Verify email sends successfully

**Expected Result:** Demo mode restrictions are enforced

---

### 2.4 Follow-Up Edge Cases

#### Test Case 2.4.1: Follow Up on Non-Overdue Invoice
- [ ] Create invoice with future due date
- [ ] Mark as "Sent"
- [ ] Navigate to invoice detail
- [ ] Verify "Send Reminder" button is NOT visible
- [ ] Try to access follow-up API directly
- [ ] Verify error: "Invoice is not overdue"

**Expected Result:** Follow-ups only work for overdue invoices

---

#### Test Case 2.4.2: Follow Up Without Client Email
- [ ] Create invoice for client without email
- [ ] Make invoice overdue
- [ ] Try to send follow-up
- [ ] Verify error: "Client email address not found"

**Expected Result:** Follow-ups require client email

---

#### Test Case 2.4.3: Follow Up Too Soon (48-Hour Rule)
- [ ] Send follow-up reminder
- [ ] Immediately try to send another
- [ ] Verify error: "Wait 48 hours between reminders"
- [ ] Verify button is disabled
- [ ] Verify cooldown message is displayed

**Expected Result:** 48-hour cooldown is enforced

---

### 2.5 Data Validation Edge Cases

#### Test Case 2.5.1: Extremely Long Text Inputs
- [ ] Enter 10,000 character description in line item
- [ ] Verify form handles it (or shows character limit)
- [ ] Enter 10,000 character client name
- [ ] Verify form handles it appropriately
- [ ] Enter 10,000 character notes
- [ ] Verify form handles it appropriately

**Expected Result:** Long text inputs are handled gracefully

---

#### Test Case 2.5.2: Special Characters in Inputs
- [ ] Enter client name: "O'Brien & Co. <script>alert('xss')</script>"
- [ ] Verify special characters are handled safely
- [ ] Verify no XSS attacks occur
- [ ] Enter invoice notes with HTML tags
- [ ] Verify HTML is escaped or sanitized

**Expected Result:** Special characters and HTML are sanitized

---

#### Test Case 2.5.3: Empty Form Submissions
- [ ] Try to submit empty client form
- [ ] Verify validation errors appear
- [ ] Try to submit empty invoice form
- [ ] Verify all required field errors appear
- [ ] Verify form does not submit

**Expected Result:** Empty forms are validated before submission

---

### 2.6 Network and Error Edge Cases

#### Test Case 2.6.1: Offline/Network Failure
- [ ] Disable network connection
- [ ] Try to create invoice
- [ ] Verify error message about network connection
- [ ] Re-enable network
- [ ] Verify form can be submitted

**Expected Result:** Network errors are handled gracefully

---

#### Test Case 2.6.2: Database Connection Failure
- [ ] Simulate database timeout (if possible)
- [ ] Try to load invoices
- [ ] Verify error message appears
- [ ] Verify user-friendly error message
- [ ] Verify page does not crash

**Expected Result:** Database errors are handled gracefully

---

#### Test Case 2.6.3: Session Expiration
- [ ] Let session expire (wait or manually expire)
- [ ] Try to perform action (create invoice)
- [ ] Verify redirect to login page
- [ ] Verify error message about session expiration
- [ ] Log back in
- [ ] Verify can continue where left off (if data preserved)

**Expected Result:** Session expiration handled gracefully

---

## 3. Cross-Browser Testing Checklist

### 3.1 Desktop Browsers

#### Chrome (Latest Version)
- [ ] **Signup/Login:** Forms work correctly
- [ ] **Dashboard:** All charts and metrics display
- [ ] **Invoice Creation:** Form works, calculations correct
- [ ] **Invoice Detail:** All buttons functional
- [ ] **Client Management:** Search and filters work
- [ ] **PDF Download:** PDF generates and downloads
- [ ] **Email Sending:** Modal and sending works
- [ ] **Responsive Design:** Mobile view works (DevTools)
- [ ] **Console Errors:** No JavaScript errors

---

#### Firefox (Latest Version)
- [ ] **Signup/Login:** Forms work correctly
- [ ] **Dashboard:** All charts and metrics display
- [ ] **Invoice Creation:** Form works, calculations correct
- [ ] **Invoice Detail:** All buttons functional
- [ ] **Client Management:** Search and filters work
- [ ] **PDF Download:** PDF generates and downloads
- [ ] **Email Sending:** Modal and sending works
- [ ] **Responsive Design:** Mobile view works (DevTools)
- [ ] **Console Errors:** No JavaScript errors

---

#### Safari (Latest Version - macOS)
- [ ] **Signup/Login:** Forms work correctly
- [ ] **Dashboard:** All charts and metrics display
- [ ] **Invoice Creation:** Form works, calculations correct
- [ ] **Invoice Detail:** All buttons functional
- [ ] **Client Management:** Search and filters work
- [ ] **PDF Download:** PDF generates and downloads
- [ ] **Email Sending:** Modal and sending works
- [ ] **Date Inputs:** Date pickers work correctly
- [ ] **Console Errors:** No JavaScript errors

---

#### Microsoft Edge (Latest Version)
- [ ] **Signup/Login:** Forms work correctly
- [ ] **Dashboard:** All charts and metrics display
- [ ] **Invoice Creation:** Form works, calculations correct
- [ ] **Invoice Detail:** All buttons functional
- [ ] **Client Management:** Search and filters work
- [ ] **PDF Download:** PDF generates and downloads
- [ ] **Email Sending:** Modal and sending works
- [ ] **Responsive Design:** Mobile view works (DevTools)
- [ ] **Console Errors:** No JavaScript errors

---

### 3.2 Mobile Browsers

#### Safari iOS (iPhone 12/13/14/15)
- [ ] **Signup/Login:** Forms work, keyboard appears correctly
- [ ] **Dashboard:** Responsive layout, tables scroll horizontally
- [ ] **Invoice Creation:** Form fields stack correctly
- [ ] **Line Items:** Grid layout works on mobile
- [ ] **Buttons:** Full-width buttons work
- [ ] **Modals:** Email modal fits on screen
- [ ] **Date Pickers:** Native date picker works
- [ ] **Touch Targets:** Buttons are large enough (min 44x44px)
- [ ] **Scrolling:** Smooth scrolling, no horizontal overflow

---

#### Chrome Android (Latest)
- [ ] **Signup/Login:** Forms work, keyboard appears correctly
- [ ] **Dashboard:** Responsive layout, tables scroll horizontally
- [ ] **Invoice Creation:** Form fields stack correctly
- [ ] **Line Items:** Grid layout works on mobile
- [ ] **Buttons:** Full-width buttons work
- [ ] **Modals:** Email modal fits on screen
- [ ] **Date Pickers:** Native date picker works
- [ ] **Touch Targets:** Buttons are large enough
- [ ] **Scrolling:** Smooth scrolling, no horizontal overflow

---

#### Samsung Internet (Android)
- [ ] **Signup/Login:** Forms work correctly
- [ ] **Dashboard:** Layout displays correctly
- [ ] **Invoice Creation:** All features work
- [ ] **PDF Download:** Downloads work
- [ ] **Responsive Design:** Mobile layout correct

---

### 3.3 Browser-Specific Features

#### Date Inputs
- [ ] **Chrome:** Date picker works
- [ ] **Firefox:** Date picker works
- [ ] **Safari:** Date picker works (may use native iOS picker)
- [ ] **Edge:** Date picker works
- [ ] **Mobile Safari:** Native date picker appears
- [ ] **Mobile Chrome:** Native date picker appears

---

#### File Downloads
- [ ] **Chrome:** PDF downloads correctly
- [ ] **Firefox:** PDF downloads correctly
- [ ] **Safari:** PDF downloads correctly (may open in new tab)
- [ ] **Edge:** PDF downloads correctly
- [ ] **Mobile:** PDF opens in viewer or downloads

---

#### Local Storage / Session
- [ ] **All Browsers:** Session persists across page refreshes
- [ ] **All Browsers:** Logout clears session
- [ ] **All Browsers:** Private/Incognito mode works
- [ ] **All Browsers:** Cookies are set correctly

---

## 4. Security Checklist

### 4.1 Authentication & Authorization

#### Test Case 4.1.1: Unauthorized Access Prevention
- [ ] **Access Dashboard Without Login:**
  - [ ] Try to access `/dashboard` directly
  - [ ] Verify redirect to `/login`
  - [ ] Verify cannot access dashboard data

- [ ] **Access Invoice Without Ownership:**
  - [ ] Login as User A
  - [ ] Note an invoice ID
  - [ ] Logout
  - [ ] Login as User B
  - [ ] Try to access User A's invoice: `/dashboard/invoices/[user-a-invoice-id]`
  - [ ] Verify "Invoice Not Found" or redirect
  - [ ] Verify cannot see User A's data

- [ ] **Access Client Without Ownership:**
  - [ ] Login as User A
  - [ ] Note a client ID
  - [ ] Logout
  - [ ] Login as User B
  - [ ] Try to access User A's client data
  - [ ] Verify cannot see User A's clients

**Expected Result:** Users can only access their own data

---

#### Test Case 4.1.2: API Endpoint Security
- [ ] **Send Invoice API:**
  - [ ] Try to send invoice without authentication token
  - [ ] Verify 401 Unauthorized response
  - [ ] Try to send another user's invoice
  - [ ] Verify 404 Not Found or 403 Forbidden

- [ ] **Follow-Up API:**
  - [ ] Try to access without authentication
  - [ ] Verify 401 Unauthorized
  - [ ] Try to follow-up on another user's invoice
  - [ ] Verify access denied

- [ ] **Delete Invoice API:**
  - [ ] Try to delete without authentication
  - [ ] Verify 401 Unauthorized
  - [ ] Try to delete another user's invoice
  - [ ] Verify access denied

**Expected Result:** All API endpoints require authentication and ownership verification

---

#### Test Case 4.1.3: Row Level Security (RLS)
- [ ] **Database RLS Policies:**
  - [ ] Verify RLS is enabled on all tables:
    - [ ] `user_profiles`
    - [ ] `clients`
    - [ ] `invoices`
    - [ ] `invoice_items`
    - [ ] `payments`
  - [ ] Verify policies check `auth.uid() = user_id`
  - [ ] Test direct database query as User A
  - [ ] Verify cannot see User B's data

**Expected Result:** Database-level security prevents cross-user data access

---

### 4.2 Input Sanitization & XSS Prevention

#### Test Case 4.2.1: XSS Attack Prevention
- [ ] **Client Name XSS:**
  - [ ] Create client with name: `<script>alert('XSS')</script>`
  - [ ] Verify script does not execute
  - [ ] Verify HTML is escaped in display
  - [ ] Check database - verify raw HTML is stored (if needed for display)

- [ ] **Invoice Notes XSS:**
  - [ ] Add invoice notes: `<img src=x onerror=alert('XSS')>`
  - [ ] Verify script does not execute
  - [ ] Verify HTML is escaped or sanitized

- [ ] **Line Item Description XSS:**
  - [ ] Add line item: `<script>document.cookie</script>`
  - [ ] Verify script does not execute
  - [ ] Verify safe display

**Expected Result:** All user inputs are sanitized, XSS attacks prevented

---

#### Test Case 4.2.2: SQL Injection Prevention
- [ ] **Client Search:**
  - [ ] Search for: `'; DROP TABLE clients; --`
  - [ ] Verify query is parameterized
  - [ ] Verify no SQL execution occurs
  - [ ] Verify error handling is graceful

- [ ] **Invoice Number:**
  - [ ] Try to inject SQL in invoice number field
  - [ ] Verify parameterized queries are used
  - [ ] Verify no SQL execution

**Expected Result:** SQL injection attacks are prevented via parameterized queries

---

#### Test Case 4.2.3: Input Validation
- [ ] **Email Validation:**
  - [ ] Try invalid emails: `test@`, `@test.com`, `test@.com`
  - [ ] Verify validation errors appear
  - [ ] Verify only valid emails are accepted

- [ ] **Number Validation:**
  - [ ] Try to enter text in quantity field
  - [ ] Try to enter text in price field
  - [ ] Verify only numbers accepted
  - [ ] Verify negative numbers prevented (if applicable)

- [ ] **Date Validation:**
  - [ ] Try invalid dates
  - [ ] Verify date picker prevents invalid dates
  - [ ] Verify due date cannot be before issue date (if validation exists)

**Expected Result:** All inputs are validated before submission

---

### 4.3 API Key & Secret Exposure

#### Test Case 4.3.1: Environment Variables
- [ ] **Client-Side Exposure:**
  - [ ] View page source
  - [ ] Check browser DevTools → Network tab
  - [ ] Check browser DevTools → Application → Local Storage
  - [ ] Verify no API keys in client-side code
  - [ ] Verify only `NEXT_PUBLIC_*` vars are exposed
  - [ ] Verify `RESEND_API_KEY` is NOT exposed
  - [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is NOT exposed

- [ ] **Server-Side Only:**
  - [ ] Verify sensitive keys only used in API routes
  - [ ] Verify keys not logged in console
  - [ ] Verify keys not in error messages

**Expected Result:** No sensitive API keys exposed to client

---

#### Test Case 4.3.2: Supabase Keys
- [ ] **Anon Key Usage:**
  - [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is used client-side
  - [ ] Verify RLS policies protect data even with anon key
  - [ ] Verify anon key cannot bypass RLS

- [ ] **Service Role Key:**
  - [ ] Verify service role key is NEVER used client-side
  - [ ] Verify service role key only in server-side code
  - [ ] Verify service role key not in environment variables exposed to client

**Expected Result:** Supabase keys are used correctly and securely

---

### 4.4 Data Privacy & GDPR

#### Test Case 4.4.1: User Data Access
- [ ] **Data Export:**
  - [ ] Verify users can export their data (if feature exists)
  - [ ] Verify export includes all user data
  - [ ] Verify export does not include other users' data

- [ ] **Data Deletion:**
  - [ ] Verify users can delete their account (if feature exists)
  - [ ] Verify deletion removes all user data
  - [ ] Verify cascade deletion works correctly

**Expected Result:** Users have control over their data

---

#### Test Case 4.4.2: Email Privacy
- [ ] **Email Content:**
  - [ ] Verify emails only sent to intended recipient
  - [ ] Verify no email addresses exposed in URLs
  - [ ] Verify email content does not leak other users' data

**Expected Result:** Email privacy is maintained

---

### 4.5 CSRF & Session Security

#### Test Case 4.5.1: CSRF Protection
- [ ] **Form Submissions:**
  - [ ] Verify forms include CSRF tokens (if implemented)
  - [ ] Try to submit form from external site
  - [ ] Verify request is rejected

- [ ] **API Requests:**
  - [ ] Verify API endpoints check authentication
  - [ ] Verify session cookies are HttpOnly
  - [ ] Verify session cookies are Secure (HTTPS only)

**Expected Result:** CSRF attacks are prevented

---

#### Test Case 4.5.2: Session Management
- [ ] **Session Expiration:**
  - [ ] Verify sessions expire after inactivity
  - [ ] Verify expired sessions redirect to login
  - [ ] Verify session tokens are rotated on login

- [ ] **Concurrent Sessions:**
  - [ ] Login from multiple devices
  - [ ] Verify both sessions work (or verify single session policy)
  - [ ] Logout from one device
  - [ ] Verify other device session status

**Expected Result:** Sessions are managed securely

---

## 5. Performance Testing

### 5.1 Load Time Testing
- [ ] **Dashboard Load:**
  - [ ] Measure time to first contentful paint
  - [ ] Measure time to interactive
  - [ ] Target: < 2 seconds on 3G connection

- [ ] **Invoice List Load:**
  - [ ] Test with 10 invoices
  - [ ] Test with 100 invoices
  - [ ] Test with 1000 invoices
  - [ ] Verify pagination or lazy loading works

- [ ] **Invoice Creation:**
  - [ ] Measure form load time
  - [ ] Measure client search response time
  - [ ] Target: < 500ms for search results

---

### 5.2 Database Query Performance
- [ ] **Invoice Queries:**
  - [ ] Verify indexes on `user_id` and `created_at`
  - [ ] Test query performance with large datasets
  - [ ] Verify queries use indexes

- [ ] **Client Queries:**
  - [ ] Verify indexes on `user_id` and `name`
  - [ ] Test search performance
  - [ ] Verify search is optimized

---

### 5.3 Image & Asset Optimization
- [ ] **Bundle Size:**
  - [ ] Check JavaScript bundle size
  - [ ] Verify code splitting is used
  - [ ] Target: Initial bundle < 200KB

- [ ] **Lazy Loading:**
  - [ ] Verify charts load lazily
  - [ ] Verify images are optimized
  - [ ] Verify fonts are optimized

---

## 6. Accessibility Testing

### 6.1 WCAG 2.1 Compliance
- [ ] **Keyboard Navigation:**
  - [ ] Tab through all interactive elements
  - [ ] Verify focus indicators are visible
  - [ ] Verify all functions work with keyboard only

- [ ] **Screen Reader:**
  - [ ] Test with NVDA (Windows) or VoiceOver (Mac)
  - [ ] Verify all form labels are announced
  - [ ] Verify button purposes are clear
  - [ ] Verify error messages are announced

- [ ] **Color Contrast:**
  - [ ] Verify text meets WCAG AA contrast (4.5:1)
  - [ ] Verify interactive elements meet contrast requirements
  - [ ] Verify error states are not color-only

- [ ] **ARIA Labels:**
  - [ ] Verify form inputs have labels
  - [ ] Verify buttons have accessible names
  - [ ] Verify modals have proper ARIA attributes

---

### 6.2 Mobile Accessibility
- [ ] **Touch Targets:**
  - [ ] Verify buttons are at least 44x44px
  - [ ] Verify spacing between touch targets
  - [ ] Verify no accidental taps

- [ ] **Zoom:**
  - [ ] Test with 200% browser zoom
  - [ ] Verify layout remains usable
  - [ ] Verify no horizontal scrolling required

---

## Test Execution Log

### Test Session 1
**Date:** _______________  
**Tester:** _______________  
**Browser:** _______________  
**Notes:** _______________

---

### Test Session 2
**Date:** _______________  
**Tester:** _______________  
**Browser:** _______________  
**Notes:** _______________

---

## Bug Tracking

### Critical Bugs
| ID | Description | Status | Priority |
|----|-------------|--------|----------|
|    |             |        |          |

### High Priority Bugs
| ID | Description | Status | Priority |
|----|-------------|--------|----------|
|    |             |        |          |

### Medium Priority Bugs
| ID | Description | Status | Priority |
|----|-------------|--------|----------|
|    |             |        |          |

---

## Sign-Off

**Test Plan Approved By:** _______________  
**Date:** _______________  

**Testing Completed By:** _______________  
**Date:** _______________  

**Ready for Production:** ☐ Yes  ☐ No

**Notes:** _______________

---

## Appendix: Test Data

### Test Users
- **User A:** testuser1@example.com
- **User B:** testuser2@example.com

### Test Clients
- **Client 1:** John Doe, john@example.com
- **Client 2:** Jane Smith (no email)
- **Client 3:** Acme Corp, acme@example.com

### Test Invoices
- **Invoice 1:** Draft status, $100 total
- **Invoice 2:** Sent status, $500 total, due yesterday
- **Invoice 3:** Paid status, $1000 total

---

**End of Test Plan**

