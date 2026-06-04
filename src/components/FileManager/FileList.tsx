import { Table, Tag, Button, Dropdown, Empty } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  MoreOutlined,
  TagsOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { FileCategory } from "../../services/fileService";
import { FILE_CATEGORY_LABELS } from "../../services/fileService";
import type { File, ProjectStage } from "../../types";
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
  files: File[];
  stage: ProjectStage;
  onPreview: (file: File) => void;
  onEdit: (file: File) => void;
  onCategorize: (file: File) => void;
  onVersionHistory: (file: File) => void;
  onOpenFolder: (file: File) => void;
  onDelete: (fileId: number) => void;
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
  onCategorize,
  onVersionHistory,
  onOpenFolder,
  onDelete,
}: FileListProps) {
  /** 格式化日期 */
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: ColumnsType<File> = [
    {
      title: "文件名",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      width: "35%",
    },
    {
      title: "版本",
      dataIndex: "version",
      key: "version",
      width: 80,
      render: (version: number) => <Tag>v{version}</Tag>,
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 180,
      render: (date: string | null) => formatDate(date),
      sorter: (a, b) =>
        new Date(a.updated_at || 0).getTime() -
        new Date(b.updated_at || 0).getTime(),
      defaultSortOrder: "descend",
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category: string | null) => {
        if (!category) return <Tag>未分类</Tag>;
        const label =
          FILE_CATEGORY_LABELS[category as FileCategory] || category;
        const color =
          CATEGORY_COLORS[category as FileCategory] || "default";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 60,
      render: (_: unknown, record: File) => {
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
              void onDelete(record.id!);
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

  const filteredFiles = files.filter((f) => f.category === stage);

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
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个文件`,
        }}
        locale={{
          emptyText: <Empty description="该阶段暂无文件" />,
        }}
      />
    </>
  );
}
