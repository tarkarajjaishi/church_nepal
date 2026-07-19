'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/admin/api'
import { DollarSign, TrendingUp, CreditCard, Clock } from 'lucide-react'
import { Loading, EmptyState } from '@/components/LoadingStates'

export default function DonationsPage() {
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['donations'],
    queryFn: () => api.get('/donations').then(r => r.data),
  })

  const { data: stats = {} } = useQuery({
    queryKey: ['donations-stats'],
    queryFn: () => api.get('/donations/stats').then(r => r.data),
  })

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0b3c5d]">Donations</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Raised', value: `Rs ${(stats.total_raised || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
          { label: 'Total Donations', value: stats.total_donations || 0, icon: TrendingUp, color: 'bg-blue-500' },
          { label: 'eSewa Total', value: `Rs ${(stats.esewa_total || 0).toLocaleString()}`, icon: CreditCard, color: 'bg-purple-500' },
          { label: 'Khalti Total', value: `Rs ${(stats.khalti_total || 0).toLocaleString()}`, icon: CreditCard, color: 'bg-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-lg ${color} flex items-center justify-center text-white`}>
                <Icon className="size-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <Loading />
        ) : donations.length === 0 ? (
          <EmptyState icon={<DollarSign className="size-10" />} title="No donations yet" description="Donations will appear here once they are recorded." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Donor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Method</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{d.donorName || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">{d.donorEmail}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">Rs {d.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{d.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status] || 'bg-gray-100 text-gray-700'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
