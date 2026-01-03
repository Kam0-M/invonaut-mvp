# Flowance MVP - Bug Report & Fix Plan

**Test Date:** 2024  
**Tester:** User  
**Test Flow:** Signup → Create Client → Create Invoice → Send Email → Mark as Paid

---

## 🐛 Bug List (Priority Order)

### 🔴 CRITICAL PRIORITY

#### Bug #1: Download PDF Returns 404 Error
**Location:** `src/app/dashboard/invoices/[id]/page.tsx` (Line 175-184)  
**Issue:** Clicking "Download PDF" button shows 404 error - API route `/api/download-invoice` doesn't exist  
**Impact:** Users cannot download invoice PDFs  
**Status:** ❌ Not Fixed

**Fix Required:**
- Create API route: `src/app/api/download-invoice/route.ts`
- Implement GET handler that generates PDF and returns it as response
- Ensure proper authentication and authorization

---

### 🟠 HIGH PRIORITY

#### Bug #2: Double Checkmarks in Success Toast Notifications
**Location:** Multiple files (see below)  
**Issue:** Success toasts show 2 checkmarks - one from `richColors` prop and one from ✅ emoji in message  
**Impact:** Visual inconsistency, looks unprofessional  
**Status:** ❌ Not Fixed

**Files Affected:**
- `src/components/invoices/mark-paid-button.tsx` (Line 48)
- `src/app/dashboard/invoices/new/page.tsx` (Line 265)
- `src/app/dashboard/clients/new/page.tsx` (Line 73)
- `src/components/invoices/delete-invoice-button.tsx` (Line 49)
- `src/components/invoices/send-invoice-button.tsx` (Lines 70, 72)
- `src/components/invoices/follow-up-button.tsx` (Line 80)

**Fix Required:**
- Remove ✅ emoji from all success toast messages
- Keep the checkmark from `richColors` prop in ToastProvider

---

#### Bug #3: Missing Edit Client Functionality
**Location:** `src/app/dashboard/clients/[id]/page.tsx`  
**Issue:** No way to edit client information after creation  
**Impact:** Users cannot update client details (email, phone, address, etc.)  
**Status:** ❌ Not Fixed

**Fix Required:**
- Create edit client page: `src/app/dashboard/clients/[id]/edit/page.tsx`
- Create edit client form component: `src/components/clients/edit-client-form.tsx`
- Add "Edit Client" button to client detail page
- Implement update functionality with validation

---

#### Bug #4: Missing Delete Client Functionality
**Location:** `src/app/dashboard/clients/[id]/page.tsx`  
**Issue:** No way to delete/remove clients  
**Impact:** Users cannot remove clients they no longer need  
**Status:** ❌ Not Fixed

**Fix Required:**
- Create delete client button component: `src/components/clients/delete-client-button.tsx`
- Add confirmation dialog (similar to delete invoice)
- Handle cascade deletion or prevent deletion if client has invoices
- Add "Delete Client" button to client detail page

---

### 🟡 MEDIUM PRIORITY

#### Bug #5: "Back to Clients" Button Position
**Location:** `src/app/dashboard/clients/[id]/page.tsx` (Line 94-98)  
**Issue:** "Back to Clients" button is on the right side, should be on the left like other pages  
**Impact:** Inconsistent UI/UX  
**Status:** ❌ Not Fixed

**Fix Required:**
- Move button to left side of header
- Match layout of `/dashboard/clients` and `/dashboard/invoices` pages

---

#### Bug #6: Quantity and Unit Price Placeholders and Validation
**Location:** `src/app/dashboard/invoices/new/page.tsx` (Lines 543-560)  
**Issues:**
1. "0" placeholder shows in Quantity and Unit Price fields
2. Fields are not marked as required
3. Quantity increments/decrements in decimals (should be whole numbers)

**Impact:** Confusing UX, allows invalid data submission  
**Status:** ❌ Not Fixed

