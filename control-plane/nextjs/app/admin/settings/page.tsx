"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMe } from "@/components/hooks/use-auth";
import { toast } from "sonner";

// Default platform settings
const defaultSettings = {
  platformName: "ChurchNepal",
  baseUrl: "churchnepal.com",
  defaultPlan: "Free",
  maintenanceMode: false,
};

export default function SettingsPage() {
  const { data: userData, isLoading: authIsLoading } = useMe();
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);

  // Load settings from API if available
  useEffect(() => {
    // In a real implementation, fetch settings from the backend here
    // For now, we'll use the defaults
  }, []);

  const handleSave = () => {
    setSaving(true);
    // In a real app, this would save to the backend
    // For now, just show a toast and simulate saving delay
    toast.success("Settings saved successfully!");
    setTimeout(() => setSaving(false), 500);
  };

  if (authIsLoading) {
    return <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile Card */}
      <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              Email
            </label>
            <p className="text-[var(--text)]">{userData?.email || "N/A"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">
              Role
            </label>
            <Badge variant="secondary">Super Admin</Badge>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Preferences</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="platform-name" className="block text-sm font-medium text-[var(--muted)] mb-2">
              Platform Name
            </label>
            <input
              id="platform-name"
              type="text"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="base-url" className="block text-sm font-medium text-[var(--muted)] mb-2">
              Base Domain
            </label>
            <input
              id="base-url"
              type="text"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <p className="text-[var(--muted)] text-xs mt-1">
              Churches will be created as subdomain.{settings.baseUrl}
            </p>
          </div>
          <div>
            <label htmlFor="default-plan" className="block text-sm font-medium text-[var(--muted)] mb-2">
              Default Plan for New Churches
            </label>
            <select
              id="default-plan"
              value={settings.defaultPlan}
              onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value })}
              className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="Free">Free</option>
              <option value="Standard">Standard</option>
              <option value="Pro">Pro</option>
            </select>
          </div>
          <div className="pt-4">
            <h4 className="text-md font-medium text-[var(--text-strong)] mb-3">Platform Status</h4>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2" 
                style={{ backgroundColor: settings.maintenanceMode ? 'var(--accent)' : 'var(--border)' }}>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only"
                />
                <span
                  className="translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  style={{ transform: settings.maintenanceMode ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </label>
              <span className="text-sm text-[var(--text)]">
                {settings.maintenanceMode ? "Platform is in maintenance mode" : "Platform is publicly accessible"}
              </span>
            </div>
            <p className="text-[var(--muted)] text-xs mt-2">
              When enabled, the public site will show a maintenance message.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card bg-[var(--panel)] border border-[var(--danger)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--danger)] mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--text)] mb-2">
              Reset all demo data and seed fresh churches
            </p>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to reset all demo data? This action cannot be undone.")) {
                  toast.error("Reset demo data functionality not implemented");
                }
              }}
            >
              Reset Demo Data
            </Button>
          </div>
          <div>
            <p className="text-sm text-[var(--text)] mb-2">
              Export all data for backup
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast.info("Export data functionality not implemented")}
            >
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="primary" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
