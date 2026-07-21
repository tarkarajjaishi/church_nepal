"use client";

import { forwardRef, createContext, useContext, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextProps {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextProps | undefined>(undefined);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("Select components must be used within Select");
  return context;
};

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value: valueProp, defaultValue = "", onValueChange, children }: SelectProps) => {
  const [value, setValue] = useState(valueProp ?? defaultValue);
  const [open, setOpen] = useState(false);
  const isControlled = valueProp !== undefined;

  return (
    <SelectContext.Provider value={{ 
      value: isControlled ? valueProp! : value, 
      onChange: (v) => { 
        onValueChange?.(v); 
        if (!isControlled) setValue(v); 
      }, 
      open, 
      setOpen 
    }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

const SelectValue = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const { value } = useSelectContext();
  return <span ref={ref} className={cn("block truncate", className)} {...props} />;
});
SelectValue.displayName = "SelectValue";

const SelectTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useSelectContext();
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-text",
        "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      <span className="truncate">{children}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useSelectContext();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-2 w-full rounded-md border border-border bg-panel shadow-lg",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const { onChange, setOpen } = useSelectContext();
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm text-text hover:bg-panel-2",
        className
      )}
      onClick={() => {
        onChange(value);
        setOpen(false);
      }}
      {...props}
    >
      <span className="truncate">{children}</span>
    </div>
  );
});
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};