**Fix Required:**
- Remove `placeholder="0"` or `placeholder="0.00"` from Quantity field
- Remove placeholder from Unit Price (or keep "0.00" if needed)
- Add `required` attribute to both fields
- Change Quantity field `step` from `"0.01"` to `"1"` for whole number increments

---

## 📋 Detailed Fix Instructions

### Fix #1: Create Download Invoice PDF API Route

**File to Create:** `src/app/api/download-invoice/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/lib/pdf/generate-invoice-pdf'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const invoiceId = searchParams.get('id')

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch invoice with client info
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        issue_date,
        due_date,
        subtotal,
        tax_amount,
        total_amount,
        notes,
        clients (
          id,
          name,
          email,
          phone,
          company,
          address
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to load invoice items' },
        { status: 500 }
      )
    }

    // Fetch user profile for business info
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, email, business_name, address')
      .eq('id', user.id)
      .single()

    const clientData = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients

    // Generate PDF
    const pdfArrayBuffer = await generateInvoicePDF({
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      notes: invoice.notes || '',
      client: {
        name: clientData?.name,
        email: clientData?.email || '',
        phone: clientData?.phone || '',
        company: clientData?.company || '',
        address: clientData?.address || ''
      },
      user_profile: {
        business_name: userProfile?.business_name || null,
        full_name: userProfile?.full_name || null,
        email: userProfile?.email || null,
        address: userProfile?.address || null
      },
      items: (items || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }))
    })

    // Convert ArrayBuffer to Buffer
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Download invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
```

---

### Fix #2: Remove Double Checkmarks from Toast Messages

**Files to Update:**

1. **`src/components/invoices/mark-paid-button.tsx`** (Line 48)
   ```typescript
   // BEFORE:
   toast.success(`✅ Invoice ${invoiceNumber} marked as paid!`, { id: loadingToast })
   
   // AFTER:
   toast.success(`Invoice ${invoiceNumber} marked as paid!`, { id: loadingToast, duration: 3000 })
   ```

2. **`src/app/dashboard/invoices/new/page.tsx`** (Line 265)
   ```typescript
   // BEFORE:
   toast.success('✅ Invoice created successfully!', { id: loadingToast, duration: 3000 })
   
   // AFTER:
   toast.success('Invoice created successfully!', { id: loadingToast, duration: 3000 })
   ```

3. **`src/app/dashboard/clients/new/page.tsx`** (Line 73)
   ```typescript
   // BEFORE:
   toast.success('✅ Client created successfully!', { id: loadingToast, duration: 3000 })
   
   // AFTER:
   toast.success('Client created successfully!', { id: loadingToast, duration: 3000 })
   ```

4. **`src/components/invoices/delete-invoice-button.tsx`** (Line 49)
   ```typescript
   // BEFORE:
   toast.success('✅ Invoice deleted successfully!', { id: loadingToast, duration: 3000 })
   
   // AFTER:
   toast.success('Invoice deleted successfully!', { id: loadingToast, duration: 3000 })
   ```

5. **`src/components/invoices/send-invoice-button.tsx`** (Lines 70, 72)
   ```typescript
   // BEFORE:
   toast.success('✅ Invoice sent successfully!', { id: loadingToast, duration: 3000 })
   
   // AFTER:
   toast.success('Invoice sent successfully!', { id: loadingToast, duration: 3000 })
   ```

6. **`src/components/invoices/follow-up-button.tsx`** (Line 80)
   ```typescript
   // BEFORE:
   toast.success('✅ Reminder sent successfully!', { id: loadingToast, duration: 3000 })
   
   // AFTER:
   toast.success('Reminder sent successfully!', { id: loadingToast, duration: 3000 })
   ```

---

### Fix #3: Add Edit Client Functionality

**Step 1: Create Edit Client Page**

**File to Create:** `src/app/dashboard/clients/[id]/edit/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditClientForm from '@/components/clients/edit-client-form'

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !client) {
    redirect('/dashboard/clients')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Client</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update client information
        </p>
      </div>

      <EditClientForm client={client} />
    </div>
  )
}
```

**Step 2: Create Edit Client Form Component**

