import { Menu } from "antd";
import {
  ShopOutlined,
  RocketOutlined,
  FileTextOutlined,
  SolutionOutlined,
  BuildOutlined,
  BugOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ProjectStageNew } from "../../types";
import { PROJECT_STAGES_NEW, PROJECT_STAGE_LIST_NEW } from "../../types";

interface StageNavProps {
  selectedStage: ProjectStageNew | null;
  onSelectStage: (stage: ProjectStageNew) => void;
}

/** 阶段图标映射 */
const STAGE_ICONS: Record<ProjectStageNew, React.ReactNode> = {
  presale: <ShopOutlined />,
  startup: <RocketOutlined />,
  requirement: <FileTextOutlined />,
  solution: <SolutionOutlined />,
  build: <BuildOutlined />,
  test: <BugOutlined />,
  launch: <CloudUploadOutlined />,
  acceptance: <CheckCircleOutlined />,
  customer_success: <CustomerServiceOutlined />,
  close: <CloseCircleOutlined />,
};

export default function StageNav({ selectedStage, onSelectStage }: StageNavProps) {
  const menuItems = PROJECT_STAGE_LIST_NEW.map((stage) => ({
    key: stage,
    icon: STAGE_ICONS[stage],
    label: PROJECT_STAGES_NEW[stage],
  }));

  return (
    <Menu
      mode="inline"
      selectedKeys={selectedStage ? [selectedStage] : []}
      onClick={({ key }) => onSelectStage(key as ProjectStageNew)}
      items={menuItems}
      style={{ height: "100%", borderRight: 0 }}
    />
  );
}
