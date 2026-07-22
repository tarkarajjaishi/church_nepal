"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMe } from "@/components/hooks";
import { setAuthToken } from "@/lib/api-client";
import { LoadingState } from "@/components/loading-state";
import { AdminSidebar, AdminMobileDrawer } from "./sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import Breadcrumbs from "@/components/admin/breadcrumbs";
import CommandPalette from "@/components/admin/command-palette";

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/churches": "Churches",
  "/admin/analytics": "Analytics",
  "/admin/billing": "Billing & Plans",
  "/admin/admins": "Admins",
  "/admin/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/admin/churches/")) {
    return "Church Details";
  }
  return pageTitles[pathname] || "Admin";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("control_token");
    if (token) {
      setAuthToken(token);
    }
    setReady(true);
  }, []);

  // Check authentication status
  const { data: meData, isLoading } = useMe();

  useEffect(() => {
    if (!ready) return;
    
    const isLoginPage = pathname === "/admin/login";
    const isAuthenticated = !!meData;
    
    if (!isAuthenticated && !isLoading && !isLoginPage) {
      router.replace("/admin/login");
    } else if (isAuthenticated && isLoginPage) {
      router.replace("/admin");
    }
  }, [ready, meData, isLoading, pathname, router]);

  // If on login page, render without shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Don't render children while checking auth
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    );
  }

  // Show loading state if not authenticated
  if (!meData) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    );
  }

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem("control_token");
    router.push("/admin/login");
  };

  const userEmail = meData?.email || "owner@churchnepal.com";
  const userName = meData?.email?.split("@")[0] || "owner";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <CommandPalette />
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <AdminSidebar />

        {/* Mobile Drawer */}
        <AdminMobileDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onNavigate={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Topbar */}
          <header className="flex flex-col gap-4 h-auto px-6 py-4 bg-[var(--panel-2)] border-b border-[var(--border)]">
            {/* Breadcrumbs row */}
            <div className="flex items-center">
              <Breadcrumbs />
            </div>
            
            {/* Navigation and User Menu row */}
            <div className="flex items-center justify-between">
              {/* Left side - Mobile menu button + Page title */}
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-2 rounded-md text-[var(--muted)] hover:text-[var(--text-strong)] hover:bg-[var(--panel-3)] transition-colors"
                  aria-label="Open navigation menu"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Page Title */}
                <h1 className="text-xl font-semibold text-[var(--text-strong)]">
                  {getPageTitle(pathname)}
                </h1>
              </div>

              {/* Right side - Theme toggle + User menu */}
              <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <ThemeToggleButton />
                
                {/* User Menu */}
                <UserMenu email={userEmail} name={userName} onLogout={handleLogout} router={router} />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Theme Toggle Button Component
function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--text-strong)] hover:bg-[var(--panel-3)] transition-colors"
      aria-label={mounted && theme === "dark" ? "Switch to light theme" : mounted ? "Switch to dark theme" : "Toggle theme"}
    >
      {mounted && theme === "dark" ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1111.21 3c-.34 0-.67.02-1 .05a7 7 0 109.79 9.74c.03-.33.04-.66.04-1z" />
        </svg>
      ) : mounted ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
        </svg>
      )}
    </button>
  );
}

// User Menu Component
interface UserMenuProps {
  email: string;
  name: string;
  onLogout: () => void;
  router: ReturnType<typeof useRouter>;
}

function UserMenu({ email, name, onLogout, router }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="flex items-center gap-2 p-1 rounded-md hover:bg-[var(--panel-3)] transition-colors"
        aria-label="User menu"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt={name} />
          <AvatarFallback>
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-[var(--text-strong)]">{name}</p>
            <p className="text-xs text-[var(--muted)]">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setOpen(false)}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { setOpen(false); router.push("/admin/settings"); }}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onSelect={() => { 
            setOpen(false); 
            onLogout(); 
          }}
          className="text-[var(--danger)] focus:text-[var(--danger)]"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
