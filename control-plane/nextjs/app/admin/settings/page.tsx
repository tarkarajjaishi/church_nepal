"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMe } from "@/components/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "organization", label: "Organization" },
  { id: "email", label: "Email" },
  { id: "api-keys", label: "API Keys" },
  { id: "danger-zone", label: "Danger Zone" },
] as const;

const defaultSettings = {
  platformName: "ChurchNepal",
  baseUrl: "churchnepal.com",
  defaultPlan: "Free" as "Free" | "Standard" | "Pro",
  maintenanceMode: false,
};

const initialApiKeys = [
  { id: "1", key: "cn_live_abcdefgh1234", created: "2025-01-15" },
  { id: "2", key: "cn_live_wxyz9876abcd", created: "2025-03-22" },
];

export default function SettingsPage() {
  const { data: userData, isLoading: authIsLoading } = useMe();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [saving, setSaving] = useState<string | null>(null);

  const [profile, setProfile] = useState({ displayName: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [twoFactor, setTwoFactor] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [smtp, setSmtp] = useState({ host: "", port: "", username: "", from: "" });
  const [apiKeys, setApiKeys] = useState(initialApiKeys as typeof initialApiKeys);

  useEffect(() => {
    if (userData) {
      setProfile({ displayName: userData.email.split("@")[0] || "", email: userData.email });
    }
  }, [userData]);

  const maskKey = (key: string) => {
    if (key.length <= 12) return "••••" + key.slice(-4);
    return key.slice(0, 8) + "••••" + key.slice(-4);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const revokeKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API key revoked");
  };

  const generateKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const rand = () => Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const newKey: typeof initialApiKeys[0] = {
      id: Date.now().toString(),
      key: "cn_live_" + rand(),
      created: new Date().toISOString().split("T")[0],
    };
    setApiKeys((prev) => [newKey, ...prev]);
    toast.success("New API key generated");
  };

  const saveProfile = () => {
    setSaving("profile");
    setTimeout(() => {
      setSaving(null);
      toast.success("Profile updated");
    }, 400);
  };

  const saveSecurity = () => {
    setSaving("security");
    if (passwords.newPass !== passwords.confirm) {
      toast.error("New passwords do not match");
      setSaving(null);
      return;
    }
    if (passwords.newPass.length > 0 && passwords.newPass.length < 8) {
      toast.error("Password must be at least 8 characters");
      setSaving(null);
      return;
    }
    if (!passwords.current) {
      toast.error("Current password is required");
      setSaving(null);
      return;
    }
    setTimeout(() => {
      setPasswords({ current: "", newPass: "", confirm: "" });
      setSaving(null);
      toast.success("Security settings updated");
    }, 400);
  };

  const saveOrganization = () => {
    setSaving("organization");
    setTimeout(() => {
      setSaving(null);
      toast.success("Organization settings saved");
    }, 400);
  };

  const sendTestEmail = () => {
    toast.info("Test email sent (simulated)");
  };

  const resetPlatformData = () => {
    if (window.confirm("Are you sure you want to reset all platform data? This action cannot be undone.")) {
      toast.success("Platform data reset initiated");
    }
  };

  if (authIsLoading) {
    return (
      <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">Loading...</div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Rail Tabs */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap lg:w-full text-left",
                  activeTab === tab.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg-2)]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Panels */}
        <div className="flex-1 min-w-0">
          {/* Profile */}
          {activeTab === "profile" && (
            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-5">
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">Profile</h3>
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full max-w-md px-3 py-2 border border-[var(--border-soft)] rounded-md bg-[var(--bg-2)] text-[var(--muted)] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">Display Name</label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">Role</label>
                  <Badge variant="secondary">Super Admin</Badge>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="primary" onClick={saveProfile} disabled={saving === "profile"}>
                  {saving === "profile" ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-5">
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">Security</h3>
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    className={cn(
                      "w-full max-w-md px-3 py-2 border rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                      passwords.newPass && passwords.newPass.length < 8 ? "border-[var(--danger)]" : "border-[var(--border)]"
                    )}
                  />
                  {passwords.newPass && passwords.newPass.length > 0 && passwords.newPass.length < 8 && (
                    <p className="text-xs text-[var(--danger)] mt-1">Password must be at least 8 characters</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className={cn(
                      "w-full max-w-md px-3 py-2 border rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                      passwords.confirm && passwords.confirm !== passwords.newPass ? "border-[var(--danger)]" : "border-[var(--border)]"
                    )}
                  />
                  {passwords.confirm && passwords.confirm !== passwords.newPass && (
                    <p className="text-xs text-[var(--danger)] mt-1">Passwords do not match</p>
                  )}
                </div>
                <div className="flex items-center justify-between max-w-md pt-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">Two-factor authentication</p>
                    <p className="text-xs text-[var(--muted)]">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={twoFactor}
                    onClick={() => setTwoFactor((prev) => !prev)}
                    className={cn(
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                      twoFactor ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        twoFactor ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="primary" onClick={saveSecurity} disabled={saving === "security"}>
                  {saving === "security" ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}

          {/* Organization */}
          {activeTab === "organization" && (
            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-5">
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">Organization</h3>
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">Platform Name</label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">Base URL</label>
                  <input
                    type="text"
                    value={settings.baseUrl}
                    onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">Churches will use this as their base domain.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">Default Plan</label>
                  <select
                    value={settings.defaultPlan}
                    onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value as typeof settings.defaultPlan })}
                    className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <option value="Free">Free</option>
                    <option value="Standard">Standard</option>
                    <option value="Pro">Pro</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">Maintenance Mode</p>
                    <p className="text-xs text-[var(--muted)]">
                      {settings.maintenanceMode ? "Platform is in maintenance mode" : "Platform is publicly accessible"}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={settings.maintenanceMode}
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                    className={cn(
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                      settings.maintenanceMode ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        settings.maintenanceMode ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="primary" onClick={saveOrganization} disabled={saving === "organization"}>
                  {saving === "organization" ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}

          {/* Email */}
          {activeTab === "email" && (
            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-5">
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">Email</h3>
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={smtp.host}
                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">SMTP Port</label>
                  <input
                    type="text"
                    value={smtp.port}
                    onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">Username</label>
                  <input
                    type="text"
                    value={smtp.username}
                    onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-2">From Address</label>
                  <input
                    type="email"
                    value={smtp.from}
                    onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
                    className="w-full max-w-md px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <Button variant="outline" onClick={sendTestEmail}>
                  Send Test Email
                </Button>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeTab === "api-keys" && (
            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-strong)]">API Keys</h3>
                <Button variant="primary" size="sm" onClick={generateKey}>
                  Generate new key
                </Button>
              </div>
              <div className="space-y-3">
                {apiKeys.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">No API keys configured.</p>
                )}
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-2)]"
                  >
                    <code className="flex-1 text-sm text-[var(--text)] font-mono break-all">
                      {maskKey(k.key)}
                    </code>
                    <span className="text-xs text-[var(--muted)]">{k.created}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(k.key)}>
                      Copy
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => revokeKey(k.id)}>
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === "danger-zone" && (
            <div className="card bg-[var(--panel)] border-[var(--danger)] rounded-xl p-5 space-y-5">
              <h3 className="text-lg font-semibold text-[var(--danger)]">Danger Zone</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--text)] mb-2">
                    Reset all platform data. This action is destructive and cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={resetPlatformData}>
                    Reset platform data
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
