import { useState, useCallback } from "react";
import { Layout, Typography, Button, Tooltip, Breadcrumb } from "antd";
import { RobotOutlined, SettingOutlined, HomeOutlined } from "@ant-design/icons";
import ProjectList from "./components/ProjectList/ProjectList";
import FileManager from "./components/FileManager/FileManager";
import ChatWindow from "./components/Chat/ChatWindow";
import SettingsPage from "./components/Settings/SettingsPage";
import type { Project } from "./types";

const { Header, Content } = Layout;
const { Title } = Typography;

/** 页面类型 */
type Page = "projects" | "project-home" | "chat" | "settings";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("projects");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  /** 进入项目首页 */
  const handleOpenProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setCurrentPage("project-home");
  }, []);

  /** 返回项目列表 */
  const handleBackToProjects = useCallback(() => {
    setCurrentPage("projects");
    setSelectedProject(null);
  }, []);

  /** 进入对话窗口 */
  const handleOpenChat = useCallback(() => {
    if (!selectedProject) return;
    setCurrentPage("chat");
  }, [selectedProject]);

  /** 从对话返回项目首页 */
  const handleBackToProjectHome = useCallback(() => {
    setCurrentPage("project-home");
  }, []);

  /** 进入设置页面 */
  const handleOpenSettings = useCallback(() => {
    setCurrentPage("settings");
  }, []);

  /** 从设置返回 */
  const handleBackFromSettings = useCallback(() => {
    if (selectedProject) {
      setCurrentPage("project-home");
    } else {
      setCurrentPage("projects");
    }
  }, [selectedProject]);

  /** 渲染面包屑导航 */
  const renderBreadcrumb = () => {
    const items = [
      {
        title: <HomeOutlined onClick={handleBackToProjects} style={{ cursor: "pointer" }} />,
      },
    ];

    if (selectedProject && currentPage !== "projects") {
      items.push({
        title: <span onClick={handleBackToProjects} style={{ cursor: "pointer" }}>{selectedProject.name}</span>,
      });
    }

    if (currentPage === "chat") {
      items.push({ title: <span>对话</span> });
    } else if (currentPage === "settings") {
      items.push({ title: <span>设置</span> });
    }

    return <Breadcrumb items={items} />;
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="flex items-center justify-between bg-white shadow-sm px-6">
        <div className="flex items-center gap-3">
          <RobotOutlined className="text-xl text-blue-500" />
          <Title level={4} className="!mb-0 !text-gray-800">
            项目管理助手
          </Title>
        </div>
        <div className="flex items-center gap-2">
          {renderBreadcrumb()}
          <Tooltip title="设置">
            <Button
              type="text"
              icon={<SettingOutlined className="text-lg" />}
              onClick={handleOpenSettings}
            />
          </Tooltip>
        </div>
      </Header>
      <Content className="p-6">
        <div className="max-w-6xl mx-auto">
          {currentPage === "projects" && (
            <ProjectList onManage={handleOpenProject} />
          )}

          {currentPage === "project-home" && selectedProject && (
            <FileManager
              projectId={selectedProject.id!}
              projectName={selectedProject.name}
              onBack={handleBackToProjects}
              onChat={handleOpenChat}
            />
          )}

          {currentPage === "chat" && selectedProject && (
            <ChatWindow
              projectId={selectedProject.id!}
              projectName={selectedProject.name}
              onBack={handleBackToProjectHome}
              onFiles={handleBackToProjectHome}
            />
          )}

          {currentPage === "settings" && (
            <SettingsPage onBack={handleBackFromSettings} />
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default App;
