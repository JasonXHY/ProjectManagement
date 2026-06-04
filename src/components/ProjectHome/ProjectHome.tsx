import { useState } from "react";
import { Card, Button, Space, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type { Project, ProjectStageNew } from "../../types";
import StageNav from "./StageNav";
import SummaryCards from "./SummaryCards";
import FileDropZone from "./FileDropZone";

const { Title } = Typography;

interface ProjectHomeProps {
  project: Project;
  onBack: () => void;
  onChat: () => void;
}

export default function ProjectHome({
  project,
  onBack,
  onChat,
}: ProjectHomeProps) {
  const [selectedStage, setSelectedStage] = useState<ProjectStageNew | null>(
    null
  );

  /** 处理文件上传完成 */
  const handleUploadComplete = () => {
    // 刷新文件列表
  };

  return (
    <div>
      {/* 顶部导航 */}
      <Space className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回项目列表
        </Button>
        <Title level={4} className="!mb-0">
          {project.name}
        </Title>
      </Space>

      {/* 主要内容区 */}
      <div style={{ display: "flex", gap: 16, height: "calc(100vh - 200px)" }}>
        {/* 左侧导航 */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{ width: 150, flexShrink: 0, overflow: "auto" }}
        >
          <StageNav
            selectedStage={selectedStage}
            onSelectStage={setSelectedStage}
          />
        </Card>

        {/* 右侧内容 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 上半部分：摘要卡片 */}
          <SummaryCards onChat={onChat} />

          {/* 下半部分：文件拖拽区 */}
          <Card style={{ flex: 1 }}>
            <FileDropZone
              projectId={project.id!}
              projectName={project.name}
              onUploadComplete={handleUploadComplete}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
