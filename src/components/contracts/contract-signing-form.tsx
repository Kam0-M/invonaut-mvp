'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, PenLine, RotateCcw, CheckCircle } from 'lucide-react'

interface ContractSigningFormProps {
  contractId: string
  token: string
  slug: string
  defaultSignerName: string
}

function SignatureCanvas({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      isDrawingRef.current = true
      const pos = getPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      if (!isDrawingRef.current) return
      const pos = getPos(e, canvas)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      if (!hasSignature) setHasSignature(true)
      onChange(canvas.toDataURL('image/png'))
    }

    const stop = () => { isDrawingRef.current = false }

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stop)
    canvas.addEventListener('mouseleave', stop)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', stop)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stop)
      canvas.removeEventListener('mouseleave', stop)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stop)
    }
  }, [onChange, hasSignature])

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-gray-200 rounded-xl bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full h-36 touch-none cursor-crosshair"
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-sm font-medium flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              Draw your signature here
            </p>
          </div>
        )}
        {/* Signature line */}
        <div className="absolute bottom-5 left-6 right-6 h-px bg-gray-100" />
      </div>
      {hasSignature && (
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear and redraw
        </button>
      )}
    </div>
  )
}

export default function ContractSigningForm({
  contractId,
  token,
  slug,
  defaultSignerName,
}: ContractSigningFormProps) {
  const router = useRouter()
  const [signerName, setSignerName] = useState(defaultSignerName)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  const canSign = signerName.trim().length > 0 && signatureData !== null && agreed

  const handleSign = async () => {
    if (!canSign) return
    setIsSigning(true)
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          token,
          slug,
          signerName: signerName.trim(),
          signatureData,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Could not save signature. Please try again.')
        return
      }
      setSigned(true)
      // Scroll to top to show the success state
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSigning(false)
    }
  }

  if (signed) {
    return (
      <div className="bg-white rounded-2xl border-2 border-green-100 shadow-sm p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Signed successfully.</h2>
          <p className="text-gray-500 text-sm">
            Your signature has been recorded. A copy of the signed contract will be sent to you by email.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-6 space-y-5">
      <div>
        <h2 className="font-black text-gray-900 mb-1">Sign this contract</h2>
        <p className="text-sm text-gray-500">
          By signing, you confirm that your electronic signature is legally binding.
        </p>
      </div>

      {/* Signer name */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Your full name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={signerName}
          onChange={e => setSignerName(e.target.value)}
          placeholder="Enter your full legal name"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
        />
      </div>

      {/* Signature canvas */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Your signature <span className="text-red-500">*</span>
        </label>
        <SignatureCanvas onChange={setSignatureData} />
      </div>

      {/* Consent checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors" />
          {agreed && (
            <svg
              className="absolute inset-0 w-5 h-5 text-white p-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-sm text-gray-600 leading-relaxed">
          I have read and agree to the terms of this contract. I understand that my
          electronic signature is legally binding under the ESIGN Act and has the
          same legal effect as a handwritten signature.
        </span>
      </label>

      {/* Sign button */}
      <button
        type="button"
        onClick={handleSign}
        disabled={!canSign || isSigning}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-base hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSigning ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Signing...</>
        ) : (
          <><PenLine className="w-5 h-5" /> Sign Contract</>
        )}
      </button>

      {!canSign && (
        <p className="text-center text-xs text-gray-400">
          {!signerName.trim()
            ? 'Enter your full name to continue.'
            : !signatureData
            ? 'Draw your signature above to continue.'
            : 'Check the agreement box to continue.'}
        </p>
      )}
    </div>
  )
}