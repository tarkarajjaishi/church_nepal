"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/error-state";
import { useLogin, useMe } from "@/components/hooks";
import Logo from "@/components/logo";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The admin layout's route guard appends ?returnTo=... when it bounces an
  // unauthenticated visitor, so sign-in resumes where they were going. Only
  // same-site admin paths are honoured, so the parameter cannot be used to
  // redirect someone to an external site after login.
  const returnToParam = searchParams.get("returnTo");
  const returnTo =
    returnToParam && returnToParam.startsWith("/admin") && !returnToParam.startsWith("//")
      ? returnToParam
      : "/admin";
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("owner@churchnepal.com");
  const [password, setPassword] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [twofaRequired, setTwofaRequired] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Token rehydration now happens once in lib/api-client.ts when the module
  // loads, so it applies to every route rather than just this page.
  useEffect(() => {
    setReady(true);
  }, []);

  // Check if already authenticated
  const { data: meData, isLoading: checkingAuth } = useMe();

  useEffect(() => {
    if (ready && meData && !checkingAuth) {
      router.replace(returnTo);
    }
  }, [ready, meData, checkingAuth, router, returnTo]);

  const loginMutation = useLogin();

  // Note there is deliberately no autofill-detection effect here. Polling the
  // DOM to copy an autofilled value into state would only be papering over a
  // dependency that no longer exists — handleSubmit reads the form directly, and
  // a real submit is always preceded by a user gesture, which is the point at
  // which Chrome commits a suggested value anyway.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // The form is the source of truth, not React state. State can be stale or
    // empty for exactly the fields a password manager just filled, and this is
    // the moment where being wrong means the person cannot sign in.
    const data = new FormData(e.currentTarget);
    const emailValue = String(data.get("email") ?? "").trim() || email.trim();
    const passwordValue = String(data.get("password") ?? "") || password;
    const codeValue = String(data.get("code") ?? "") || twofaCode;

    // Said out loud. This used to `return` silently, so a form that could not be
    // submitted looked identical to one the server had not answered yet.
    if (!emailValue || !passwordValue) {
      setFormError("Enter your email address and password.");
      return;
    }
    if (twofaRequired && !codeValue) {
      setFormError("Enter the six-digit code from your authenticator app.");
      return;
    }

    setFormError(null);
    loginMutation.mutate({
      email: emailValue,
      password: passwordValue,
      code: twofaRequired ? codeValue : undefined,
    });
  };

  // Handle successful login
  useEffect(() => {
    if (loginMutation.isSuccess) {
      if (loginMutation.data?.token) {
        router.replace(returnTo);
      } else if (loginMutation.data?.twofa_required) {
        setTwofaRequired(true);
      }
    }
  }, [loginMutation.isSuccess, loginMutation.data, router, returnTo]);

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
            {/* CardTitle renders an <h3>; the login page is a top-level page and
                needs an <h1> so the heading order starts correctly. */}
            <h1 className="font-semibold leading-none tracking-tight text-2xl text-center">
              Master Control Login
            </h1>
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
                  name="email"
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
                {/* No onKeyDown. It called handleSubmit only when React state
                    was already populated — the very condition autofill breaks —
                    and it passed a keyboard event where the handler expects the
                    form. Enter now submits the form natively, which works
                    because the button below is no longer disabled. */}
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    name="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter your 2FA code"
                    value={twofaCode}
                    onChange={(e) => setTwofaCode(e.target.value)}
                    disabled={loginMutation.isPending}
                    required
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
              )}

              {/* Error State */}
              {(formError || loginMutation.error) && (
                <InlineError
                  message={
                    formError ||
                    loginMutation.error?.message ||
                    "Login failed. Please check your credentials."
                  }
                  className="mt-2"
                />
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              {/* Disabled only while a request is in flight, which is the one
                  thing that genuinely must not be repeated.

                  It used to also disable on !email || !password, read from React
                  state. A password manager fills the DOM without React hearing
                  about it, so the button disabled itself over a form the person
                  could see was complete — and `disabled:pointer-events-none`
                  meant the click dispatched no event at all, to anything. No
                  request, no error, nothing to notice. Empty credentials are
                  refused in handleSubmit now, out loud, where refusing can say
                  why. */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loginMutation.isPending}
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

// useSearchParams (for ?returnTo=) opts this route into client-side rendering,
// which Next requires a Suspense boundary around or prerendering fails.
export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
          <LoadingState message="Loading…" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
