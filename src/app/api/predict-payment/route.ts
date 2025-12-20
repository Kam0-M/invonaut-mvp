import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { predictPayment, analyzePaymentHistory } from '@/lib/ai/payment-predictions'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, clientId, totalAmount, status, dueDate } =
      await request.json()

    // Get user authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch current invoice details
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch all client invoices for history
    const { data: clientInvoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)

    // Analyze payment history
    const paymentHistory = await analyzePaymentHistory(
      clientId,
      clientInvoices || []
    )

    // Get AI prediction
    const prediction = await predictPayment(invoice, paymentHistory)

    return NextResponse.json({
      prediction,
      paymentHistory
    })
  } catch (error) {
    console.error('Prediction API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}