import { useState, useCallback } from "react";
import { Layout, Button, Breadcrumb } from "antd";
import {
  SettingOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import ProjectList from "./components/ProjectList/ProjectList";
import ProjectHome from "./components/ProjectHome/ProjectHome";
import ChatWindow from "./components/Chat/ChatWindow";
import SettingsPage from "./components/Settings/SettingsPage";
import StyleTest from "./pages/StyleTest";
import type { Project } from "./types";

const { Header, Content } = Layout;

/** 页面类型 */
type Page = "projects" | "project-home" | "chat" | "settings" | "style-test";

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

  /** 进入样式验证页 */
  const handleOpenStyleTest = useCallback(() => {
    setCurrentPage("style-test");
  }, []);

  /** 从设置返回 */
  const handleBackFromSettings = useCallback(() => {
    if (selectedProject) {
      setCurrentPage("project-home");
    } else {
      setCurrentPage("projects");
    }
  }, [selectedProject]);

  /** 从样式验证页返回 */
  const handleBackFromStyleTest = useCallback(() => {
    setCurrentPage("projects");
  }, []);

  /** 项目数据更新回调 */
  const handleProjectUpdated = useCallback((updated: Project) => {
    setSelectedProject(updated);
  }, []);

  /** 渲染面包屑导航 */
  const renderBreadcrumb = () => {
    const items = [
      {
        title: (
          <HomeOutlined
            onClick={handleBackToProjects}
            style={{ cursor: "pointer", color: '#6B7280' }}
          />
        ),
      },
    ];

    if (selectedProject && currentPage !== "projects") {
      items.push({
        title: (
          <span
            onClick={() => setCurrentPage("project-home")}
            style={{ cursor: "pointer", color: '#6B7280' }}
          >
            {selectedProject.name}
          </span>
        ),
      });
    }

    if (currentPage === "chat") {
      items.push({ title: <span style={{ color: '#9CA3AF' }}>对话</span> });
    } else if (currentPage === "settings") {
      items.push({ title: <span style={{ color: '#9CA3AF' }}>设置</span> });
    } else if (currentPage === "style-test") {
      items.push({ title: <span style={{ color: '#9CA3AF' }}>样式验证</span> });
    }

    return <Breadcrumb items={items} />;
  };

  /** 渲染页面标题和操作按钮 */
  const renderPageHeader = () => {
    if (currentPage === "projects") {
      return (
        <div className="flex items-center justify-between" style={{ width: '100%' }}>
          <div className="flex items-center" style={{ gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                background: '#4F46E5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              PM
            </div>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>项目管理助手</span>
          </div>
          <div className="flex items-center" style={{ gap: '12px' }}>
            {renderBreadcrumb()}
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={handleOpenSettings}
              style={{ color: '#6B7280' }}
              title="设置"
            />
            <Button
              type="text"
              onClick={handleOpenStyleTest}
              style={{ color: '#6B7280' }}
              title="样式验证"
            >
              样式验证
            </Button>
          </div>
        </div>
      );
    }

    if (currentPage === "project-home" && selectedProject) {
      return (
        <div className="flex items-center justify-between" style={{ width: '100%' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToProjects}
              style={{ color: '#6B7280' }}
            />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                {selectedProject.name}
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                {selectedProject.current_stage}
              </div>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            {renderBreadcrumb()}
            <Button
              type="primary"
              icon={<MessageOutlined />}
              onClick={handleOpenChat}
              size="small"
            >
              对话
            </Button>
            <Button
              type="default"
              icon={<SettingOutlined />}
              onClick={handleOpenSettings}
              size="small"
            >
              设置
            </Button>
          </div>
        </div>
      );
    }

    if (currentPage === "chat" && selectedProject) {
      return (
        <div className="flex items-center justify-between" style={{ width: '100%' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToProjectHome}
              style={{ color: '#6B7280' }}
            />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                {selectedProject.name}
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                AI 对话
              </div>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            {renderBreadcrumb()}

          </div>
        </div>
      );
    }

    if (currentPage === "settings") {
      return (
        <div className="flex items-center justify-between" style={{ width: '100%' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackFromSettings}
              style={{ color: '#6B7280' }}
            />
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>设置</span>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            {renderBreadcrumb()}
          </div>
        </div>
      );
    }

    if (currentPage === "style-test") {
      return (
        <div className="flex items-center justify-between" style={{ width: '100%' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackFromStyleTest}
              style={{ color: '#6B7280' }}
            />
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>样式验证页</span>
          </div>
          <div className="flex items-center" style={{ gap: '8px' }}>
            {renderBreadcrumb()}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Layout className="min-h-screen" style={{ background: '#F8F7F4' }}>
      <Header
        className="flex items-center justify-between"
        style={{
          background: '#FFFFFF',
          height: '56px',
          lineHeight: '56px',
          padding: '0 24px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {renderPageHeader()}
      </Header>
      <Content
        style={{
          background: '#F8F7F4',
          padding: '0',
          overflow: 'auto',
        }}
      >
        {currentPage === "projects" && (
          <ProjectList onOpen={handleOpenProject} />
        )}

        {currentPage === "project-home" && selectedProject && (
          <ProjectHome
            project={selectedProject}
            onProjectUpdated={handleProjectUpdated}
          />
        )}

        {currentPage === "chat" && selectedProject && (
          <ChatWindow
            projectId={selectedProject.id}
          />
        )}

        {currentPage === "settings" && (
          <SettingsPage onBack={handleBackFromSettings} />
        )}

        {currentPage === "style-test" && import.meta.env.DEV && (
          <StyleTest />
        )}
      </Content>
    </Layout>
  );
}

export default App;
