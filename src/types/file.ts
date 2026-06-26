export interface FileRecord {
  id: number
  project_id: number
  filename: string
  original_path: string | null
  stored_path: string
  category: string | null
  subcategory: string | null
  stage: string | null
  file_type: string | null
  file_size: number | null
  content_extracted: string | null
  is_analyzed: boolean
  has_signature: boolean
  signature_status: 'unsigned' | 'pending' | 'signed' | 'rejected'
  ai_summary: string | null
  ai_key_info: string | null
  created_at: string
}
