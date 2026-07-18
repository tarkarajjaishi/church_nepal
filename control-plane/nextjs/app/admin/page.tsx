"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_CONTROL_API || "http://localhost:3100/api";

type Church = {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  admin_email: string;
  status: string;
  created_at?: string;
};

type NewChurch = {
  slug: string;
  subdomain: string;
  url: string;
  admin_email: string;
  admin_password: string;
};

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("control_token"));
    setReady(true);
  }, []);

  const onLogin = (t: string) => {
    localStorage.setItem("control_token", t);
    setToken(t);
  };
  const onLogout = () => {
    localStorage.removeItem("control_token");
    setToken(null);
  };

  if (!ready) return null;

  return (
    <div className="wrap">
      <div className="brand">
        <Link href="/" className="dot" aria-label="Home" />
        <h1>ChurchNepal — Master Control</h1>
      </div>
      <p className="sub">Create and manage church websites · one subdomain, database &amp; storage per church</p>
      {token ? <Dashboard token={token} onLogout={onLogout} onExpired={onLogout} /> : <Login onLogin={onLogin} />}
    </div>
  );
}

function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const [email, setEmail] = useState("owner@churchnepal.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLogin(data.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center">
      <div className="card login">
        <h2 style={{ marginTop: 0 }}>Owner sign in</h2>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <div style={{ marginTop: 18 }}>
          <button onClick={submit} disabled={busy} style={{ width: "100%" }}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

function Dashboard({
  token,
  onLogout,
  onExpired,
}: {
  token: string;
  onLogout: () => void;
  onExpired: () => void;
}) {
  const [churches, setChurches] = useState<Church[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<NewChurch | null>(null);

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token]
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/churches`, { headers: authHeaders() });
      if (res.status === 401) return onExpired();
      const data = await res.json();
      setChurches(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not reach the control API. Is the backend running on :3100?");
    }
  }, [authHeaders, onExpired]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/churches`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create church");
      setCreated(data as NewChurch);
      setName("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create church");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Church) => {
    if (!confirm(`Delete "${c.name}"? This drops its database and storage permanently.`)) return;
    try {
      const res = await fetch(`${API}/churches/${c.id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Delete failed");
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const localUrl = (slug: string) => `http://${slug}.localhost:3005`;

  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="toolbar">
          <h2>Add a church</h2>
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </div>
        <div className="row">
          <div>
            <label>Church name</label>
            <input
              placeholder="e.g. Grace Church Kathmandu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </div>
          <button onClick={create} disabled={busy}>{busy ? "Provisioning…" : "Create church"}</button>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Creates a subdomain, a dedicated Postgres database, a storage folder, and an auto-generated admin login.
        </p>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="card">
        <div className="toolbar">
          <h2>Churches ({churches.length})</h2>
        </div>
        {churches.length === 0 ? (
          <div className="empty">No churches yet. Add your first one above.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Local link</th>
                <th>Admin</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {churches.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    <a className="link" href={localUrl(c.slug)} target="_blank" rel="noreferrer">
                      {c.slug}.localhost:3005
                    </a>
                  </td>
                  <td className="muted">{c.admin_email}</td>
                  <td><span className="badge">{c.status}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <button className="danger" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {created && <CredentialsModal data={created} onClose={() => setCreated(null)} />}
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
