import { useState, useCallback } from "react";
import { Upload, Button, List, Tag, Typography, message } from "antd";
import {
  FileOutlined,
  DeleteOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Dragger } = Upload;
const { Text } = Typography;

/** 已上传文件信息 */
export interface UploadedFile {
  name: string;
  size: number;
  content: string;
}

/** 允许上传的文件类型 */
const ALLOWED_FILE_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

/** 最大文件大小：10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 上传区域属性 */
interface UploadZoneProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

/** 格式化文件大小 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 上传区域组件
 * 支持拖拽上传文本文件，读取文件内容用于AI对话
 */
export default function UploadZone({
  files,
  onFilesChange,
  disabled = false,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  /** 校验文件是否允许上传 */
  const validateFile = (file: globalThis.File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      message.error(`文件 ${file.name} 超过 10MB 大小限制`);
      return false;
    }
    if (
      ALLOWED_FILE_TYPES.length > 0 &&
      !ALLOWED_FILE_TYPES.includes(file.type)
    ) {
      message.error(`文件 ${file.name} 类型不支持，仅支持文本文件`);
      return false;
    }
    return true;
  };

  /** 读取文件内容 */
  const readFileContent = (file: globalThis.File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  /** 处理文件选择 */
  const handleBeforeUpload: UploadProps["beforeUpload"] = useCallback(
    async (file: globalThis.File) => {
      if (!validateFile(file)) return false;
      try {
        const content = await readFileContent(file);
        const newFile: UploadedFile = {
          name: file.name,
          size: file.size,
          content,
        };
        onFilesChange([...files, newFile]);
        message.success(`已添加文件: ${file.name}`);
      } catch {
        message.error(`读取文件失败: ${file.name}`);
      }
      return false;
    },
    [files, onFilesChange],
  );

  /** 删除文件 */
  const handleRemove = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange],
  );

  /** 拖拽事件处理 */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles: globalThis.File[] = Array.from(
        e.dataTransfer.files,
      );
      const newFiles: UploadedFile[] = [];
      for (const file of droppedFiles) {
        if (!validateFile(file)) continue;
        try {
          const content = await readFileContent(file);
          newFiles.push({
            name: file.name,
            size: file.size,
            content,
          });
        } catch {
          message.error(`读取文件失败: ${file.name}`);
        }
      }
      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
        message.success(`已添加 ${newFiles.length} 个文件`);
      }
    },
    [files, onFilesChange],
  );

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* 拖拽上传区域 */}
      <Dragger
        multiple
        beforeUpload={handleBeforeUpload}
        showUploadList={false}
        disabled={disabled}
        className="!p-0"
        openFileDialogOnClick={true}
      >
        <div
          className={`p-4 transition-colors ${isDragOver ? "bg-blue-50" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="flex items-center justify-center gap-2 text-gray-500 mb-0">
            <PaperClipOutlined />
            <Text type="secondary">
              拖拽文件到此处或点击上传文档（用于AI对话上下文）
            </Text>
          </p>
        </div>
      </Dragger>

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="px-4 pb-3">
          <List
            size="small"
            dataSource={files}
            renderItem={(file, index) => (
              <List.Item
                className="!py-1.5"
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileOutlined className="text-blue-400" />}
                  title={
                    <Text ellipsis className="!text-sm">
                      {file.name}
                    </Text>
                  }
                  description={
                    <Tag color="blue" className="!text-xs">
                      {formatFileSize(file.size)}
                    </Tag>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
}
