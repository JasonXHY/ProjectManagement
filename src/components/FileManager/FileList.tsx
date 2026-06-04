import { Table, Tag, Button, Dropdown, Empty } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  MoreOutlined,
  SwapOutlined,
  TagsOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ManagedFile, FileCategory } from "../../services/fileService";
import { FILE_CATEGORY_LABELS } from "../../services/fileService";
import type { ProjectStage } from "../../types";
import { PROJECT_STAGES } from "../../types";

/** 文件分类颜色映射 */
const CATEGORY_COLORS: Record<FileCategory, string> = {
  requirement: "blue",
  design: "purple",
  development: "green",
  test: "orange",
  deployment: "cyan",
  other: "default",
};

/** 文件列表属性 */
interface FileListProps {
  files: ManagedFile[];
  stage: ProjectStage;
  onPreview: (file: ManagedFile) => void;
  onEdit: (file: ManagedFile) => void;
  onMove: (file: ManagedFile) => void;
  onCategorize: (file: ManagedFile) => void;
  onVersionHistory: (file: ManagedFile) => void;
  onOpenFolder: (file: ManagedFile) => void;
  onDelete: (fileId: string) => void;
}

/**
 * 文件列表组件
 * 显示文件列表，包含：文件名、版本、更新时间、分类，以及操作按钮
 */
export default function FileList({
  files,
  stage,
  onPreview,
  onEdit,
  onMove,
  onCategorize,
  onVersionHistory,
  onOpenFolder,
  onDelete,
}: FileListProps) {
  /** 格式化文件大小 */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /** 格式化日期 */
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: ColumnsType<ManagedFile> = [
    {
      title: "文件名",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      width: "30%",
    },
    {
      title: "版本",
      dataIndex: "version",
      key: "version",
      width: 100,
      render: (version: string) => <Tag>{version}</Tag>,
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (date: string) => formatDate(date),
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      defaultSortOrder: "descend",
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category: FileCategory) => (
        <Tag color={CATEGORY_COLORS[category]}>
          {FILE_CATEGORY_LABELS[category]}
        </Tag>
      ),
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      width: 100,
      render: (size: number) => formatFileSize(size),
      sorter: (a, b) => a.size - b.size,
    },
    {
      title: "操作",
      key: "actions",
      width: 60,
      render: (_: unknown, record: ManagedFile) => {
        const menuItems = [
          {
            key: "preview",
            icon: <EyeOutlined />,
            label: "预览",
            onClick: () => onPreview(record),
          },
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "编辑",
            onClick: () => onEdit(record),
          },
          {
            key: "move",
            icon: <SwapOutlined />,
            label: "移动到阶段",
            onClick: () => onMove(record),
          },
          {
            key: "categorize",
            icon: <TagsOutlined />,
            label: "修改分类",
            onClick: () => onCategorize(record),
          },
          {
            key: "history",
            icon: <HistoryOutlined />,
            label: "版本历史",
            onClick: () => onVersionHistory(record),
          },
          {
            key: "folder",
            icon: <FolderOpenOutlined />,
            label: "打开文件夹",
            onClick: () => onOpenFolder(record),
          },
          { type: "divider" as const },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "删除",
            danger: true,
            onClick: () => {
              void onDelete(record.id);
            },
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  const filteredFiles = files.filter((f) => f.stage === stage);

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        {PROJECT_STAGES[stage]} - 文件列表
        <Tag style={{ marginLeft: 8 }}>{filteredFiles.length} 个文件</Tag>
      </div>
      <Table
        columns={columns}
        dataSource={filteredFiles}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 个文件` }}
        locale={{
          emptyText: (
            <Empty description="该阶段暂无文件" />
          ),
        }}
      />
    </>
  );
}
