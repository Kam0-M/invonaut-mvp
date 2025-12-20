import { Card } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded" />
          <div className="h-10 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-8 w-32 bg-gray-200 rounded" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-64 bg-gray-100 rounded" />
        </Card>
        <Card className="p-6">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-64 bg-gray-100 rounded" />
        </Card>
      </div>

      <Card className="p-6">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      </Card>
    </div>
  )
}