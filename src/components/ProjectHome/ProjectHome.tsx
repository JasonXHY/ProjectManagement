import { useCallback, useState } from 'react'
import { Progress, Button } from 'antd'
import {
  FolderOpenOutlined,
  FolderOutlined,
  TagsOutlined,
  RocketOutlined,
  ShareAltOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { Project } from '../../types'
import { fileService } from '../../services/fileService'
import StageProgressionModal from '../StageProgressionModal'
import AISummaryModal from './AISummaryModal'
import ProjectInfoCard from './ProjectInfoCard'
import StageSidebar from './StageSidebar'
import SummaryRow from './SummaryRow'
import FeatureCards from './FeatureCards'
import FileListTable from './FileListTable'
import BatchActionBar from './BatchActionBar'
import UploadArea from './UploadArea'
import HandoverDialog from '../Handover/HandoverDialog'
import { useProjectHome } from './projectHome.hooks'

interface ProjectHomeProps {
  project: Project
  onProjectUpdated?: (project: Project) => void
}

export default function ProjectHome({ project, onProjectUpdated }: ProjectHomeProps) {
  const {
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
    loadFiles,
    handleUpload,
    handleDelete,
    handleClassify,
    handleBatchClassify,
    handleBatchDelete,
    handleBatchClassifySelected,
    handleStageChange,
    handleConfirmProgression,
    handleManualProgression,
    handleCancelBatchClassify,
    handleViewSummary,
    handleGenerateSummary,
  } = useProjectHome(project, onProjectUpdated)

  const [handoverVisible, setHandoverVisible] = useState(false)

  const handleOpenFolder = useCallback(async () => {
    await fileService.openFolder(project.id)
  }, [project.id])

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      <StageSidebar
        files={allFiles}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onUpload={handleUpload}
        onOpenFolder={handleOpenFolder}
        customStages={(() => {
          if (!project.custom_stages) return undefined
          try {
            const parsed = JSON.parse(project.custom_stages)
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined
          } catch {
            return undefined
          }
        })()}
      />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '24px' }}>
        <SummaryRow
          project={project}
          files={allFiles}
          analyzing={analyzing}
          onViewSummary={handleViewSummary}
          onGenerateSummary={handleGenerateSummary}
        />

        <FeatureCards
          project={project}
          selectedCategory={selectedCategory}
          allFiles={allFiles}
        />

        {/* ProjectInfoCard 已隐藏，使用 FeatureCards 中的 ProjectInfoPlaceholderCard */}

        {selectedCategory === '所有文件' && <UploadArea onUpload={handleUpload} />}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{selectedCategory || '所有文件'}</span>
              <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 400, marginLeft: '6px' }}>
                ({files.length})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="text" size="small" icon={<FolderOpenOutlined />} onClick={handleOpenFolder}>打开文件夹</Button>
              <Button type="text" size="small" icon={<FolderOutlined />} onClick={loadFiles}>刷新</Button>
              <Button
                type="default"
                size="small"
                icon={<TagsOutlined />}
                loading={batchClassifying}
                disabled={files.filter(f => !f.category).length === 0}
                onClick={handleBatchClassify}
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                一键分类({files.filter(f => !f.category).length})
              </Button>
              {batchClassifying && classifyProgress && (
                <>
                  <Progress
                    percent={Math.round((classifyProgress.current / classifyProgress.total) * 100)}
                    size="small"
                    style={{ width: 120 }}
                    format={() => `${classifyProgress.current}/${classifyProgress.total}`}
                  />
                  <Button
                    danger
                    size="small"
                    icon={<StopOutlined />}
                    onClick={handleCancelBatchClassify}
                  >
                    取消
                  </Button>
                </>
              )}
              <Button
                size="small"
                icon={<ShareAltOutlined />}
                onClick={() => setHandoverVisible(true)}
              >
                转交项目
              </Button>
              {project.current_stage !== '关闭' && (
                <Button type="primary" size="small" icon={<RocketOutlined />} onClick={handleManualProgression}>
                  推进到下一阶段
                </Button>
              )}
            </div>
          </div>

          <BatchActionBar
            selectedCount={selectedRowKeys.length}
            batchClassifying={batchClassifying}
            classifyProgress={classifyProgress}
            onBatchClassify={handleBatchClassifySelected}
            onBatchDelete={handleBatchDelete}
            onCancelBatch={handleCancelBatchClassify}
          />

          <FileListTable
            files={files}
            classifying={classifying}
            loading={filesLoading}
            onClassify={handleClassify}
            onDelete={handleDelete}
            onStageChange={handleStageChange}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
            onUpload={handleUpload}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>

      

      <AISummaryModal
        open={summaryVisible}
        onClose={() => setSummaryVisible(false)}
        summary={summaryContent || ''}
      />

      <StageProgressionModal
        open={progressionModal.open}
        project={project}
        detectedFileType={progressionModal.detectedType}
        targetStage={progressionModal.targetStage}
        onConfirm={handleConfirmProgression}
        onCancel={() => setProgressionModal({ open: false, targetStage: '', detectedType: '' })}
        loading={progressionLoading}
      />

      <HandoverDialog
        open={handoverVisible}
        onClose={() => setHandoverVisible(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  )
}