**File to Create:** `src/components/clients/edit-client-form.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  payment_terms: number | null
}

type EditClientFormProps = {
  client: Client
}

export default function EditClientForm({ client }: EditClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    company: client.company || '',
    address: client.address || '',
    payment_terms: client.payment_terms || 30
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      if (!formData.name.trim()) {
        toast.error('⚠️ Client name is required. Please enter a name for this client.', { duration: 3000 })
        setLoading(false)
        return
      }

      if (formData.email && !formData.email.includes('@')) {
        toast.error('⚠️ Please enter a valid email address. Make sure it includes an @ symbol.', { duration: 3000 })
        setLoading(false)
        return
      }

      const loadingToast = toast.loading('Updating client...')

      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
          address: formData.address.trim() || null,
          payment_terms: formData.payment_terms
        })
        .eq('id', client.id)
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      toast.success('Client updated successfully!', { id: loadingToast, duration: 3000 })
      
      setTimeout(() => {
        router.push(`/dashboard/clients/${client.id}`)
        router.refresh()
      }, 500)

    } catch (err: any) {
      let errorMessage = 'Could not update client. Please check your internet connection and try again.'
      
      if (err?.code === 'PGRST116') {
        errorMessage = 'Could not update client. The database connection was interrupted. Please check your internet connection and try again.'
      } else if (err?.message) {
        if (err.message.includes('network') || err.message.includes('connection') || err.message.includes('timeout')) {
          errorMessage = 'Could not update client. Please check your internet connection and try again.'
        } else if (err.message.length < 100 && !err.message.includes('PGRST')) {
          errorMessage = err.message
        }
      }
      
      toast.error('⚠️ ' + errorMessage, { duration: 3000 })
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="555-0123"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Company
          </label>
          <Input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Acme Corporation"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main Street, City, State, ZIP"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 placeholder:text-gray-500"
            rows={3}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Payment Terms
          </label>
          <select
            value={formData.payment_terms}
            onChange={(e) => setFormData({ ...formData, payment_terms: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 bg-white"
            disabled={loading}
          >
            <option value={7}>7 days</option>
            <option value={15}>15 days</option>
            <option value={30}>30 days</option>
            <option value={45}>45 days</option>
            <option value={60}>60 days</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button
            type="button"
            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            disabled={loading}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
```

**Step 3: Add Edit Button to Client Detail Page**

**File to Update:** `src/app/dashboard/clients/[id]/page.tsx`

Add import and button:
```typescript
import { Pencil } from 'lucide-react'

// In the header section (around line 80-100):
<div className="flex items-center gap-2 sm:gap-3">
  <Link href="/dashboard/clients">
    <Button variant="outline" size="sm" className="shrink-0">
      <ArrowLeft className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Back to Clients</span>
      <span className="sm:hidden">Back</span>
    </Button>
  </Link>
  <div>
    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{client.name}</h1>
    <p className="text-xs sm:text-sm text-slate-500 mt-1">
      Client since {new Date(client.created_at).toLocaleDateString()}
    </p>
  </div>
</div>
<div className="flex gap-2">
  <Link href={`/dashboard/clients/${client.id}/edit`}>
    <Button variant="outline" size="sm">
      <Pencil className="w-4 h-4 mr-2" />
      Edit Client
    </Button>
  </Link>
  <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
    <Button className="bg-primary text-white hover:bg-primary/90">
      <FileText className="w-4 h-4 mr-2" />
      Create Invoice
    </Button>
  </Link>
</div>
```

---

### Fix #4: Add Delete Client Functionality

**Step 1: Create Delete Client Button Component**

