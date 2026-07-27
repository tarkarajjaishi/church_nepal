'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface TabListProps {
  children: React.ReactNode;
}

interface TabProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface TabPanelsProps {
  children: React.ReactNode;
}

interface TabPanelProps {
  value: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export function Tabs({
  children,
  defaultValue,
  value: controlledValue,
  onValueChange,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      {children}
    </TabsContext.Provider>
  );
}

export function TabList({ children }: TabListProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabList must be used within Tabs');

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndicatorStyle, setActiveIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const updateIndicator = () => {
      if (!containerRef.current) return;
      
      const activeTab = Array.from(containerRef.current.children).find(
        child => child.getAttribute('data-state') === 'active'
      ) as HTMLElement | undefined;

      if (activeTab) {
        const rect = activeTab.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        setActiveIndicatorStyle({
          left: rect.left - containerRect.left,
          width: rect.width,
        });
      }
    };

    // Wait for DOM updates
    setTimeout(updateIndicator, 0);
    
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const tabs = Array.from(containerRef.current?.children || []) as HTMLElement[];
      const currentIndex = tabs.findIndex(tab => tab.getAttribute('data-state') === 'active');
      let nextIndex = currentIndex;

      if (e.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      } else if (e.key === 'ArrowRight') {
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      }

      if (tabs[nextIndex]) {
        const value = tabs[nextIndex].getAttribute('data-value');
        if (value) {
          context.onValueChange(value);
        }
      }
    }
  };

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className="flex w-full border-b border-[var(--border-soft)]"
      >
{React.Children.map(children, (child, index) => {
         if (React.isValidElement(child)) {
           return React.cloneElement(child, { key: `tab-${index}` });
         }
         return child;
       })}
      </div>
      <div
        className="absolute bottom-0 h-0.5 bg-[var(--accent)] transition-all duration-200 ease-in-out"
        style={{
          left: `${activeIndicatorStyle.left}px`,
          width: `${activeIndicatorStyle.width}px`,
        }}
      />
    </div>
  );
}

export function Tab({ value, children, disabled = false }: TabProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const isActive = context.value === value;
  const handleClick = () => {
    if (!disabled) {
      context.onValueChange(value);
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : isActive ? 0 : -1}
      onClick={handleClick}
      data-value={value}
      data-state={isActive ? 'active' : 'inactive'}
      disabled={disabled}
      className={`px-4 py-3 font-medium text-sm transition-colors duration-200 ${
        disabled
          ? 'text-[var(--muted)] cursor-not-allowed'
          : isActive
          ? 'text-[var(--text-strong)]'
          : 'text-[var(--muted)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  );
}

export function TabPanels({ children }: TabPanelsProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanels must be used within Tabs');

  return (
    <div role="tabpanel" className="mt-4">
      {React.Children.toArray(children).filter(
        child => React.isValidElement(child) && 
                 typeof (child.props as Record<string, unknown>).value === 'string' && 
                 (child.props as TabPanelProps).value === context.value
      )}
    </div>
  );
}

export function TabPanel({ value, children }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  if (context.value !== value) return null;

  return <div>{children}</div>;
}
