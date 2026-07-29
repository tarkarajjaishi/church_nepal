"use client";
import React from 'react';

interface ResponsiveTableProps {
  headers: string[];
  children: React.ReactNode;
  caption?: string;
}

export default function ResponsiveTable({ 
  headers, 
  children, 
  caption 
}: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--border)]">
        {caption && (
          <caption className="py-3 px-4 text-left text-sm font-medium text-[var(--text)] bg-[var(--panel-2)]">
            {caption}
          </caption>
        )}
        <thead className="bg-[var(--panel-2)]">
          <tr>
            {headers.map((header, index) => (
              <th 
                key={index}
                scope="col"
                className="py-3 px-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {children}
        </tbody>
      </table>
      
      {/* Stacked card view for mobile */}
      <div className="block lg:hidden mt-4">
        {React.Children.map(children, (row, rowIndex) => (
          <div key={rowIndex} className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-2">
              {React.Children.map(row, (cell, cellIndex) => (
                <div key={cellIndex} className="py-2">
                  <dt className="text-xs font-medium text-[var(--muted)]">{headers[cellIndex]}</dt>
                  <dd className="mt-1 text-sm text-[var(--text)]">{cell}</dd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