**File to Create:** `src/components/clients/delete-client-button.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type DeleteClientButtonProps = {
  clientId: string
  clientName: string
  hasInvoices: boolean
}

export function DeleteClientButton({
  clientId,
  clientName,
  hasInvoices
}: DeleteClientButtonProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (hasInvoices) {
      toast.error('⚠️ Cannot delete client with existing invoices. Please delete or reassign invoices first.', { duration: 3000 })
      setIsDialogOpen(false)
      return
    }

    setIsDeleting(true)
    const loadingToast = toast.loading('Deleting client...')

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (deleteError) throw deleteError

      toast.success('Client deleted successfully!', { id: loadingToast, duration: 3000 })
      
      setTimeout(() => {
        router.push('/dashboard/clients')
        router.refresh()
      }, 500)
    } catch (err: any) {
      console.error('Error deleting client:', err)
      toast.error('⚠️ ' + (err.message || 'Failed to delete client'), { id: loadingToast, duration: 3000 })
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        size="sm"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Client
      </Button>

      <ConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client?"
        description={`Are you sure you want to delete ${clientName}? This action cannot be undone. ${hasInvoices ? 'This client has invoices and cannot be deleted.' : ''}`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </>
  )
}
```

**Step 2: Add Delete Button to Client Detail Page**

**File to Update:** `src/app/dashboard/clients/[id]/page.tsx`

Add import and button:
```typescript
import { DeleteClientButton } from '@/components/clients/delete-client-button'

// In the header section, add delete button:
<div className="flex gap-2">
  <Link href={`/dashboard/clients/${client.id}/edit`}>
    <Button variant="outline" size="sm">
      <Pencil className="w-4 h-4 mr-2" />
      Edit Client
    </Button>
  </Link>
  <DeleteClientButton 
    clientId={client.id}
    clientName={client.name}
    hasInvoices={clientInvoices.length > 0}
  />
  <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
    <Button className="bg-primary text-white hover:bg-primary/90">
      <FileText className="w-4 h-4 mr-2" />
      Create Invoice
    </Button>
  </Link>
</div>
```

---

### Fix #5: Move "Back to Clients" Button to Left

**File to Update:** `src/app/dashboard/clients/[id]/page.tsx` (Lines 78-100)

**BEFORE:**
```typescript
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold text-slate-900">{client.name}</h1>
    <p className="text-sm text-slate-500 mt-1">
      Client since {new Date(client.created_at).toLocaleDateString()}
    </p>
  </div>
  <div className="flex gap-2">
    <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
      <Button className="bg-primary text-white hover:bg-primary/90">
        <FileText className="w-4 h-4 mr-2" />
        Create Invoice
      </Button>
    </Link>
    <Link href="/dashboard/clients">
      <Button variant="outline">
        Back to Clients
      </Button>
    </Link>
  </div>
</div>
```

**AFTER:**
```typescript
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div className="flex items-center gap-2 sm:gap-3">
    <Link href="/dashboard/clients">
      <Button variant="outline" size="sm" className="shrink-0">
        <ArrowLeft className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Back to Clients</span>
        <span className="sm:hidden">Back</span>
      </Button>
    </Link>
    <div>
      <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{client.name}</h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">
        Client since {new Date(client.created_at).toLocaleDateString()}
      </p>
    </div>
  </div>
  <div className="flex gap-2">
    <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
      <Button className="bg-primary text-white hover:bg-primary/90">
        <FileText className="w-4 h-4 mr-2" />
        Create Invoice
      </Button>
    </Link>
  </div>
</div>
```

**Also add import:**
```typescript
import { ArrowLeft } from 'lucide-react'
```

---

### Fix #6: Fix Quantity and Unit Price Fields

**File to Update:** `src/app/dashboard/invoices/new/page.tsx` (Lines 539-560)

**BEFORE:**
```typescript
<div className="col-span-1 sm:col-span-4 md:col-span-2">
  <label className="block text-xs font-medium text-gray-600 mb-1">
    Quantity
  </label>
  <Input
    type="number"
    min="0"
    step="0.01"
    value={item.quantity}
    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
    disabled={isSaving || isLoading}
  />
</div>
<div className="col-span-1 sm:col-span-4 md:col-span-2">
  <label className="block text-xs font-medium text-gray-600 mb-1">
    Unit Price
  </label>
  <Input
    type="number"
    min="0"
    step="0.01"
    value={item.unit_price}
    onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
    placeholder="0.00"
    disabled={isSaving || isLoading}
  />
</div>
```

