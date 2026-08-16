'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

/**
 * Set where a church is.
 *
 * Every church created before migration 021 has no location, and the wizard is
 * the only other place it can be entered — so without this, existing churches
 * could never appear on a /churches/<city> page.
 */
export function ChurchLocationForm({
  id,
  city,
  district,
  province,
}: {
  id: string;
  city?: string | null;
  district?: string | null;
  province?: string | null;
}) {
  const [form, setForm] = useState({
    city: city ?? '',
    district: district ?? '',
    province: province ?? '',
  });
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: () => apiClient.patch(`/churches/${id}`, form),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['church', id] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const field = (name: 'city' | 'district' | 'province', label: string, placeholder: string) => (
    <div>
      <label className="block text-sm font-medium text-[var(--text)] mb-1">{label}</label>
      <Input
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className="bg-[var(--panel-2)] border-[var(--border-soft)] text-[var(--text)]"
      />
    </div>
  );

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <h2 className="font-semibold mb-1">Location</h2>
      <p className="text-sm text-[var(--muted)] mb-4">
        The city places this church on the public directory page for that city.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {field('city', 'City', 'Kathmandu')}
        {field('district', 'District', 'Kathmandu')}
        {field('province', 'Province', 'Bagmati')}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save location'}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
        {save.isError && (
          <span className="text-sm text-red-500">
            {(save.error as { message?: string })?.message || 'Could not save'}
          </span>
        )}
      </div>
    </Card>
  );
}
