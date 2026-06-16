import { useState, useEffect, useCallback, useRef } from 'react'
import { message, Modal } from 'antd'
import { Project, FileRecord, checkStageProgression, DEFAULT_STAGES } from '../../types'
import { fileService } from '../../services/fileService'
import { aiService } from '../../services/aiService'
import { projectService } from '../../services/projectService'

function getHighestStage(current: string | null, existing: string | null): string | null {
  if (!current) return existing
  const currentIdx = DEFAULT_STAGES.indexOf(current)
  const existingIdx = existing ? DEFAULT_STAGES.indexOf(existing) : -1
  return currentIdx > existingIdx ? current : existing
}

export function useProjectHome(project: Project, onProjectUpdated?: (project: Project) => void) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [allFiles, setAllFiles] = useState<FileRecord[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>('所有文件')
  const [classifying, setClassifying] = useState<number | null>(null)
  const [batchClassifying, setBatchClassifying] = useState(false)
  const [summaryVisible, setSummaryVisible] = useState(false)
  const [summaryContent, setSummaryContent] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [classifyProgress, setClassifyProgress] = useState<{ current: number; total: number } | null>(null)
  const [progressionModal, setProgressionModal] = useState<{
    open: boolean
    targetStage: string
    detectedType: string
  }>({ open: false, targetStage: '', detectedType: '' })
  const [progressionLoading, setProgressionLoading] = useState(false)
  const [criticalIssues, setCriticalIssues] = useState<number | null>(null)
  const batchCancelledRef = useRef(false)

  useEffect(() => {
    return () => { batchCancelledRef.current = true }
  }, [])

  const loadFiles = useCallback(async () => {
    const allResult = await fileService.list(project.id)
    if (allResult.success && allResult.data) {
      setAllFiles(allResult.data)
    }

    if (selectedCategory && selectedCategory !== '所有文件') {
      const result = await fileService.listByCategory(project.id, selectedCategory)
      if (result.success && result.data) {
        setFiles(result.data)
      } else {
        message.error('加载文件列表失败')
      }
    } else {
      setFiles(allResult.success ? allResult.data || [] : [])
    }
  }, [project.id, selectedCategory])

  const loadCriticalIssues = useCallback(async () => {
    try {
      const result = await window.api.file.getSummary(project.id)
      if (result.success && result.data) {
        const summary = result.data
        const criticalSection = summary.match(/关键问题[：:]\s*\n([\s\S]*?)(?=\n###|\n##|\n$|$)/i)
        if (criticalSection && criticalSection[1]) {
          const issues = criticalSection[1].match(/^[-*]\s+/gm)
          setCriticalIssues(issues ? issues.length : 0)
        } else {
          setCriticalIssues(0)
        }
      } else {
        setCriticalIssues(null)
      }
    } catch {
      setCriticalIssues(null)
    }
  }, [project.id])

  useEffect(() => {
    loadFiles()
    loadCriticalIssues()
  }, [loadFiles, loadCriticalIssues])

  const handleUpload = useCallback(async (file: File) => {
    try {
      const result = await fileService.upload(project.id, file)
      if (result.success) {
        message.success(`${file.name} 上传成功`)
        loadFiles()
      } else {
        message.error(result.error || '上传失败')
      }
    } catch (error) {
      message.error('上传失败')
      console.error(error)
    }
    return false
  }, [project.id, loadFiles])

  const handleDelete = useCallback(async (id: number) => {
    try {
      const result = await fileService.delete(id)
      if (result.success) {
        message.success('删除成功')
        loadFiles()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
      console.error(error)
    }
  }, [loadFiles])

  const handleClassify = useCallback(async (fileId: number) => {
    setClassifying(fileId)
    try {
      const result = await aiService.classify(fileId, project.category_type)
      if (result.success) {
        const data = typeof result.data === 'object' && result.data ? result.data : { category: result.data, stage: null, summary: null }
        const category = data.category
        const fileStage = 'stage' in data ? data.stage : null
        message.success(`分类结果：${category}`)

        if (fileStage) {
          const progression = checkStageProgression(project.current_stage, fileStage)
          if (progression) {
            setProgressionModal({
              open: true,
              targetStage: progression.targetStage,
              detectedType: progression.detectedType,
            })
          }
        }

        loadFiles()
      } else {
        message.error(result.error || '分类失败')
      }
    } catch (error) {
      message.error('分类失败')
      console.error(error)
    } finally {
      setClassifying(null)
    }
  }, [project.current_stage, loadFiles])

  const handleBatchClassify = useCallback(async () => {
    const uncategorizedFiles = files.filter(f => !f.category)
    if (uncategorizedFiles.length === 0) {
      message.info('所有文件已分类')
      return
    }

    batchCancelledRef.current = false
    setBatchClassifying(true)
    setClassifyProgress({ current: 0, total: uncategorizedFiles.length })
    let successCount = 0
    let failCount = 0
    let highestStage: string | null = null
    let highestDetectedType: string | null = null

    try {
      for (let i = 0; i < uncategorizedFiles.length; i++) {
        if (batchCancelledRef.current) break
        const file = uncategorizedFiles[i]
        setClassifyProgress({ current: i + 1, total: uncategorizedFiles.length })
        try {
          const result = await aiService.classify(file.id, project.category_type)
          if (result.success) {
            successCount++
            const data = typeof result.data === 'object' && result.data ? result.data : { category: result.data, stage: null, summary: null }
            const fileStage = 'stage' in data ? data.stage : null
            if (fileStage) {
              const prev: string | null = highestStage
              highestStage = getHighestStage(fileStage, highestStage)
              if (highestStage !== prev) {
                highestDetectedType = fileStage
              }
            }
          } else {
            failCount++
          }
        } catch {
          failCount++
        }
      }

      if (highestStage && highestDetectedType) {
        const progression = checkStageProgression(project.current_stage, highestStage)
        if (progression) {
          setProgressionModal({
            open: true,
            targetStage: progression.targetStage,
            detectedType: progression.detectedType,
          })
        }
      }

      if (failCount === 0) {
        message.success(`已分类 ${successCount} 个文件`)
      } else {
        message.warning(`${successCount} 个成功，${failCount} 个失败`)
      }
      loadFiles()
    } finally {
      setBatchClassifying(false)
      setClassifyProgress(null)
    }
  }, [files, project.current_stage, loadFiles])

  const handleBatchDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.info('请先选择文件')
      return
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个文件吗？此操作不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        let successCount = 0
        let failCount = 0

        for (const key of selectedRowKeys) {
          const id = key as number
          try {
            const result = await fileService.delete(id)
            if (result.success) {
              successCount++
            } else {
              failCount++
            }
          } catch {
            failCount++
          }
        }

        setSelectedRowKeys([])
        if (failCount === 0) {
          message.success(`已删除 ${successCount} 个文件`)
        } else {
          message.warning(`${successCount} 个成功，${failCount} 个失败`)
        }
        loadFiles()
      },
    })
  }, [selectedRowKeys, loadFiles])

  const handleBatchClassifySelected = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.info('请先选择文件')
      return
    }

    batchCancelledRef.current = false
    setBatchClassifying(true)
    setClassifyProgress({ current: 0, total: selectedRowKeys.length })
    let successCount = 0
    let failCount = 0
    let highestStage: string | null = null
    let highestDetectedType: string | null = null

    try {
      for (let i = 0; i < selectedRowKeys.length; i++) {
        if (batchCancelledRef.current) break
        const id = selectedRowKeys[i] as number
        setClassifyProgress({ current: i + 1, total: selectedRowKeys.length })
        try {
          const result = await aiService.classify(id, project.category_type)
          if (result.success) {
            successCount++
            const data = typeof result.data === 'object' && result.data ? result.data : { category: result.data, stage: null, summary: null }
            const fileStage = 'stage' in data ? data.stage : null
            if (fileStage) {
              const prev: string | null = highestStage
              highestStage = getHighestStage(fileStage, highestStage)
              if (highestStage !== prev) {
                highestDetectedType = fileStage
              }
            }
          } else {
            failCount++
          }
        } catch {
          failCount++
        }
      }

      if (highestStage && highestDetectedType) {
        const progression = checkStageProgression(project.current_stage, highestStage)
        if (progression) {
          setProgressionModal({
            open: true,
            targetStage: progression.targetStage,
            detectedType: progression.detectedType,
          })
        }
      }

      setSelectedRowKeys([])
      if (failCount === 0) {
        message.success(`已分类 ${successCount} 个文件`)
      } else {
        message.warning(`${successCount} 个成功，${failCount} 个失败`)
      }
      loadFiles()
    } finally {
      setBatchClassifying(false)
      setClassifyProgress(null)
    }
  }, [selectedRowKeys, project.current_stage, loadFiles])

  const handleStageChange = useCallback(async (fileId: number, newStage: string) => {
    try {
      const result = await fileService.updateCategory(fileId, newStage)
      if (result.success) {
        message.success(`文件已移动到「${newStage}」阶段`)
        loadFiles()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
      console.error(error)
    }
  }, [loadFiles])

  const handleConfirmProgression = useCallback(async () => {
    setProgressionLoading(true)
    try {
      const result = await projectService.update(project.id, {
        current_stage: progressionModal.targetStage,
      })
      if (result.success) {
        message.success(`项目阶段已推进到「${progressionModal.targetStage}」`)
        setProgressionModal({ open: false, targetStage: '', detectedType: '' })
        if (onProjectUpdated) {
          onProjectUpdated({ ...project, current_stage: progressionModal.targetStage })
        }
        loadFiles()
      } else {
        message.error(result.error || '推进失败')
      }
    } catch (error) {
      message.error('推进失败')
      console.error(error)
    } finally {
      setProgressionLoading(false)
    }
  }, [project, progressionModal.targetStage, loadFiles, onProjectUpdated])

  const handleManualProgression = useCallback(() => {
    const progression = checkStageProgression(project.current_stage, '')
    if (progression) {
      setProgressionModal({
        open: true,
        targetStage: progression.targetStage,
        detectedType: '手动推进',
      })
    } else {
      message.info('当前阶段已是最终阶段，无法继续推进')
    }
  }, [project.current_stage])

  const handleViewSummary = useCallback(async () => {
    try {
      const result = await window.api.file.getSummary(project.id)
      if (result.success && result.data) {
        setSummaryContent(result.data)
        setSummaryVisible(true)
      } else {
        message.info('暂无摘要，请先生成')
      }
    } catch {
      message.info('暂无摘要，请先生成')
    }
  }, [project.id])

  const handleGenerateSummary = useCallback(async () => {
    setAnalyzing(true)
    try {
      const result = await aiService.analyze(project.id)
      if (result.success) {
        message.success('分析完成')
        handleViewSummary()
      } else {
        const errMsg = typeof result.error === 'object' && result.error !== null
          ? (result.error as any).message || JSON.stringify(result.error)
          : result.error || '分析失败'
        message.error(errMsg)
      }
    } catch {
      message.error('分析失败')
    } finally {
      setAnalyzing(false)
    }
  }, [project.id, handleViewSummary])

  return {
    files,
    allFiles,
    selectedCategory,
    setSelectedCategory,
    classifying,
    batchClassifying,
    summaryVisible,
    setSummaryVisible,
    summaryContent,
    analyzing,
    selectedRowKeys,
    setSelectedRowKeys,
    classifyProgress,
    progressionModal,
    setProgressionModal,
    progressionLoading,
    criticalIssues,
    loadFiles,
    handleUpload,
    handleDelete,
    handleClassify,
    handleBatchClassify,
    handleBatchDelete,
    handleBatchClassifySelected,
    handleCancelBatchClassify: () => { batchCancelledRef.current = true },
    handleStageChange,
    handleConfirmProgression,
    handleManualProgression,
    handleViewSummary,
    handleGenerateSummary,
  }
}