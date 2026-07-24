'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useCreateChurch } from '@/components/hooks/use-churches';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Circle, CheckCircle2, Loader2 } from 'lucide-react';
import type { Church } from '@/types';

interface CreateChurchModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { key: 'subdomain', label: 'Subdomain' },
  { key: 'database', label: 'Database' },
  { key: 'storage', label: 'Storage' },
  { key: 'admin', label: 'Admin account' },
];

function StepItem({
  label,
  status,
}: {
  label: string;
  status: 'pending' | 'active' | 'complete';
}) {
  const Icon =
    status === 'complete'
      ? CheckCircle2
      : status === 'active'
        ? Loader2
        : Circle;

  const cls =
    status === 'complete'
      ? 'text-[var(--good)]'
      : status === 'active'
        ? 'text-[var(--accent)]'
        : 'text-[var(--muted)]';

  return (
    <li className="flex items-center gap-3 py-1.5">
      <Icon
        className={`h-4 w-4 ${cls} ${status === 'active' ? 'animate-spin' : ''}`}
      />
      <span
        className={`text-sm ${
          status === 'complete'
            ? 'text-[var(--text-strong)]'
            : status === 'active'
              ? 'text-[var(--text-strong)]'
              : 'text-[var(--muted)]'
        }`}
      >
        {label}
      </span>
    </li>
  );
}

export default function CreateChurchModal({ open, onClose }: CreateChurchModalProps) {
  const [name, setName] = useState('');
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [provisioningName, setProvisioningName] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const { mutateAsync: createChurch, isPending } = useCreateChurch();

  const active = useRef(true);

  useEffect(() => {
    return () => {
      active.current = false;
    };
  }, []);

  useEffect(() => {
    if (!provisioningId) return;

    setActiveStep(0);
    let done = false;

    const tick = async () => {
      if (done) return;

      try {
        const response = await apiClient.get<Church>(`/churches/${provisioningId}`);
        if (response.data.status === 'active') {
          setActiveStep(4);
          done = true;
          setTimeout(() => {
            if (active.current) {
              onClose();
              toast.success(`${response.data.name} is now active and ready!`);
            }
          }, 600);
          return;
        }
      } catch {
        // keep polling
      }

      setActiveStep(prev => Math.min(prev + 1, 4));
    };

    const interval = setInterval(tick, 1800);

    return () => {
      clearInterval(interval);
      done = true;
    };
  }, [provisioningId, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !disableClose) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isPending) return;

    try {
      await createChurch(name);
      setProvisioningId(name.trim().toLowerCase().replace(/\s+/g, '-'));
    } catch {
      toast.error('Failed to create church');
    }
  };

  const showProvisioning = !!provisioningId;
  const isComplete = activeStep >= 4;
  const disableClose = showProvisioning && !isComplete;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)]"
      onClick={disableClose ? undefined : handleBackdropClick}
      onKeyDown={disableClose ? undefined : handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-church-title"
    >
      <div
        className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 shadow-lg"
        tabIndex={-1}
      >
        <h2 id="create-church-title" className="text-lg font-semibold text-[var(--text-strong)] mb-4">
          {showProvisioning ? 'Setting up your church' : 'Create New Church'}
        </h2>

        {!showProvisioning ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="church-name" className="block text-sm font-medium text-[var(--text)] mb-1">
                Church Name
              </label>
              <input
                type="text"
                id="church-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="Enter church name"
                autoFocus
                required
                disabled={isPending}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isPending || !name.trim()}
              >
                {isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span> Creating...
                  </>
                ) : (
                  'Create Church'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-sm text-[var(--muted)] mb-4">
              We&apos;re setting up everything for <span className="font-medium text-[var(--text-strong)]">{name}</span>. This usually takes a few moments.
            </p>
            <ul className="space-y-1 mb-5">
              {STEPS.map((step, i) => (
                <StepItem
                  key={step.key}
                  label={step.label}
                  status={
                    isComplete
                      ? 'complete'
                      : activeStep > i
                        ? 'complete'
                        : activeStep === i
                          ? 'active'
                          : 'pending'
                  }
                />
              ))}
            </ul>
            {isComplete && (
              <div className="flex justify-end">
                <Button variant="primary" onClick={onClose}>
                  Done
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
