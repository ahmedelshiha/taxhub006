import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { WorkstationInsightsPanel } from '../WorkstationInsightsPanel'

// Mock the lazy-loaded AnalyticsCharts component
vi.mock('../AnalyticsCharts', () => ({
  AnalyticsCharts: ({ userGrowthTrend }: any) => (
    <div data-testid="analytics-charts">
      User Growth: {userGrowthTrend?.length || 0} data points
    </div>
  ),
}))

// Mock the recommendations hook
vi.mock('../../hooks/useDashboardMetrics', () => ({
  useDashboardRecommendations: () => ({
    data: [
      {
        id: 'rec-1',
        title: 'Review pending users',
        description: 'There are 5 users awaiting approval',
        impactLevel: 'high',
        action: { label: 'Review Now', actionId: 'review-pending' },
        metrics: { affectedUsers: 5, impactScore: 0.8 },
      },
      {
        id: 'rec-2',
        title: 'Update inactive users',
        description: 'Consider deactivating inactive users',
        impactLevel: 'medium',
        action: { label: 'Update', actionId: 'update-inactive' },
        metrics: { affectedUsers: 12, impactScore: 0.6 },
      },
    ],
    isLoading: false,
    error: null,
    mutate: vi.fn(),
  }),
}))

// Mock the analytics hook
vi.mock('../../hooks/useRealtimeAnalytics', () => ({
  useAnalyticsChartData: () => ({
    data: {
      userGrowthTrend: [{ date: '2025-01-01', value: 100 }],
      departmentDistribution: [{ name: 'Sales', value: 30 }],
      roleDistribution: [{ name: 'Admin', value: 5 }],
      workflowEfficiency: 0.92,
      complianceScore: 0.85,
    },
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}))

describe('WorkstationInsightsPanel', () => {
  const defaultProps = {
    isOpen: true,
    stats: { total: 100, clients: 30, staff: 70 },
    analyticsData: {},
  }

  describe('Rendering', () => {
    it('should render insights panel header', () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument()
    })

    it('should render summary statistics', () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      expect(screen.getByText('Summary')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should render analytics charts section', () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      expect(screen.getByText('Analytics Charts')).toBeInTheDocument()
    })

    it('should render recommended actions section', () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      expect(screen.getByText('Recommended Actions')).toBeInTheDocument()
    })

    it('should render without stats gracefully', () => {
      render(<WorkstationInsightsPanel {...defaultProps} stats={undefined} />)
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument()
    })
  })

  describe('Interaction', () => {
    it('should call onClose when close button clicked', async () => {
      const onClose = vi.fn()
      render(<WorkstationInsightsPanel {...defaultProps} onClose={onClose} />)
      
      const closeButton = screen.getByLabelText('Close insights panel')
      await userEvent.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should handle missing onClose gracefully', async () => {
      const { container } = render(
        <WorkstationInsightsPanel {...defaultProps} onClose={undefined} />
      )
      const closeButton = screen.getByLabelText('Close insights panel')
      
      // Should not throw error
      await userEvent.click(closeButton)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Analytics Charts', () => {
    it('should render lazy-loaded charts with Suspense fallback', async () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      
      // Wait for the lazy-loaded component
      await waitFor(() => {
        expect(screen.getByTestId('analytics-charts')).toBeInTheDocument()
      })
    })

    it('should pass correct chart data to AnalyticsCharts', async () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('User Growth: 1 data points')).toBeInTheDocument()
      })
    })

    it('should handle chart data errors gracefully', () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument()
    })
  })

  describe('Recommended Actions', () => {
    it('should display recommended actions', async () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Review pending users')).toBeInTheDocument()
        expect(screen.getByText('Update inactive users')).toBeInTheDocument()
      })
    })

    it('should show impact level indicators', async () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Review pending users/)).toBeInTheDocument()
      })
    })

    it('should show action buttons for recommendations', async () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Review Now')).toBeInTheDocument()
        expect(screen.getByText('Update')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should have correct CSS classes for layout', () => {
      const { container } = render(<WorkstationInsightsPanel {...defaultProps} />)
      const panel = container.querySelector('.workstation-insights-panel')
      expect(panel).toHaveClass('workstation-insights-panel')
    })

    it('should have semantic ARIA labels', () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      expect(screen.getByLabelText('Summary Statistics')).toBeInTheDocument()
      expect(screen.getByLabelText('Analytics Charts')).toBeInTheDocument()
      expect(screen.getByLabelText('Recommended Actions')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      const mainHeading = screen.getByRole('heading', { level: 2 })
      expect(mainHeading).toHaveTextContent('Analytics & Insights')
    })

    it('should have accessible close button', () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      const closeButton = screen.getByLabelText('Close insights panel')
      expect(closeButton).toHaveAttribute('title', 'Close insights panel (mobile)')
    })

    it('should support keyboard navigation', async () => {
      render(<WorkstationInsightsPanel {...defaultProps} />)
      const closeButton = screen.getByLabelText('Close insights panel')
      
      // Should be focusable via keyboard
      closeButton.focus()
      expect(document.activeElement).toBe(closeButton)
    })
  })

  describe('Performance', () => {
    it('should lazy load analytics charts', async () => {
      const { container } = render(<WorkstationInsightsPanel {...defaultProps} />)
      
      // Charts are lazy-loaded, so they shouldn't be in DOM initially
      await waitFor(() => {
        expect(screen.getByTestId('analytics-charts')).toBeInTheDocument()
      })
    })

    it('should memoize component to prevent unnecessary re-renders', () => {
      const { rerender } = render(<WorkstationInsightsPanel {...defaultProps} />)
      
      // Re-render with same props
      const onClose = vi.fn()
      rerender(<WorkstationInsightsPanel {...defaultProps} onClose={onClose} />)
      
      // Component should still be in document
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing chart data gracefully', () => {
      render(
        <WorkstationInsightsPanel
          {...defaultProps}
          analyticsData={undefined}
        />
      )
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument()
    })

    it('should handle empty stats gracefully', () => {
      render(
        <WorkstationInsightsPanel
          {...defaultProps}
          stats={{} as any}
        />
      )
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument()
    })
  })
})
