import OpenAI from 'openai'

type Invoice = {
  id: string
  total_amount: number
  issue_date: string
  due_date: string
  status: string
  client_id: string
}

type PaymentHistory = {
  invoice_count: number
  avg_days_to_payment: number
  on_time_percentage: number
  total_paid: number
}

type PredictionResult = {
  predicted_date: string
  confidence_score: number
  risk_level: 'low' | 'medium' | 'high'
  insight: string
  reasoning: string
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// TEMPORARY DEBUG - Remove after testing
console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY)
console.log('OpenAI API Key starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-'))

/**
 * Analyze client payment history
 */
export async function analyzePaymentHistory(
  clientId: string,
  invoices: Invoice[]
): Promise<PaymentHistory> {
  const clientInvoices = invoices.filter(
    (inv) => inv.client_id === clientId && inv.status === 'paid'
  )

  if (clientInvoices.length === 0) {
    return {
      invoice_count: 0,
      avg_days_to_payment: 0,
      on_time_percentage: 0,
      total_paid: 0
    }
  }

  // Calculate average days to payment
  const paymentDays = clientInvoices.map((inv) => {
    const issued = new Date(inv.issue_date)
    const due = new Date(inv.due_date)
    return Math.floor((due.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24))
  })

  const avgDays = paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length

  // Calculate on-time percentage (simplified - assumes paid = on time for now)
  const onTimePercentage = 100 // We'll enhance this later with actual payment dates

  // Calculate total paid
  const totalPaid = clientInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)

  return {
    invoice_count: clientInvoices.length,
    avg_days_to_payment: Math.round(avgDays),
    on_time_percentage: onTimePercentage,
    total_paid: totalPaid
  }
}

/**
 * Get AI payment prediction for an invoice
 */
export async function predictPayment(
  invoice: Invoice,
  paymentHistory: PaymentHistory
): Promise<PredictionResult> {
  const dueDate = new Date(invoice.due_date)
  const today = new Date()
  const daysUntilDue = Math.floor(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Build context for AI
  const prompt = `You are a financial AI assistant analyzing invoice payment predictions.

Client Payment History:
- Total invoices paid: ${paymentHistory.invoice_count}
- Average days to payment: ${paymentHistory.avg_days_to_payment}
- On-time payment rate: ${paymentHistory.on_time_percentage}%
- Total amount paid historically: $${paymentHistory.total_paid.toFixed(2)}

Current Invoice:
- Amount: $${invoice.total_amount.toFixed(2)}
- Days until due: ${daysUntilDue}
- Status: ${invoice.status}

Based on this data, predict:
1. The likelihood this invoice will be paid on time (0-100%)
2. Risk level (low/medium/high)
3. A brief insight explaining the prediction

Respond in JSON format:
{
  "confidence_score": <number 0-100>,
  "risk_level": "<low|medium|high>",
  "insight": "<brief explanation>",
  "reasoning": "<detailed reasoning>"
}

Be transparent that this is a prediction based on patterns, not a guarantee.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a financial prediction AI. Provide honest, conservative predictions with appropriate disclaimers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3 // Lower temperature for more consistent predictions
    })

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}')

    // Calculate predicted date based on historical avg
    const predictedDate = new Date(invoice.issue_date)
    predictedDate.setDate(
      predictedDate.getDate() +
        (paymentHistory.avg_days_to_payment || daysUntilDue)
    )

    return {
      predicted_date: predictedDate.toISOString().split('T')[0],
      confidence_score: aiResponse.confidence_score || 50,
      risk_level: aiResponse.risk_level || 'medium',
      insight: aiResponse.insight || 'Limited data available for prediction',
      reasoning: aiResponse.reasoning || 'Based on available payment history'
    }
  } catch (error) {
    console.error('AI prediction error:', error)

    // Fallback prediction if AI fails
    const predictedDate = new Date(invoice.due_date)

    return {
      predicted_date: predictedDate.toISOString().split('T')[0],
      confidence_score: 50,
      risk_level: 'medium',
      insight: 'Prediction based on due date (AI unavailable)',
      reasoning: 'Using fallback prediction method'
    }
  }
}

/**
 * Format confidence score for display
 */
export function formatConfidence(score: number): string {
  if (score >= 80) return 'High confidence'
  if (score >= 60) return 'Moderate confidence'
  if (score >= 40) return 'Low confidence'
  return 'Very low confidence'
}

/**
 * Get risk color for UI
 */
export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}