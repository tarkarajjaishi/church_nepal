'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Sample data for demo
const sampleChurches = [
  { id: 1, name: 'Grace Community Church', plan: 'Pro', mrr: 1200 },
  { id: 2, name: 'Mountainside Fellowship', plan: 'Starter', mrr: 800 },
  { id: 3, name: 'New Life Assembly', plan: 'Pro', mrr: 1500 },
];

const sampleAnalytics = {
  totalMrr: 3500,
  activeChurches: 24,
  newThisMonth: 3,
};

// Toast component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  return (
    <div className="fixed top-20 right-4 z-50 bg-[var(--accent-soft)] text-[var(--text-strong)] px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center">
        <span>{message}</span>
        <button 
          className="ml-2 text-[var(--text-strong)] hover:text-white"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function DemoPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const handleAction = (action: string) => {
    setToast({ message: 'Demo mode: Action blocked' });
    setTimeout(() => setToast(null), 3000);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', href: '#' },
    { id: 'churches', label: 'Churches', href: '#' },
    { id: 'analytics', label: 'Analytics', href: '#' },
    { id: 'billing', label: 'Billing', href: '#' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
                <h3 className="text-[var(--muted)]">Total MRR</h3>
                <p className="text-2xl font-bold">${sampleAnalytics.totalMrr}</p>
              </div>
              <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
                <h3 className="text-[var(--muted)]">Active Churches</h3>
                <p className="text-2xl font-bold">{sampleAnalytics.activeChurches}</p>
              </div>
              <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
                <h3 className="text-[var(--muted)]">New This Month</h3>
                <p className="text-2xl font-bold">{sampleAnalytics.newThisMonth}</p>
              </div>
            </div>
            
            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-medium mb-4">Recent Activity</h3>
              <ul className="space-y-2">
                <li className="flex justify-between text-sm">
                  <span>Grace Community Church upgraded to Pro</span>
                  <span className="text-[var(--muted)]">2 hours ago</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span>New signup: Mountainside Fellowship</span>
                  <span className="text-[var(--muted)]">1 day ago</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span>Payment received from New Life Assembly</span>
                  <span className="text-[var(--muted)]">3 days ago</span>
                </li>
              </ul>
            </div>
          </div>
        );
        
      case 'churches':
        return (
          <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Churches</h2>
              <button 
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm"
                onClick={() => handleAction('add-church')}
              >
                Add Church
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-soft)]">
                  <th className="py-2 text-left text-[var(--muted)]">Name</th>
                  <th className="py-2 text-left text-[var(--muted)]">Plan</th>
                  <th className="py-2 text-left text-[var(--muted)]">MRR</th>
                  <th className="py-2 text-right text-[var(--muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sampleChurches.map((church) => (
                  <tr key={church.id} className="border-b border-[var(--border-soft)]">
                    <td className="py-3">{church.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full text-xs">
                        {church.plan}
                      </span>
                    </td>
                    <td className="py-3">${church.mrr}</td>
                    <td className="py-3 text-right">
                      <button 
                        className="mr-2 text-[var(--muted)] hover:text-[var(--text)]"
                        onClick={() => handleAction('edit-church')}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-[var(--muted)] hover:text-[var(--text)]"
                        onClick={() => handleAction('delete-church')}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-medium mb-4">Revenue Chart</h3>
              <div className="h-64 flex items-end space-x-2 justify-center pt-10">
                {[60, 80, 70, 90, 110, 100, 120].map((height, i) => (
                  <div 
                    key={i} 
                    className="w-8 bg-[var(--accent)] rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
                <h3 className="font-medium mb-4">Top Plans</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Pro Plan</span>
                    <span className="font-medium">15 churches</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Starter Plan</span>
                    <span className="font-medium">7 churches</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Enterprise Plan</span>
                    <span className="font-medium">2 churches</span>
                  </li>
                </ul>
              </div>
              
              <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
                <h3 className="font-medium mb-4">Growth Metrics</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>MRR Growth (MoM)</span>
                    <span className="font-medium text-[var(--good)]">+12%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Churn Rate</span>
                    <span className="font-medium">2.3%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Avg. Revenue per Church</span>
                    <span className="font-medium">$1,050</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[var(--panel)] border-r border-[var(--border)] min-h-screen p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Master Control</h1>
          <p className="text-[var(--muted)] text-sm">Demo Mode</p>
        </div>
        <nav>
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <Link href="#" passHref>
                  <span
                    className={`block px-4 py-2 rounded-lg cursor-pointer ${
                      activeTab === item.id 
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]' 
                        : 'hover:bg-[var(--panel-2)]'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(item.id);
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
        </header>
        
        {renderContent()}
      </main>
      
      {/* Toast notification */}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
