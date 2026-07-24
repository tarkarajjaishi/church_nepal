"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowUpDown, Search, Plus, Trash2, ExternalLink, MoreVertical, ChevronLeft, ChevronRight, CheckSquare, Square, Circle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useChurches, useCreateChurch, useDeleteChurch, useSuspendChurch, useReactivateChurch, useSeedDummyChurches, useImpersonateChurch } from "@/components/hooks";
import { LoadingState, EmptyState, ErrorState, useConfirmDialog } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { Church, NewChurch } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ChurchesToolbar from "@/components/admin/churches-toolbar";
import { apiClient } from "@/lib/api-client";

type SortField = "name" | "created" | "members" | "giving";
type SortDirection = "asc" | "desc";

export default function ChurchesPage() {
  const churchesQuery = useChurches();
  const createChurchMutation = useCreateChurch();
  const deleteChurchMutation = useDeleteChurch();
  const suspendChurchMutation = useSuspendChurch();
  const reactivateChurchMutation = useReactivateChurch();
  const seedDummyMutation = useSeedDummyChurches();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const impersonateMutation = useImpersonateChurch();

  const churches = churchesQuery.data || [];
  const [churchName, setChurchName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdChurch, setCreatedChurch] = useState<NewChurch | null>(null);
  const [provisioningChurch, setProvisioningChurch] = useState<NewChurch | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const pageSize = 10;

  const filteredAndSortedChurches = useMemo(() => {
    let result = churches.filter(c =>
      (searchQuery === "" ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.custom_domain || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedPlan === "" || c.plan === selectedPlan)
    );

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
  }, [churches, searchQuery, selectedPlan, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedChurches.length / pageSize);
  const paginatedChurches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedChurches.slice(start, start + pageSize);
  }, [filteredAndSortedChurches, currentPage]);

  const isAllSelected = paginatedChurches.length > 0 && paginatedChurches.every(c => selectedIds.has(c.id));
  const isSomeSelected = paginatedChurches.some(c => selectedIds.has(c.id));
  const selectedCount = selectedIds.size;

  const handleCreate = () => {
    if (!churchName.trim()) return;
    createChurchMutation.mutate(churchName.trim(), {
      onSuccess: (data) => {
        setProvisioningChurch(data);
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
      onConfirm: () => {
        deleteChurchMutation.mutate(church.id);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(church.id);
          return next;
        });
      },
    });
  };

  const handleSeedDummy = () => {
    seedDummyMutation.mutate();
  };

  const toggleStatus = (churchId: string, currentStatus: "active" | "suspended") => {
    if (currentStatus === "active") {
      suspendChurchMutation.mutate(churchId);
    } else {
      reactivateChurchMutation.mutate(churchId);
    }
  };

  const handleViewSite = (church: Church) => {
    const slug = church.slug || church.custom_domain;
    if (!slug) {
      toast.error("No subdomain or domain configured for this church.");
      return;
    }
    window.open(`https://${slug}.churchnepal.com`, "_blank");
  };

  const handleLogInAs = (church: Church) => {
    confirm({
      title: "Log in as church admin?",
      description: `You are about to impersonate "${church.name}". This action is audited and will be logged.`,
      confirmLabel: "Log in as",
      variant: "destructive",
      onConfirm: () => {
        impersonateMutation.mutate(church.id, {
          onSuccess: (url) => {
            window.open(url, "_blank");
          },
        });
      },
    });
  };

  const handleToggleSelect = (churchId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(churchId) ? next.delete(churchId) : next.add(churchId);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      paginatedChurches.forEach(c => selectedIds.delete(c.id));
      setSelectedIds(new Set(selectedIds));
    } else {
      const newSelected = new Set(selectedIds);
      paginatedChurches.forEach(c => newSelected.add(c.id));
      setSelectedIds(newSelected);
    }
  };

  const handleBulkSuspend = () => {
    selectedIds.forEach(id => suspendChurchMutation.mutate(id));
    setSelectedIds(new Set());
  };

  const handleBulkReactivate = () => {
    selectedIds.forEach(id => reactivateChurchMutation.mutate(id));
    setSelectedIds(new Set());
  };

  const handleExportCSV = () => {
    const exportList = selectedCount > 0
      ? filteredAndSortedChurches.filter(c => selectedIds.has(c.id))
      : filteredAndSortedChurches;

    if (exportList.length === 0) return;

    const rows = [
      ["name", "subdomain", "plan", "status", "created"],
      ...exportList.map(c => [
        c.name,
        c.slug || "",
        c.plan,
        c.status === "suspended" ? "suspended" : "active",
        c.created_at || "",
      ]),
    ];

    const csvContent = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `churches_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  useEffect(() => {
    if (!provisioningChurch?.id) return;

    let active = true;
    let done = false;

    const tick = async () => {
      if (!active || done) return;

      try {
        const response = await apiClient.get<Church>(`/churches/${provisioningChurch.id}`);
        if (response.data.status === "active") {
          done = true;
          setCreatedChurch(provisioningChurch);
          setProvisioningChurch(null);
          toast.success(`${response.data.name} is now active and ready!`);
          return;
        }
      } catch {
        // keep polling
      }
    };

    const interval = setInterval(tick, 2000);

    return () => {
      active = false;
      done = true;
      clearInterval(interval);
    };
  }, [provisioningChurch?.id]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortString = `${sortField}:${sortDirection}`;
  const handleSortFromToolbar = (s: string) => {
    const [field, dir] = s.split(":");
    if (field) setSortField(field as SortField);
    if (dir) setSortDirection(dir as SortDirection);
  };

  const effectiveFilteredCount = filteredAndSortedChurches.length;

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

      {/* Provisioning Modal */}
      {provisioningChurch && (
        <ProvisioningModal
          data={provisioningChurch}
          onDone={() => setProvisioningChurch(null)}
        />
      )}

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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">
          {effectiveFilteredCount === churches.length
            ? `${churches.length} total`
            : `${effectiveFilteredCount} of ${churches.length}`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportCSV}
          disabled={effectiveFilteredCount === 0}
          className="text-sm text-muted hover:text-text-strong"
        >
          Export CSV
        </Button>
      </div>

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
          ) : (
            <div className="overflow-x-auto">
              <ChurchesToolbar
                search={searchQuery}
                onSearch={setSearchQuery}
                plan={selectedPlan}
                onPlan={setSelectedPlan}
                status={selectedStatus}
                onStatus={setSelectedStatus}
                sort={sortString}
                onSort={handleSortFromToolbar}
              />

              {filteredAndSortedChurches.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <button
                            type="button"
                            onClick={handleToggleSelectAll}
                            className="flex items-center text-muted hover:text-text-strong"
                          >
                            {isAllSelected ? (
                              <CheckSquare className="h-4 w-4 text-accent" />
                            ) : isSomeSelected ? (
                              <div className="h-4 w-4 border border-accent rounded-sm bg-accent/20" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </TableHead>
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
                      {paginatedChurches.map((church) => {
                        const isSuspended = church.status === "suspended";
                        const isProvisioning = church.status === "provisioning";
                        const isSelected = selectedIds.has(church.id);

                        return (
                          <TableRow
                            key={church.id}
                            className={cn(isSuspended && "opacity-60", isProvisioning && "opacity-60")}
                          >
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => handleToggleSelect(church.id)}
                                className="flex items-center text-muted hover:text-text-strong"
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-4 w-4 text-accent" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell>
                              <div>
                                <Link
                                  href={`/admin/churches/${church.id}`}
                                  className="font-medium text-text-strong hover:text-accent"
                                >
                                  {church.name}
                                </Link>
                                <div className="text-xs text-muted">
                                  {church.slug}.localhost:3005
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
                                variant={church.status === "active" ? "success" : "warning"}
                                className="capitalize"
                              >
                                {isSuspended && "Suspended "}
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
                              <div className="relative flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setOpenMenuId(openMenuId === church.id ? null : church.id)}
                                  disabled={isProvisioning}
                                >
                                  <MoreVertical className="h-4 w-4 text-muted" />
                                </Button>
                                {openMenuId === church.id && (
                                  <div className="absolute right-0 top-8 z-20 w-48 overflow-hidden rounded-md border border-border bg-panel shadow-md">
                                    <button
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-strong hover:bg-panel-2 transition-colors"
                                      onClick={() => {
                                        toggleStatus(church.id, church.status === "suspended" ? "suspended" : "active");
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      {isSuspended ? "Reactivate" : "Suspend"}
                                    </button>
                                    <button
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-strong hover:bg-panel-2 transition-colors"
                                      onClick={() => {
                                        handleViewSite(church);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      View site
                                    </button>
                                    <button
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-strong hover:bg-panel-2 transition-colors"
                                      onClick={() => {
                                        handleLogInAs(church);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      Log in as
                                    </button>
                                  </div>
                                )}
                                <a
                                  href={`http://${church.slug}.localhost:3005`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    "inline-flex items-center gap-1 text-sm font-medium",
                                    isProvisioning
                                      ? "text-muted cursor-not-allowed pointer-events-none"
                                      : "text-accent hover:underline"
                                  )}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Open
                                </a>
                                <button
                                  onClick={() => handleDelete(church)}
                                  disabled={deleteChurchMutation.isPending || isProvisioning}
                                  className={cn(
                                    "inline-flex items-center gap-1 text-sm font-medium transition-colors",
                                    isProvisioning
                                      ? "text-muted cursor-not-allowed"
                                      : "text-danger hover:text-danger/80"
                                  )}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Empty filtered state */}
              {filteredAndSortedChurches.length === 0 && (
                <EmptyState
                  icon="search"
                  title="No churches found"
                  description="No churches match your filters"
                />
              )}
            </div>
          )}

          {/* Pagination */}
          {effectiveFilteredCount > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(p => p - 1);
                }}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="text-sm text-muted">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage(p => p + 1);
                }}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <Card className="mt-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-strong">
                {selectedCount} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedIds(new Set());
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkSuspend}
                >
                  Suspend selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkReactivate}
                >
                  Reactivate selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  Export selected (CSV)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
    </>
  );
}

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

