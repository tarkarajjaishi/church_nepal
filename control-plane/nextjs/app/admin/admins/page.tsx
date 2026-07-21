"use client";

import { useState } from "react";
import { useControlAdmins, useCreateControlAdmin, useDeleteControlAdmin } from "@/components/hooks";
import { LoadingState, EmptyState, ErrorState, useConfirmDialog } from "@/components";
import { Badge } from "@/components/ui/badge";

export default function AdminsPage() {
  const { data: admins, isLoading, error, refetch } = useControlAdmins();
  const createAdminMutation = useCreateControlAdmin();
  const deleteAdminMutation = useDeleteControlAdmin();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("admin");

  const handleAddAdmin = () => {
    if (!email.trim() || !name.trim()) return;
    createAdminMutation.mutate(
      { email: email.trim(), name: name.trim(), role },
      {
        onSuccess: () => {
          setShowAddForm(false);
          setEmail("");
          setName("");
          refetch();
        },
      }
    );
  };

  const handleDelete = (admin: { id: string; email: string; name: string }) => {
    confirm({
      title: "Remove admin?",
      description: `This will remove ${admin.name}'s admin access. They will no longer be able to access the control plane.`,
      confirmLabel: "Remove",
      variant: "destructive",
      onConfirm: () => deleteAdminMutation.mutate(admin.id),
    });
  };

  if (isLoading) {
    return <LoadingState message="Loading admins..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load admins"
        description={error.message}
        retry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Admin Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-strong)]">Add Admin User</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-ghost"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Invite Admin
          </button>
        </div>

        {showAddForm && (
          <div className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-[var(--muted)] mb-2">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="admin-name" className="block text-sm font-medium text-[var(--muted)] mb-2">
                Name
              </label>
              <input
                id="admin-name"
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddAdmin} disabled={createAdminMutation.isPending}>
                {createAdminMutation.isPending ? "Inviting..." : "Send Invite"}
              </button>
              <button onClick={() => setShowAddForm(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admins Table */}
      <div className="card">
        <div className="toolbar mb-4">
          <h2>Control Plane Admins ({admins?.length || 0})</h2>
        </div>
        
        {admins && admins.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{admin.name}</div>
                  </td>
                  <td className="muted">{admin.email}</td>
                  <td>
                    <Badge variant="outline" className="capitalize">
                      {admin.role}
                    </Badge>
                  </td>
                  <td className="muted">
                    {admin.last_login_at ? new Date(admin.last_login_at).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-destructive"
                      onClick={() => handleDelete(admin)}
                      disabled={deleteAdminMutation.isPending}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon="user"
            title="No admins yet"
            description="Invite your first control plane admin user above."
          />
        )}
      </div>

      <ConfirmDialog />
    </div>
  );
}