import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'

type NotFoundProps = {
  title: string
  description: string
  backLink: string
  backText: string
  icon?: React.ReactNode
}

export function NotFound({
  title,
  description,
  backLink,
  backText,
  icon
}: NotFoundProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            {icon || <AlertCircle className="w-12 h-12 text-red-600" />}
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Possible Reasons */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6">
          <p className="text-sm font-medium text-gray-900 mb-2">
            Possible reasons:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>The URL may be incorrect or outdated</li>
            <li>The item may have been deleted</li>
            <li>You don't have permission to access this item</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={backLink} className="flex-1">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backText}
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full bg-primary">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}