"use client";

import { Button } from "@/components/ui/button";
import { Church, FileText, Users, Settings, Database, Search, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode | "church" | "file" | "users" | "settings" | "database" | "search";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "compact";
}

const iconMap: Record<string, LucideIcon> = {
  church: Church,
  file: FileText,
  users: Users,
  settings: Settings,
  database: Database,
  search: Search,
};

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  variant = "default" 
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;
    
    if (typeof icon === "string" && icon in iconMap) {
      const IconComponent = iconMap[icon];
      return <IconComponent className="h-12 w-12" style={{ color: "var(--muted)" }} />;
    }
    
    return icon;
  };

  if (variant === "compact") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        {renderIcon()}
        <h3 className="mt-3 text-base font-medium" style={{ color: "var(--text)" }}>{title}</h3>
        {description && (
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} variant="outline" size="sm" className="mt-3">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-4xl" style={{ color: "var(--muted)" }}>
        {renderIcon()}
      </div>
      <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
      {description && (
        <p className="mt-2 text-sm max-w-sm" style={{ color: "var(--muted)" }}>{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}