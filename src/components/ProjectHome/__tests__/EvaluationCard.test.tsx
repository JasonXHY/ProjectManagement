import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EvaluationCard from '../cards/EvaluationCard'
import { Project } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '售前',
  folder_uuid: 'abc-123',
  metadata: JSON.stringify({
    contract_amount: 1000000,
    cost_estimate: 600000,
    profit_rate: 0.4,
    person_days: 100,
  }),
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

describe('EvaluationCard', () => {
  it('renders evaluation data', () => {
    render(<EvaluationCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('项目评估')).toBeInTheDocument()
    expect(screen.getByText('¥1,000,000.00')).toBeInTheDocument()
    expect(screen.getByText('¥600,000.00')).toBeInTheDocument()
    expect(screen.getByText('40.00%')).toBeInTheDocument()
    expect(screen.getByText('100天')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: null,
    }

    render(<EvaluationCard project={emptyProject} allFiles={[]} />)

    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })

  it('shows profit rate with color based on threshold', () => {
    const lowProfitProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({
        contract_amount: 1000000,
        cost_estimate: 700000,
        profit_rate: 0.3,
        person_days: 100,
      }),
    }

    render(<EvaluationCard project={lowProfitProject} allFiles={[]} />)

    expect(screen.getByText('30.00%')).toBeInTheDocument()
  })

  it('has profit calculation tool hint', () => {
    render(<EvaluationCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('利润测算')).toBeInTheDocument()
  })

  // T2 — 优先读取 metadata.evaluation.result
  it('reads from metadata.evaluation.result when available', () => {
    const evalProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({
        evaluation: {
          contractAmount: 2000000,
          result: {
            totalCost: 800000,
            internalProfitRate: 0.6,
            externalProfitRate: 0.45,
            isInternalRedLine: false,
            isExternalRedLine: false,
          },
        },
        contract_amount: 1000000,
        cost_estimate: 600000,
        profit_rate: 0.4,
        person_days: 100,
      }),
    }

    render(<EvaluationCard project={evalProject} allFiles={[]} />)

    expect(screen.getByText('¥2,000,000.00')).toBeInTheDocument()
    expect(screen.getByText('¥800,000.00')).toBeInTheDocument()
    expect(screen.getByText('60.00%')).toBeInTheDocument()
  })
})
