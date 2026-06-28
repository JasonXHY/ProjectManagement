import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContractCard from '../../components/ProjectHome/cards/ContractCard'
import RequirementCard from '../../components/ProjectHome/cards/RequirementCard'
import { Project } from '../../types'

function makeProject(metadata: string | null): Project {
  return {
    id: 1,
    name: '测试项目',
    category_type: 'stage',
    custom_stages: null,
    current_stage: '进行中',
    folder_uuid: 'abc',
    metadata,
    milestones: null,
  }
}

describe('Card boundary conditions', () => {
  describe('ContractCard edge cases', () => {
    it('handles contract_amount as NaN', () => {
      const project = makeProject(JSON.stringify({
        contract_amount: NaN,
        contract_items: [],
      }))
      render(<ContractCard project={project} allFiles={[]} />)
      expect(screen.getByText('暂无合同数据')).toBeInTheDocument()
    })

    it('handles contract_items with undefined amount', () => {
      const project = makeProject(JSON.stringify({
        contract_amount: 50000,
        contract_items: [{ name: 'Item1' }],
      }))
      render(<ContractCard project={project} allFiles={[]} />)
      expect(screen.getByText('¥50,000.00')).toBeInTheDocument()
      expect(screen.getByText('Item1')).toBeInTheDocument()
    })

    it('handles very large contract amount', () => {
      const project = makeProject(JSON.stringify({
        contract_amount: 999999999,
        contract_items: [],
      }))
      render(<ContractCard project={project} allFiles={[]} />)
      expect(screen.getByText('¥999,999,999.00')).toBeInTheDocument()
    })
  })

  describe('RequirementCard edge cases', () => {
    it('handles requirement with undefined name', () => {
      const project = makeProject(JSON.stringify({
        requirements: [{ status: 'pending' }],
      }))
      render(<RequirementCard project={project} allFiles={[]} />)
      expect(screen.getByText('待定')).toBeInTheDocument()
    })

    it('handles requirement with undefined status', () => {
      const project = makeProject(JSON.stringify({
        requirements: [{ name: 'Test Req' }],
      }))
      render(<RequirementCard project={project} allFiles={[]} />)
      expect(screen.getByText('Test Req')).toBeInTheDocument()
    })

    it('handles very long requirement name', () => {
      const longName = '这是一个非常长的需求名称'.repeat(10)
      const project = makeProject(JSON.stringify({
        requirements: [{ name: longName, status: 'pending' }],
      }))
      render(<RequirementCard project={project} allFiles={[]} />)
      expect(screen.getByText(longName)).toBeInTheDocument()
    })
  })
})
