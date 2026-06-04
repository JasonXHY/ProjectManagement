import { useState, useEffect, useCallback } from "react";
import { Card, Button, Upload, Modal, Form, Select, message, Spin, Space } from "antd";
import {
  UploadOutlined,
  InboxOutlined,
  ArrowLeftOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload";
import type { ProjectStage } from "../../types";
import { PROJECT_STAGES } from "../../types";
import type { ManagedFile } from "../../services/fileService";
import {
  FILE_CATEGORY_LABELS,
  getFilesByProject,
  createFile,
  updateFileCategory,
  updateFileStage,
  deleteFile,
} from "../../services/fileService";
import type { FileCategory } from "../../services/fileService";
import StageList from "./StageList";
import FileList from "./FileList";

/** 文件管理页面属性 */
interface FileManagerProps {
  projectId: string;
  onBack?: () => void;
  onChat?: () => void;
}

/**
 * 文件管理页面
 * 左侧显示项目阶段列表，右侧显示对应阶段的文件列表
 */
export default function FileManager({ projectId, onBack, onChat }: FileManagerProps) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [selectedStage, setSelectedStage] = useState<ProjectStage | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ManagedFile | null>(null);
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);

  const [categoryForm] = Form.useForm<{ category: FileCategory }>();
  const [moveForm] = Form.useForm<{ stage: ProjectStage }>();

  /** 加载文件列表 */
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFilesByProject(projectId);
      setFiles(data);
    } catch {
      message.error("加载文件列表失败");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  /** 处理阶段选择 */
  const handleSelectStage = (stage: ProjectStage) => {
    setSelectedStage(stage);
  };

  /** 处理文件上传 */
  const handleUpload = async () => {
    if (!selectedStage || uploadFileList.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const file of uploadFileList) {
      if (file.originFileObj) {
        try {
          await createFile({
            projectId,
            name: file.name ?? "未知文件",
            path: `/projects/${projectId}/${file.name}`,
            size: file.size ?? 0,
            mimeType: file.type ?? "application/octet-stream",
            stage: selectedStage,
            category: "other",
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
    }

    if (failCount === 0) {
      message.success(`成功上传 ${successCount} 个文件`);
    } else if (successCount === 0) {
      message.error(`全部 ${failCount} 个文件上传失败`);
    } else {
      message.warning(`上传完成：${successCount} 个成功，${failCount} 个失败`);
    }

    setUploadModalOpen(false);
    setUploadFileList([]);
    await loadFiles();
  };

  /** 处理预览 */
  const handlePreview = (file: ManagedFile) => {
    Modal.info({
      title: file.name,
      content: (
        <div>
          <p><strong>路径：</strong>{file.path}</p>
          <p><strong>大小：</strong>{file.size} bytes</p>
          <p><strong>版本：</strong>{file.version}</p>
          <p><strong>分类：</strong>{FILE_CATEGORY_LABELS[file.category]}</p>
          <p><strong>更新时间：</strong>{new Date(file.updatedAt).toLocaleString("zh-CN")}</p>
        </div>
      ),
      width: 500,
    });
  };

  /** 处理编辑 */
  const handleEdit = (file: ManagedFile) => {
    message.info(`编辑文件：${file.name}`);
  };

  /** 处理移动阶段 */
  const handleMove = (file: ManagedFile) => {
    setSelectedFile(file);
    moveForm.setFieldsValue({ stage: file.stage });
    setMoveModalOpen(true);
  };

  /** 确认移动 */
  const handleMoveConfirm = async () => {
    if (!selectedFile) return;
    try {
      const values = await moveForm.validateFields();
      await updateFileStage({
        id: selectedFile.id,
        stage: values.stage,
      });
      void loadFiles();
      message.success("文件已移动");
      setMoveModalOpen(false);
    } catch {
      message.error("移动文件失败");
    }
  };

  /** 处理修改分类 */
  const handleCategorize = (file: ManagedFile) => {
    setSelectedFile(file);
    categoryForm.setFieldsValue({ category: file.category });
    setCategoryModalOpen(true);
  };

  /** 确认修改分类 */
  const handleCategorizeConfirm = async () => {
    if (!selectedFile) return;
    try {
      const values = await categoryForm.validateFields();
      await updateFileCategory({
        id: selectedFile.id,
        category: values.category,
      });
      void loadFiles();
      message.success("分类已更新");
      setCategoryModalOpen(false);
    } catch {
      message.error("修改分类失败");
    }
  };

  /** 处理版本历史 */
  const handleVersionHistory = (file: ManagedFile) => {
    Modal.info({
      title: `${file.name} - 版本历史`,
      content: (
        <div>
          <p>当前版本：{file.version}</p>
          <p>版本历史功能即将上线</p>
        </div>
      ),
    });
  };

  /** 处理打开文件夹 */
  const handleOpenFolder = (file: ManagedFile) => {
    message.info(`打开文件夹：${file.path}`);
  };

  /** 处理删除文件 */
  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      message.success("文件已删除");
    } catch {
      message.error("删除文件失败");
    } finally {
      await loadFiles();
    }
  };

  return (
    <div>
      {/* 导航栏 */}
      <Space className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
        >
          返回项目列表
        </Button>
        <Button
          icon={<CommentOutlined />}
          onClick={onChat}
        >
          对话
        </Button>
      </Space>
      <div style={{ display: "flex", gap: 16, height: "calc(100vh - 260px)" }}>
      {/* 左侧：阶段列表 */}
      <Card
        title="项目阶段"
        style={{ width: 280, flexShrink: 0 }}
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={loading}>
          <StageList
            selectedStage={selectedStage}
            onSelectStage={handleSelectStage}
            files={files}
          />
        </Spin>
      </Card>

      {/* 右侧：文件列表 */}
      <Card
        title="文件列表"
        style={{ flex: 1 }}
        extra={
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalOpen(true)}
            disabled={!selectedStage}
          >
            上传文件
          </Button>
        }
      >
        <Spin spinning={loading}>
          {selectedStage ? (
            <FileList
              files={files}
              stage={selectedStage}
              onPreview={handlePreview}
              onEdit={handleEdit}
              onMove={handleMove}
              onCategorize={handleCategorize}
              onVersionHistory={handleVersionHistory}
              onOpenFolder={handleOpenFolder}
              onDelete={handleDelete}
            />
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
              请在左侧选择一个项目阶段
            </div>
          )}
        </Spin>
      </Card>

      {/* 上传文件弹窗 */}
      <Modal
        title={`上传文件 - ${selectedStage ? PROJECT_STAGES[selectedStage] : ""}`}
        open={uploadModalOpen}
        onOk={() => void handleUpload()}
        onCancel={() => {
          setUploadModalOpen(false);
          setUploadFileList([]);
        }}
        okText="上传"
        cancelText="取消"
        okButtonProps={{ disabled: uploadFileList.length === 0 }}
      >
        <Upload.Dragger
          multiple
          fileList={uploadFileList}
          onChange={({ fileList }) => setUploadFileList(fileList)}
          beforeUpload={() => false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持单个或批量上传</p>
        </Upload.Dragger>
      </Modal>

      {/* 修改分类弹窗 */}
      <Modal
        title="修改文件分类"
        open={categoryModalOpen}
        onOk={() => void handleCategorizeConfirm()}
        onCancel={() => setCategoryModalOpen(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item
            name="category"
            label="文件分类"
            rules={[{ required: true, message: "请选择文件分类" }]}
          >
            <Select placeholder="请选择文件分类">
              {(Object.keys(FILE_CATEGORY_LABELS) as FileCategory[]).map(
                (key) => (
                  <Select.Option key={key} value={key}>
                    {FILE_CATEGORY_LABELS[key]}
                  </Select.Option>
                ),
              )}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 移动文件弹窗 */}
      <Modal
        title="移动文件到其他阶段"
        open={moveModalOpen}
        onOk={() => void handleMoveConfirm()}
        onCancel={() => setMoveModalOpen(false)}
        okText="确认移动"
        cancelText="取消"
      >
        <Form form={moveForm} layout="vertical">
          <Form.Item
            name="stage"
            label="目标阶段"
            rules={[{ required: true, message: "请选择目标阶段" }]}
          >
            <Select placeholder="请选择目标阶段">
              {(Object.keys(PROJECT_STAGES) as ProjectStage[]).map((key) => (
                <Select.Option key={key} value={key}>
                  {PROJECT_STAGES[key]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
    </div>
  );
}
