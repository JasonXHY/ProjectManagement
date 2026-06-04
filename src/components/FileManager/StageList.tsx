import { List, Badge } from "antd";
import {
  BulbOutlined,
  RocketOutlined,
  ShopOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { ProjectStage } from "../../types";
import { PROJECT_STAGES } from "../../types";
import type { ManagedFile } from "../../services/fileService";

/** 阶段图标映射 */
const STAGE_ICONS: Record<ProjectStage, React.ReactNode> = {
  blueprint: <BulbOutlined />,
  startup: <RocketOutlined />,
  presale: <ShopOutlined />,
  progress: <ProjectOutlined />,
  acceptance: <CheckCircleOutlined />,
  halted: <PauseCircleOutlined />,
  ended: <StopOutlined />,
};

/** 阶段列表属性 */
interface StageListProps {
  selectedStage: ProjectStage | null;
  onSelectStage: (stage: ProjectStage) => void;
  files: ManagedFile[];
}

/**
 * 阶段列表组件
 * 显示7个项目阶段，支持点击选择，显示每个阶段的文件数量
 */
export default function StageList({
  selectedStage,
  onSelectStage,
  files,
}: StageListProps) {
  /** 统计每个阶段的文件数量 */
  const stageFileCount = (stage: ProjectStage): number => {
    return files.filter((f) => f.stage === stage).length;
  };

  const stageKeys = Object.keys(PROJECT_STAGES) as ProjectStage[];

  return (
    <List
      dataSource={stageKeys}
      renderItem={(stage) => {
        const count = stageFileCount(stage);
        const isSelected = selectedStage === stage;

        return (
          <List.Item
            key={stage}
            onClick={() => onSelectStage(stage)}
            style={{
              cursor: "pointer",
              padding: "12px 16px",
              backgroundColor: isSelected ? "#e6f4ff" : "transparent",
              borderLeft: isSelected ? "3px solid #1677ff" : "3px solid transparent",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <List.Item.Meta
              avatar={STAGE_ICONS[stage]}
              title={PROJECT_STAGES[stage]}
              description={
                <Badge count={count} showZero style={{ backgroundColor: count > 0 ? "#1677ff" : "#d9d9d9" }} />
              }
            />
          </List.Item>
        );
      }}
    />
  );
}
