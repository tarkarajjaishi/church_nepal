"use client";

import { forwardRef, createContext, useContext, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextProps | undefined>(undefined);

const useDropdownMenuContext = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenu components must be used within DropdownMenu");
  return context;
};

interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const DropdownMenu = ({ open: openProp, onOpenChange, children }: DropdownMenuProps) => {
  const [open, setOpen] = useState(openProp ?? false);
  const isControlled = openProp !== undefined;

  return (
    <DropdownMenuContext.Provider value={{ 
      open: isControlled ? openProp! : open, 
      setOpen: (o) => { 
        onOpenChange?.(o); 
        if (!isControlled) setOpen(o); 
      } 
    }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { setOpen } = useDropdownMenuContext();
  return (
    <button
      ref={ref}
      className={cn(className)}
      onClick={() => setOpen(true)}
      {...props}
    />
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
  side?: "top" | "bottom";
}

const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, align = "start", side = "bottom", ...props }, ref) => {
  const { open } = useDropdownMenuContext();
  
  if (!open) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] rounded-md border border-border bg-panel p-1 shadow-md",
        align === "end" && "right-0",
        side === "top" && "bottom-auto mt-0 mb-2",
        className
      )}
      {...props}
    />
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-text outline-none transition-colors hover:bg-panel-2 hover:text-text",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { checked?: boolean }
>(({ className, checked, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-text outline-none transition-colors hover:bg-panel-2",
      className
    )}
    {...props}
  >
    {checked && (
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <span className="h-2 w-2 rounded-sm bg-accent" />
      </span>
    )}
  </div>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-text", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};