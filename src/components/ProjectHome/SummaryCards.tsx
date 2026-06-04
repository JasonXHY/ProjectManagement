import { Card, Col, Row, Statistic } from "antd";
import {
  WarningOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  MessageOutlined,
} from "@ant-design/icons";

interface SummaryCardsProps {
  onChat: () => void;
}

export default function SummaryCards({ onChat }: SummaryCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card hoverable>
          <Statistic
            title="待处理问题"
            value={0}
            prefix={<WarningOutlined />}
            valueStyle={{ color: "#faad14" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card hoverable>
          <Statistic
            title="项目进度"
            value={0}
            suffix="%"
            prefix={<SyncOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card hoverable>
          <Statistic
            title="待追踪事项"
            value={0}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card hoverable onClick={onChat} style={{ cursor: "pointer" }}>
          <Statistic
            title="AI对话"
            value="进入对话"
            prefix={<MessageOutlined />}
            valueStyle={{ color: "#722ed1" }}
          />
        </Card>
      </Col>
    </Row>
  );
}
