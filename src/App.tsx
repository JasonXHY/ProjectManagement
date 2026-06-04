import { useState, useCallback } from "react";
import { Layout, Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import ProjectList from "./components/ProjectList/ProjectList";
import FileManager from "./components/FileManager/FileManager";
import ChatWindow from "./components/Chat/ChatWindow";
import type { Project } from "./types";

const { Header, Content } = Layout;
const { Title } = Typography;

/** 页面类型 */
type Page = "projects" | "files" | "chat";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("projects");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  /** 进入文件管理页面 */
  const handleManageProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setCurrentPage("files");
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

  /** 从对话返回文件管理 */
  const handleBackToFiles = useCallback(() => {
    setCurrentPage("files");
  }, []);

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="flex items-center bg-white shadow-sm px-6">
        <div className="flex items-center gap-3">
          <RobotOutlined className="text-xl text-blue-500" />
          <Title level={4} className="!mb-0 !text-gray-800">
            AI Project Manager
          </Title>
        </div>
      </Header>
      <Content className="p-6">
        <div className="max-w-6xl mx-auto">
          {currentPage === "projects" && (
            <ProjectList onManage={handleManageProject} />
          )}

          {currentPage === "files" && selectedProject && (
            <FileManager
              projectId={selectedProject.id!}
              onBack={handleBackToProjects}
              onChat={handleOpenChat}
            />
          )}

          {currentPage === "chat" && selectedProject && (
            <ChatWindow
              projectId={selectedProject.id!}
              projectName={selectedProject.name}
              onBack={handleBackToProjects}
              onFiles={handleBackToFiles}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default App;
