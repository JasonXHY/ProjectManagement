import { Project, FileRecord } from '../../types'
import ProjectInfoPlaceholderCard from './cards/ProjectInfoPlaceholderCard'
import ContractCard from './cards/ContractCard'
import EvaluationCard from './cards/EvaluationCard'
import RequirementCard from './cards/RequirementCard'
import IssueCard from './cards/IssueCard'
import SignatureCard from './cards/SignatureCard'
import OpportunityCard from './cards/OpportunityCard'
import DeliverableCard from './cards/DeliverableCard'
import SummaryCard from './cards/SummaryCard'

const PRESALE_CARDS = [ProjectInfoPlaceholderCard, ContractCard, EvaluationCard]
const PROGRESS_CARDS = [RequirementCard, IssueCard, SignatureCard]
const HANDOVER_CARDS = [SignatureCard, OpportunityCard, DeliverableCard]
const CLOSED_CARDS = [OpportunityCard, DeliverableCard, SummaryCard]

const PRESALE_STAGES = ['售前']
const PROGRESS_STAGES = ['启动', '需求', '方案', '构建', '测试', '上线', '验收']
const HANDOVER_STAGES = ['转客户成功']
const CLOSED_STAGES = ['关闭']

type StageGroup = 'presale' | 'progress' | 'handover' | 'closed'

function getStageGroup(selectedCategory: string | null, currentStage: string): StageGroup {
  if (selectedCategory) {
    if (PRESALE_STAGES.includes(selectedCategory)) return 'presale'
    if (PROGRESS_STAGES.includes(selectedCategory)) return 'progress'
    if (HANDOVER_STAGES.includes(selectedCategory)) return 'handover'
    if (CLOSED_STAGES.includes(selectedCategory)) return 'closed'
  }

  if (PRESALE_STAGES.includes(currentStage)) return 'presale'
  if (HANDOVER_STAGES.includes(currentStage)) return 'handover'
  if (CLOSED_STAGES.includes(currentStage)) return 'closed'
  return 'progress'
}

export interface FeatureCardsProps {
  project: Project
  selectedCategory: string | null
  allFiles: FileRecord[]
  onProjectUpdated?: (project: Project) => void
}

const GROUP_MAP: Record<StageGroup, React.ComponentType<{project: Project; allFiles: FileRecord[]}>[]> = {
  presale: PRESALE_CARDS,
  progress: PROGRESS_CARDS,
  handover: HANDOVER_CARDS,
  closed: CLOSED_CARDS,
}

export default function FeatureCards({ project, selectedCategory, allFiles, onProjectUpdated }: FeatureCardsProps) {
  const stageGroup = getStageGroup(selectedCategory, project.current_stage)
  const cards = GROUP_MAP[stageGroup]

  return (
    <div className="feature-row">
      {cards.map((Card, index) => (
        <Card key={index} project={project} allFiles={allFiles} onProjectUpdated={onProjectUpdated} />
      ))}
    </div>
  )
}
