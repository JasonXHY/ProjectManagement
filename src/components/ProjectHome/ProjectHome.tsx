import { useCallback, useState } from 'react'
import { Modal, Progress, Button } from 'antd'
import {
  FolderOpenOutlined,
  FolderOutlined,
  TagsOutlined,
  RocketOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { Project } from '../../types'
import { fileService } from '../../services/fileService'
import StageProgressionModal from '../StageProgressionModal'
import ProjectInfoCard from './ProjectInfoCard'
import StageSidebar from './StageSidebar'
import SummaryRow from './SummaryRow'
import FeatureCards from './FeatureCards'
import FileListTable from './FileListTable'
import BatchActionBar from './BatchActionBar'
import UploadArea from './UploadArea'
import MarkdownPreview from '../MarkdownPreview'
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
    selectedCategory,
    setSelectedCategory,
    classifying,
    batchClassifying,
    summaryVisible,
    setSummaryVisible,
    summaryContent,
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
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <SummaryRow
          project={project}
          files={allFiles}
          onViewSummary={handleViewSummary}
          onGenerateSummary={handleGenerateSummary}
        />

        <FeatureCards
          project={project}
          selectedCategory={selectedCategory}
          allFiles={allFiles}
        />

        <ProjectInfoCard metadata={project.metadata} />

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
                <Progress
                  percent={Math.round((classifyProgress.current / classifyProgress.total) * 100)}
                  size="small"
                  style={{ width: 120 }}
                  format={() => `${classifyProgress.current}/${classifyProgress.total}`}
                />
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

      

      <Modal title="项目摘要" open={summaryVisible} onCancel={() => setSummaryVisible(false)} footer={null} width={800}>
        <MarkdownPreview content={summaryContent || '暂无摘要'} />
      </Modal>

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