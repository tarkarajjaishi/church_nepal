"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Default platform settings
const defaultSettings = {
  platformName: "ChurchNepal",
  baseUrl: "churchnepal.com",
  defaultPlan: "Free",
  maintenanceMode: false,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // In a real app, this would save to the backend
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Branding Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Platform Branding</h3>
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
              className="max-w-md"
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
              className="max-w-md"
            />
            <p className="muted text-xs mt-1">
              Churches will be created as subdomain.{settings.baseUrl}
            </p>
          </div>
        </div>
      </div>

      {/* Default Plan Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Default Settings</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="default-plan" className="block text-sm font-medium text-[var(--muted)] mb-2">
              Default Plan for New Churches
            </label>
            <select
              id="default-plan"
              value={settings.defaultPlan}
              onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value })}
              className="max-w-md"
            >
              <option value="Free">Free</option>
              <option value="Standard">Standard</option>
              <option value="Pro">Pro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Maintenance Mode</h3>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2" style={{ backgroundColor: settings.maintenanceMode ? 'var(--accent)' : 'var(--border)' }}>
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
        <p className="muted text-xs mt-2">
          When enabled, the public site will show a maintenance message.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="card border-2 border-[var(--danger)]">
        <h3 className="text-lg font-semibold text-[var(--danger)] mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--text)] mb-2">
              Reset all demo data and seed fresh churches
            </p>
            <button className="btn-destructive">
              Reset Demo Data
            </button>
          </div>
          <div>
            <p className="text-sm text-[var(--text)] mb-2">
              Export all data for backup
            </p>
            <button className="btn-outline">
              Export Data
            </button>
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