"use client";

import { useState } from "react";
import Link from "next/link";
import PublicLayout from "../public-layout";
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Step = 1 | 2 | 3 | 4;
type Plan = "free" | "standard" | "pro";

interface FormData {
  churchName: string;
  country: string;
  city: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  plan: Plan;
  agreedToTerms: boolean;
}

const plans = [
  { id: "free" as Plan, name: "Free", price: "$0", description: "Perfect for small churches just getting started" },
  { id: "standard" as Plan, name: "Standard", price: "$9/mo", description: "Best for growing churches with more members" },
  { id: "pro" as Plan, name: "Pro", price: "$29/mo", description: "Advanced features for large church communities" },
];

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    churchName: "",
    country: "",
    city: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    plan: "standard",
    agreedToTerms: false,
  });

  const slug = form.churchName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const isStep1Valid = form.churchName.trim().length > 0;
  const isStep2Valid =
    form.fullName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;
  const isStep3Valid = true;
  const isStep4Valid = form.agreedToTerms;

  const canProceed = () => {
    switch (step) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      case 4:
        return isStep4Valid;
    }
  };

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (canProceed() && step < 4) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const handleSubmit = () => {
    if (isStep4Valid) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-10 pb-8">
              <div
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: "var(--good-soft)" }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: "var(--good)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-strong mb-2">
                Your church site is being provisioning
              </h2>
              {slug && (
                <p className="text-accent font-mono mb-2">{slug}.churchnepal.com</p>
              )}
              <p className="text-sm text-muted mb-8">
                Login details will be emailed to{" "}
                <span className="text-text">{form.email}</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/admin">
                  <Button className="w-full sm:w-auto">Go to admin</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Back to home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen py-10 px-4">
        <div className="max-w-[var(--max)] mx-auto">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <p className="text-sm text-muted mb-3">Step {step} of 4</p>
              <div className="w-full bg-panel-2 rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 1 && "Your church"}
                  {step === 2 && "Admin account"}
                  {step === 3 && "Choose a plan"}
                  {step === 4 && "Review"}
                </CardTitle>
                <CardDescription>
                  {step === 1 && "Let's start with the basics about your church."}
                  {step === 2 && "Create the admin account for your church."}
                  {step === 3 && "Select the plan that best fits your church."}
                  {step === 4 && "Review your information before creating your church."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {step === 1 && (
                  <>
                    <div>
                      <label htmlFor="churchName" className="block text-sm font-medium text-text mb-1.5">
                        Church name
                      </label>
                      <input
                        id="churchName"
                        type="text"
                        value={form.churchName}
                        onChange={(e) => update("churchName", e.target.value)}
                        className="w-full rounded-lg border border-border bg-panel px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Grace Community Church"
                      />
                    </div>
                    {slug && (
                      <p className="text-sm text-muted">
                        <span className="text-accent font-mono">{slug}.churchnepal.com</span>
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-text mb-1.5">
                          Country (optional)
                        </label>
                        <input
                          id="country"
                          type="text"
                          value={form.country}
                          onChange={(e) => update("country", e.target.value)}
                          className="w-full rounded-lg border border-border bg-panel px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="Nepal"
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-text mb-1.5">
                          City (optional)
                        </label>
                        <input
                          id="city"
                          type="text"
                          value={form.city}
                          onChange={(e) => update("city", e.target.value)}
                          className="w-full rounded-lg border border-border bg-panel px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="Kathmandu"
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-text mb-1.5">
                        Full name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                        className="w-full rounded-lg border border-border bg-panel px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className={`w-full rounded-lg border bg-panel px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                          form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                            ? "border-[var(--danger)]"
                            : "border-border"
                        }`}
                        placeholder="john@example.com"
                      />
                      {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                        <p className="text-sm mt-1" style={{ color: "var(--danger)" }}>
                          Please enter a valid email address.
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        className="w-full rounded-lg border border-border bg-panel px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-1.5">
                        Confirm password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                        className={`w-full rounded-lg border bg-panel px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                          form.confirmPassword && form.password !== form.confirmPassword
                            ? "border-[var(--danger)]"
                            : "border-border"
                        }`}
                        placeholder="••••••••"
                      />
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <p className="text-sm mt-1" style={{ color: "var(--danger)" }}>
                          Passwords do not match.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <div className="grid gap-4">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => update("plan", plan.id)}
                        className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                          form.plan === plan.id
                            ? "border-accent"
                            : "border-border hover:border-accent/50"
                        }`}
                        style={form.plan === plan.id ? { backgroundColor: "var(--accent-soft)" } : { backgroundColor: "var(--panel)" }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-text-strong">{plan.name}</p>
                            <p className="text-sm text-muted">{plan.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-text-strong">{plan.price}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted mb-1">Church</p>
                        <p className="font-medium text-text-strong">{form.churchName}</p>
                        {slug && (
                          <p className="text-sm text-accent font-mono">{slug}.churchnepal.com</p>
                        )}
                        {(form.country || form.city) && (
                          <p className="text-sm text-muted">
                            {[form.country, form.city].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted mb-1">Admin</p>
                        <p className="font-medium text-text-strong">{form.fullName}</p>
                        <p className="text-sm text-muted">{form.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted mb-1">Plan</p>
                        <Badge variant="secondary">
                          {plans.find((p) => p.id === form.plan)?.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={form.agreedToTerms}
                        onChange={(e) => update("agreedToTerms", e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-border bg-panel accent-accent"
                      />
                      <label htmlFor="terms" className="text-sm text-muted">
                        I agree to the{" "}
                        <a href="#" className="text-accent hover:underline">
                          Terms
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-accent hover:underline">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between pt-6">
                <div>
                  {step > 1 && (
                    <Button variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                  )}
                </div>
                <div>
                  {step < 4 ? (
                    <Button onClick={handleNext} disabled={!canProceed()}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={!isStep4Valid}>
                      Create my church
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
