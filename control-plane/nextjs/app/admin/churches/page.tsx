"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Search, Plus, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useChurches, useCreateChurch, useDeleteChurch, useSeedDummyChurches } from "@/components/hooks";
import { LoadingState, EmptyState, ErrorState, useConfirmDialog } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { Church, NewChurch } from "@/types";
import { cn } from "@/lib/utils";

type SortField = "name" | "created" | "members" | "giving";
type SortDirection = "asc" | "desc";

export default function ChurchesPage() {
  const churchesQuery = useChurches();
  const createChurchMutation = useCreateChurch();
  const deleteChurchMutation = useDeleteChurch();
  const seedDummyMutation = useSeedDummyChurches();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const churches = churchesQuery.data || [];
  const [churchName, setChurchName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdChurch, setCreatedChurch] = useState<NewChurch | null>(null);

  // Filter and sort churches
  const filteredAndSortedChurches = useMemo(() => {
    let result = churches.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.custom_domain || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "created":
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
        case "members":
          aVal = a.member_count || 0;
          bVal = b.member_count || 0;
          break;
        case "giving":
          aVal = a.giving_total || 0;
          bVal = b.giving_total || 0;
          break;
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal as string) 
          : (bVal as string).localeCompare(aVal);
      }
      return sortDirection === "asc" 
        ? (aVal as number) - (bVal as number) 
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [churches, searchQuery, sortField, sortDirection]);

  const handleCreate = () => {
    if (!churchName.trim()) return;
    createChurchMutation.mutate(churchName.trim(), {
      onSuccess: (data) => {
        setCreatedChurch(data);
        setChurchName("");
        setShowCreateModal(false);
      },
    });
  };

  const handleDelete = (church: Church) => {
    confirm({
      title: "Delete church?",
      description: `This will permanently delete "${church.name}", its database, and all data. This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => deleteChurchMutation.mutate(church.id),
    });
  };

  const handleSeedDummy = () => {
    seedDummyMutation.mutate();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-strong">Churches</h1>
          <p className="text-sm text-muted mt-1">
            Manage church instances, databases, and credentials
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleSeedDummy}
            disabled={seedDummyMutation.isPending}
          >
            {seedDummyMutation.isPending ? "Seeding..." : "Seed Demo Churches"}
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Church
          </Button>
        </div>
      </div>

      {/* Create Church Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Church</DialogTitle>
            <DialogDescription>
              This will create a subdomain, dedicated database, storage folder, and admin credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label 
                htmlFor="church-name" 
                className="block text-sm font-medium text-muted mb-2"
              >
                Church Name
              </label>
              <Input
                id="church-name"
                placeholder="e.g. Grace Church Kathmandu"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                disabled={createChurchMutation.isPending}
                autoFocus
              />
            </div>
            {createChurchMutation.error && (
              <ErrorState 
                title="Error" 
                description={createChurchMutation.error.message} 
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreate}
              disabled={createChurchMutation.isPending || !churchName.trim()}
            >
              {createChurchMutation.isPending ? "Creating..." : "Create Church"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Modal */}
      {createdChurch && (
        <CredentialsModal 
          data={createdChurch} 
          onClose={() => setCreatedChurch(null)} 
        />
      )}

      {/* Search bar */}
      {churches.length > 0 && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Search churches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Churches Table */}
      <Card>
        <CardContent className="p-0">
          {churchesQuery.isLoading ? (
            <LoadingState message="Loading churches..." variant="skeleton" rows={5} />
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
                onClick: handleSeedDummy,
              }}
            />
          ) : filteredAndSortedChurches.length === 0 ? (
            <EmptyState
              icon="search"
              title="No churches found"
              description={`No churches match "${searchQuery}"`}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1 font-medium text-muted hover:text-text-strong"
                        onClick={() => handleSort("name")}
                      >
                        Name
                        {sortField === "name" && (
                          <ArrowUpDown className={cn(
                            "h-3 w-3 transition-transform",
                            sortDirection === "desc" && "rotate-180"
                          )} />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1 font-medium text-muted hover:text-text-strong"
                        onClick={() => handleSort("members")}
                      >
                        Members
                        {sortField === "members" && (
                          <ArrowUpDown className={cn(
                            "h-3 w-3 transition-transform",
                            sortDirection === "desc" && "rotate-180"
                          )} />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1 font-medium text-muted hover:text-text-strong"
                        onClick={() => handleSort("giving")}
                      >
                        Giving
                        {sortField === "giving" && (
                          <ArrowUpDown className={cn(
                            "h-3 w-3 transition-transform",
                            sortDirection === "desc" && "rotate-180"
                          )} />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1 font-medium text-muted hover:text-text-strong"
                        onClick={() => handleSort("created")}
                      >
                        Last Active
                        {sortField === "created" && (
                          <ArrowUpDown className={cn(
                            "h-3 w-3 transition-transform",
                            sortDirection === "desc" && "rotate-180"
                          )} />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedChurches.map((church) => (
                    <TableRow key={church.id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/admin/churches/${church.id}`}
                            className="font-medium text-text-strong hover:text-accent"
                          >
                            {church.name}
                          </Link>
                          <div className="text-xs text-muted">
                            {church.subdomain}.localhost:3005
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="accent" 
                          className={cn(
                            "capitalize",
                            church.plan === "Pro" && "badge-accent",
                            church.plan === "Standard" && "badge-success",
                            church.plan === "Free" && "badge-muted",
                          )}
                        >
                          {church.plan || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={church.status === "active" ? "success" : church.status === "suspended" ? "warning" : "destructive"} 
                          className="capitalize"
                        >
                          {church.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted">
                        {church.member_count?.toLocaleString() ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted">
                        Rs. {church.giving_total?.toLocaleString() ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted">
                        {formatDate(church.last_active_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`http://${church.slug}.localhost:3005`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-accent hover:underline text-sm font-medium"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </a>
                          <button
                            onClick={() => handleDelete(church)}
                            disabled={deleteChurchMutation.isPending}
                            className="inline-flex items-center gap-1 text-danger hover:text-danger/80 text-sm font-medium transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog />
    </>
  );
}

// Credentials Modal Component
function CredentialsModal({ data, onClose }: { data: NewChurch; onClose: () => void }) {
  const localUrl = `http://${data.slug}.localhost:3005`;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Church credentials"
    >
      <div 
        className="bg-panel border border-border rounded-xl shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-text-strong mb-2">Church created ✅</h2>
        <p className="text-sm text-muted mb-4">
          Give these details to the church. The password is shown only once.
        </p>
        
        <div className="space-y-3 mb-4">
          <div className="p-3 bg-panel-2 border border-border rounded-md">
            <div className="text-xs text-muted uppercase tracking-wide font-medium mb-1">
              Website (production)
            </div>
            <div className="font-mono text-sm text-text-strong">{data.url}</div>
          </div>
          <div className="p-3 bg-panel-2 border border-border rounded-md">
            <div className="text-xs text-muted uppercase tracking-wide font-medium mb-1">
              Open now (local)
            </div>
            <a 
              href={localUrl} 
              target="_blank" 
              rel="noreferrer"
              className="font-mono text-sm text-accent hover:underline"
            >
              {localUrl}
            </a>
          </div>
          <div className="p-3 bg-panel-2 border border-border rounded-md">
            <div className="text-xs text-muted uppercase tracking-wide font-medium mb-1">
              Admin login (email)
            </div>
            <div className="font-mono text-sm text-text-strong">{data.admin_email}</div>
          </div>
          <div className="p-3 bg-panel-2 border border-border rounded-md">
            <div className="text-xs text-muted uppercase tracking-wide font-medium mb-1">
              Admin password
            </div>
            <div className="font-mono text-sm text-text-strong">{data.admin_password}</div>
          </div>
        </div>
        
        <p className="text-xs text-gold mb-4">
          ⚠ Save the password now — it cannot be shown again.
        </p>
        
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}