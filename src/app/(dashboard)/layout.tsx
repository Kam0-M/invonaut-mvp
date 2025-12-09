import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Flowance</h1>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}