"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useChurches, useCreateChurch, useDeleteChurch, useSeedDummyChurches, useLogin, useMe } from "@/components/hooks";
import { setAuthToken, getAuthToken } from "@/lib/api-client";
import { LoadingState, EmptyState, ErrorState, InlineError, useConfirmDialog } from "@/components";
import type { Church, NewChurch } from "@/types";

export default function AdminPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize token from localStorage on mount
    const token = localStorage.getItem("control_token");
    if (token) {
      setAuthToken(token);
    }
    setReady(true);
  }, []);

  // Check auth status using the useMe hook
  const { data: meData, isLoading: checkingAuth } = useMe();

  if (!ready || checkingAuth) {
    return (
      <div className="wrap">
        <div className="brand">
          <Link href="/" className="dot" aria-label="Home" />
          <h1>ChurchNepal — Master Control</h1>
        </div>
        <LoadingState message="Checking authentication..." />
      </div>
    );
  }

  const isLoggedIn = !!meData;

  const handleLogin = (token: string) => {
    setAuthToken(token);
    localStorage.setItem("control_token", token);
    window.location.reload();
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem("control_token");
    window.location.reload();
  };

  return (
    <div className="wrap">
      <div className="brand">
        <Link href="/" className="dot" aria-label="Home" />
        <h1>ChurchNepal — Master Control</h1>
      </div>
      <p className="sub">Create and manage church websites · one subdomain, database &amp; storage per church</p>
      {isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Login onLogin={handleLogin} />}
    </div>
  );
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("owner@churchnepal.com");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();

  const submit = () => {
    loginMutation.mutate({ email, password });
  };

  // Handle successful login
  useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data?.token) {
      onLogin(loginMutation.data.token);
    }
  }, [loginMutation.isSuccess, loginMutation.data?.token, onLogin]);

  return (
    <div className="center">
      <div className="card login">
        <h2 style={{ marginTop: 0 }}>Owner sign in</h2>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} disabled={loginMutation.isPending} />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          disabled={loginMutation.isPending}
        />
        <div style={{ marginTop: 18 }}>
          <button onClick={submit} disabled={loginMutation.isPending} style={{ width: "100%" }}>
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </div>
        {loginMutation.error && <InlineError message={loginMutation.error.message} className="mt-2" />}
      </div>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const churchesQuery = useChurches();
  const createChurchMutation = useCreateChurch();
  const deleteChurchMutation = useDeleteChurch();
  const seedDummyMutation = useSeedDummyChurches();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const churches = churchesQuery.data || [];
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [created, setCreated] = useState<NewChurch | null>(null);

  // Filter churches by search
  const filtered = churches.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const create = () => {
    if (!name.trim()) return;
    createChurchMutation.mutate(name.trim(), {
      onSuccess: (data) => {
        setCreated(data);
        setName("");
      },
    });
  };

  const remove = (c: Church) => {
    confirm({
      title: "Delete church?",
      description: `This will permanently delete "${c.name}", its database, and all data. This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => deleteChurchMutation.mutate(c.id),
    });
  };

  const seedDummy = () => {
    seedDummyMutation.mutate();
  };

  const localUrl = (slug: string) => `http://${slug}.localhost:3005`;

  // Get error state
  const error = deleteChurchMutation.error?.message || createChurchMutation.error?.message || seedDummyMutation.error?.message || churchesQuery.error?.message;

  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="toolbar">
          <h2>Add a church</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="ghost" onClick={seedDummy} disabled={seedDummyMutation.isPending}>
              {seedDummyMutation.isPending ? "Seeding…" : "Seed Demo Churches"}
            </button>
            <button className="ghost" onClick={onLogout}>Sign out</button>
          </div>
        </div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Church name</label>
            <input
              placeholder="e.g. Grace Church Kathmandu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </div>
          <button onClick={create} disabled={createChurchMutation.isPending}>{createChurchMutation.isPending ? "Provisioning…" : "Create church"}</button>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Creates a subdomain, a dedicated Postgres database, a storage folder, and an auto-generated admin login.
        </p>
        {error && <ErrorState title="Error" description={error} />}
      </div>

      {churches.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search churches…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, maxWidth: "300px" }}
            />
            <span className="muted" style={{ fontSize: "12px" }}>{filtered.length} of {churches.length} churches</span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="toolbar">
          <h2>Churches ({churches.length})</h2>
        </div>
        {churchesQuery.isLoading ? (
          <LoadingState message="Loading churches..." variant="skeleton" />
        ) : churchesQuery.error ? (
          <ErrorState 
            title="Failed to load churches" 
            description={churchesQuery.error.message}
            retry={() => churchesQuery.refetch()}
          />
        ) : churches.length === 0 ? (
          <EmptyState
            icon="church"
            title="No churches yet"
            description="Get started by creating a new church or seeding demo data."
            action={{
              label: seedDummyMutation.isPending ? "Seeding..." : "Seed 5 Demo Churches",
              onClick: seedDummy,
            }}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Members</th>
                <th>Giving</th>
                <th>Last Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div className="muted" style={{ fontSize: "11px" }}>{c.slug}.localhost:3005</div>
                  </td>
                  <td><span className="badge" style={{ 
                    background: c.plan === "Pro" ? "rgba(79,140,255,0.2)" : 
                              c.plan === "Standard" ? "rgba(47,191,107,0.15)" : "rgba(147,163,187,0.1)" 
                  }}>{c.plan || "—"}</span></td>
                  <td><span className="badge" style={{
                    background: c.status === "active" ? "rgba(47,191,107,0.15)" : "rgba(255,93,93,0.15)",
                    color: c.status === "active" ? "var(--good)" : "var(--danger)"
                  }}>{c.status}</span></td>
                  <td className="muted">{c.member_count ?? "—"}</td>
                  <td className="muted">Rs. {c.giving_total?.toLocaleString() ?? "—"}</td>
                  <td className="muted">{c.last_active_at ? new Date(c.last_active_at).toLocaleDateString() : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <a className="link" href={localUrl(c.slug)} target="_blank" rel="noreferrer" style={{ marginRight: "8px" }}>
                      Open
                    </a>
                    <button className="danger" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {created && <CredentialsModal data={created} onClose={() => setCreated(null)} />}
      <ConfirmDialog />
    </>
  );
}

function CredentialsModal({ data, onClose }: { data: NewChurch; onClose: () => void }) {
  const localUrl = `http://${data.slug}.localhost:3005`;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Church created ✅</h2>
        <p className="muted">Give these details to the church. The password is shown only once.</p>
        <div className="cred">
          <div className="k">Website (production)</div>
          <div className="v">{data.url}</div>
          <div className="k">Open now (local)</div>
          <div className="v"><a className="link" href={localUrl} target="_blank" rel="noreferrer">{localUrl}</a></div>
          <div className="k">Admin login (email)</div>
          <div className="v">{data.admin_email}</div>
          <div className="k">Admin password</div>
          <div className="v">{data.admin_password}</div>
        </div>
        <p className="warn">⚠ Save the password now — it cannot be shown again.</p>
        <div style={{ marginTop: 14, textAlign: "right" }}>
          <button onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}