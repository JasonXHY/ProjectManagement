import type { Project } from "../types";

/**
 * 演示项目数据，用于 API 请求失败时的降级展示
 */
export const demoProjects: Project[] = [
  {
    id: 1,
    name: "AI Chat Application",
    description:
      "An AI-powered chat application with natural language processing capabilities.",
    stage: "build",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-05-28T14:20:00Z",
    status: "active",
  },
  {
    id: 2,
    name: "E-commerce Platform",
    description:
      "Full-stack e-commerce platform with payment integration and inventory management.",
    stage: "acceptance",
    created_at: "2025-02-10T08:00:00Z",
    updated_at: "2025-05-25T09:15:00Z",
    status: "active",
  },
  {
    id: 3,
    name: "Portfolio Website",
    description:
      "Personal portfolio website showcasing projects and skills.",
    stage: "close",
    created_at: "2025-03-01T12:00:00Z",
    updated_at: "2025-04-10T16:45:00Z",
    status: "active",
  },
  {
    id: 4,
    name: "Task Management API",
    description:
      "RESTful API for task management with authentication and authorization.",
    stage: "startup",
    created_at: "2025-05-01T09:30:00Z",
    updated_at: "2025-05-20T11:00:00Z",
    status: "active",
  },
  {
    id: 5,
    name: "Data Visualization Dashboard",
    description:
      "Interactive dashboard for data visualization with charts and graphs.",
    stage: "presale",
    created_at: "2025-05-15T15:00:00Z",
    updated_at: "2025-05-18T10:30:00Z",
    status: "active",
  },
  {
    id: 6,
    name: "Internal CRM System",
    description:
      "Customer relationship management system for the sales team.",
    stage: "test",
    created_at: "2025-04-01T08:00:00Z",
    updated_at: "2025-05-10T09:00:00Z",
    status: "active",
  },
];
