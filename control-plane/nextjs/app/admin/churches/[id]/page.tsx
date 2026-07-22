"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Database, ExternalLink, Copy, CreditCard } from "lucide-react";
import Link from "next/link";
import { useChurch, useDeleteChurch, usePlans } from "@/components/hooks";
import { LoadingState, ErrorState } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import EditPlanModal from "@/components/admin/edit-plan-modal";
import { Plan } from "@/types";
import React, { useState } from "react";

export default function ChurchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const churchId = params.id as string;
  
  const { data: church, isLoading, error } = useChurch(churchId);
  const deleteChurchMutation = useDeleteChurch();
  const { data: plans } = usePlans();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleDelete = () => {
    if (!church) return;
    confirm({
      title: "Delete church?",
      description: `This will permanently delete "${church.name}", its database, and all data. This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deleteChurchMutation.mutate(church.id, {
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
    if (!plans || plans.length === 0) return;
    const currentPlan = plans.find((p: Plan) => p.name === church?.plan) ?? plans[0];
    setSelectedPlan(currentPlan);
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
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteChurchMutation.isPending}
          >
            {deleteChurchMutation.isPending ? "Deleting..." : "Delete Church"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      
      <EditPlanModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </div>
  );
}
