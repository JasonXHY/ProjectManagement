import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContractCard from '../../components/ProjectHome/cards/ContractCard'
import RequirementCard from '../../components/ProjectHome/cards/RequirementCard'
import IssueCard from '../../components/ProjectHome/cards/IssueCard'
import OpportunityCard from '../../components/ProjectHome/cards/OpportunityCard'
import SummaryCard from '../../components/ProjectHome/cards/SummaryCard'
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

describe('classify → metadata → card data flow', () => {
  describe('ContractCard reads from metadata', () => {
    it('shows contract data when metadata has contract_amount', () => {
      const project = makeProject(JSON.stringify({
        contract_amount: 150000,
        contract_items: [{ name: '软件许可', amount: 100000 }],
      }))
      render(<ContractCard project={project} allFiles={[]} />)
      expect(screen.getByText('¥150,000.00')).toBeInTheDocument()
      expect(screen.getByText('软件许可')).toBeInTheDocument()
    })

    it('shows empty when metadata has no contract data', () => {
      const project = makeProject(JSON.stringify({ project_code: 'PRJ-001' }))
      render(<ContractCard project={project} allFiles={[]} />)
      expect(screen.getByText('暂无合同数据')).toBeInTheDocument()
    })

    it('shows empty when metadata is empty object', () => {
      const project = makeProject('{}')
      render(<ContractCard project={project} allFiles={[]} />)
      expect(screen.getByText('暂无合同数据')).toBeInTheDocument()
    })
  })

  describe('RequirementCard reads from metadata', () => {
    it('shows requirements when metadata has requirements array', () => {
      const project = makeProject(JSON.stringify({
        requirements: [
          { name: '用户登录功能', status: 'pending' },
          { name: '数据导出功能', status: 'progress' },
        ],
      }))
      render(<RequirementCard project={project} allFiles={[]} />)
      expect(screen.getByText('用户登录功能')).toBeInTheDocument()
      expect(screen.getByText('数据导出功能')).toBeInTheDocument()
    })

    it('shows empty when metadata has no requirements', () => {
      const project = makeProject(JSON.stringify({ project_code: 'PRJ-001' }))
      render(<RequirementCard project={project} allFiles={[]} />)
      expect(screen.getByText('暂无需求记录')).toBeInTheDocument()
    })
  })

  describe('IssueCard reads from metadata', () => {
    it('shows issues when metadata has key_issues array', () => {
      const project = makeProject(JSON.stringify({
        key_issues: [
          { text: '数据库连接超时', priority: 'high', status: 'open' },
        ],
      }))
      render(<IssueCard project={project} allFiles={[]} />)
      expect(screen.getByText('数据库连接超时')).toBeInTheDocument()
    })

    it('shows empty when metadata has no key_issues', () => {
      const project = makeProject(JSON.stringify({ project_code: 'PRJ-001' }))
      render(<IssueCard project={project} allFiles={[]} />)
      expect(screen.getByText('暂无关键问题')).toBeInTheDocument()
    })
  })

  describe('OpportunityCard reads from metadata', () => {
    it('shows opportunities when metadata has opportunities array', () => {
      const project = makeProject(JSON.stringify({
        opportunities: [
          { name: '二期建设', description: '客户追加需求', status: 'planned' },
        ],
      }))
      render(<OpportunityCard project={project} allFiles={[]} />)
      expect(screen.getByText('二期建设')).toBeInTheDocument()
    })

    it('shows empty when metadata has no opportunities', () => {
      const project = makeProject(JSON.stringify({ project_code: 'PRJ-001' }))
      render(<OpportunityCard project={project} allFiles={[]} />)
      expect(screen.getByText('暂无拓展商机')).toBeInTheDocument()
    })
  })

  describe('SummaryCard reads from metadata', () => {
    it('shows summary when metadata has project_overview', () => {
      const project = makeProject(JSON.stringify({
        project_overview: '这是一个项目总结内容',
      }))
      render(<SummaryCard project={project} allFiles={[]} />)
      expect(screen.getByText('这是一个项目总结内容')).toBeInTheDocument()
    })

    it('shows empty when metadata has no project_overview', () => {
      const project = makeProject(JSON.stringify({ project_code: 'PRJ-001' }))
      render(<SummaryCard project={project} allFiles={[]} />)
      expect(screen.getByText('暂无项目总结')).toBeInTheDocument()
    })
  })

  describe('malformed metadata scenarios', () => {
    it('all cards handle invalid JSON gracefully', () => {
      const project = makeProject('not valid json{{{')
      render(<ContractCard project={project} allFiles={[]} />)
      expect(screen.getByText('暂无合同数据')).toBeInTheDocument()
    })

    it('all cards handle undefined metadata fields', () => {
      const project = makeProject('{}')
      render(<ContractCard project={project} allFiles={[]} />)
      render(<RequirementCard project={project} allFiles={[]} />)
      render(<IssueCard project={project} allFiles={[]} />)
      render(<OpportunityCard project={project} allFiles={[]} />)
      render(<SummaryCard project={project} allFiles={[]} />)
      expect(screen.getAllByText(/暂无/).length).toBeGreaterThanOrEqual(3)
    })
  })
})
