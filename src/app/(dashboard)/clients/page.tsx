import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

export default function ClientsPage() {
  const clients = [
    {
      id: 1,
      name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, City, State 12345',
      totalInvoices: 12,
      totalAmount: '$15,500',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Tech Solutions',
      email: 'hello@techsolutions.com',
      phone: '+1 (555) 987-6543',
      address: '456 Tech Ave, City, State 12345',
      totalInvoices: 8,
      totalAmount: '$8,200',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Design Studio',
      email: 'info@designstudio.com',
      phone: '+1 (555) 456-7890',
      address: '789 Creative Blvd, City, State 12345',
      totalInvoices: 15,
      totalAmount: '$22,100',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Marketing Pro',
      email: 'team@marketingpro.com',
      phone: '+1 (555) 321-0987',
      address: '321 Marketing Way, City, State 12345',
      totalInvoices: 6,
      totalAmount: '$4,800',
      status: 'Inactive'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  client.status === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status}
                </span>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {client.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {client.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {client.address}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Invoices:</span>
                <span className="font-medium">{client.totalInvoices}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">{client.totalAmount}</span>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                View Details
              </Button>
              <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                New Invoice
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
