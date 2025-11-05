'use client'

import { useEffect, useCallback, useRef } from 'react'
import useSWR from 'swr'
import type { UserFilters } from '../types/workstation'

interface AnalyticsData {
  userGrowthTrend: Array<{ date: string; value: number }>
  departmentDistribution: Array<{ name: string; value: number }>
  roleDistribution: Array<{ name: string; value: number }>
  workflowEfficiency: number
  complianceScore: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

/**
 * useRealtimeAnalytics Hook
 *
 * Phase 3: Provides real-time analytics data with intelligent caching
 * - Subscribes to filter changes
 * - Updates analytics when filters change
 * - Debounces rapid filter updates (500ms)
 * - Caches data with 1-minute dedupe and 5-minute throttle
 * - Handles loading and error states
 *
 * Features:
 * - Filter-aware analytics (updates on filter change)
 * - SWR caching strategy
 * - Debouncing to prevent excessive API calls
 * - Typed response data
 * - Error handling
 *
 * @param filters - Current user filters (optional)
 * @returns Analytics data, loading state, error, and refresh function
 */
export function useRealtimeAnalytics(filters?: UserFilters) {
  const debounceTimer = useRef<NodeJS.Timeout>()

  /**
   * Build query string from filters for cache key
   * Ensures same filters always hit the cache
   */
  const getQueryString = useCallback((f?: UserFilters): string => {
    if (!f) return ''
    const params = new URLSearchParams()
    if (f.search) params.set('search', f.search)
    if (f.role) params.set('role', f.role)
    if (f.status) params.set('status', f.status)
    if (f.department) params.set('department', f.department)
    if (f.dateRange && f.dateRange !== 'all') params.set('dateRange', f.dateRange)
    return params.toString()
  }, [])

  const queryString = getQueryString(filters)
  const cacheKey = `/api/admin/dashboard/analytics${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<AnalyticsData>(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute dedupe
      focusThrottleInterval: 300000, // 5 minute throttle
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    }
  )

  /**
   * Debounced refresh to prevent excessive API calls
   * Useful when filters change rapidly
   */
  const debouncedRefresh = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      mutate()
    }, 500)
  }, [mutate])

  /**
   * Immediate refresh (bypasses debounce)
   */
  const immediateRefresh = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    mutate()
  }, [mutate])

  /**
   * Auto-refresh when filters change
   */
  useEffect(() => {
    debouncedRefresh()
  }, [filters, debouncedRefresh])

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    mutate: immediateRefresh,
    debouncedRefresh,
  }
}

/**
 * useAnalyticsChartData Hook
 *
 * Simplified hook for getting analytics data without filters
 * Useful for static analytics displays
 */
export function useAnalyticsChartData() {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsData>(
    '/api/admin/dashboard/analytics',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // 10 minutes
      focusThrottleInterval: 600000, // 10 minutes
    }
  )

  return {
    data,
    isLoading,
    error,
    refresh: mutate,
  }
}
