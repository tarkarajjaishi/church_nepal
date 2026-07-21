"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-panel border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text">
            {variant === "destructive" && (
              <AlertTriangle className="h-5 w-5 text-danger" />
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-muted">
              {variant === "destructive" ? (
                <span>
                  <strong className="text-danger">Warning:</strong> {description}
                </span>
              ) : description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button 
            variant={variant === "destructive" ? "destructive" : "primary"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing confirm dialog state
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmProps, setConfirmProps] = useState<{
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);

  const confirm = useCallback((props: {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  }) => {
    setConfirmProps(props);
    setIsOpen(true);
  }, []);

  const ConfirmDialogComponent = useCallback(() => {
    if (!confirmProps) return null;
    
    return (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={confirmProps.title}
        description={confirmProps.description}
        confirmLabel={confirmProps.confirmLabel}
        cancelLabel={confirmProps.cancelLabel}
        variant={confirmProps.variant}
        onConfirm={confirmProps.onConfirm}
      />
    );
  }, [isOpen, confirmProps]);

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}