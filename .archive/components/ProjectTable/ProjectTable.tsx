import { useMemo } from "react";
import { Table, Tag, Space, Button, Popconfirm, Typography } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Project, ProjectStageNew } from "../../types";
import { PROJECT_STAGES_NEW } from "../../types";

const { Text } = Typography;

/** 项目阶段颜色映射 */
const STAGE_COLOR_MAP: Record<ProjectStageNew, string> = {
  presale: "cyan",
  startup: "orange",
  requirement: "blue",
  solution: "geekblue",
  build: "processing",
  test: "purple",
  launch: "green",
  acceptance: "gold",
  customer_success: "lime",
  close: "default",
  // 兼容旧数据
  blueprint: "blue",
  progress: "processing",
  halted: "red",
  ended: "default",
};

/** 项目阶段标签映射 */
const STAGE_LABEL_MAP: Record<ProjectStageNew, string> = PROJECT_STAGES_NEW;

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  onOpen?: (project: Project) => void;
  onDelete?: (id: number) => void;
  onEdit?: (project: Project) => void;
}

/** 数据驱动的基础列配置（不含回调，提取到组件外部避免每次渲染重建） */
const BASE_COLUMNS: ColumnsType<Project> = [
  {
    title: "项目名称",
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
    title: "项目描述",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
    width: 300,
  },
  {
    title: "项目阶段",
    dataIndex: "stage",
    key: "stage",
    width: 140,
    filters: Object.entries(PROJECT_STAGES_NEW).map(([value, label]) => ({
      text: label,
      value: value,
    })),
    onFilter: (value, record) => record.stage === value,
    render: (stage: ProjectStageNew) => (
      <Tag color={STAGE_COLOR_MAP[stage]}>{STAGE_LABEL_MAP[stage]}</Tag>
    ),
  },
  {
    title: "更新时间",
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
  onOpen,
  onDelete,
  onEdit,
}: ProjectTableProps) {
  const columns: ColumnsType<Project> = useMemo(
    () => [
      ...BASE_COLUMNS,
      {
        title: "操作",
        key: "actions",
        width: 220,
        fixed: "right",
        render: (_, record) => (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onOpen?.(record)}
            >
              打开
            </Button>
            <Button
              size="small"
              icon={<FolderOutlined />}
              onClick={() => onEdit?.(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个项目吗？"
              onConfirm={() => onDelete?.(record.id!)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onOpen, onDelete, onEdit],
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
          `第 ${range[0]}-${range[1]} 条，共 ${total} 个项目`,
      }}
      scroll={{ x: 900 }}
    />
  );
}