**AFTER:**
```typescript
<div className="col-span-1 sm:col-span-4 md:col-span-2">
  <label className="block text-xs font-medium text-gray-600 mb-1">
    Quantity <span className="text-red-500">*</span>
  </label>
  <Input
    type="number"
    min="0"
    step="1"
    value={item.quantity}
    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
    disabled={isSaving || isLoading}
    required
  />
</div>
<div className="col-span-1 sm:col-span-4 md:col-span-2">
  <label className="block text-xs font-medium text-gray-600 mb-1">
    Unit Price <span className="text-red-500">*</span>
  </label>
  <Input
    type="number"
    min="0"
    step="0.01"
    value={item.unit_price}
    onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
    disabled={isSaving || isLoading}
    required
  />
</div>
```

---

## 🧪 Additional Edge Cases to Test

Based on the bugs found, here are additional scenarios to test:

### 1. Client Deletion Edge Cases
- [ ] Try to delete client with 1 invoice
- [ ] Try to delete client with multiple invoices
- [ ] Try to delete client with no invoices
- [ ] Verify error message is clear when deletion is prevented

### 2. Client Editing Edge Cases
- [ ] Edit client name to empty string
- [ ] Edit client email to invalid format
- [ ] Edit client and save, then verify changes persist
- [ ] Edit client and cancel, verify no changes saved

### 3. Invoice Form Validation
- [ ] Submit form with empty quantity
- [ ] Submit form with empty unit price
- [ ] Submit form with quantity = 0
- [ ] Submit form with unit price = 0
- [ ] Verify quantity only accepts whole numbers via spinner
- [ ] Verify unit price accepts decimals via spinner

### 4. PDF Download Edge Cases
- [ ] Download PDF for draft invoice
- [ ] Download PDF for sent invoice
- [ ] Download PDF for paid invoice
- [ ] Download PDF for invoice with many line items
- [ ] Download PDF for invoice with no line items (should not happen, but test)
- [ ] Verify PDF opens correctly in browser
- [ ] Verify PDF downloads correctly

### 5. Toast Notification Consistency
- [ ] Verify all success toasts show single checkmark
- [ ] Verify all error toasts show warning icon
- [ ] Verify toast durations are consistent (3000ms)
- [ ] Verify toasts don't stack/overlap

---

## ✅ Testing Checklist After Fixes

### Critical Path Re-test
- [ ] Signup → Create Client → Create Invoice → Send Email → Mark as Paid
- [ ] Download PDF works correctly
- [ ] All toasts show single checkmark
- [ ] Edit client works
- [ ] Delete client works (with and without invoices)

### Form Validation
- [ ] Quantity field requires input
- [ ] Unit Price field requires input
- [ ] Quantity increments by whole numbers
- [ ] Unit Price increments by decimals
- [ ] No "0" placeholders visible

### UI Consistency
- [ ] "Back to Clients" button on left side
- [ ] Edit and Delete buttons visible on client detail page
- [ ] All buttons properly aligned and responsive

---

## 📝 Implementation Order

1. **Fix #1** - Create download-invoice API route (CRITICAL)
2. **Fix #2** - Remove double checkmarks (HIGH - Quick fix)
3. **Fix #6** - Fix quantity/unit price fields (HIGH - Quick fix)
4. **Fix #5** - Move back button (MEDIUM - Quick fix)
5. **Fix #3** - Add edit client (HIGH - More complex)
6. **Fix #4** - Add delete client (HIGH - More complex)

---

## 🎯 Success Criteria

All fixes are complete when:
- ✅ PDF downloads work without 404 errors
- ✅ All success toasts show exactly one checkmark
- ✅ Users can edit client information
- ✅ Users can delete clients (with proper validation)
- ✅ "Back to Clients" button is on the left
- ✅ Quantity and Unit Price fields are required and work correctly
- ✅ All tests pass in the critical user flow

---

**End of Bug Report**

