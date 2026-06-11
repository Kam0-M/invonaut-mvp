'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Sparkles, AlertCircle, TrendingUp, Calendar, Loader2 } from 'lucide-react'

type PredictionData = {
  predictedDate: string
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
  insight: string
}

type Props = {
  invoiceId: string
  clientId: string
  clientName: string
  invoiceAmount: number
  invoiceStatus: string
  dueDate: string
}

export function PaymentPrediction({ invoiceId, clientId, clientName, invoiceAmount, invoiceStatus, dueDate }: Props) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPrediction() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/predict-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId,
            clientId,
            totalAmount: invoiceAmount,
            status: invoiceStatus,
            dueDate
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch prediction')
        }

        const data = await response.json()
        
        // API returns { prediction: {...}, paymentHistory: {...} }
        // We need the prediction object
        const rawPrediction = data.prediction || data
        
        // Convert snake_case to camelCase
        const predictionData: PredictionData = {
          predictedDate: rawPrediction.predicted_date || rawPrediction.predictedDate,
          confidence: rawPrediction.confidence_score || rawPrediction.confidence,
          riskLevel: rawPrediction.risk_level || rawPrediction.riskLevel,
          insight: rawPrediction.insight
        }
        
        // Validate converted data
        if (!predictionData.predictedDate || !predictionData.riskLevel) {
          console.error('Validation failed after conversion:', predictionData)
          throw new Error('Invalid prediction data received. Check console for details.')
        }

        setPrediction(predictionData)
      } catch (err) {
        console.error('Prediction error:', err)
        setError(err instanceof Error ? err.message : 'Unable to generate prediction. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [invoiceId, clientId, clientName, invoiceAmount, invoiceStatus, dueDate])

  if (loading) {
    return (
      <Card className="p-6 bg-[#F8FAFF] border-blue-100">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <h3 className="text-base font-black text-gray-900">AI Payment Prediction</h3>
            <p className="text-sm text-gray-500 font-medium">Analyzing payment patterns...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-black text-gray-900">Prediction unavailable</h3>
            <p className="text-sm text-gray-600 font-medium mt-1">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!prediction) return null

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: 'text-green-600'
        }
      case 'medium':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          icon: 'text-yellow-600'
        }
      case 'high':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: 'text-red-600'
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-300',
          icon: 'text-gray-600'
        }
    }
  }

  const riskColors = getRiskColor(prediction.riskLevel || 'medium')
  const confidenceColor = prediction.confidence >= 80 ? 'text-green-600' : prediction.confidence >= 60 ? 'text-yellow-600' : 'text-red-600'

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatRiskLevel = (risk: string) => {
    if (!risk) return 'Unknown'
    return risk.charAt(0).toUpperCase() + risk.slice(1)
  }

  return (
    <Card className="p-6 bg-[#F8FAFF] border-blue-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-black text-gray-900">AI Payment Prediction</h3>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${riskColors.bg} ${riskColors.text} ${riskColors.border} border`}>
          {formatRiskLevel(prediction.riskLevel)} Risk
        </span>
      </div>

      {/* Main Prediction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Predicted Payment Date */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${riskColors.bg}`}>
            <Calendar className={`w-5 h-5 ${riskColors.icon}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Predicted Payment Date</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatDate(prediction.predictedDate)}
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Confidence Score</p>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-xl font-bold ${confidenceColor}`}>
                {prediction.confidence}%
              </p>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                <div
                  className={`h-full ${
                    prediction.confidence >= 80
                      ? 'bg-green-600'
                      : prediction.confidence >= 60
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, prediction.confidence))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
        <p className="text-sm font-medium text-gray-700 mb-2">AI Insight:</p>
        <p className="text-sm text-gray-600 leading-relaxed">{prediction.insight || 'No insight available.'}</p>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          This is an AI-generated prediction based on historical patterns and is not guaranteed. Use as guidance only.
        </p>
      </div>
    </Card>
  )
}