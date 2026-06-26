export interface Project {
  id: number
  name: string
  category_type: 'stage' | 'content'
  custom_stages: string | null
  current_stage: string
  folder_uuid: string | null
  metadata: string | null
  milestones: string | null
  created_at: string
  updated_at: string
}
