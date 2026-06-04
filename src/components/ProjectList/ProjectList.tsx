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
  onManage?: (project: Project) => void;
}

/**
 * 项目列表页面
 * 包含搜索、筛选、排序功能
 */
export default function ProjectList({ onManage }: ProjectListProps) {
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
      message.error("Failed to load projects");
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
      message.success("Project deleted successfully");
      loadProjects();
    } catch {
      message.error("Failed to delete project");
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
        message.success("Project updated successfully");
      } else {
        const request: CreateProjectRequest = {
          name: values.name,
          description: values.description,
        };
        await createProject(request);
        message.success("Project created successfully");
      }

      setModalVisible(false);
      loadProjects();
    } catch {
      message.error("Operation failed");
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
          Projects
        </Title>
        <Space>
          <ReloadOutlined
            className="text-lg cursor-pointer text-gray-500 hover:text-blue-500 transition-colors"
            onClick={loadProjects}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New Project
          </Button>
        </Space>
      </div>

      {/* 搜索和筛选栏 */}
      <Card className="mb-4 shadow-sm">
        <Space wrap className="w-full" size="middle">
          <Search
            placeholder="Search projects by name or description..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 320 }}
            prefix={<SearchOutlined className="text-gray-400" />}
          />
          <Select
            placeholder="Filter by stage"
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
              { label: "Sort by Updated", value: "updated_at" },
              { label: "Sort by Created", value: "created_at" },
              { label: "Sort by Name", value: "name" },
            ]}
          />
          <Select
            value={sortOrder}
            onChange={setSortOrder}
            style={{ width: 140 }}
            options={[
              { label: "Newest First", value: "descend" },
              { label: "Oldest First", value: "ascend" },
            ]}
          />
          <Button onClick={handleReset}>Reset</Button>
        </Space>
      </Card>

      {/* 项目表格 */}
      <Card className="shadow-sm">
        {filteredProjects.length === 0 && !loading ? (
          <Empty description="No projects found" />
        ) : (
          <ProjectTable
            projects={filteredProjects}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onManage={onManage ?? (() => {})}
          />
        )}
      </Card>

      {/* 新建/编辑项目弹窗 */}
      <Modal
        title={editingProject ? "Edit Project" : "New Project"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingProject ? "Update" : "Create"}
        cancelText="Cancel"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Project Name"
            rules={[
              { required: true, message: "Please enter project name" },
              { min: 2, message: "Name must be at least 2 characters" },
            ]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Enter project description"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
