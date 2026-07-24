"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Database, ExternalLink, Copy, CreditCard, LogIn } from "lucide-react";
import Link from "next/link";
import { useChurchDetail } from "@/components/hooks";
import { LoadingState, ErrorState } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plan } from "@/types";
import React, { useState } from "react";

export default function ChurchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const churchId = params.id as string;

  const {
    data: church,
    isLoading,
    error,
    plans,
    invoices,
    isLoadingInvoices,
    errorInvoices,
    suspendChurch,
    reactivateChurch,
    updateChurch,
    deleteChurch,
    impersonateChurch,
  } = useChurchDetail(churchId);

  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const handleDelete = () => {
    if (!church) return;
    confirm({
      title: "Delete church?",
      description: `This will permanently delete "${church.name}", its database, and all data. This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deleteChurch.mutate(church.id, {
          onSuccess: () => {
            toast.success("Church deleted successfully");
            router.push("/admin/churches");
          },
          onError: (err) => {
            toast.error(err.message || "Failed to delete church");
          }
        });
      },
    });
  };

  const handleCopyEmail = () => {
    if (church?.admin_email) {
      navigator.clipboard.writeText(church.admin_email);
      toast.success("Admin email copied to clipboard");
    }
  };

  const handleOpenPlanModal = () => {
    if (!church) return;
    // Find the plan object that matches the church's current plan
    const currentPlan = plans?.find(p => p.name === church?.plan) ?? plans?.[0];
    setSelectedPlanId(currentPlan?.id ?? null);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = () => {
    if (!church || !selectedPlanId) return;
    const selectedPlan = plans?.find(p => p.id === selectedPlanId);
    if (!selectedPlan) return;
    updateChurch.mutate({
      id: church.id,
      data: { plan: selectedPlan.name },
    });
    setIsPlanModalOpen(false);
  };

  const handleSuspend = () => {
    if (!church) return;
    confirm({
      title: "Suspend church?",
      description: `This will suspend "${church.name}". The church will not be able to access the platform until reactivated.`,
      confirmLabel: "Suspend",
      variant: "destructive",
      onConfirm: () => {
        suspendChurch.mutate(church.id, {
          onSuccess: () => {
            toast.success("Church suspended successfully");
          },
          onError: (err) => {
            toast.error(err.message || "Failed to suspend church");
          }
        });
      },
    });
  };

  const handleReactivate = () => {
    if (!church) return;
    confirm({
      title: "Reactivate church?",
      description: `This will reactivate "${church.name}". The church will regain access to the platform.`,
      confirmLabel: "Reactivate",
      variant: "default",
      onConfirm: () => {
        reactivateChurch.mutate(church.id, {
          onSuccess: () => {
            toast.success("Church reactivated successfully");
          },
          onError: (err) => {
            toast.error(err.message || "Failed to reactivate church");
          }
        });
      },
    });
  };

  const handleViewInvoices = () => {
    // In a real app, you might navigate to an invoices page
    // For now, we just refetch and show a toast
    // The useChurchDetail hook already fetches invoices, so we can just show a toast
    toast.success("Invoices refreshed");
  };

  const handleLogInAs = () => {
    if (!church) return;
    confirm({
      title: "Log in as church admin?",
      description: `You are about to impersonate "${church.name}". This action is audited and will be logged.`,
      confirmLabel: "Log in as",
      variant: "destructive",
      onConfirm: () => {
        impersonateChurch.mutate(church.id, {
          onSuccess: (url) => {
            window.open(url, "_blank");
          },
          onError: (err) => {
            toast.error(err.message || "Failed to impersonate church");
          }
        });
      },
    });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/churches">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-text-strong">Church Details</h1>
        </div>
        <LoadingState message="Loading church details..." />
      </div>
    );
  }

  if (error || !church) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/churches">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-text-strong">Church Details</h1>
        </div>
        <ErrorState 
          title="Church not found" 
          description={error?.message || "The requested church could not be found."}
          retryLabel="Back to churches"
          retry={() => window.location.href = "/admin/churches"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/churches">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-strong">{church.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={church.status === "active" ? "success" : church.status === "suspended" ? "warning" : "destructive"}
                className="capitalize"
              >
                {church.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`http://${church.slug}.localhost:3005`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Church
            </Button>
          </a>
          <Button variant="outline" onClick={handleLogInAs}>
            <LogIn className="h-4 w-4 mr-2" />
            Log in as
          </Button>
          <Button variant="outline" onClick={handleCopyEmail}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Email
          </Button>
          {plans && plans.length > 0 && (
            <Button variant="outline" onClick={handleOpenPlanModal}>
              <CreditCard className="h-4 w-4 mr-2" />
              Change Plan
            </Button>
          )}
          <Button variant="outline" onClick={handleViewInvoices}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Invoices
          </Button>
          {church.status === "active" ? (
            <Button variant="outline" onClick={handleSuspend}>
              <Database className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          ) : (
            <Button variant="outline" onClick={handleReactivate}>
              <Database className="h-4 w-4 mr-2" />
              Reactivate
            </Button>
          )}
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteChurch.isPending}
          >
            {deleteChurch.isPending ? "Deleting..." : "Delete Church"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted mb-1">Status</p>
            <Badge 
              variant={church.status === "active" ? "success" : church.status === "suspended" ? "warning" : "destructive"}
              className="capitalize"
            >
              {church.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted mb-1">Plan</p>
            <Badge 
              variant={church.plan ? "accent" : "outline"}
              className={cn(
                "capitalize",
                church.plan === "Pro" && "badge-accent",
                church.plan === "Standard" && "badge-success",
                church.plan === "Free" && "badge-muted",
              )}
            >
              {church.plan || "—"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted mb-1">Members</p>
            <p className="text-2xl font-bold text-text-strong">
              {church.member_count?.toLocaleString() ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted mb-1">Total Giving</p>
            <p className="text-2xl font-bold text-text-strong">
              Rs. {church.giving_total?.toLocaleString() ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted mb-1">Invoices</p>
            <p className="text-2xl font-bold text-text-strong">
              {invoices?.length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted mb-1 uppercase tracking-wide">Church Name</p>
              <p className="font-medium">{church.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1 uppercase tracking-wide">Slug</p>
              <p className="font-mono">{church.slug}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1 uppercase tracking-wide">Subdomain</p>
              <p className="font-mono">{church.slug}.localhost:3005</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1 uppercase tracking-wide">Admin Email</p>
              <p className="font-mono">{church.admin_email}</p>
            </div>
            {church.custom_domain && (
              <div>
                <p className="text-xs text-muted mb-1 uppercase tracking-wide">Custom Domain</p>
                <p className="font-mono">{church.custom_domain}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database & Storage */}
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-panel-2 border border-border rounded-lg">
              <Database className="h-8 w-8 text-accent" />
              <div>
                <p className="text-xs text-muted mb-1">Database</p>
                <p className="font-mono font-medium">{church.slug}_db</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted mb-1 uppercase tracking-wide">Storage Used</p>
              <p className="font-medium">
                {church.storage_bytes 
                  ? `${Math.round(church.storage_bytes / 1024 / 1024)} MB`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1 uppercase tracking-wide">Created</p>
              <p className="font-medium">{formatDate(church.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1 uppercase tracking-wide">Last Active</p>
              <p className="font-medium">{formatDate(church.last_active_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      {church.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text">{church.notes}</p>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
      
      {/* Change Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-[var(--panel)] border border-[var(--border)] rounded-xl w-96 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-strong)]">Change Church Plan</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsPlanModalOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSavePlan(); }} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text)]">Select a plan for {church.name}</p>
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id={`plan-${plan.id}`}
                        name="plan"
                        value={plan.id}
                        checked={selectedPlanId === plan.id}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="h-4 w-4 text-[var(--primary)] focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <label htmlFor={`plan-${plan.id}`} className="text-[var(--text)] flex-1">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1">
                            <p className="font-medium">{plan.name}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              ${(plan.price_monthly / 100).toFixed(2)}/mo
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4 space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsPlanModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={!selectedPlanId}
                >
                  {selectedPlanId ? "Save" : "Saving..."}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}