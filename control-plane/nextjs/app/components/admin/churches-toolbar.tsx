'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

interface ChurchesToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  plan: string;
  onPlan: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  sort: string;
  onSort: (value: string) => void;
}

export default function ChurchesToolbar({
  search,
  onSearch,
  plan,
  onPlan,
  status,
  onStatus,
  sort,
  onSort,
}: ChurchesToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      {/* Search Input */}
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <Input
          type="text"
          placeholder="Search churches..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10 w-full sm:w-64"
        />
      </div>

      {/* Filters and Sort Controls */}
      <div className="flex flex-wrap gap-3 w-full sm:w-auto">
        <Select value={plan} onValueChange={onPlan}>
          <SelectTrigger className="w-[140px]">
            <span className="opacity-70">Plan</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Plans</SelectItem>
            <SelectItem value="Free">Free</SelectItem>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Pro">Pro</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={onStatus}>
          <SelectTrigger className="w-[140px]">
            <span className="opacity-70">Status</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={onSort}>
          <SelectTrigger className="w-[140px]">
            <span className="opacity-70">Sort By</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Newest">Newest</SelectItem>
            <SelectItem value="Name">Name</SelectItem>
            <SelectItem value="Members">Members</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
