"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useState } from "react";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  max_members: number;
  max_storage_mb: number;
}

interface EditPlanModalProps {
  plan: Plan | null;
  onClose: () => void;
}

export default function EditPlanModal({ plan, onClose }: EditPlanModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    price_monthly: plan?.price_monthly || 0,
    price_annual: plan?.price_annual || 0,
    max_members: plan?.max_members || 0,
    max_storage_mb: plan?.max_storage_mb || 0,
  });

  if (!plan) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('price') || name.includes('max_') ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await apiClient.put(`/plans/${plan.id}`, formData);
      toast.success("Plan updated successfully");
      onClose();
    } catch (error) {
      console.error("Failed to update plan:", error);
      toast.error("Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 p-5 bg-[var(--panel)] border border-[var(--border)] rounded-xl">
        <h2 className="text-lg font-semibold mb-4 text-[var(--text-strong)]">Edit Plan</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--text)] mb-1">
              Name
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
            />
          </div>
          
          <div>
            <label htmlFor="price_monthly" className="block text-sm font-medium text-[var(--text)] mb-1">
              Monthly Price ($)
            </label>
            <Input
              id="price_monthly"
              name="price_monthly"
              type="number"
              min="0"
              step="0.01"
              value={formData.price_monthly}
              onChange={handleChange}
              required
              className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
            />
          </div>
          
          <div>
            <label htmlFor="price_annual" className="block text-sm font-medium text-[var(--text)] mb-1">
              Annual Price ($)
            </label>
            <Input
              id="price_annual"
              name="price_annual"
              type="number"
              min="0"
              step="0.01"
              value={formData.price_annual}
              onChange={handleChange}
              required
              className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
            />
          </div>
          
          <div>
            <label htmlFor="max_members" className="block text-sm font-medium text-[var(--text)] mb-1">
              Max Members
            </label>
            <Input
              id="max_members"
              name="max_members"
              type="number"
              min="0"
              value={formData.max_members}
              onChange={handleChange}
              required
              className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
            />
          </div>
          
          <div>
            <label htmlFor="max_storage_mb" className="block text-sm font-medium text-[var(--text)] mb-1">
              Max Storage (MB)
            </label>
            <Input
              id="max_storage_mb"
              name="max_storage_mb"
              type="number"
              min="0"
              value={formData.max_storage_mb}
              onChange={handleChange}
              required
              className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)]"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