const STEPS = [
  { key: 'subdomain', label: 'Subdomain' },
  { key: 'database', label: 'Database' },
  { key: 'storage', label: 'Storage' },
  { key: 'admin', label: 'Admin account' },
];

function ProvisioningModal({
  data,
  onDone,
}: {
  data: NewChurch;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev >= 4) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1600);

    return () => clearInterval(interval);
  }, []);

  const disableClose = step < 4;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disableClose && e.key === 'Escape') {
      e.preventDefault();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm"
      onClick={disableClose ? undefined : onDone}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Provisioning church"
    >
      <div
        className="bg-panel border border-border rounded-xl shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-text-strong mb-2">
          {step >= 4 ? 'Church created ✅' : 'Setting up your church...'}
        </h2>
        <p className="text-sm text-muted mb-4">
          {step >= 4
            ? `${data.name} is ready.`
            : `We are provisioning ${data.name}. This usually takes a few moments.`}
        </p>

        <ul className="space-y-2 mb-5">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex items-center gap-3">
              {step > i ? (
                <CheckCircle2 className="h-4 w-4 text-[var(--good)]" />
              ) : step === i ? (
                <Loader2 className="h-4 w-4 text-[var(--accent)] animate-spin" />
              ) : (
                <Circle className="h-4 w-4 text-[var(--muted)]" />
              )}
              <span
                className={`text-sm ${
                  step > i
                    ? 'text-[var(--text-strong)]'
                    : step === i
                      ? 'text-[var(--text-strong)]'
                      : 'text-[var(--muted)]'
                }`}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ul>

        {step >= 4 && (
          <div className="flex justify-end">
            <Button variant="primary" onClick={onDone}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
