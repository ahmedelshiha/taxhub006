'use client'

import { memo, useCallback, useMemo } from 'react'
import { X } from 'lucide-react'
import type { WorkstationSidebarProps, UserFilters } from '../../types/workstation'
import { SavedViewsButtons } from './SavedViewsButtons'
import { AdvancedUserFilters } from '../AdvancedUserFilters'
import './workstation.css'

export const WorkstationSidebar = memo(function WorkstationSidebar({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  stats,
  onAddUser,
  onReset,
}: WorkstationSidebarProps) {
  /**
   * Safely extracts string filter values, handling both string and undefined types
   * @param value The filter value to extract
   * @returns The string value or undefined
   */
  const getFilterValue = (value: any): string | undefined => {
    return typeof value === 'string' ? value : undefined
  }

  /**
   * Handle saved view changes - clears other filters and applies selected role filter
   */
  const handleViewChange = useCallback((viewName: string, roleFilter?: string) => {
    if (onFiltersChange) {
      onFiltersChange({
        search: '',
        role: roleFilter || undefined,
        status: undefined,
        department: undefined,
        dateRange: 'all',
      })
    }
  }, [onFiltersChange])

  /**
   * Handle reset button click - clears all filters
   */
  const handleResetClick = useCallback(() => {
    if (onFiltersChange) {
      onFiltersChange({
        search: '',
        role: '',
        status: '',
        department: '',
        dateRange: 'all',
      })
    }
    if (onReset) {
      onReset()
    }
  }, [onFiltersChange, onReset])

  /**
   * Map filters from WorkstationIntegrated format to AdvancedUserFilters format
   * Ensures safe extraction of all filter values with proper typing
   */
  const mappedFilters: UserFilters = useMemo(() => {
    const dateRangeStr = getFilterValue(filters?.dateRange)
    return {
      search: getFilterValue(filters?.search) || '',
      role: getFilterValue(filters?.role),
      status: getFilterValue(filters?.status),
      department: getFilterValue(filters?.department),
      dateRange: (dateRangeStr as 'all' | 'today' | 'week' | 'month' | undefined) || undefined,
    }
  }, [filters])

  return (
    <div className="workstation-sidebar-content" data-testid="workstation-sidebar">
      {/* Close Button - Mobile Only */}
      <button
        className="sidebar-close-btn md:hidden"
        onClick={onClose}
        aria-label="Close sidebar"
        data-testid="sidebar-close-btn"
      >
        <X size={20} />
      </button>

      {/* Quick Stats Section */}
      <div className="sidebar-section" data-testid="quick-stats-section">
        <h3 className="sidebar-title">Quick Stats</h3>
        <div className="sidebar-stats-container" data-testid="stats-container">
          {stats && (
            <>
              <div className="stat-item">
                <span className="stat-label">Total Users</span>
                <span className="stat-value">{(stats as any).total || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active</span>
                {/* TODO: Phase 3 - Replace with dedicated stats.active property for better performance */}
                {/* For now, calculate as sum of clients + staff + admins, but stats object should include a direct 'active' count */}
                <span className="stat-value">{(stats as any).active !== undefined ? (stats as any).active : ((stats as any).clients || 0) + ((stats as any).staff || 0) + ((stats as any).admins || 0) || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pending</span>
                <span className="stat-value">0</span>
              </div>
            </>
          )}
          {!stats && (
            <div className="stat-item">
              <span className="stat-label">Loading...</span>
            </div>
          )}
        </div>
      </div>

      {/* Saved Views Section */}
      <SavedViewsButtons
        activeView="all"
        onViewChange={handleViewChange}
        viewCounts={{
          all: (stats as any)?.total || 0,
          clients: (stats as any)?.clients || 0,
          team: ((stats as any)?.staff || 0) + ((stats as any)?.admins || 0),
          admins: (stats as any)?.admins || 0,
        }}
        className="sidebar-saved-views"
      />

      {/* Filters Section - Scrollable */}
      <div className="sidebar-section sidebar-filters flex-1 overflow-y-auto" data-testid="filters-section">
        <h3 className="sidebar-title">Filters</h3>
        <div className="sidebar-filters-container" data-testid="filters-container">
          <AdvancedUserFilters
            filters={mappedFilters}
            onFiltersChange={(f) => onFiltersChange?.(f as any)}
            onReset={onReset}
          />
        </div>
      </div>

      {/* Footer - Reset Button */}
      <div className="sidebar-footer" data-testid="sidebar-footer">
        <button
          className="sidebar-reset-btn"
          onClick={handleResetClick}
          aria-label="Reset all filters"
          data-testid="reset-filters-btn"
        >
          Reset Filters
        </button>
      </div>
    </div>
  )
})
