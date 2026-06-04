import { useMemo } from "react";
import { Table, Tag, Space, Button, Popconfirm, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Project, ProjectStage } from "../../types";
import { PROJECT_STAGES } from "../../types";

const { Text } = Typography;

/** 项目阶段颜色映射 */
const STAGE_COLOR_MAP: Record<ProjectStage, string> = {
  blueprint: "blue",
  startup: "orange",
  presale: "cyan",
  progress: "processing",
  acceptance: "purple",
  halted: "red",
  ended: "default",
};

/** 项目阶段标签映射 */
const STAGE_LABEL_MAP: Record<ProjectStage, string> = PROJECT_STAGES;

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  onEdit: (project: Project) => void;
  onDelete: (id: number) => void;
  onManage: (project: Project) => void;
}

/** 数据驱动的基础列配置（不含回调，提取到组件外部避免每次渲染重建） */
const BASE_COLUMNS: ColumnsType<Project> = [
  {
    title: "Project Name",
    dataIndex: "name",
    key: "name",
    render: (name: string) => (
      <Space>
        <FolderOutlined className="text-blue-500" />
        <Text strong>{name}</Text>
      </Space>
    ),
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
    width: 300,
  },
  {
    title: "Stage",
    dataIndex: "stage",
    key: "stage",
    width: 140,
    filters: Object.entries(PROJECT_STAGES).map(([value, label]) => ({
      text: label,
      value: value,
    })),
    onFilter: (value, record) => record.stage === value,
    render: (stage: ProjectStage) => (
      <Tag color={STAGE_COLOR_MAP[stage]}>{STAGE_LABEL_MAP[stage]}</Tag>
    ),
  },
  {
    title: "Updated At",
    dataIndex: "updated_at",
    key: "updated_at",
    width: 200,
    render: (date: string | null) => (
      <Text type="secondary">
        {date ? new Date(date).toLocaleString() : "N/A"}
      </Text>
    ),
  },
];

/**
 * 项目列表表格组件
 */
export default function ProjectTable({
  projects,
  loading,
  onEdit,
  onDelete,
  onManage,
}: ProjectTableProps) {
  const columns: ColumnsType<Project> = useMemo(
    () => [
      ...BASE_COLUMNS,
      {
        title: "Actions",
        key: "actions",
        width: 220,
        fixed: "right",
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<FolderOutlined />}
              onClick={() => onManage(record)}
            >
              Manage
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Are you sure you want to delete this project?"
              onConfirm={() => onDelete(record.id!)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onEdit, onDelete, onManage],
  );

  return (
    <Table<Project>
      columns={columns}
      dataSource={projects}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ["5", "10", "20", "50"],
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} projects`,
      }}
      scroll={{ x: 900 }}
    />
  );
}
