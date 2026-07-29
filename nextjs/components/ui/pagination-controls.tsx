'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface PaginationState {
  page: number
  per_page: number
}

interface PaginationControlsProps {
  page: number
  perPage: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ page, perPage, total, totalPages, onPageChange }: PaginationControlsProps) {
  if (total === 0) return null

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <div className="text-sm text-muted-foreground">
        Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(1)} disabled={page <= 1}>
          <ChevronsLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-3 text-sm font-medium">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}>
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
