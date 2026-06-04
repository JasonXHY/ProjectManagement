import { useState, useCallback } from "react";
import { Layout, Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import ProjectList from "./components/ProjectList/ProjectList";
import FileManager from "./components/FileManager/FileManager";
import ChatWindow from "./components/Chat/ChatWindow";
import type { Project, Conversation } from "./types";

const { Header, Content } = Layout;
const { Title } = Typography;

/** 页面类型 */
type Page = "projects" | "files" | "chat";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("projects");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);

  /** 进入文件管理页面 */
  const handleManageProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setCurrentPage("files");
  }, []);

  /** 返回项目列表 */
  const handleBackToProjects = useCallback(() => {
    setCurrentPage("projects");
    setSelectedProject(null);
    setCurrentConversation(null);
  }, []);

  /** 进入对话窗口 */
  const handleOpenChat = useCallback(() => {
    if (!selectedProject) return;

    // 如果项目没有对话，创建一个默认对话
    if (
      selectedProject.conversations &&
      selectedProject.conversations.length > 0
    ) {
      setCurrentConversation(selectedProject.conversations[0]);
    } else {
      const defaultConversation: Conversation = {
        id: `conv_${Date.now()}`,
        projectId: selectedProject.id,
        title: `${selectedProject.name} - 对话`,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentConversation(defaultConversation);
    }
    setCurrentPage("chat");
  }, [selectedProject]);

  /** 从对话返回文件管理 */
  const handleBackToFiles = useCallback(() => {
    setCurrentPage("files");
  }, []);

  /** 更新对话信息 */
  const handleConversationUpdate = useCallback(
    (conversation: Conversation) => {
      setCurrentConversation(conversation);
    },
    [],
  );

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
              projectId={selectedProject.id}
              onBack={handleBackToProjects}
              onChat={handleOpenChat}
            />
          )}

          {currentPage === "chat" && currentConversation && (
            <ChatWindow
              conversation={currentConversation}
              onConversationUpdate={handleConversationUpdate}
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
