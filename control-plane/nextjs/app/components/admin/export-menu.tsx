"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ExportMenuProps {
  rows: any[];
  filename: string;
}

export function ExportMenu({ rows, filename }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      exportToCSV(rows, `${filename}.csv`);
    } else if (format === 'json') {
      exportToJSON(rows, `${filename}.json`);
    }
    setIsOpen(false);
  };

  // Function to convert array of objects to CSV string
  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return "";
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas, quotes, and newlines in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(",")
      )
    ].join("\n");

    return csvContent;
  };

  // Function to export data as CSV file
  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export data as JSON file
  const exportToJSON = (data: any[], filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  // Add/remove event listener for clicks outside
  if (isOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
  }

  return (
    <div className="relative inline-block">
      <Button
        ref={buttonRef}
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[var(--panel)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-[var(--panel)] border border-[var(--border)] rounded-md shadow-lg z-50">
          <button
            onClick={() => handleExport('csv')}
            className="block w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--panel-2)] focus:outline-none"
          >
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="block w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--panel-2)] border-t border-[var(--border-soft)] focus:outline-none"
          >
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
}
