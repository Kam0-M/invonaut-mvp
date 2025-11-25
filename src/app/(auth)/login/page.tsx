'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // TODO: Implement authentication logic
    console.log('Login attempt:', { email, password })
    
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            placeholder="Enter your password"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
              Sign up
            </Link>
          </span>
        </div>
      </form>
    </Card>
  )
}
