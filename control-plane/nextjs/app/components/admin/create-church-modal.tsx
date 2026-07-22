'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreateChurch } from '@/components/hooks/use-churches';
import { toast } from 'sonner';

interface CreateChurchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateChurchModal({ open, onClose }: CreateChurchModalProps) {
  const [name, setName] = useState('');
  const { mutateAsync: createChurch, isPending } = useCreateChurch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createChurch(name);
      
      // Show success message with details
      toast.success('Church created successfully!');
      console.log('New church details:', result);
      // In a real implementation, we would show the credentials in the UI
    } catch (error) {
      toast.error('Failed to create church');
      console.error('Error creating church:', error);
    }
  };

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)]"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-church-title"
    >
      <div 
        className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 shadow-lg"
        tabIndex={-1}
      >
        <h2 id="create-church-title" className="text-lg font-semibold text-[var(--text-strong)] mb-4">
          Create New Church
        </h2>
        
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
      </div>
    </div>
  );
}
