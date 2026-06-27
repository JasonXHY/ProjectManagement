import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { message, Modal } from 'antd'
import { Project, FileRecord, checkStageProgression, STAGE_PROGRESSION_RULES, DEFAULT_STAGES } from '../../types'
import { fileService } from '../../services/fileService'
import { aiService } from '../../services/aiService'
import { projectService } from '../../services/projectService'
import { isApiError } from '../../utils/error'

function getHighestStage(current: string | null, existing: string | null): string | null {
  if (!current) return existing
  const currentIdx = DEFAULT_STAGES.indexOf(current)
  const existingIdx = existing ? DEFAULT_STAGES.indexOf(existing) : -1
  return currentIdx > existingIdx ? current : existing
}

export function useProjectHome(project: Project, onProjectUpdated?: (project: Project) => void) {
  const [allFiles, setAllFiles] = useState<FileRecord[]>([])
  const [filesLoading, setFilesLoading] = useState(true)
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

  // 监听后端自动分类触发的阶段推进事件
  useEffect(() => {
    window.api.project.onStageProgressionNeeded((data) => {
      if (data.projectId === project.id) {
        setProgressionModal({
          open: true,
          targetStage: data.targetStage,
          detectedType: data.detectedType,
        })
      }
    })
    return () => {
      window.api.project.removeStageProgressionListener()
    }
  }, [project.id])

  const loadFiles = useCallback(async () => {
    setFilesLoading(true)
    try {
      const allResult = await fileService.list(project.id)
      if (allResult.success && allResult.data) {
        setAllFiles(allResult.data)
      }
    } finally {
      setFilesLoading(false)
    }
  }, [project.id])

  // files 由 allFiles + selectedCategory 派生，不再触发 IPC
  const files = useMemo(() => {
    if (!selectedCategory || selectedCategory === '所有文件') return allFiles
    if (selectedCategory === '未分类') {
      return allFiles.filter(f => !f.category || f.category === '未分类')
    }
    return allFiles.filter(f => f.category === selectedCategory)
  }, [allFiles, selectedCategory])

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

    // 并行分类配置
    const CONCURRENCY_LIMIT = 3 // 并发数限制，避免AI限流
    const batchSize = Math.min(CONCURRENCY_LIMIT, uncategorizedFiles.length)

    try {
      // 分批并行处理
      for (let i = 0; i < uncategorizedFiles.length; i += batchSize) {
        if (batchCancelledRef.current) break

        const batch = uncategorizedFiles.slice(i, i + batchSize)
        const batchPromises = batch.map(async (file, batchIndex) => {
          if (batchCancelledRef.current) return null

          try {
            const result = await aiService.classify(file.id, project.category_type)
            if (result.success) {
              const data = typeof result.data === 'object' && result.data ? result.data : { category: result.data, stage: null, summary: null }
              const fileStage = 'stage' in data ? data.stage : null
              return { success: true, fileStage }
            }
            return { success: false, fileStage: null }
          } catch {
            return { success: false, fileStage: null }
          }
        })

        const batchResults = await Promise.all(batchPromises)

        // 处理批次结果
        batchResults.forEach(result => {
          if (result === null) return
          if (result.success) {
            successCount++
            if (result.fileStage) {
              const prev: string | null = highestStage
              highestStage = getHighestStage(result.fileStage, highestStage)
              if (highestStage !== prev) {
                highestDetectedType = result.fileStage
              }
            }
          } else {
            failCount++
          }
        })

        // 更新进度
        setClassifyProgress({ current: Math.min(i + batchSize, uncategorizedFiles.length), total: uncategorizedFiles.length })
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

  const handleStageChange = useCallback(async (fileId: number, newStage: string, subcategory?: string | null) => {
    try {
      const result = await fileService.updateCategory(fileId, newStage, subcategory)
      if (result.success) {
        const label = subcategory ? `「${newStage} / ${subcategory}」` : `「${newStage}」阶段`
        message.success(`文件已移动到${label}`)
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
    for (const rule of Object.values(STAGE_PROGRESSION_RULES)) {
      if (project.current_stage === rule.from) {
        setProgressionModal({
          open: true,
          targetStage: rule.to,
          detectedType: '手动推进',
        })
        return
      }
    }
    console.warn('[手动推进] 未找到匹配规则, current_stage:', project.current_stage)
    message.info('当前阶段已是最终阶段，无法继续推进')
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
        const errMsg = isApiError(result.error)
          ? result.error.message
          : typeof result.error === 'string'
          ? result.error
          : '分析失败'
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
    filesLoading,
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