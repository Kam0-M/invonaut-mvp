'use client'

import { useEffect, useState } from 'react'
import { Brain, TrendingUp, AlertCircle, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'

type PaymentPredictionProps = {
  invoiceId: string
  clientId: string
  totalAmount: number
  status: string
  dueDate: string
}

type Prediction = {
  predicted_date: string
  confidence_score: number
  risk_level: 'low' | 'medium' | 'high'
  insight: string
  reasoning: string
}

export function PaymentPrediction({
  invoiceId,
  clientId,
  totalAmount,
  status,
  dueDate
}: PaymentPredictionProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPrediction() {
      try {
        const response = await fetch('/api/predict-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId,
            clientId,
            totalAmount,
            status,
            dueDate
          })
        })

        if (!response.ok) throw new Error('Failed to fetch prediction')

        const data = await response.json()
        setPrediction(data.prediction)
      } catch (err: any) {
        console.error('Prediction error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    // Only predict for sent invoices
    if (status === 'sent') {
      fetchPrediction()
    } else {
      setLoading(false)
    }
  }, [invoiceId, clientId, totalAmount, status, dueDate])

  // Don't show for paid/draft invoices
  if (status !== 'sent' || !prediction) return null

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'border-green-200 bg-green-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'high':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <Card className="p-6 border-2 border-dashed border-gray-200">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-gray-400 animate-pulse" />
          <p className="text-sm text-gray-600">AI analyzing payment patterns...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-2 border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <p className="text-sm text-gray-600">
            AI prediction unavailable. Check back later.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 border-2 ${getRiskColor(prediction.risk_level)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Payment Prediction</h3>
            <p className="text-xs text-gray-500">Based on client payment history</p>
          </div>
        </div>
        {getRiskIcon(prediction.risk_level)}
      </div>

      {/* Prediction Details */}
      <div className="space-y-4">
        {/* Confidence Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Confidence Score</span>
            <span className="text-sm font-semibold text-gray-900">
              {prediction.confidence_score}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${prediction.confidence_score}%` }}
            />
          </div>
        </div>

        {/* Predicted Date */}
        <div className="flex items-center justify-between py-3 border-t border-gray-200">
          <span className="text-sm text-gray-600">Predicted Payment Date</span>
          <span className="text-sm font-semibold text-gray-900">
            {new Date(prediction.predicted_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Risk Level */}
        <div className="flex items-center justify-between py-3 border-t border-gray-200">
          <span className="text-sm text-gray-600">Risk Level</span>
          <span className="text-sm font-semibold text-gray-900 capitalize">
            {prediction.risk_level}
          </span>
        </div>

        {/* AI Insight */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed">
            {prediction.insight}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="pt-3 border-t border-gray-200 bg-white rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>AI Prediction Disclaimer:</strong> This prediction is based on
              historical payment patterns and statistical analysis. It is not financial
              advice or a guarantee of payment. Always use your judgment and follow up
              with clients as needed.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}