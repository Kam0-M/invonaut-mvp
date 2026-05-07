'use client'

import { useEffect } from 'react'
import clarity from '@microsoft/clarity'

export default function ClarityProvider() {
  useEffect(() => {
    clarity.init('wn0k9cxu7r')
  }, [])

  return null
}