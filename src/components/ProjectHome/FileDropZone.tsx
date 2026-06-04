import { useState, useCallback } from "react";
import { Upload, message, Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload";

const { Dragger } = Upload;
const { Text } = Typography;

interface FileDropZoneProps {
  projectId: number;
  projectName: string;
  onUploadComplete: () => void;
}

export default function FileDropZone({
  projectId,
  projectName,
  onUploadComplete,
}: FileDropZoneProps) {
  const [uploading, setUploading] = useState(false);

  /** 处理文件上传 */
  const handleUpload = useCallback(
    async (file: UploadFile) => {
      if (!file.originFileObj) return false;

      setUploading(true);
      try {
        // 调用AI自动分类上传
        // await uploadFileWithAutoClassify(projectId, projectName, file.originFileObj);
        message.success(`文件 ${file.name} 上传成功`);
        onUploadComplete();
      } catch (error) {
        message.error(`文件 ${file.name} 上传失败`);
      } finally {
        setUploading(false);
      }
      return false;
    },
    [projectId, projectName, onUploadComplete]
  );

  return (
    <Dragger
      multiple
      showUploadList={false}
      beforeUpload={handleUpload}
      disabled={uploading}
      style={{ padding: "40px 0" }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        <Text strong>拖拽文件到此处上传</Text>
      </p>
      <p className="ant-upload-hint">
        <Text type="secondary">AI将自动分类文件到对应阶段</Text>
      </p>
    </Dragger>
  );
}
