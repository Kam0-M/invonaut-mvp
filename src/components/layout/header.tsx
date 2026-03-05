'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
  Bell, 
  User, 
  Settings,
  LogOut,
  Building2
} from 'lucide-react'

interface HeaderProps {
  businessName?: string | null
  userEmail?: string
}

export function Header({ businessName, userEmail }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Business Name */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image 
                src="/invonaut-logo.png" 
                alt="Invonaut" 
                width={40} 
                height={40}
                className="rounded-full"
                quality={100}
                priority
              />
              <span className="text-2xl font-bold text-primary">Invonaut</span>
            </Link>
            
            {/* Business Name Display */}
            {businessName && (
              <>
                <div className="hidden md:block h-8 w-px bg-gray-300"></div>
                <div className="hidden md:flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-700">{businessName}</span>
                </div>
              </>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/api/auth/signout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {/* Business Name - Mobile */}
              {businessName && (
                <div className="px-3 py-2 border-b border-gray-200 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-bold text-gray-700">{businessName}</span>
                  </div>
                </div>
              )}
              
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/api/auth/signout">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}