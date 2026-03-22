type ContractStatus =
  | 'draft'
  | 'sent'
  | 'awaiting_signature'
  | 'active'
  | 'completed'
  | 'expired'
  | 'cancelled'

const styles: Record<ContractStatus, string> = {
  draft:               'bg-gray-100 text-gray-700',
  sent:                'bg-blue-100 text-blue-700',
  awaiting_signature:  'bg-yellow-100 text-yellow-700',
  active:              'bg-green-100 text-green-700',
  completed:           'bg-teal-100 text-teal-700',
  expired:             'bg-red-100 text-red-700',
  cancelled:           'bg-gray-100 text-gray-500',
}

const labels: Record<ContractStatus, string> = {
  draft:               'Draft',
  sent:                'Sent',
  awaiting_signature:  'Awaiting Signature',
  active:              'Active',
  completed:           'Completed',
  expired:             'Expired',
  cancelled:           'Cancelled',
}

export default function ContractStatusBadge({ status }: { status: string }) {
  const s = (status as ContractStatus) in styles ? (status as ContractStatus) : 'draft'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${styles[s]}`}>
      {labels[s]}
    </span>
  )
}