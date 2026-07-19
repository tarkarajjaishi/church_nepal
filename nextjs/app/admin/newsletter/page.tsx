'use client'

import { useQuery } from '@tanstack/react-query'
import { Mail, Users } from 'lucide-react'
import api from '@/lib/admin/api'
import { Loading, EmptyState } from '@/components/LoadingStates'

export default function NewsletterAdminPage() {
  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: () => api.get('/newsletter/subscribers').then(r => r.data ?? []),
  })

  const { data: countData } = useQuery({
    queryKey: ['newsletter-count'],
    queryFn: () => api.get('/newsletter/count').then(r => r.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0b3c5d]">Newsletter Subscribers</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0b3c5d] flex items-center justify-center text-white">
            <Users className="size-6" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0b3c5d]">{countData?.count ?? subscribers.length}</div>
            <div className="text-sm text-gray-500">Total Subscribers</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : subscribers.length === 0 ? (
        <EmptyState icon={<Mail className="size-10" />} title="No subscribers yet" description="Subscribers will appear here when people sign up." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subscribed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscribers.map((sub: any, i: number) => (
                <tr key={sub.email || i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{sub.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{sub.subscribedAt || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
