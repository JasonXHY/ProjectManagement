import { useState, useEffect } from "react";
import { Modal, Button, Spin, Tag, Typography, Space, Select } from "antd";
import { CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import type { ClassificationResult } from "../../types";
import { FILE_CATEGORY_LABELS } from "../../services/fileService";
import type { FileCategory } from "../../services/fileService";

const { Text, Paragraph } = Typography;

interface ClassifyModalProps {
  visible: boolean;
  fileName: string;
  classification: ClassificationResult | null;
  loading: boolean;
  onConfirm: (category: string) => void;
  onCancel: () => void;
}

export default function ClassifyModal({
  visible,
  fileName,
  classification,
  loading,
  onConfirm,
  onCancel,
}: ClassifyModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    if (classification) {
      setSelectedCategory(classification.category);
    }
  }, [classification]);

  const handleConfirm = () => {
    if (selectedCategory) {
      onConfirm(selectedCategory);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    if (classification) {
      setSelectedCategory(classification.category);
    }
  };

  return (
    <Modal
      title="AI文件分类"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>正在分析文件内容...</Text>
          </div>
        </div>
      ) : classification ? (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>文件名：</Text>
            <Text>{fileName}</Text>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>文件类型：</Text>
            <Tag color="blue">{classification.file_type}</Tag>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>内容摘要：</Text>
            <Paragraph ellipsis={{ rows: 2, expandable: true }}>
              {classification.summary}
            </Paragraph>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>AI分类建议：</Text>
            <div style={{ marginTop: 8 }}>
              {editMode ? (
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: "100%" }}
                >
                  {(Object.keys(FILE_CATEGORY_LABELS) as FileCategory[]).map((key) => (
                    <Select.Option key={key} value={key}>
                      {FILE_CATEGORY_LABELS[key]}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <Tag
                  color="green"
                  icon={<CheckCircleOutlined />}
                  style={{ fontSize: 14, padding: "4px 12px" }}
                >
                  {FILE_CATEGORY_LABELS[selectedCategory as FileCategory] || selectedCategory}
                </Tag>
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                置信度：{(classification.confidence * 100).toFixed(0)}%
              </Text>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <Space>
              {editMode ? (
                <>
                  <Button onClick={handleCancelEdit}>取消</Button>
                  <Button type="primary" onClick={handleConfirm}>
                    确认
                  </Button>
                </>
              ) : (
                <>
                  <Button icon={<EditOutlined />} onClick={handleEdit}>
                    修改分类
                  </Button>
                  <Button type="primary" onClick={handleConfirm}>
                    确认使用
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Text type="secondary">无法获取分类结果</Text>
        </div>
      )}
    </Modal>
  );
}
