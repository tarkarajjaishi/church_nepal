"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/error-state";
import { useLogin, useMe } from "@/components/hooks";
import { setAuthToken } from "@/lib/api-client";
import Logo from "@/components/logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("owner@churchnepal.com");
  const [password, setPassword] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [twofaRequired, setTwofaRequired] = useState(false);

  // Initialize token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("control_token");
    const refreshToken = localStorage.getItem("control_refresh_token");
    if (token) {
      setAuthToken(token, refreshToken);
    }
    setReady(true);
  }, []);

  // Check if already authenticated
  const { data: meData, isLoading: checkingAuth } = useMe();

  useEffect(() => {
    if (ready && meData && !checkingAuth) {
      router.replace("/admin");
    }
  }, [ready, meData, checkingAuth, router]);

  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ email, password, code: twofaRequired ? twofaCode : undefined });
  };

  // Handle successful login
  useEffect(() => {
    if (loginMutation.isSuccess) {
      if (loginMutation.data?.token) {
        router.replace("/admin");
      } else if (loginMutation.data?.twofa_required) {
        setTwofaRequired(true);
      }
    }
  }, [loginMutation.isSuccess, loginMutation.data, router]);

  if (!ready || checkingAuth) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Link href="/" aria-label="Home"><Logo size={44} /></Link>
            <span className="text-2xl font-bold text-[var(--text-strong)]">ChurchNepal</span>
          </div>
          <LoadingState message="Checking authentication..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand/Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6" aria-label="Home">
            <Logo size={44} className="transition-transform group-hover:scale-105" />
            <span className="text-2xl font-bold text-[var(--text-strong)]">ChurchNepal</span>
          </Link>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Master Control Login</CardTitle>
            <CardDescription className="text-center">
              Sign in to access the admin dashboard
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Email Field */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-[var(--muted)] mb-2"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@churchnepal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMutation.isPending}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-[var(--muted)] mb-2"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email && password && (!twofaRequired || twofaCode)) {
                      handleSubmit(e);
                    }
                  }}
                  disabled={loginMutation.isPending}
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* 2FA Code Field */}
              {twofaRequired && (
                <div>
                  <label 
                    htmlFor="twofa" 
                    className="block text-sm font-medium text-[var(--muted)] mb-2"
                  >
                    Two-Factor Code
                  </label>
                  <Input
                    id="twofa"
                    type="text"
                    placeholder="Enter your 2FA code"
                    value={twofaCode}
                    onChange={(e) => setTwofaCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && email && password && twofaCode) {
                        handleSubmit(e);
                      }
                    }}
                    disabled={loginMutation.isPending}
                    required
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              )}

              {/* Error State */}
              {loginMutation.error && (
                <InlineError 
                  message={loginMutation.error.message || "Login failed. Please check your credentials."} 
                  className="mt-2"
                />
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="w-full"
                disabled={loginMutation.isPending || !email || !password || (twofaRequired && !twofaCode)}
              >
                {loginMutation.isPending ? "Signing in..." : twofaRequired ? "Verify & Sign in" : "Sign in to Master Control"}
              </Button>

              <div className="text-center space-y-2 mt-2">
                <p className="text-xs text-[var(--muted)]">
                  Secure admin access — managed via ChurchNepal Control Plane
                </p>
                <Link 
                  href="/" 
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  ← Back to homepage
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
