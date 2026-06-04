import { useState, useEffect, useCallback } from "react";
import { Card, Button, Upload, Modal, Form, Select, message, Spin, Space } from "antd";
import {
  UploadOutlined,
  ArrowLeftOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload";
import type { File, ProjectStage } from "../../types";
import {
  FILE_CATEGORY_LABELS,
  getFilesByProject,
  updateFileCategory,
  deleteFile,
  uploadFileWithAutoClassify,
} from "../../services/fileService";
import type { FileCategory } from "../../services/fileService";
import FileList from "./FileList";

/** 文件管理页面属性 */
interface FileManagerProps {
  projectId: number;
  projectName?: string;
  stage?: string;  // 当前阶段
  onBack?: () => void;
  onChat?: () => void;
}

/**
 * 文件管理页面 - 简化版本
 * 直接上传文件，AI自动分类，无需用户确认
 */
export default function FileManager({
  projectId,
  projectName,
  stage,
  onBack,
  onChat,
}: FileManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [categoryForm] = Form.useForm<{ category: FileCategory }>();

  /** 加载文件列表 */
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFilesByProject(projectId, stage);
      setFiles(data);
    } catch {
      message.error("加载文件列表失败");
    } finally {
      setLoading(false);
    }
  }, [projectId, stage]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  /** 处理文件上传 - 简化版本，直接AI分类 */
  const handleUpload = async (file: UploadFile) => {
    if (!file.originFileObj) return false;

    try {
      await uploadFileWithAutoClassify(projectId, projectName || "", file.originFileObj);
      message.success(`文件 ${file.name} 上传成功`);
      await loadFiles();
    } catch (error) {
      console.error("上传失败:", error);
      message.error(`文件 ${file.name} 上传失败`);
    }
    return false;
  };

  /** 处理预览 */
  const handlePreview = (file: File) => {
    Modal.info({
      title: file.name,
      content: (
        <div>
          <p>
            <strong>路径：</strong>
            {file.path}
          </p>
          <p>
            <strong>版本：</strong>v{file.version}
          </p>
          <p>
            <strong>分类：</strong>
            {file.category
              ? FILE_CATEGORY_LABELS[file.category as FileCategory] ||
                file.category
              : "未分类"}
          </p>
          <p>
            <strong>更新时间：</strong>
            {file.updated_at
              ? new Date(file.updated_at).toLocaleString("zh-CN")
              : "N/A"}
          </p>
        </div>
      ),
      width: 500,
    });
  };

  /** 处理编辑 */
  const handleEdit = (file: File) => {
    message.info(`编辑文件：${file.name}`);
  };

  /** 处理修改分类 */
  const handleCategorize = (file: File) => {
    setSelectedFile(file);
    categoryForm.setFieldsValue({
      category: (file.category as FileCategory) || "other",
    });
    setCategoryModalOpen(true);
  };

  /** 确认修改分类 */
  const handleCategorizeConfirm = async () => {
    if (!selectedFile) return;
    try {
      const values = await categoryForm.validateFields();
      await updateFileCategory({
        id: selectedFile.id!,
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
  const handleVersionHistory = (file: File) => {
    Modal.info({
      title: `${file.name} - 版本历史`,
      content: (
        <div>
          <p>当前版本：v{file.version}</p>
          <p>版本历史功能即将上线</p>
        </div>
      ),
    });
  };

  /** 处理打开文件夹 */
  const handleOpenFolder = (file: File) => {
    message.info(`打开文件夹：${file.path}`);
  };

  /** 处理删除文件 */
  const handleDelete = async (fileId: number) => {
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
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回项目列表
        </Button>
        <Button icon={<CommentOutlined />} onClick={onChat}>
          对话
        </Button>
      </Space>

      {/* 文件列表 */}
      <Card
        title={`文件列表${stage ? ` - ${stage}` : ""}`}
        extra={
          <Upload
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button type="primary" icon={<UploadOutlined />}>
              上传文件
            </Button>
          </Upload>
        }
      >
        <Spin spinning={loading}>
          <FileList
            files={files}
            stage={(stage as ProjectStage) || "progress"}
            onPreview={handlePreview}
            onEdit={handleEdit}
            onCategorize={handleCategorize}
            onVersionHistory={handleVersionHistory}
            onOpenFolder={handleOpenFolder}
            onDelete={handleDelete}
          />
        </Spin>
      </Card>

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
    </div>
  );
}
