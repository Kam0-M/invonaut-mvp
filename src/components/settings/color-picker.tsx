'use client'

import { useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import { RotateCcw } from 'lucide-react'

interface ColorPickerProps {
  userId: string
  currentPrimaryColor: string
  currentSecondaryColor: string
  onColorsChanged: (primaryColor: string, secondaryColor: string) => void
}

type ActivePicker = 'primary' | 'secondary'

export default function ColorPicker({ 
  userId, 
  currentPrimaryColor, 
  currentSecondaryColor,
  onColorsChanged 
}: ColorPickerProps) {
  const [primaryColor, setPrimaryColor] = useState(currentPrimaryColor)
  const [secondaryColor, setSecondaryColor] = useState(currentSecondaryColor)
  const [activePicker, setActivePicker] = useState<ActivePicker>('primary')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setHasChanges(primaryColor !== currentPrimaryColor || secondaryColor !== currentSecondaryColor)
  }, [primaryColor, secondaryColor, currentPrimaryColor, currentSecondaryColor])

  const handlePickerChange = (color: string) => {
    if (activePicker === 'primary') {
      setPrimaryColor(color)
      onColorsChanged(color, secondaryColor)
    } else {
      setSecondaryColor(color)
      onColorsChanged(primaryColor, color)
    }
  }

  const handleHexInput = (value: string, which: ActivePicker) => {
    const clean = value.startsWith('#') ? value : `#${value}`
    if (which === 'primary') {
      setPrimaryColor(clean)
      onColorsChanged(clean, secondaryColor)
    } else {
      setSecondaryColor(clean)
      onColorsChanged(primaryColor, clean)
    }
  }

  const handleReset = () => {
    if (hasChanges && !window.confirm('Reset to original colors?')) return
    setPrimaryColor(currentPrimaryColor)
    setSecondaryColor(currentSecondaryColor)
    onColorsChanged(currentPrimaryColor, currentSecondaryColor)
  }

  const activeColor = activePicker === 'primary' ? primaryColor : secondaryColor

  return (
    <div className="space-y-6">
      {/* Color selector tabs */}
      <div className="flex gap-3">
        {(['primary', 'secondary'] as ActivePicker[]).map((which) => {
          const color = which === 'primary' ? primaryColor : secondaryColor
          const label = which === 'primary' ? 'Primary Color' : 'Secondary Color'
          const isActive = activePicker === which
          return (
            <button
              key={which}
              type="button"
              onClick={() => setActivePicker(which)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex-1 ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 border border-white/30"
                style={{ backgroundColor: color }}
              />
              {label}
            </button>
          )
        })}
        {hasChanges && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Picker + Hex input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <HexColorPicker
            color={activeColor}
            onChange={handlePickerChange}
            style={{ width: '100%', height: '220px', borderRadius: '12px' }}
          />
          <div className="flex items-center gap-3 mt-3">
            <div
              className="w-10 h-10 rounded-lg flex-shrink-0 border border-gray-100"
              style={{ backgroundColor: activeColor }}
            />
            <input
              type="text"
              value={activeColor}
              onChange={(e) => handleHexInput(e.target.value, activePicker)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl font-mono text-sm font-bold uppercase text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={7}
            />
          </div>
        </div>

        {/* Live invoice preview */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Invoice Preview</p>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Invoice header bar */}
            <div
              className="h-1.5"
              style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
            />
            <div className="p-4 space-y-3">
              {/* Logo + company */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="w-16 h-5 rounded" style={{ backgroundColor: primaryColor, opacity: 0.15 }} />
                  <div className="text-xs font-black text-gray-900">Your Business</div>
                  <div className="text-[10px] text-gray-400">hello@yourbusiness.com</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>Invoice</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">#INV-0001</div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* Line items */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Design Services</span>
                  <span className="font-bold text-gray-700">$2,400.00</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Consulting (4h)</span>
                  <span className="font-bold text-gray-700">$600.00</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Due</span>
                <span className="text-sm font-black text-gray-900">$3,000.00</span>
              </div>

              {/* Pay button */}
              <button
                type="button"
                className="w-full py-2 rounded-lg text-white text-[10px] font-black transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                Pay Invoice
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">Live preview — updates as you pick</p>
        </div>
      </div>
    </div>
  )
}
