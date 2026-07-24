'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Church {
  id: string;
  name: string;
  subdomain: string;
  // Add other fields as needed
}

async function fetchChurch(id: string): Promise<Church | null> {
  try {
    const res = await fetch(`/api/admin/churches/${id}`);
    if (!res.ok) {
      console.error('Failed to fetch church:', res.status);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching church:', error);
    return null;
  }
}

export default function ChurchDetailPage({ params }: { params: { id: string } }) {
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  if (loading && !church) {
    fetchChurch(params.id)
      .then(data => {
        setChurch(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }

  const handleImpersonate = async () => {
    if (!church) return;

    try {
      // First, try to call the backend impersonation endpoint
      const impersonateRes = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId: church.id }),
      });

      if (impersonateRes.ok) {
        const data = await impersonateRes.json();
        const token = data.token;
        // Open the church admin URL with the impersonation token
        window.open(`https://${church.subdomain}.churchnepal.com/admin?impersonationToken=${token}`, '_blank');
      } else {
        // Fallback: just open the church URL without token
        window.open(`https://${church.subdomain}.churchnepal.com/admin`, '_blank');
      }
    } catch (error) {
      console.error('Impersonation failed, opening URL directly:', error);
      // Fallback: just open the church URL without token
      window.open(`https://${church.subdomain}.churchnepal.com/admin`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  if (!church) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
          <p>Church not found.</p>
          <Link href="/admin/churches" className="mt-4 inline-block">
            Back to Churches
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Church Details</h1>
        <Button onClick={handleImpersonate}>
          Log in as
        </Button>
      </div>
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{church.name}</h2>
            <p className="text-[var(--muted)]">{church.subdomain}.churchnepal.com</p>
          </div>
          {/* Add more details as needed */}
        </div>
      </Card>
    </div>
  );
}
