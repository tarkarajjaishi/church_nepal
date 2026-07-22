"use client";

import { useMe } from "@/components/hooks";
import { LoadingState, EmptyState, ErrorState } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminsPage() {
  const { data: currentUser, isLoading, error } = useMe();

  if (isLoading) {
    return <LoadingState message="Loading admin information..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load admin information"
        description={(error as Error).message}
      />
    );
  }

  const displayName = currentUser
    ? currentUser.email.split("@")[0]
    : "N/A";

  return (
    <div className="space-y-6">
      {/* Current Admin Card */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-4">Current Admin</h3>
        
        {currentUser ? (
          <div className="space-y-3">
            <div>
              <span className="text-[var(--muted)] text-sm">Name</span>
              <p className="font-medium">{displayName}</p>
            </div>
            <div>
              <span className="text-[var(--muted)] text-sm">Email</span>
              <p className="font-medium">{currentUser.email}</p>
            </div>
            <div>
              <span className="text-[var(--muted)] text-sm">Role</span>
              <div className="mt-1">
                <Badge variant="outline" className="capitalize">
                  Super Admin
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="user"
            title="No admin session"
            description="You are not currently logged in as an admin."
          />
        )}
      </div>

      {/* Coming Soon Note */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-2">Additional Admins</h3>
        <p className="text-[var(--muted)] mb-4">
          Management of additional control plane administrators is coming soon.
        </p>
        <Button variant="ghost" disabled>
          Coming Soon
        </Button>
      </div>
    </div>
  );
}
