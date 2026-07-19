"use client";

import { forwardRef, createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsContextProps {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within Tabs");
  return context;
};

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

const Tabs = ({ defaultValue, value: valueProp, onValueChange, className, children }: TabsProps) => {
  const [value, setValue] = useState(valueProp ?? defaultValue);
  const isControlled = valueProp !== undefined;

  return (
    <TabsContext.Provider value={{ 
      value: isControlled ? valueProp! : value, 
      onValueChange: (v) => {
        onValueChange?.(v);
        if (!isControlled) setValue(v);
      }
    }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-lg bg-panel-2 p-1 text-muted",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const { value: selected, onValueChange } = useTabsContext();
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
        "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected === value 
          ? "bg-accent text-white shadow" 
          : "text-muted hover:text-text",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const { value: selected } = useTabsContext();
  if (selected !== value) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
};