"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onActionClick?: () => void;
  hideAction?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText = "Add New",
  onActionClick,
  hideAction = false,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-[var(--text-strong)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--muted)] max-w-md mb-6">
        {description}
      </p>
      {!hideAction && onActionClick && (
        <Button onClick={onActionClick} className="gap-2">
          <PlusIcon size={16} />
          {actionText}
        </Button>
      )}
    </div>
  );
}
