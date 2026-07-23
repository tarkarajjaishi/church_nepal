"use client";

import { useState, useEffect } from "react";
import { useMe, useControlAdmins } from "@/components/hooks";
import { LoadingState, EmptyState, ErrorState } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { ControlAdmin } from "@/types";

type AdminRoleOption = "super_admin" | "admin" | "read_only";

type LocalAdmin = Omit<ControlAdmin, "role"> & { role: AdminRoleOption; status: "active" | "pending"; last_active: string };

const SAMPLE_ADMINS: LocalAdmin[] = [
  {
    id: "1",
    email: "sarah@church.org",
    name: "Sarah Johnson",
    role: "super_admin",
    status: "active",
    last_active: "2 minutes ago",
  },
  {
    id: "2",
    email: "mike@church.org",
    name: "Mike Chen",
    role: "admin",
    status: "active",
    last_active: "1 hour ago",
  },
  {
    id: "3",
    email: "emma@church.org",
    name: "Emma Wilson",
    role: "read_only",
    status: "pending",
    last_active: "Not yet active",
  },
];

const ROLE_LABELS: Record<AdminRoleOption, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  read_only: "Read-only",
};

const ROLE_VARIANTS: Record<AdminRoleOption, "default" | "outline" | "secondary"> = {
  super_admin: "default",
  admin: "outline",
  read_only: "secondary",
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const formatLastActive = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

export default function AdminsPage() {
  const { data: currentUser, isLoading: userLoading, error: userError } = useMe();
  const { data: adminsData, isLoading: adminsLoading, error: adminsError } = useControlAdmins();

  const [admins, setAdmins] = useState<LocalAdmin[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRoleOption>("admin");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (adminsData && adminsData.length > 0) {
      const mapped: LocalAdmin[] = adminsData.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        role: a.role === "owner" ? "super_admin" : a.role === "viewer" ? "read_only" : a.role === "admin" ? "admin" : "admin",
        status: a.last_login_at ? "active" : "pending",
        last_active: a.last_login_at ? formatLastActive(a.last_login_at) : "Not yet active",
        created_at: a.created_at,
      }));
      setAdmins(mapped);
    }
  }, [adminsData]);

  const handleInvite = () => {
    setEmailError("");
    if (!inviteEmail.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(inviteEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (admins.some((a) => a.email.toLowerCase() === inviteEmail.toLowerCase())) {
      setEmailError("This email is already on the list");
      return;
    }

    const name = inviteEmail.split("@")[0];
    const newAdmin: LocalAdmin = {
      id: `${Date.now()}`,
      email: inviteEmail.toLowerCase(),
      name,
      role: inviteRole,
      status: "pending",
      last_active: "Not yet active",
    };

    setAdmins([...admins, newAdmin]);
    setShowInviteModal(false);
    setInviteEmail("");
    setInviteRole("admin");
    toast.success("Invite sent successfully");
  };

  const handleRoleChange = (id: string, newRole: AdminRoleOption) => {
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, role: newRole } : a)));
    toast.success(`Role updated to ${ROLE_LABELS[newRole]}`);
  };

  const handleRemove = (id: string) => {
    const admin = admins.find((a) => a.id === id);
    if (!admin) return;

    const superAdmins = admins.filter((a) => a.role === "super_admin");
    if (admin.role === "super_admin" && superAdmins.length <= 1) {
      toast.error("Cannot remove the last Super Admin");
      return;
    }

    if (window.confirm(`Remove ${admin.email} from the admin list?`)) {
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      toast.success(`${admin.email} removed`);
    }
  };

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.status === "active").length;
  const pendingAdmins = admins.filter((a) => a.status === "pending").length;

  const displayName = currentUser ? currentUser.email.split("@")[0] : "N/A";

  if (userLoading || adminsLoading) {
    return <LoadingState message="Loading admin information..." />;
  }

  if (userError) {
    return (
      <ErrorState
        title="Failed to load admin information"
        description={(userError as Error).message}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Current Admin</h3>

        {currentUser ? (
          <div className="space-y-3">
            <div>
              <span className="text-[var(--muted)] text-sm">Name</span>
              <p className="font-medium">{displayName}</p>
            </div>
            <div>
              <span className="text-[var(--muted)] text-sm">Email</span>
              <p className="font-medium">{currentUser.email}</p>
            </div>
            <div>
              <span className="text-[var(--muted)] text-sm">Role</span>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">
                  Super Admin
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="user"
            title="No admin session"
            description="You are not currently logged in as an admin."
          />
        )}
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-strong)]">Additional Admins</h3>
            <p className="text-[var(--muted)] text-sm mt-1">Manage control plane administrators</p>
          </div>
          <Button onClick={() => setShowInviteModal(true)} className="w-full sm:w-auto">
            Invite admin
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--text-strong)]">{totalAdmins}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide">Total</div>
          </div>
          <div className="bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--good)]">{activeAdmins}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide">Active</div>
          </div>
          <div className="bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--gold)]">{pendingAdmins}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide">Pending</div>
          </div>
        </div>

        {admins.length === 0 ? (
          <EmptyState
            icon="users"
            title="No admins"
            description="Get started by inviting your first admin."
          />
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-[var(--panel-2)] border border-[var(--border)] rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs font-semibold">{getInitials(admin.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-[var(--text-strong)] truncate">{admin.email}</div>
                    <div className="text-xs text-[var(--muted)]">{admin.last_active}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={admin.role}
                    onChange={(e) => handleRoleChange(admin.id, e.target.value as AdminRoleOption)}
                    style={{ width: "auto" }}
                    className="h-9 rounded-md border border-border bg-panel-2 px-2.5 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)]"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="read_only">Read-only</option>
                  </select>

                  <Badge variant={admin.status === "active" ? "default" : "warning"} className="capitalize">
                    {admin.status === "active" ? "Active" : "Pending"}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(admin.id)}
                    className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="relative w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-1">Invite Admin</h3>
              <p className="text-sm text-[var(--muted)] mb-5">Send an invitation to add a new administrator.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleInvite();
                    }}
                  />
                  {emailError && <div className="text-xs text-[var(--danger)] mt-1.5">{emailError}</div>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as AdminRoleOption)}
                    className="w-full h-10 rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)]"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="read_only">Read-only</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite}>Send invite</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
