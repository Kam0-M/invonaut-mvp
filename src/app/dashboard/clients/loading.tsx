import { Card } from '@/components/ui/card'

export default function ClientsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-12 flex-1 bg-gray-100 rounded" />
              <div className="h-12 flex-1 bg-gray-100 rounded" />
              <div className="h-12 flex-1 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}