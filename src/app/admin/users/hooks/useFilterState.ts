'use client'

import { useState, useCallback, useMemo } from 'react'
import { UserItem } from '../contexts/UserDataContext'
import {
  AdvancedFilterConfig,
  FilterCondition,
  FilterGroup,
  FilterOperator,
} from '../types/filters'

export interface UseFilterStateConfig {
  users: UserItem[]
  initialFilters?: AdvancedFilterConfig
}

export interface UseFilterStateReturn {
  filters: AdvancedFilterConfig
  setFilters: (config: AdvancedFilterConfig) => void
  filteredUsers: UserItem[]
  updateCondition: (groupId: string, conditionId: string, updates: Partial<FilterCondition>) => void
  updateGroup: (groupId: string, updates: Partial<FilterGroup>) => void
}

/**
 * Helper function to evaluate a single condition against a user
 */
function evaluateCondition(user: UserItem, condition: FilterCondition): boolean {
  if (!condition.field) return true

  const fieldValue = (user as any)[condition.field]
  const conditionValue = condition.value

  switch (condition.operator) {
    case 'eq':
      return fieldValue === conditionValue
    case 'neq':
      return fieldValue !== conditionValue
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase())
    case 'startsWith':
      return String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase())
    case 'endsWith':
      return String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase())
    case 'in':
      return Array.isArray(conditionValue) ? conditionValue.includes(fieldValue) : false
    case 'notIn':
      return Array.isArray(conditionValue) ? !conditionValue.includes(fieldValue) : true
    case 'gt':
      return Number(fieldValue) > Number(conditionValue)
    case 'gte':
      return Number(fieldValue) >= Number(conditionValue)
    case 'lt':
      return Number(fieldValue) < Number(conditionValue)
    case 'lte':
      return Number(fieldValue) <= Number(conditionValue)
    case 'between':
      if (!Array.isArray(conditionValue) || conditionValue.length < 2) return true
      return Number(fieldValue) >= Number(conditionValue[0]) && Number(fieldValue) <= Number(conditionValue[1])
    case 'isEmpty':
      return !fieldValue || String(fieldValue).trim() === ''
    case 'isNotEmpty':
      return fieldValue && String(fieldValue).trim() !== ''
    case 'isNull':
      return fieldValue === null || fieldValue === undefined
    case 'isNotNull':
      return fieldValue !== null && fieldValue !== undefined
    default:
      return true
  }
}

/**
 * Helper function to evaluate a filter group (with AND/OR logic)
 */
function evaluateGroup(user: UserItem, group: FilterGroup): boolean {
  if (!group.conditions || group.conditions.length === 0) return true

  const conditionResults = group.conditions
    .filter((c) => c && c.field)
    .map((condition) => evaluateCondition(user, condition))

  if (conditionResults.length === 0) return true

  if (group.logic === 'AND') {
    return conditionResults.every((result) => result)
  } else {
    return conditionResults.some((result) => result)
  }
}

/**
 * Helper function to evaluate an advanced query (top-level config with multiple groups)
 */
function evaluateAdvancedQuery(user: UserItem, config: AdvancedFilterConfig | undefined | null): boolean {
  if (!config || !config.groups || config.groups.length === 0) return true

  const groupResults = config.groups
    .filter((g) => g && g.id)
    .map((group) => evaluateGroup(user, group))

  if (groupResults.length === 0) return true

  if (config.logic === 'AND') {
    return groupResults.every((result) => result)
  } else {
    return groupResults.some((result) => result)
  }
}

/**
 * Hook for managing advanced filter state
 * Handles complex filter configurations with AND/OR logic
 *
 * @param users - Array of users to filter
 * @param initialFilters - Initial filter configuration
 * @returns Filter state and update methods
 */
export function useFilterState({ users, initialFilters }: UseFilterStateConfig): UseFilterStateReturn {
  const [filters, setFilters] = useState<AdvancedFilterConfig>(
    initialFilters || {
      logic: 'AND',
      groups: []
    }
  )

  const updateCondition = useCallback(
    (groupId: string, conditionId: string, updates: Partial<FilterCondition>) => {
      setFilters((prev) => ({
        ...prev,
        groups: prev.groups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              conditions: group.conditions.map((condition) =>
                condition.id === conditionId
                  ? { ...condition, ...updates }
                  : condition
              )
            }
          }
          return group
        })
      }))
    },
    []
  )

  const updateGroup = useCallback(
    (groupId: string, updates: Partial<FilterGroup>) => {
      setFilters((prev) => ({
        ...prev,
        groups: prev.groups.map((group) =>
          group.id === groupId ? { ...group, ...updates } : group
        )
      }))
    },
    []
  )

  const filteredUsers = useMemo(() => {
    let result = users

    // Apply advanced query filter if present
    if (filters && filters.groups && filters.groups.length > 0) {
      result = result.filter((user) => evaluateAdvancedQuery(user, filters))
    }

    return result
  }, [users, filters])

  return {
    filters,
    setFilters,
    filteredUsers,
    updateCondition,
    updateGroup
  }
}
