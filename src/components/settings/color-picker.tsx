'use client'

import { useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'

interface ColorPickerProps {
  userId: string
  currentPrimaryColor: string
  currentSecondaryColor: string
  onColorsChanged: (primaryColor: string, secondaryColor: string) => void
}

export default function ColorPicker({ 
  userId, 
  currentPrimaryColor, 
  currentSecondaryColor,
  onColorsChanged 
}: ColorPickerProps) {
  const [primaryColor, setPrimaryColor] = useState(currentPrimaryColor)
  const [secondaryColor, setSecondaryColor] = useState(currentSecondaryColor)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  useEffect(() => {
    const changed = 
      primaryColor !== currentPrimaryColor ||
      secondaryColor !== currentSecondaryColor
    setHasChanges(changed)
  }, [primaryColor, secondaryColor, currentPrimaryColor, currentSecondaryColor])

  const handlePrimaryColorChange = (color: string) => {
    setPrimaryColor(color)
    onColorsChanged(color, secondaryColor)
  }

  const handleSecondaryColorChange = (color: string) => {
    setSecondaryColor(color)
    onColorsChanged(primaryColor, color)
  }

  const handleReset = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'Are you sure you want to reset to the original colors? Your current color selections will be lost.'
      )
      if (!confirmed) return
    }

    setPrimaryColor(currentPrimaryColor)
    setSecondaryColor(currentSecondaryColor)
    onColorsChanged(currentPrimaryColor, currentSecondaryColor)
  }

  return (
    <div className="space-y-8">
      {/* Color Pickers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Primary Color */}
        <div className="space-y-4">
          <label className="block text-base font-bold text-gray-900 uppercase tracking-wide">
            Primary Brand Color
          </label>
          
          {/* react-colorful Picker */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
            <HexColorPicker 
              color={primaryColor} 
              onChange={handlePrimaryColorChange}
              style={{ width: '100%', height: '280px' }}
            />
          </div>
          
          {/* Hex Input & Preview */}
          <div className="flex items-center gap-4">
            <div 
              className="w-20 h-20 rounded-xl border-2 border-gray-300 shadow-md flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            ></div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Hex Code
              </label>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => handlePrimaryColorChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-mono text-lg font-bold uppercase text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                pattern="^#[0-9A-Fa-f]{6}$"
                maxLength={7}
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 font-medium">Used for headers, buttons, and primary elements</p>
        </div>

        {/* Secondary Color */}
        <div className="space-y-4">
          <label className="block text-base font-bold text-gray-900 uppercase tracking-wide">
            Secondary Brand Color
          </label>
          
          {/* react-colorful Picker */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
            <HexColorPicker 
              color={secondaryColor} 
              onChange={handleSecondaryColorChange}
              style={{ width: '100%', height: '280px' }}
            />
          </div>
          
          {/* Hex Input & Preview */}
          <div className="flex items-center gap-4">
            <div 
              className="w-20 h-20 rounded-xl border-2 border-gray-300 shadow-md flex-shrink-0"
              style={{ backgroundColor: secondaryColor }}
            ></div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Hex Code
              </label>
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => handleSecondaryColorChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-mono text-lg font-bold uppercase text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                pattern="^#[0-9A-Fa-f]{6}$"
                maxLength={7}
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 font-medium">Used for accents, highlights, and secondary elements</p>
        </div>
      </div>

      {/* Reset Button */}
      {hasChanges && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 transition shadow-lg"
          >
            Reset to Original Colors
          </button>
        </div>
      )}

      {/* Preview Section */}
      <div className="border-t-2 border-gray-200 pt-8">
        <h3 className="text-base font-black text-gray-900 mb-6 uppercase tracking-wide">Live Preview</h3>
        <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
          <div className="bg-white rounded-2xl shadow-xl p-10 max-w-2xl mx-auto">
            {/* Gradient Header */}
            <div 
              className="h-4 rounded-full mb-8 shadow-md"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
              }}
            ></div>
            
            <div className="space-y-5">
              {/* Primary Button */}
              <button 
                type="button"
                className="w-full py-5 rounded-xl font-black text-white shadow-xl hover:opacity-90 transition text-xl"
                style={{ backgroundColor: primaryColor }}
              >
                Primary Button
              </button>
              
              {/* Secondary Button */}
              <button 
                type="button"
                className="w-full py-5 rounded-xl font-black text-white shadow-xl hover:opacity-90 transition text-xl"
                style={{ backgroundColor: secondaryColor }}
              >
                Secondary Button
              </button>
              
              {/* Color Swatches */}
              <div className="flex gap-4 pt-3">
                <div className="flex-1 h-24 rounded-xl shadow-lg" style={{ backgroundColor: primaryColor }}></div>
                <div className="flex-1 h-24 rounded-xl shadow-lg" style={{ backgroundColor: secondaryColor }}></div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-8 text-center font-semibold">
            Preview of how your colors will appear on invoices and emails
          </p>
        </div>
      </div>

      {/* Info Tip */}
      <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl">
        <div className="flex items-start gap-4">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          <div>
            <p className="text-base text-blue-900 font-bold mb-2">Color Selection Tips</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              Use the gradient picker to select your colors precisely. The square lets you choose saturation and brightness, while the slider below selects the hue. Choose colors that complement each other and provide good contrast with white backgrounds.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}