import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Input,
  Select,
  Button,
  Card,
  Space,
  Typography,
  message,
  Modal,
  Form,
  Empty,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import ProjectTable from "./ProjectTable";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/projectService";
import type {
  Project,
  ProjectStage,
  CreateProjectRequest,
} from "../../types";
import { PROJECT_STAGES } from "../../types";

type SortField = "updated_at" | "created_at" | "name";

const { Title } = Typography;
const { Search } = Input;

/** 项目列表页面属性 */
interface ProjectListProps {
  onOpen?: (project: Project) => void;
}

/**
 * 项目列表页面
 * 包含搜索、筛选、排序功能
 */
export default function ProjectList({ onOpen }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterStage, setFilterStage] = useState<ProjectStage | undefined>(
    undefined,
  );
  const [sortBy, setSortBy] = useState<SortField>("updated_at");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  /** 加载项目列表 */
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      message.error("加载项目列表失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /** 筛选和排序后的项目列表 */
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // 搜索过滤
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          (p.description?.toLowerCase().includes(lowerSearch) ?? false),
      );
    }

    // 阶段筛选：默认排除 ended 和 halted，选了则按选的来
    if (filterStage) {
      result = result.filter((p) => p.stage === filterStage);
    } else {
      result = result.filter(
        (p) => p.stage !== "ended" && p.stage !== "halted",
      );
    }

    // 排序
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "updated_at":
          comparison =
            new Date(a.updated_at || 0).getTime() -
            new Date(b.updated_at || 0).getTime();
          break;
        case "created_at":
          comparison =
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "descend" ? -comparison : comparison;
    });

    return result;
  }, [projects, searchText, filterStage, sortBy, sortOrder]);

  /** 打开新建项目弹窗 */
  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  /** 打开编辑项目弹窗 */
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      description: project.description,
    });
    setModalVisible(true);
  };

  /** 删除项目 */
  const handleDelete = async (id: number) => {
    try {
      await deleteProject(id);
      message.success("项目已删除");
      loadProjects();
    } catch {
      message.error("删除项目失败");
    }
  };

  /** 提交表单（新建/编辑） */
  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      // 表单校验失败，antd 已自动显示字段级错误提示，无需额外处理
      return;
    }

    try {
      if (editingProject) {
        await updateProject({
          id: editingProject.id!,
          name: values.name,
          description: values.description,
        });
        message.success("项目已更新");
      } else {
        const request: CreateProjectRequest = {
          name: values.name,
          description: values.description,
        };
        await createProject(request);
        message.success("项目已创建");
      }

      setModalVisible(false);
      loadProjects();
    } catch {
      message.error("操作失败");
    }
  };

  /** 处理打开项目 */
  const handleOpenProject = (project: Project) => {
    if (onOpen) {
      onOpen(project);
    }
  };

  /** 重置筛选 */
  const handleReset = () => {
    setSearchText("");
    setFilterStage(undefined);
    setSortBy("updated_at");
    setSortOrder("descend");
  };

  return (
    <div>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <Title level={3} className="!mb-0">
          项目列表
        </Title>
        <Space>
          <ReloadOutlined
            className="text-lg cursor-pointer text-gray-500 hover:text-blue-500 transition-colors"
            onClick={loadProjects}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建项目
          </Button>
        </Space>
      </div>

      {/* 搜索和筛选栏 */}
      <Card className="mb-4 shadow-sm">
        <Space wrap className="w-full" size="middle">
          <Search
            placeholder="搜索项目名称或描述..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 320 }}
            prefix={<SearchOutlined className="text-gray-400" />}
          />
          <Select
            placeholder="筛选阶段"
            allowClear
            value={filterStage}
            onChange={setFilterStage}
            style={{ width: 180 }}
            options={Object.entries(PROJECT_STAGES).map(([value, label]) => ({
              label,
              value,
            }))}
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 160 }}
            options={[
              { label: "按更新时间", value: "updated_at" },
              { label: "按创建时间", value: "created_at" },
              { label: "按项目名称", value: "name" },
            ]}
          />
          <Select
            value={sortOrder}
            onChange={setSortOrder}
            style={{ width: 140 }}
            options={[
              { label: "最新优先", value: "descend" },
              { label: "最早优先", value: "ascend" },
            ]}
          />
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {/* 项目表格 */}
      <Card className="shadow-sm">
        {filteredProjects.length === 0 && !loading ? (
          <Empty description="暂无项目" />
        ) : (
          <ProjectTable
            projects={filteredProjects}
            loading={loading}
            onOpen={handleOpenProject}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </Card>

      {/* 新建/编辑项目弹窗 */}
      <Modal
        title={editingProject ? "编辑项目" : "新建项目"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingProject ? "更新" : "创建"}
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[
              { required: true, message: "请输入项目名称" },
              { min: 2, message: "名称至少2个字符" },
            ]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
