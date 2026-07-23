"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMe } from "@/components/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

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

export default function SettingsPage() {
  const { data: userData, isLoading: authIsLoading } = useMe();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [saving, setSaving] = useState<string | null>(null);

  const [profile, setProfile] = useState({ displayName: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [twoFactor, setTwoFactor] = useState<{
    enabled: boolean;
    enrolling: boolean;
    secret: string;
    otpauthUrl: string;
    qrBase64: string;
    verifyCode: string;
    disableCode: string;
  }>({
    enabled: false,
    enrolling: false,
    secret: "",
    otpauthUrl: "",
    qrBase64: "",
    verifyCode: "",
    disableCode: "",
  });
  const [settings, setSettings] = useState(defaultSettings);
  const [smtp, setSmtp] = useState({ host: "", port: "", username: "", from: "" });
  const [apiKeys, setApiKeys] = useState<Array<{
    id: string;
    name: string;
    masked_key: string;
    scopes: string[];
    revoked_at?: string;
    created_at: string;
  }>>([]);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  useEffect(() => {
    if (userData) {
      setProfile({ displayName: userData.email.split("@")[0] || "", email: userData.email });
      setTwoFactor((prev) => ({ ...prev, enabled: !!userData.twofa_enabled }));
      loadSettings();
      loadApiKeys();
    }
  }, [userData]);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get("/api/settings");
      const data = response.data as Record<string, unknown>;
      setSettings((prev) => ({
        platformName: (data.platformName as string) || prev.platformName,
        baseUrl: (data.baseUrl as string) || prev.baseUrl,
        defaultPlan: (data.defaultPlan as string) || prev.defaultPlan,
        maintenanceMode: (data.maintenanceMode as boolean) ?? prev.maintenanceMode,
      }));
    } catch {
      toast.error("Failed to load settings");
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await apiClient.get("/api/api-keys");
      setApiKeys(response.data as typeof apiKeys);
    } catch {
      toast.error("Failed to load API keys");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const saveProfile = () => {
    setSaving("profile");
    setTimeout(() => {
      setSaving(null);
      toast.success("Profile updated");
    }, 400);
  };

  const saveSecurity = async () => {
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
    try {
      await apiClient.post("/api/auth/reset-authenticated", {
        current_password: passwords.current,
        new_password: passwords.newPass,
      });
      setPasswords({ current: "", newPass: "", confirm: "" });
      toast.success("Security settings updated");
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to update password";
      toast.error(msg);
    } finally {
      setSaving(null);
    }
  };

  const startEnroll2FA = async () => {
    try {
      const response = await apiClient.post("/api/auth/2fa/enroll");
      const data = response.data;
      setTwoFactor((prev) => ({
        ...prev,
        enrolling: true,
        secret: data.secret,
        otpauthUrl: data.otpauth_url,
        qrBase64: data.qr_base64,
        verifyCode: "",
      }));
    } catch {
      toast.error("Failed to start 2FA enrollment");
    }
  };

  const verify2FA = async () => {
    if (!twoFactor.verifyCode.trim()) {
      toast.error("Please enter the verification code");
      return;
    }
    try {
      await apiClient.post("/api/auth/2fa/verify", { code: twoFactor.verifyCode });
      setTwoFactor((prev) => ({ ...prev, enabled: true, enrolling: false }));
      toast.success("Two-factor authentication enabled");
    } catch {
      toast.error("Invalid verification code");
    }
  };

  const disable2FA = async () => {
    if (!twoFactor.disableCode.trim()) {
      toast.error("Please enter the verification code");
      return;
    }
    try {
      await apiClient.post("/api/auth/2fa/disable", { code: twoFactor.disableCode });
      setTwoFactor((prev) => ({ ...prev, enabled: false, secret: "", otpauthUrl: "", qrBase64: "", disableCode: "" }));
      toast.success("Two-factor authentication disabled");
    } catch {
      toast.error("Invalid verification code");
    }
  };

  const saveOrganization = async () => {
    setSaving("organization");
    try {
      await apiClient.put("/api/settings", {
        platformName: settings.platformName,
        baseUrl: settings.baseUrl,
        defaultPlan: settings.defaultPlan,
        maintenanceMode: settings.maintenanceMode,
      });
      toast.success("Organization settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(null);
    }
  };

  const sendTestEmail = () => {
    toast.info("Test email sent (simulated)");
  };

  const generateApiKey = async () => {
    try {
      const response = await apiClient.post("/api/api-keys", {
        name: `API Key ${new Date().toLocaleString()}`,
        scopes: [],
      });
      const data = response.data;
      setNewKeySecret(data.full_key);
      setApiKeys((prev) => [
        {
          id: data.id,
          name: data.name,
          masked_key: data.masked_key,
          scopes: data.scopes,
          created_at: data.created_at,
        },
        ...prev,
      ]);
      toast.success("New API key generated");
    } catch {
      toast.error("Failed to generate API key");
    }
  };

  const revokeApiKey = async (id: string) => {
    try {
      await apiClient.delete(`/api/api-keys/${id}`);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key revoked");
    } catch {
      toast.error("Failed to revoke API key");
    }
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
                      passwords.newPass && passwords.newPass.length > 0 && passwords.newPass.length < 8 ? "border-[var(--danger)]" : "border-[var(--border)]"
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
                      passwords.confirm && passwords.confirm.length > 0 && passwords.confirm !== passwords.newPass ? "border-[var(--danger)]" : "border-[var(--border)]"
                    )}
                  />
                  {passwords.confirm && passwords.confirm.length > 0 && passwords.confirm !== passwords.newPass && (
                    <p className="text-xs text-[var(--danger)] mt-1">Passwords do not match</p>
                  )}
                </div>
                <div className="pt-2">
                  <Button variant="primary" onClick={saveSecurity} disabled={saving === "security"}>
                    {saving === "security" ? "Saving..." : "Update Password"}
                  </Button>
                </div>
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between max-w-md">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">Two-factor authentication</p>
                      <p className="text-xs text-[var(--muted)]">
                        {twoFactor.enabled ? "Two-factor authentication is enabled" : "Add an extra layer of security to your account"}
                      </p>
                    </div>
                    <Badge variant={twoFactor.enabled ? "success" : "outline"}>
                      {twoFactor.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  {!twoFactor.enabled && !twoFactor.enrolling && (
                    <div className="pt-4">
                      <Button variant="outline" onClick={startEnroll2FA}>
                        Enable 2FA
                      </Button>
                    </div>
                  )}

                  {twoFactor.enrolling && (
                    <div className="pt-4 space-y-4">
                      <div className="p-4 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-2)] space-y-3">
                        <p className="text-sm font-medium text-[var(--text)]">Scan QR code with your authenticator app</p>
                        {twoFactor.qrBase64 && (
                          <img
                            src={`data:image/png;base64,${twoFactor.qrBase64}`}
                            alt="2FA QR Code"
                            className="w-40 h-40 rounded-md border border-[var(--border)]"
                          />
                        )}
                        <div>
                          <p className="text-xs text-[var(--muted)] mb-1">Or enter this secret manually:</p>
                          <code className="block text-xs text-[var(--text)] font-mono break-all bg-[var(--bg)] p-2 rounded border border-[var(--border-soft)]">
                            {twoFactor.secret}
                          </code>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--muted)] mb-2">Verification Code</label>
                          <input
                            type="text"
                            value={twoFactor.verifyCode}
                            onChange={(e) => setTwoFactor({ ...twoFactor, verifyCode: e.target.value })}
                            className="w-full max-w-xs px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            placeholder="Enter 6-digit code"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="primary" onClick={verify2FA}>
                            Verify & Enable
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setTwoFactor((prev) => ({ ...prev, enrolling: false, secret: "", otpauthUrl: "", qrBase64: "", verifyCode: "" }))
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {twoFactor.enabled && (
                    <div className="pt-4 space-y-3">
                      <p className="text-xs text-[var(--muted)]">Disabling 2FA will reduce your account security.</p>
                      <div>
                        <label className="block text-sm font-medium text-[var(--muted)] mb-2">Enter verification code to disable</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={twoFactor.disableCode}
                            onChange={(e) => setTwoFactor({ ...twoFactor, disableCode: e.target.value })}
                            className="flex-1 max-w-xs px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg,var(--bg))] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            placeholder="Enter 6-digit code"
                          />
                          <Button variant="destructive" onClick={disable2FA}>
                            Disable 2FA
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                <Button variant="primary" size="sm" onClick={generateApiKey}>
                  Generate new key
                </Button>
              </div>
              {newKeySecret && (
                <div className="p-4 rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)]">
                  <p className="text-sm font-medium text-[var(--accent)] mb-1">New API key (shown once)</p>
                  <code className="block text-xs text-[var(--text)] font-mono break-all bg-[var(--bg)] p-2 rounded border border-[var(--border-soft)]">
                    {newKeySecret}
                  </code>
                </div>
              )}
              <div className="space-y-3">
                {apiKeys.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">No API keys configured.</p>
                )}
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-2)]"
                  >
                    <div className="flex-1 min-w-0">
                      <code className="block text-sm text-[var(--text)] font-mono break-all">
                        {k.masked_key}
                      </code>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{k.created_at}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(k.masked_key)}>
                      Copy
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => revokeApiKey(k.id)}>
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
